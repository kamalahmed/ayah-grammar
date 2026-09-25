import data from './bookVerbs.json'
import { arabicRoot } from './study'

export type BookAspect = 'PERF' | 'IMPF' | 'IMPV'
export type BookPerson = '3MS' | '3MP' | '2MS' | '2MP' | '1S' | '1P'
export interface BookCell {
  aspect: BookAspect
  person: BookPerson
  ar: string
  bn: string
  source_page: number
  bn_source?: string
  correction_note_bn?: string
  review_note_bn?: string
}
export interface BookVerb {
  entry_number: number
  level: number
  root_ar: string
  form: string
  voice: string
  headword_ar: string
  meaning_bn: string
  note_bn?: string
  source: { pdf_file: string; pdf_page: number; pages: number[] }
  conjugations: BookCell[]
  alternate_readings?: BookVerb[]
}
export const bookPersons: BookPerson[] = ['3MS', '3MP', '2MS', '2MP', '1S', '1P']
export const bookVerbs = data as BookVerb[]
export const bookReadings = (verb: BookVerb): BookVerb[] => [verb, ...(verb.alternate_readings || [])]
export const bookCell = (verb: BookVerb, aspect: string, person: string) => verb.conjugations.find(cell => cell.aspect === aspect && cell.person === person)
export const bookPageUrl = (verb: BookVerb, page = verb.source.pdf_page) => `/books/level-${verb.level}.pdf#page=${page}`

// Root identity is checked separately from the written citation. For example,
// sa'ala (ask) must never match sala (flow), even if hamza marks are removed.
export function arabicLetters(value: string): string {
  return value.normalize('NFKD').replace(/[\p{Mark}\sـ]/gu, '').replace(/ى/g, 'ي').replace(/ٱ/g, 'ا')
}
const rootIndex = new Map<string, BookVerb[]>()
for (const verb of bookVerbs.flatMap(bookReadings)) {
  const key = `${arabicLetters(verb.root_ar)}:${verb.form}`
  rootIndex.set(key, [...(rootIndex.get(key) || []), verb])
}
export function findBookVerb(root: string | null, form: string, voice: string, citation?: string): BookVerb | null {
  if (!root || voice !== 'ACT') return null
  const candidates = rootIndex.get(`${arabicLetters(arabicRoot(root))}:${form}`) || []
  if (candidates.length === 1) return candidates[0]
  // Multiple vowel patterns/senses require an exact vocalized citation. An
  // unresolved ambiguity stays unlinked; every reading is in the library.
  const exact = citation ? candidates.filter(v => v.headword_ar.normalize('NFC') === citation.normalize('NFC')) : []
  return exact.length === 1 ? exact[0] : null
}
const searchText = new Map(bookVerbs.map(v => [v.entry_number, bookReadings(v).map(r => `${arabicLetters(r.root_ar)} ${arabicLetters(r.headword_ar)} ${r.meaning_bn} ${r.conjugations.map(c => `${arabicLetters(c.ar)} ${c.bn}`).join(' ')}`).join(' ').normalize('NFC').toLowerCase()]))
export function searchBookVerbs(query: string, level = 0, form = ''): BookVerb[] {
  const normalized = query.trim().normalize('NFC').toLowerCase().replace(/[০-৯]/g, n => String(n.charCodeAt(0) - 0x09e6))
  const number = /^#?\d+$/.test(normalized) ? Number(normalized.replace('#', '')) : null
  const terms = normalized.split(/\s+/).filter(Boolean).map(term => /[\u0600-\u06ff]/.test(term) ? arabicLetters(term) : term)
  return bookVerbs.filter(v => (!level || v.level === level) && (!form || v.form === form) && (number !== null ? v.entry_number === number : terms.every(term => searchText.get(v.entry_number)!.includes(term))))
}
