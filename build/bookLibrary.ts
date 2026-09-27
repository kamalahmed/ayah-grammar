import { arabicLetters, bookReadings, type BookVerb } from '../src/domain/books/bookData'
import type { LibraryEntry } from '../src/features/verb-library/searchLibrary'

export function createBookLibrary(books: BookVerb[]) {
  const index: LibraryEntry[] = books.map(v => ({
    entry_number: v.entry_number, level: v.level, form: v.form,
    headword_ar: v.headword_ar, meaning_bn: v.meaning_bn,
    search: bookReadings(v).map(r => `${arabicLetters(r.root_ar)} ${arabicLetters(r.headword_ar)} ${r.meaning_bn} ${r.conjugations.map(c => `${arabicLetters(c.ar)} ${c.bn}`).join(' ')}`).join(' ').normalize('NFC').toLowerCase(),
  }))
  return { index, entries: Object.fromEntries(books.map(verb => [verb.entry_number, verb])) }
}
