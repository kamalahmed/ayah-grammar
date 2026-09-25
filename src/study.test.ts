import { describe, expect, it } from 'vitest'
import { attestedChart, arabicRoot, chartSlotApplies, personOrder, pronounLabels, verbFormNumber, verbFormPattern } from './study'
import type { VerbOccurrence } from './types'

const occurrence = (person: string, aspect: string, arabic: string, form = 'I'): VerbOccurrence => ({
  key: '2:30', position: 2, arabic, en: 'said', bn: 'বললেন',
  form, aspect, person, voice: 'ACT', mood: 'IND',
})

describe('study data', () => {
  it('turns Buckwalter root letters into Arabic', () => {
    expect(arabicRoot('qwl')).toBe('قول')
    expect(arabicRoot('krh')).toBe('كره')
  })

  it('shows only attested forms of the selected root and pattern', () => {
    const chart = attestedChart([
      occurrence('3MS', 'PERF', 'قَالَ'),
      occurrence('3MS', 'PERF', 'وَقَالَ'),
      occurrence('3MP', 'PERF', 'قَالُوا'),
      occurrence('3MS', 'IMPF', 'يَقُولُ'),
      occurrence('3MS', 'PERF', 'أَقَالَ', 'IV'),
    ], 'I', 'ACT')
    expect(chart['PERF:3MS']?.arabic).toBe('قَالَ')
    expect(chart['PERF:3MS']?.count).toBe(2)
    expect(chart['PERF:3MP']?.arabic).toBe('قَالُوا')
    expect(chart['IMPV:3MS']).toBeUndefined()
  })

  it('keeps passive occurrences separate from active ones', () => {
    const active = occurrence('3MS', 'PERF', 'قَالَ')
    const passive = { ...occurrence('3MS', 'PERF', 'قِيلَ'), voice: 'PASS' }
    expect(attestedChart([active, passive], 'I', 'PASS')['PERF:3MS']?.arabic).toBe('قِيلَ')
    expect(attestedChart([active, passive], 'I', 'ACT')['PERF:3MS']?.count).toBe(1)
  })

  it('uses a sourced verb-form pattern and distinguishes impossible imperative slots', () => {
    expect(verbFormNumber('IV')).toBe(4)
    expect(verbFormPattern('IV', 'nzl')).toBe('أَفْعَلَ')
    expect(verbFormPattern('IV', 'q$Er')).toBe('إِفْعَلَلَّ')
    expect(verbFormPattern('XII', 'qwl')).toBeNull()
    expect(chartSlotApplies('IMPV', '3MS')).toBe(false)
    expect(chartSlotApplies('IMPV', '2MP')).toBe(true)
  })

  it('shows the tapped occurrence in its chart slot when available', () => {
    const first = occurrence('3MS', 'PERF', 'قَالَ')
    const tapped = { ...occurrence('3MS', 'PERF', 'وَقَالَ'), key: '2:8', position: 3 }
    const chart = attestedChart([first, tapped], 'I', 'ACT', { key: '2:8', position: 3 })
    expect(chart['PERF:3MS']?.arabic).toBe('وَقَالَ')
    expect(chart['PERF:3MS']?.count).toBe(2)
  })

  it('keeps corpus dual verbs with unmarked gender visible', () => {
    expect(personOrder).toContain('2D')
    expect(pronounLabels['2D']).toBe('أَنْتُمَا')
    expect(attestedChart([occurrence('2D', 'IMPF', 'تَعْلَمَانِ')], 'I', 'ACT')['IMPF:2D']?.arabic).toBe('تَعْلَمَانِ')
  })
})
