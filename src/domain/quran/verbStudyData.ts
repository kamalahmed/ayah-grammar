import type { BookVerb } from '../books/bookData'
import type { Paradigm } from '../conjugation/paradigms'
import type { VerbOccurrence } from './types'

export interface VerbStudyData {
  occurrences: VerbOccurrence[]
  paradigms: Record<string, Record<string, Paradigm>>
  books: BookVerb[]
}
