import { defineConfig } from 'vite'
import { existsSync, rmSync } from 'node:fs'
import { resolve } from 'node:path'
import { verbDataPlugin } from './build/verbDataPlugin'

export default defineConfig(({ command }) => ({
  base: '/',
  define: {
    __LOCAL_BOOK_PDFS__: JSON.stringify(command === 'serve'
      ? [1, 2].filter(level => existsSync(resolve(`public/books/level-${level}.pdf`)))
      : []),
  },
  plugins: [verbDataPlugin(), {
    name: 'exclude-personal-book-pdfs',
    writeBundle(options) {
      if (options.dir) rmSync(resolve(options.dir, 'books'), { recursive: true, force: true })
    },
  }],
}))
