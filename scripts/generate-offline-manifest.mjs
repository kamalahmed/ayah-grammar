import { createHash } from 'node:crypto'
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export function generateOfflineManifest(root) {
  const paths = []
  const visit = directory => {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      const path = join(directory, entry.name)
      const name = relative(root, path).split(sep).join('/')
      if (entry.name.startsWith('.') || name === 'books' || name.startsWith('books/') || name === 'offline-manifest.json' || name.endsWith('.pdf')) continue
      if (entry.isDirectory()) visit(path)
      else if (entry.isFile()) paths.push(name)
    }
  }
  visit(root)
  paths.sort()
  const hash = createHash('sha256')
  const files = paths.map(name => {
    const bytes = readFileSync(join(root, name))
    const sha256 = createHash('sha256').update(bytes).digest('hex')
    hash.update(name).update('\0').update(sha256).update('\0')
    return { url: `/${name}`, bytes: bytes.length, sha256 }
  })
  const manifest = {
    version: hash.digest('hex'),
    totalBytes: files.reduce((sum, file) => sum + file.bytes, 0),
    files,
  }
  writeFileSync(join(root, 'offline-manifest.json'), `${JSON.stringify(manifest)}\n`)
  return manifest
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const manifest = generateOfflineManifest(process.argv[2] || 'dist')
  console.log(`Offline manifest: ${manifest.files.length} files, ${manifest.totalBytes} bytes, ${manifest.version.slice(0, 12)}`)
}
