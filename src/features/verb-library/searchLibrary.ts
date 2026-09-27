import { arabicLetters } from '../../domain/books/bookData'
import type { BookVerb } from '../../domain/books/bookData'

export type LibraryEntry = Pick<BookVerb, 'entry_number' | 'level' | 'form' | 'headword_ar' | 'meaning_bn'> & { search: string }

export function searchLibrary(index: LibraryEntry[], query: string, level = 0, form = ''): LibraryEntry[] {
  const normalized = query.trim().normalize('NFC').toLowerCase().replace(/[০-৯]/g, n => String(n.charCodeAt(0) - 0x09e6))
  const number = /^#?\d+$/.test(normalized) ? Number(normalized.replace('#', '')) : null
  const terms = normalized.split(/\s+/).filter(Boolean).map(term => /[\u0600-\u06ff]/.test(term) ? arabicLetters(term) : term)
  return index.filter(v => (!level || v.level === level) && (!form || v.form === form) && (number !== null ? v.entry_number === number : terms.every(term => v.search.includes(term))))
}
