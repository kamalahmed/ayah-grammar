import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { test } from 'node:test'
import { generateOfflineManifest } from './generate-offline-manifest.mjs'

test('the offline list covers build assets and data without private or server files', () => {
  const root = mkdtempSync(join(tmpdir(), 'ayah-offline-'))
  try {
    mkdirSync(join(root, 'assets'))
    mkdirSync(join(root, 'data'))
    mkdirSync(join(root, 'books'))
    writeFileSync(join(root, 'index.html'), 'reader')
    writeFileSync(join(root, 'assets', 'study.js'), 'study')
    writeFileSync(join(root, 'data', 'chapter-1.json'), '[]')
    writeFileSync(join(root, 'books', 'level-1.pdf'), 'private')
    writeFileSync(join(root, '.htaccess'), 'server rules')
    const first = generateOfflineManifest(root)
    assert.deepEqual(first.files.map(file => file.url), ['/assets/study.js', '/data/chapter-1.json', '/index.html'])
    assert.equal(first.totalBytes, 13)
    assert.deepEqual(JSON.parse(readFileSync(join(root, 'offline-manifest.json'), 'utf8')), first)
    writeFileSync(join(root, 'data', 'chapter-1.json'), '{}')
    assert.notEqual(generateOfflineManifest(root).version, first.version)
  } finally {
    rmSync(root, { recursive: true, force: true })
  }
})
