import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'
import { createVerbShards } from './verbShards'

export function verbDataPlugin(): Plugin {
  const virtualId = 'virtual:verb-data'
  const resolvedId = '\0' + virtualId
  let dev = false
  let urls: Record<string, string> = {}
  let shards: ReturnType<typeof createVerbShards>
  const read = (file: string) => JSON.parse(readFileSync(resolve(file), 'utf8'))
  const rootName = (root: string) => Buffer.from(root).toString('hex')
  return {
    name: 'root-study-data',
    configResolved(config) { dev = config.command === 'serve' },
    buildStart() {
      shards = createVerbShards(read('public/data/verbs.json'), read('src/selectedParadigms.json'), read('src/bookVerbs.json'))
      urls = Object.fromEntries(Object.entries(shards).map(([root, data]) => {
        const name = `verb-${rootName(root)}.json`
        const id = dev ? '' : this.emitFile({ type: 'asset', name, source: JSON.stringify(data) })
        return [root, dev ? JSON.stringify(`/data/roots/${name}`) : `import.meta.ROLLUP_FILE_URL_${id}`]
      }))
    },
    resolveId(id) { if (id === virtualId) return resolvedId },
    load(id) {
      if (id === resolvedId) return `export default {${Object.entries(urls).map(([root, url]) => `${JSON.stringify(root)}:${url}`).join(',')}}`
    },
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const match = request.url?.match(/^\/data\/roots\/verb-([a-f0-9]+)\.json$/)
        if (!match) return next()
        const data = shards?.[Buffer.from(match[1], 'hex').toString()]
        response.setHeader('Content-Type', 'application/json')
        if (!data) { response.statusCode = 404; response.end('{}'); return }
        response.end(JSON.stringify(data))
      })
    },
  }
}
