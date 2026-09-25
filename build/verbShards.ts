import { arabicLetters, bookReadings } from '../src/bookData'
import { arabicRoot } from '../src/study'
import type { BookVerb } from '../src/bookData'
import type { Paradigm } from '../src/paradigms'
import type { VerbIndex, VerbOccurrence } from '../src/types'

export interface VerbStudyData {
  occurrences: VerbOccurrence[]
  paradigms: Record<string, Record<string, Paradigm>>
  books: BookVerb[]
}

export function createVerbShards(verbs: VerbIndex, paradigms: Record<string, Record<string, Record<string, Paradigm>>>, books: unknown): Record<string, VerbStudyData> {
  return Object.fromEntries(Object.entries(verbs).map(([root, occurrences]) => [root, {
    occurrences,
    paradigms: paradigms[root] || {},
    books: (books as BookVerb[]).filter(verb => bookReadings(verb).some(reading => arabicLetters(reading.root_ar) === arabicLetters(arabicRoot(root)))),
  }]))
}
