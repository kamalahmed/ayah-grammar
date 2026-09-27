import { readFileSync } from 'node:fs'
import type { Plugin } from 'vite'
import { createBookLibrary } from './bookLibrary'

export function bookLibraryPlugin(): Plugin {
  const id = 'virtual:book-library'
  let dev = false
  let assets: Record<string, string> = {}
  let module = ''
  return {
    name: 'book-library-data',
    configResolved(config) { dev = config.command === 'serve' },
    buildStart() {
      const { index, entries } = createBookLibrary(JSON.parse(readFileSync('data/generated/bookVerbs.json', 'utf8')))
      assets = Object.fromEntries([
        ['book-index.json', JSON.stringify(index)],
        ...Object.entries(entries).map(([number, verb]) => [`book-entry-${number}.json`, JSON.stringify(verb)]),
      ])
      const urls = Object.fromEntries(Object.entries(assets).map(([name, source]) => {
        const ref = dev ? '' : this.emitFile({ type: 'asset', name, source })
        return [name, dev ? JSON.stringify(`/data/library/${name}`) : `import.meta.ROLLUP_FILE_URL_${ref}`]
      }))
      module = `export const indexUrl = ${urls['book-index.json']}; export const entryUrls = {${Object.keys(entries).map(number => `${number}:${urls[`book-entry-${number}.json`]}`).join(',')}};`
    },
    resolveId(source) { if (source === id) return '\0' + id },
    load(source) { if (source === '\0' + id) return module },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const name = request.url?.split('?')[0].match(/^\/data\/library\/(book-(?:index|entry-\d+)\.json)$/)?.[1]
        if (!name) return next()
        response.setHeader('Content-Type', 'application/json')
        response.statusCode = assets[name] ? 200 : 404
        response.end(assets[name] || '{}')
      })
    },
  }
}
