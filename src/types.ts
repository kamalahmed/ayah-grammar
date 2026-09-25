export interface MorphSegment {
  tag: string
  features: string
}

export interface Word {
  position: number
  arabic: string
  en: string
  bn: string
  pos: string | null
  root: string | null
  lemma: string | null
  form: string | null
  aspect: string | null
  person: string | null
  voice: string | null
  mood: string | null
  segments: MorphSegment[]
}

export interface Verse {
  key: string
  opening: string
  text: string
  en: string
  bn: string
  parts: Array<{ text: string; word: number | null }>
  words: Word[]
}

export interface Chapter {
  number: number
  arabic: string
  english: string
  meaning: string
  ayahs: number
}

export interface VerbOccurrence {
  key: string
  position: number
  arabic: string
  en: string
  bn: string
  form: string
  aspect: string | null
  person: string | null
  voice: string
  mood: string
}

export type VerbIndex = Record<string, VerbOccurrence[]>
