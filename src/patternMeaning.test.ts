import { describe, expect, it } from 'vitest'
import { englishPatternExample } from './patternMeaning'
import type { VerbOccurrence } from './types'

const occurrence = (values: Partial<VerbOccurrence> = {}): VerbOccurrence => ({
  key: '5:60', position: 19, arabic: 'وَعَبَدَ', en: 'and (who) worshipped', bn: 'ও সে উপাসনা করেছে',
  form: 'I', aspect: 'PERF', person: '3MS', voice: 'ACT', mood: 'IND', ...values,
})

describe('English examples beside verb patterns', () => {
  it('prefers the exact written form and retains the contextual source', () => {
    const prefixed = occurrence()
    const exact = occurrence({ arabic: 'عَبَدَ', key: '1:1', en: 'worshipped' })
    expect(englishPatternExample([prefixed, exact], 'عَبَدَ', 'I', 'ACT', 'PERF')).toEqual(exact)
    expect(englishPatternExample([prefixed], 'عَبَدَ', 'I', 'ACT', 'PERF')).toEqual(prefixed)
  })

  it('does not confuse vowel patterns, voices, persons, aspects or attached objects', () => {
    const candidates = [
      occurrence({ arabic: 'عُبِدَ' }),
      occurrence({ arabic: 'عَبَدَ', voice: 'PASS' }),
      occurrence({ arabic: 'عَبَدَ', person: '3MP' }),
      occurrence({ arabic: 'عَبَدَ', aspect: 'IMPF' }),
      occurrence({ arabic: 'عَبَدَ', form: 'II' }),
      occurrence({ arabic: 'عَبَدَهُ' }),
    ]
    expect(englishPatternExample(candidates, 'عَبَدَ', 'I', 'ACT', 'PERF')).toBeNull()
  })

  it('ignores display elongation and Quran annotation without discarding vowel marks', () => {
    const source = occurrence({ arabic: 'عَـبَدَۖ' })
    expect(englishPatternExample([source], 'عَبَدَ', 'I', 'ACT', 'PERF')).toEqual(source)
  })
})
