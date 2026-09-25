import data from './bookVerbs.json'
import { arabicLetters, bookReadings, findBookReading } from './bookData'
import type { BookVerb } from './bookData'
export * from './bookData'

export const bookVerbs = data as BookVerb[]
export function findBookVerb(root: string | null, form: string, voice: string, citation?: string): BookVerb | null {
  return findBookReading(bookVerbs, root, form, voice, citation)
}

const searchText = new Map(bookVerbs.map(v => [v.entry_number, bookReadings(v).map(r => `${arabicLetters(r.root_ar)} ${arabicLetters(r.headword_ar)} ${r.meaning_bn} ${r.conjugations.map(c => `${arabicLetters(c.ar)} ${c.bn}`).join(' ')}`).join(' ').normalize('NFC').toLowerCase()]))
export function searchBookVerbs(query: string, level = 0, form = ''): BookVerb[] {
  const normalized = query.trim().normalize('NFC').toLowerCase().replace(/[০-৯]/g, n => String(n.charCodeAt(0) - 0x09e6))
  const number = /^#?\d+$/.test(normalized) ? Number(normalized.replace('#', '')) : null
  const terms = normalized.split(/\s+/).filter(Boolean).map(term => /[\u0600-\u06ff]/.test(term) ? arabicLetters(term) : term)
  return bookVerbs.filter(v => (!level || v.level === level) && (!form || v.form === form) && (number !== null ? v.entry_number === number : terms.every(term => searchText.get(v.entry_number)!.includes(term))))
}
