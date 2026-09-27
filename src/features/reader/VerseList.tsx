import { memo, useMemo } from 'react'
import VerseCard from './VerseCard'
import { verseAudioUrl } from '../audio/audio'
import type { AudioStatus } from '../audio/useAudioPlayer'
import type { Chapter, Verse, Word } from '../../domain/quran/types'
import type { UiLanguage } from '../../i18n/uiText'

interface Props { verses: Verse[]; chapters: Chapter[]; reciter: Parameters<typeof verseAudioUrl>[2]; selectedKey?: string; selectedPosition?: number; highlightVerbs: boolean; showArabicVerses: boolean; showWordMeanings: boolean; language: 'both' | 'bn' | 'en'; uiLanguage: UiLanguage; audioId: string | null; audioStatus: AudioStatus; onToggleAudio: (key: string, url: string | null) => void; onSelect: (key: string, word: Word) => void }

export default memo(function VerseList({ verses, chapters, reciter, selectedKey, selectedPosition, highlightVerbs, showArabicVerses, showWordMeanings, language, uiLanguage, audioId, audioStatus, onToggleAudio, onSelect }: Props) {
  const audioUrls = useMemo(() => verses.map(verse => verseAudioUrl(verse.key, chapters, reciter)), [verses, chapters, reciter])
  if (!verses.length) return null
  return <div className="verses">
          {showArabicVerses && verses[0].opening && <div className="basmalah" lang="ar" dir="rtl">{verses[0].opening}</div>}
          {verses.map((verse, index) => <VerseCard key={verse.key} verse={verse} index={index} selectedPosition={selectedKey === verse.key ? selectedPosition : undefined} highlightVerbs={highlightVerbs} showArabicVerses={showArabicVerses} showWordMeanings={showWordMeanings} language={language} uiLanguage={uiLanguage} audioUrl={audioUrls[index]} audioStatus={audioId === `verse:${verse.key}` ? audioStatus : 'idle'} onToggleAudio={onToggleAudio} onSelect={onSelect} />)}
        </div>
})
