import { describe, expect, it } from 'vitest'
import { bookVerbs, findBookVerb, searchBookVerbs, bookCell, bookReadings } from './bookVerbs'

describe('500 verb book collection', () => {
  it('retains every numbered entry, the second reading of 374, and the book omissions', () => {
    expect(bookVerbs.map(v => v.entry_number)).toEqual(Array.from({ length: 500 }, (_, i) => i + 1))
    expect(bookReadings(bookVerbs[373])).toHaveLength(2)
    expect(bookVerbs[90].conjugations).toHaveLength(0)
    expect(bookVerbs[189].conjugations).toHaveLength(0)
    expect(bookVerbs[29].conjugations).toHaveLength(6)
    expect(bookVerbs.flatMap(v => bookReadings(v).flatMap(r => r.conjugations))).toHaveLength(6978)
  })

  it('keeps source spelling and page references without copying surrounding headings', () => {
    expect(bookVerbs[0].meaning_bn).toBe('বলা')
    expect(bookCell(bookVerbs[0], 'PERF', '3MS')?.bn).toBe('সে বলেছে')
    expect(bookCell(bookVerbs[29], 'PERF', '3MS')?.bn).toBe('সে নয়')
    expect(bookCell(bookVerbs[5], 'PERF', '3MS')?.bn).toBe('সে অস্বীকার করেছে')
    expect(bookVerbs[10].headword_ar).toBe('أَتَى')
    expect(bookVerbs[200].source.pdf_file).toBe('Quran words - level2.pdf')
    expect(bookVerbs[200].source.pdf_page).toBe(28)
    expect(bookVerbs[499].meaning_bn).toBe('বাধ্য করা')
  })

  it('never manufactures feminine, dual, passive or missing commands', () => {
    for (const v of bookVerbs.flatMap(bookReadings)) {
      expect(v.voice).toBe('ACT')
      const slots = v.conjugations.map(c => `${c.aspect}:${c.person}`)
      expect(new Set(slots).size).toBe(slots.length)
      for (const c of v.conjugations) {
        expect(['3MS', '3MP', '2MS', '2MP', '1S', '1P']).toContain(c.person)
        if (c.aspect === 'IMPV') expect(['2MS', '2MP']).toContain(c.person)
        expect(c.ar).toMatch(/[\u0621-\u064a]/)
        expect(c.bn).toMatch(/[\u0980-\u09ff]/)
        expect(c.bn).not.toMatch(/[⟦\uE000-\uF8FF]/)
        expect(c.source_page).toBeGreaterThan(0)
      }
    }
    expect(findBookVerb('hdy', 'I', 'PASS')).toBeNull()
    expect(bookCell(bookVerbs[29], 'IMPV', '2MS')).toBeUndefined()
  })

  it('matches the root and form, never an unrelated homographic citation', () => {
    expect(findBookVerb('hdy', 'I', 'ACT')?.entry_number).toBe(18)
    expect(findBookVerb('sAl', 'I', 'ACT')?.entry_number).toBe(26)
    expect(findBookVerb('syl', 'I', 'ACT')?.entry_number).not.toBe(26)
    expect(findBookVerb('bdw', 'I', 'ACT')?.entry_number).not.toBe(254)
    expect(findBookVerb('qwl', 'II', 'ACT')).toBeNull()
    expect(findBookVerb(null, 'I', 'ACT')).toBeNull()
  })

  it('searches Bangla, Arabic with or without vowel marks, and either numeral script', () => {
    expect(searchBookVerbs('বলেছে').some(v => v.entry_number === 1)).toBe(true)
    expect(searchBookVerbs('قال').some(v => v.entry_number === 1)).toBe(true)
    expect(searchBookVerbs('৫০০').map(v => v.entry_number)).toEqual([500])
    expect(searchBookVerbs('201', 1)).toEqual([])
    expect(searchBookVerbs('201', 2).map(v => v.entry_number)).toEqual([201])
    expect(searchBookVerbs('অস্তমিত').some(v => v.entry_number === 374)).toBe(true)
  })
})
