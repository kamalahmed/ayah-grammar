import type { VerbOccurrence } from './types'

const buckwalter: Record<string, string> = {
  "'": 'ء', '|': 'آ', '>': 'أ', '&': 'ؤ', '<': 'إ', '}': 'ئ', A: 'ا', b: 'ب',
  p: 'ة', t: 'ت', v: 'ث', j: 'ج', H: 'ح', x: 'خ', d: 'د', '*': 'ذ', r: 'ر',
  z: 'ز', s: 'س', '$': 'ش', S: 'ص', D: 'ض', T: 'ط', Z: 'ظ', E: 'ع', g: 'غ',
  f: 'ف', q: 'ق', k: 'ك', l: 'ل', m: 'م', n: 'ن', h: 'ه', w: 'و', Y: 'ى',
  y: 'ي', '{': 'ٱ',
}

export function arabicRoot(root: string | null): string {
  if (!root) return '—'
  return [...root].map(letter => buckwalter[letter] ?? letter).join('')
}

export interface ChartCell extends VerbOccurrence {
  count: number
}

export function attestedChart(occurrences: VerbOccurrence[], form: string, voice: string, preferred?: { key: string; position: number }): Record<string, ChartCell> {
  const groups: Record<string, VerbOccurrence[]> = {}
  for (const occurrence of occurrences) {
    if (occurrence.form !== form || occurrence.voice !== voice || !occurrence.aspect || !occurrence.person) continue
    const key = `${occurrence.aspect}:${occurrence.person}`
    ;(groups[key] ??= []).push(occurrence)
  }
  const result: Record<string, ChartCell> = {}
  for (const [key, values] of Object.entries(groups)) {
    const best = values.find(value => value.key === preferred?.key && value.position === preferred.position)
      ?? [...values].sort((a, b) => a.arabic.length - b.arabic.length)[0]
    result[key] = { ...best, count: values.length }
  }
  return result
}

// Patterns are the documented 3rd-person masculine singular perfect templates,
// not generated words for the selected root.
const triliteralPatterns: Record<string, string> = {
  I: 'فَعَلَ', II: 'فَعَّلَ', III: 'فَاعَلَ', IV: 'أَفْعَلَ', V: 'تَفَعَّلَ',
  VI: 'تَفَاعَلَ', VII: 'إِنْفَعَلَ', VIII: 'إِفْتَعَلَ', IX: 'إِفْعَلَّ', X: 'إِسْتَفْعَلَ',
}
const quadriliteralPatterns: Record<string, string> = {
  I: 'فَعْلَلَ', II: 'تَفَعْلَلَ', III: 'إِفْعَنْلَلَ', IV: 'إِفْعَلَلَّ',
}
const romanForms = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']

export function verbFormNumber(form: string): number | null {
  const index = romanForms.indexOf(form)
  return index < 0 ? null : index + 1
}

export function verbFormPattern(form: string, root: string | null): string | null {
  return (root?.length === 4 ? quadriliteralPatterns : triliteralPatterns)[form] || null
}

export function chartSlotApplies(aspect: string, person: string): boolean {
  return aspect !== 'IMPV' || person.startsWith('2')
}

// Corpus v0.4 also uses 2D when the dual's gender is not specified.
export const personOrder = ['1S', '1P', '2MS', '2FS', '2D', '2MD', '2FD', '2MP', '2FP', '3MS', '3FS', '3MD', '3FD', '3MP', '3FP']

export const pronounLabels: Record<string, string> = {
  '1S': 'أَنَا', '1P': 'نَحْنُ',
  '2MS': 'أَنْتَ', '2FS': 'أَنْتِ', '2D': 'أَنْتُمَا', '2MD': 'أَنْتُمَا', '2FD': 'أَنْتُمَا',
  '2MP': 'أَنْتُمْ', '2FP': 'أَنْتُنَّ',
  '3MS': 'هُوَ', '3FS': 'هِيَ', '3MD': 'هُمَا', '3FD': 'هُمَا', '3MP': 'هُمْ', '3FP': 'هُنَّ',
}

export const personLabels: Record<string, [string, string]> = {
  '1S': ['I', 'আমি'], '1P': ['We', 'আমরা'],
  '2MS': ['You · m.', 'তুমি · পুং'], '2FS': ['You · f.', 'তুমি · স্ত্রী'],
  '2D': ['You two · gender unmarked', 'তোমরা দুজন · লিঙ্গ অনির্দিষ্ট'],
  '2MD': ['You two · m.', 'তোমরা দুজন · পুং'], '2FD': ['You two · f.', 'তোমরা দুজন · স্ত্রী'],
  '2MP': ['You all · m.', 'তোমরা · পুং'],
  '2FP': ['You all · f.', 'তোমরা · স্ত্রী'],
  '3MS': ['He', 'সে · পুং'], '3FS': ['She', 'সে · স্ত্রী'],
  '3MD': ['They two · m.', 'তারা দুজন · পুং'], '3FD': ['They two · f.', 'তারা দুজন · স্ত্রী'],
  '3MP': ['They · m.', 'তারা · পুং'], '3FP': ['They · f.', 'তারা · স্ত্রী'],
}

export const aspectLabels: Record<string, [string, string]> = {
  PERF: ['Perfect', 'অতীত'], IMPF: ['Imperfect', 'বর্তমান / ভবিষ্যৎ'], IMPV: ['Imperative', 'আদেশ'],
}

export const posLabels: Record<string, [string, string]> = {
  V: ['Verb', 'ক্রিয়াপদ'], N: ['Noun', 'বিশেষ্য'], PN: ['Proper noun', 'নামবাচক বিশেষ্য'],
  ADJ: ['Adjective', 'বিশেষণ'], P: ['Preposition', 'অব্যয়'], CONJ: ['Conjunction', 'সংযোজক'],
  PRON: ['Pronoun', 'সর্বনাম'], DET: ['Determiner', 'নির্দেশক'], NEG: ['Negative particle', 'নেতিবাচক অব্যয়'],
}
