import { describe, expect, it } from 'vitest'
import { createVerbShards } from '../build/verbShards'
import verbs from '../public/data/verbs.json'
import selected from './selectedParadigms.json'
import books from './bookVerbs.json'
import { findBookVerb } from './bookVerbs'
import { findBookReading } from './bookData'

const shards = createVerbShards(verbs, selected, books)

describe('root-specific study data', () => {
  it('preserves every attested occurrence and generated paradigm in its own root', () => {
    expect(Object.keys(shards).sort()).toEqual(Object.keys(verbs).sort())
    for (const [root, occurrences] of Object.entries(verbs)) {
      expect(shards[root].occurrences).toEqual(occurrences)
      expect(shards[root].paradigms).toEqual((selected as Record<string, unknown>)[root] || {})
    }
    expect(shards.hdy.occurrences.some(item => item.key === '1:6')).toBe(true)
    expect(shards.hdy.paradigms.I.ACT['3MS'].perfect).toBe('هَدَى')
    expect(Object.values(shards).flatMap(shard => shard.occurrences).filter(item => item.person === '2D')).toHaveLength(54)
  })

  it('keeps the full collection out of a single root while preserving book matching', () => {
    expect(shards.hdy.books.length).toBeLessThan(10)
    expect(shards.hdy.books.some(book => book.entry_number === 18)).toBe(true)
    expect(shards.hdy.books.some(book => book.entry_number === 1)).toBe(false)
    for (const [root, shard] of Object.entries(shards)) {
      for (const form of new Set(shard.occurrences.map(item => item.form))) {
        for (const voice of ['ACT', 'PASS']) {
          const citation = shard.paradigms[form]?.[voice]?.['3MS'].perfect
          expect(findBookReading(shard.books, root, form, voice, citation)).toEqual(findBookVerb(root, form, voice, citation))
        }
      }
    }
  })
})
