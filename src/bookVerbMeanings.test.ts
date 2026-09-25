import { describe, expect, it } from 'vitest'
import { bookVerbMeaning } from './bookVerbMeanings'
import { selectedVerbParadigm } from './paradigms'

describe('supplied Bangla conjugation meanings', () => {
  const hdy = selectedVerbParadigm('hdy', 'I', 'ACT')!

  it('shows the correct first-person meaning for the reported verb', () => {
    expect(bookVerbMeaning('hdy', 'I', 'ACT', 'PERF', '1S', hdy['1S'].perfect)).toBe('আমি সৎ পথে পরিচালনা করেছি')
    expect(bookVerbMeaning('hdy', 'I', 'ACT', 'IMPF', '1S', hdy['1S'].imperfect)).toBe('আমি সৎ পথে পরিচালনা করি / করবো')
  })

  it('accepts harmless vowel-mark differences in matching Arabic cells', () => {
    expect(bookVerbMeaning('hdy', 'I', 'ACT', 'IMPV', '2MS', hdy['2MS'].imperative)).toBe('সৎ পথে পরিচালনা করো (তুমি)')
  })

  it('does not fill female, dual, passive, or other verb forms', () => {
    expect(bookVerbMeaning('hdy', 'I', 'ACT', 'PERF', '2FS', hdy['2FS'].perfect)).toBeNull()
    expect(bookVerbMeaning('hdy', 'I', 'ACT', 'PERF', '2MD', hdy['2MD'].perfect)).toBeNull()
    expect(bookVerbMeaning('hdy', 'I', 'PASS', 'PERF', '1S', hdy['1S'].perfect)).toBeNull()
    expect(bookVerbMeaning('hdy', 'VIII', 'ACT', 'PERF', '1S', hdy['1S'].perfect)).toBeNull()
  })

  it('does not attach a meaning to a different written verb', () => {
    expect(bookVerbMeaning('hdy', 'I', 'ACT', 'PERF', '1S', 'هَدَى')).toBeNull()
    expect(bookVerbMeaning('hdy', 'I', 'ACT', 'PERF', '1S', 'هَدَيْتَنَا')).toBeNull()
  })
})
