import { describe, expect, it } from 'vitest'
import { referenceParadigm, selectedVerbParadigm } from './paradigms'

describe('reference conjugations', () => {
  it('provides the complete standard person table for a three-letter form', () => {
    const form = referenceParadigm('I', 3)
    expect(Object.keys(form ?? {})).toHaveLength(14)
    expect(form?.['1S']).toEqual({ perfect: 'فَعَلْتُ', imperfect: 'أَفْعَلُ', imperative: null })
    expect(form?.['2MS']?.imperative).toBe('اِفْعَلْ')
  })

  it('does not present a three-letter pattern as a four-letter pattern', () => {
    expect(referenceParadigm('X', 4)).toBeNull()
    expect(referenceParadigm('I', 4)?.['1S']?.perfect).toBe('فَعْلَلْتُ')
  })
})

describe('selected verb conjugations', () => {
  it('uses the actual weak root for ihdina and includes they', () => {
    const form = selectedVerbParadigm('hdy', 'I', 'ACT')
    expect(form?.['3MS']).toEqual({ perfect: 'هَدَى', imperfect: 'يَهْدِي', imperative: null })
    expect(form?.['3MP']).toEqual({ perfect: 'هَدَوْا', imperfect: 'يَهْدُونَ', imperative: null })
    expect(form?.['2MS'].imperative).toBe('اِهْدِ')
  })

  it('uses the lexical present vowel for worship and keeps voices separate', () => {
    expect(selectedVerbParadigm('Ebd', 'I', 'ACT')?.['3MS'].imperfect).toBe('يَعْبُدُ')
    expect(selectedVerbParadigm('hdy', 'I', 'PASS')?.['3MS'].perfect).toBe('هُدِيَ')
    expect(selectedVerbParadigm('hdy', 'VIII', 'ACT')?.['3MS'].perfect).toBe('اِهْتَدَى')
  })

  it('matches derived weak verbs from attested Quran forms', () => {
    expect(selectedVerbParadigm('Ewn', 'X', 'ACT')?.['1P'].imperfect).toBe('نَسْتَعِينُ')
    expect(selectedVerbParadigm('Amn', 'IV', 'ACT')?.['3MS']).toEqual({ perfect: 'آمَنَ', imperfect: 'يُؤْمِنُ', imperative: null })
  })

  it('does not substitute a teaching root when a lexical citation is unavailable', () => {
    expect(selectedVerbParadigm('xyz', 'I', 'ACT')).toBeNull()
  })
})
