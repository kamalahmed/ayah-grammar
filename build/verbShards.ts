import type { VerbStudyData } from '../src/domain/quran/verbStudyData'
import { arabicLetters, bookReadings } from '../src/domain/books/bookData'
import { arabicRoot } from '../src/domain/quran/study'
import type { BookVerb } from '../src/domain/books/bookData'
import type { Paradigm } from '../src/domain/conjugation/paradigms'
import type { VerbIndex, VerbOccurrence } from '../src/domain/quran/types'


export function createVerbShards(verbs: VerbIndex, paradigms: Record<string, Record<string, Record<string, Paradigm>>>, books: unknown): Record<string, VerbStudyData> {
  return Object.fromEntries(Object.entries(verbs).map(([root, occurrences]) => [root, {
    occurrences,
    paradigms: paradigms[root] || {},
    books: (books as BookVerb[]).filter(verb => bookReadings(verb).some(reading => arabicLetters(reading.root_ar) === arabicLetters(arabicRoot(root)))),
  }]))
}
