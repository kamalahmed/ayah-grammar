import { memo } from 'react'
import { Pause, Play } from 'lucide-react'
import type { Verse, Word } from '../../domain/quran/types'
import type { AudioStatus } from '../audio/useAudioPlayer'
import type { UiLanguage } from '../../i18n/uiText'
import { uiText } from '../../i18n/uiText'

interface Props { verse: Verse; index: number; selectedPosition?: number; highlightVerbs: boolean; showArabicVerses: boolean; showWordMeanings: boolean; language: 'both' | 'bn' | 'en'; uiLanguage: UiLanguage; audioUrl: string | null; audioStatus: AudioStatus; onToggleAudio: (key: string, url: string | null) => void; onSelect: (key: string, word: Word) => void }

export default memo(function VerseCard({ verse, index, selectedPosition, highlightVerbs, showArabicVerses, showWordMeanings, language, uiLanguage, audioUrl, audioStatus, onToggleAudio, onSelect }: Props) {
  const playing = audioStatus === 'playing' || audioStatus === 'loading'
  return <article id={`ayah-${verse.key}`} className={!!selectedPosition ? 'verse active-verse' : 'verse'}>
    <div className="verse-top"><span className="verse-number">{String(index + 1).padStart(2, '0')}</span><span className="verse-reference">{verse.key}</span><button className="verse-audio-button" disabled={!audioUrl} onClick={() => onToggleAudio(verse.key, audioUrl)} aria-label={uiText(uiLanguage, playing ? 'Pause recitation {key}' : 'Play recitation {key}', { key: verse.key })} aria-pressed={playing} title={uiText(uiLanguage, 'Audio requires an internet connection.')}>{playing ? <Pause size={15} /> : <Play size={15} />}{uiText(uiLanguage, playing ? 'Pause' : 'Recite')}</button></div>
    {showArabicVerses && <div className="arabic-verse" lang="ar" dir="rtl">{verse.parts.map((part, i) => <span key={i}>{part.word ? <button lang="ar" className={`arabic-word ${highlightVerbs && verse.words[part.word - 1]?.pos === 'V' ? 'is-verb' : ''} ${selectedPosition === part.word ? 'is-selected' : ''}`} onClick={() => onSelect(verse.key, verse.words[part.word! - 1])} aria-label={uiText(uiLanguage, 'Study {word}, word {position}', { word: part.text, position: part.word! })}>{part.text}</button> : <span className="pause-mark">{part.text}</span>}{i < verse.parts.length - 1 ? ' ' : ''}</span>)}</div>}
    {showWordMeanings && <div className="word-glosses" dir="rtl">{verse.words.map(word => <button className={selectedPosition === word.position ? 'gloss selected' : 'gloss'} key={word.position} onClick={() => onSelect(verse.key, word)}><span className="gloss-arabic" lang="ar">{word.arabic}</span>{language !== 'en' && <span className="gloss-bn" lang="bn">{word.bn}</span>}{language !== 'bn' && <span className="gloss-en" lang="en">{word.en}</span>}</button>)}</div>}
    <div className="ayah-translations">{language !== 'en' && <p lang="bn" className="ayah-bn"><span className="translation-label">বাংলা</span>{verse.bn}</p>}{language !== 'bn' && <p className="ayah-en"><span className="translation-label">{uiText(uiLanguage, 'ENGLISH')}</span>{verse.en}</p>}</div>
  </article>
})
