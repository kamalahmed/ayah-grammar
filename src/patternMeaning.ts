import type { VerbOccurrence } from './types'

// Keep vowels: two readings of the same root can have different meanings.
const writtenForm = (arabic: string) => arabic.normalize('NFC').replace(/[ـ\u06d6-\u06ed]/gu, '').replace(/ٱ/g, 'ا')

export function englishPatternExample(occurrences: VerbOccurrence[], arabic: string, form: string, voice: string, aspect: string): VerbOccurrence | null {
  const target = writtenForm(arabic)
  const candidates = occurrences.filter(item => item.form === form && item.voice === voice && item.aspect === aspect && item.person === '3MS' && item.en.trim())
  return candidates.find(item => writtenForm(item.arabic) === target)
    // A conjunction is allowed only in a clearly attributed Quran example.
    // Object suffixes and other prefixes must not become a citation meaning.
    || candidates.find(item => writtenForm(item.arabic).replace(/^[وف]َ/u, '') === target)
    || null
}
