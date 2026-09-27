import { describe, expect, it } from 'vitest'
import books from '../data/generated/bookVerbs.json'
import { bookReadings, type BookVerb } from '../src/domain/books/bookData'
import { searchBookVerbs } from '../src/domain/books/bookVerbs'
import { createBookLibrary } from '../build/bookLibrary'
import { searchLibrary } from '../src/features/verb-library/searchLibrary'

const source = books as BookVerb[]
describe('split library data', () => {
  it('preserves all 500 complete entries including alternate readings and omissions', () => {
    const { index, entries } = createBookLibrary(source)
    expect(index).toHaveLength(500)
    expect(Object.values(entries)).toEqual(source)
    expect(index.every(row => !('conjugations' in row))).toBe(true)
  })
  it('matches existing search for every headword, meaning and conjugation', () => {
    const { index } = createBookLibrary(source)
    const queries = new Set(['', '৫০০', '#374', '201', 'অস্তমিত', 'قال', 'no-match'])
    for (const verb of source.flatMap(bookReadings)) {
      queries.add(verb.headword_ar); queries.add(verb.meaning_bn)
      for (const cell of verb.conjugations) { queries.add(cell.ar); queries.add(cell.bn) }
    }
    for (const query of queries) {
      expect(searchLibrary(index, query).map(v => v.entry_number), query).toEqual(searchBookVerbs(query).map(v => v.entry_number))
    }
    for (const level of [0, 1, 2]) for (const form of ['', 'I', 'II', 'X']) {
      expect(searchLibrary(index, '', level, form).map(v => v.entry_number)).toEqual(searchBookVerbs('', level, form).map(v => v.entry_number))
    }
  })
})
