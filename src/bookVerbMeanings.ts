import { arabicLetters, bookCell, findBookVerb } from './bookVerbs'

// Only a matching root, form, voice, aspect, person AND written cell can supply
// a meaning to an independently generated Arabic paradigm.
export function bookVerbMeaning(root: string | null, form: string, voice: string, aspect: string, person: string, arabic: string | null | undefined): string | null {
  if (!arabic) return null
  const verb = findBookVerb(root, form, voice)
  if (!verb) return null
  const cell = bookCell(verb, aspect, person)
  return cell && !cell.review_note_bn && arabicLetters(cell.ar) === arabicLetters(arabic) ? cell.bn : null
}
