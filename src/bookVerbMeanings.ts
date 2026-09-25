import { findBookVerb } from './bookVerbs'
import { meaningForBookReading } from './bookData'

// Only matching root, form, voice, aspect, person and written cell supply a meaning.
export function bookVerbMeaning(root: string | null, form: string, voice: string, aspect: string, person: string, arabic: string | null | undefined): string | null {
  return meaningForBookReading(findBookVerb(root, form, voice), aspect, person, arabic)
}
