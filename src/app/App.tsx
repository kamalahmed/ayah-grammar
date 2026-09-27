import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { BookOpen, Bookmark, ChevronDown, ChevronLeft, ChevronRight, Highlighter, Settings2 } from 'lucide-react'
import DeferredFeature from '../shared/components/DeferredFeature'
import { deferModule } from '../shared/components/deferredModule'
import { useJsonData } from '../shared/data/useJsonData'
import VerseList from '../features/reader/VerseList'
import ChapterNavigation from '../features/reader/ChapterNavigation'
import DisplaySettings from '../features/settings/DisplaySettings'
import SavedWords, { useSavedWords } from '../features/saved-words/SavedWords'

import type { Chapter, Verse, Word } from '../domain/quran/types'
import { readThemePreference, resolveTheme } from '../features/settings/theme'
import { clampReaderShare, readArabicScale, readFontScale, readReaderShare, readerShareBounds } from '../features/settings/displayPreferences'
import { readReciter, reciters, wordAudioUrl } from '../features/audio/audio'
import { useAudioPlayer } from '../features/audio/useAudioPlayer'
import { readUiLanguage, uiText } from '../i18n/uiText'

const loadWordPanel = deferModule(() => import('../features/study/WordPanel'))
const loadVerbLibrary = deferModule(() => import('../features/verb-library/VerbLibrary'))

type LanguageMode = 'both' | 'bn' | 'en'
type Selection = { key: string; word: Word }
function storedChapter(): number {
  const value = Number(localStorage.getItem('ayah-chapter') || 1)
  return Number.isInteger(value) && value >= 1 && value <= 114 ? value : 1
}

export default function App() {
  const [chapterNumber, setChapterNumber] = useState(storedChapter)
  const chapterList = useJsonData<Chapter[]>('/data/chapters.json')
  const chapterData = useJsonData<Verse[]>(`/data/chapter-${chapterNumber}.json`)
  const chapters = chapterList.data ?? []
  const verses = chapterData.data ?? []
  const [selection, setSelection] = useState<Selection | null>(null)
  const [language, setLanguage] = useState<LanguageMode>(() => (localStorage.getItem('ayah-language') as LanguageMode) || 'both')
  const [uiLanguage, setUiLanguage] = useState(() => readUiLanguage(localStorage.getItem('ayah-ui-language')))
  const [reciter, setReciter] = useState(() => readReciter(localStorage.getItem('ayah-reciter')))
  const audio = useAudioPlayer()
  const toggleVerseAudio = useCallback((key: string, url: string | null) => audio.toggle(`verse:${key}`, url), [audio.toggle])
  const t = (english: string, values?: Record<string, string | number>) => uiText(uiLanguage, english, values)
  const [highlightVerbs, setHighlightVerbs] = useState(() => localStorage.getItem('ayah-highlight') !== 'false')
  const [showWordMeanings, setShowWordMeanings] = useState(() => localStorage.getItem('ayah-word-meanings') !== 'false')
  const [showArabicVerses, setShowArabicVerses] = useState(() => localStorage.getItem('ayah-arabic-verses') !== 'false')
  const [arabicScale, setArabicScale] = useState(() => readArabicScale(localStorage.getItem('ayah-arabic-scale') ?? localStorage.getItem('ayah-font-scale')))
  const [showVerbBn, setShowVerbBn] = useState(() => localStorage.getItem('ayah-verb-meaning-bn') !== 'false')
  const [showVerbEn, setShowVerbEn] = useState(() => localStorage.getItem('ayah-verb-meaning-en') !== 'false')
  const [themePreference, setThemePreference] = useState(() => readThemePreference(localStorage.getItem('ayah-theme')))
  const [fontScale, setFontScale] = useState(() => readFontScale(localStorage.getItem('ayah-font-scale')))
  const [readerShare, setReaderShare] = useState(() => readReaderShare(localStorage.getItem('ayah-reader-share')))
  const [availableWidth, setAvailableWidth] = useState(() => window.innerWidth - 277)
  const [resizing, setResizing] = useState(false)
  const [visibleVerseKey, setVisibleVerseKey] = useState(() => `${storedChapter()}:1`)
  const [prefersDark, setPrefersDark] = useState(() => window.matchMedia('(prefers-color-scheme: dark)').matches)
  const [surahMenu, setSurahMenu] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('ayah-sidebar-collapsed') === 'true')
  const [desktopSidebar, setDesktopSidebar] = useState(() => window.matchMedia('(min-width: 1351px)').matches)
  const chaptersOpen = desktopSidebar ? !sidebarCollapsed : surahMenu
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [savedWords, setSavedWords] = useSavedWords()
  const [target, setTarget] = useState<{ key: string; position: number } | null>(null)
  const studyRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const chapterToggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1351px)')
    const update = (event: MediaQueryListEvent) => { setDesktopSidebar(event.matches); setSurahMenu(false) }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    if (!chaptersOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || settingsOpen || savedOpen || libraryOpen || selection) return
      if (desktopSidebar) setSidebarCollapsed(true)
      else setSurahMenu(false)
      chapterToggleRef.current?.focus()
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [chaptersOpen, desktopSidebar, settingsOpen, savedOpen, libraryOpen, selection])

  useEffect(() => { localStorage.setItem('ayah-chapter', String(chapterNumber)) }, [chapterNumber])

  useEffect(() => {
    if (!target || !verses.length) return
    const verse = verses.find(item => item.key === target.key)
    if (!verse) return
    const word = verse.words[target.position - 1]
    if (word) setSelection({ key: target.key, word })
    setTarget(null)
    requestAnimationFrame(() => document.getElementById(`ayah-${target.key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }))
  }, [target, verses])

  useEffect(() => { localStorage.setItem('ayah-language', language) }, [language])
  useEffect(() => { localStorage.setItem('ayah-ui-language', uiLanguage); document.documentElement.lang = uiLanguage }, [uiLanguage])
  useEffect(() => { localStorage.setItem('ayah-reciter', reciter) }, [reciter])
  useEffect(() => { localStorage.setItem('ayah-highlight', String(highlightVerbs)) }, [highlightVerbs])
  useEffect(() => { localStorage.setItem('ayah-word-meanings', String(showWordMeanings)) }, [showWordMeanings])
  useEffect(() => { localStorage.setItem('ayah-arabic-verses', String(showArabicVerses)) }, [showArabicVerses])
  useEffect(() => { localStorage.setItem('ayah-arabic-scale', String(arabicScale)) }, [arabicScale])
  useEffect(() => { localStorage.setItem('ayah-verb-meaning-bn', String(showVerbBn)) }, [showVerbBn])
  useEffect(() => { localStorage.setItem('ayah-verb-meaning-en', String(showVerbEn)) }, [showVerbEn])
  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const update = (event: MediaQueryListEvent) => setPrefersDark(event.matches)
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useLayoutEffect(() => {
    const theme = resolveTheme(themePreference, prefersDark)
    document.documentElement.dataset.theme = theme
    document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#182723' : '#173b35')
    localStorage.setItem('ayah-theme', themePreference)
  }, [themePreference, prefersDark])
  useEffect(() => { localStorage.setItem('ayah-sidebar-collapsed', String(sidebarCollapsed)) }, [sidebarCollapsed])
  useEffect(() => { localStorage.setItem('ayah-font-scale', String(fontScale)) }, [fontScale])
  useEffect(() => { localStorage.setItem('ayah-reader-share', String(readerShare)) }, [readerShare])
  useEffect(() => {
    const workspace = workspaceRef.current
    if (!workspace) return
    const update = () => {
      const sidebarWidth = workspace.querySelector('.chapter-sidebar')?.getBoundingClientRect().width || 0
      const available = workspace.clientWidth - sidebarWidth
      setAvailableWidth(available)
      if (window.innerWidth > 1350) setReaderShare(current => clampReaderShare(current, available))
    }
    const observer = new ResizeObserver(update)
    observer.observe(workspace)
    const sidebar = workspace.querySelector('.chapter-sidebar')
    if (sidebar) observer.observe(sidebar)
    update()
    return () => observer.disconnect()
  }, [sidebarCollapsed])

  useEffect(() => {
    if (!verses.length) return
    const nodes = verses.map(verse => document.getElementById(`ayah-${verse.key}`))
    let frame = 0
    const update = () => {
      frame = 0
      const top = window.innerWidth <= 760 ? 122 : 136
      let current = 0
      let low = 0
      let high = nodes.length - 1
      while (low <= high) {
        const middle = Math.floor((low + high) / 2)
        if (nodes[middle] && nodes[middle]!.getBoundingClientRect().top <= top) { current = middle; low = middle + 1 }
        else high = middle - 1
      }
      setVisibleVerseKey(verses[current].key)
    }
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    return () => { window.removeEventListener('scroll', schedule); window.removeEventListener('resize', schedule); if (frame) cancelAnimationFrame(frame) }
  }, [verses])

  const chapter = chapters.find(item => item.number === chapterNumber)
  const [minReaderShare, maxReaderShare] = readerShareBounds(availableWidth)
  const selectedId = selection && `${selection.key}:${selection.word.position}`
  const isSaved = !!selectedId && savedWords.some(item => item.id === selectedId)
  const selectWord = useCallback((key: string, word: Word) => { setSelection({ key, word }); setVisibleVerseKey(key) }, [])
  const selectChapter = (number: number) => { audio.stop(); setChapterNumber(number); setVisibleVerseKey(`${number}:1`); setSurahMenu(false); setSelection(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const navigate = (key: string, position: number) => {
    const number = Number(key.split(':')[0])
    setTarget({ key, position })
    if (number !== chapterNumber) { audio.stop(); setChapterNumber(number); setVisibleVerseKey(key) }
    else document.getElementById(`ayah-${key}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
  const toggleSave = () => {
    if (!selectedId) return
    if (!selection) return
    setSavedWords(current => current.some(item => item.id === selectedId)
      ? current.filter(item => item.id !== selectedId)
      : [...current, { id: selectedId, arabic: selection.word.arabic, en: selection.word.en, bn: selection.word.bn }])
  }
  const toggleChapters = () => {
    if (desktopSidebar) setSidebarCollapsed(value => !value)
    else setSurahMenu(value => !value)
  }
  const startResize = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (window.innerWidth <= 1350) return
    event.preventDefault()
    setResizing(true)
    const move = (pointer: PointerEvent) => {
      const workspace = workspaceRef.current
      if (!workspace) return
      const rect = workspace.getBoundingClientRect()
      const sidebarWidth = workspace.querySelector('.chapter-sidebar')?.getBoundingClientRect().width || 0
      const available = rect.width - sidebarWidth
      setReaderShare(clampReaderShare((pointer.clientX - rect.left - sidebarWidth) / available, available))
    }
    const stop = () => { setResizing(false); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', stop) }
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', stop, { once: true })
  }
  const resizeWithKeyboard = (direction: number) => {
    const workspace = workspaceRef.current
    if (!workspace) return
    const sidebarWidth = workspace.querySelector('.chapter-sidebar')?.getBoundingClientRect().width || 0
    setReaderShare(current => clampReaderShare(current + direction * 0.05, workspace.clientWidth - sidebarWidth))
  }
  const openChapters = () => {
    if (window.matchMedia('(min-width: 1351px)').matches) {
      setSidebarCollapsed(false)
      requestAnimationFrame(() => document.querySelector<HTMLInputElement>('.search-box input')?.focus())
    }
    else setSurahMenu(true)
  }

  return <div className="app-shell" style={{ '--font-scale': fontScale, '--arabic-scale': arabicScale } as CSSProperties}>
    <header className="topbar">
      <div className="brand"><span className="brand-mark" aria-hidden="true">۞</span><div><strong>AYAH <em>GRAMMAR</em></strong><small>{t('READ DEEPLY')}</small></div></div>
      <nav className="top-actions" aria-label={t('Reader controls')}>
        <button className="top-button book-library-trigger" onClick={() => { setLibraryOpen(true); setSettingsOpen(false); setSavedOpen(false) }} aria-label={t('Open 500 verbs library')}><BookOpen size={18} /><span>{t('500 verbs')}</span></button>
        <button className={highlightVerbs ? 'top-button active' : 'top-button'} onClick={() => setHighlightVerbs(value => !value)} aria-pressed={highlightVerbs}><Highlighter size={17} /><span>{t('Verbs')}</span></button>
        <button className="top-button" onClick={() => { setSavedOpen(value => !value); setSettingsOpen(false) }} aria-expanded={savedOpen} aria-label={t('Saved words, {count}', { count: savedWords.length })}><Bookmark size={17} /><span>{t('Saved')} {savedWords.length || ''}</span></button>
        <button className="top-button settings-trigger" onClick={() => { setSettingsOpen(value => !value); setSavedOpen(false) }} aria-expanded={settingsOpen} aria-label={t('Display settings')}><Settings2 size={18} /><span>{t('Display')}</span></button>
      </nav>
      <DisplaySettings open={settingsOpen} onClose={() => setSettingsOpen(false)} language={language} setLanguage={setLanguage} uiLanguage={uiLanguage} setUiLanguage={setUiLanguage} themePreference={themePreference} setThemePreference={setThemePreference} fontScale={fontScale} setFontScale={setFontScale} arabicScale={arabicScale} setArabicScale={setArabicScale} showArabicVerses={showArabicVerses} setShowArabicVerses={setShowArabicVerses} showWordMeanings={showWordMeanings} setShowWordMeanings={setShowWordMeanings} highlightVerbs={highlightVerbs} setHighlightVerbs={setHighlightVerbs} showVerbBn={showVerbBn} setShowVerbBn={setShowVerbBn} showVerbEn={showVerbEn} setShowVerbEn={setShowVerbEn} />
      {savedOpen && <SavedWords savedWords={savedWords} navigate={navigate} onClose={() => setSavedOpen(false)} uiLanguage={uiLanguage} />}
    </header>

    {libraryOpen && <DeferredFeature load={loadVerbLibrary} componentProps={{ onClose: () => setLibraryOpen(false), uiLanguage }} label={t('500 verbs')} uiLanguage={uiLanguage} onClose={() => setLibraryOpen(false)} modal />}

    <div ref={workspaceRef} className={`workspace ${selection ? 'is-studying' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${surahMenu ? 'surah-open' : ''} ${resizing ? 'is-resizing' : ''}`} style={{ '--reader-fr': `${readerShare * 100}fr`, '--panel-fr': `${(1 - readerShare) * 100}fr` } as CSSProperties}>
      <button ref={chapterToggleRef} className="surah-rail-toggle" onClick={toggleChapters} aria-controls="chapter-navigation" aria-expanded={chaptersOpen} aria-label={t(chaptersOpen ? 'Close surah sidebar' : 'Open surah sidebar')} title={t(chaptersOpen ? 'Close surah sidebar' : 'Open surah sidebar')}><ChevronLeft size={20} aria-hidden="true" /></button>
      <ChapterNavigation chapters={chapters} chapterNumber={chapterNumber} chaptersOpen={chaptersOpen} surahMenu={surahMenu} selectChapter={selectChapter} uiLanguage={uiLanguage} />
      {surahMenu && <button className="mobile-scrim" aria-label={t('Close chapter list')} onClick={() => setSurahMenu(false)} />}

      <main className="reader" id="quran-reader" ref={studyRef}>
        <div className="reading-location" aria-label={t('Current reading location')}><button onClick={openChapters} aria-label={t('Choose Surah')}><BookOpen size={15} /><span>{t('Surah {number}', { number: String(chapterNumber).padStart(2, '0') })}</span><strong>{chapter?.english || t('Loading…')}</strong><ChevronDown size={13} /></button><span className="reading-location-ayah">{t('Ayah {key}', { key: visibleVerseKey })}</span></div>
        <div className="reader-intro">
          <div className="breadcrumbs"><span>{t('THE QURAN')}</span><ChevronRight size={13} /><span>{t('SURAH {number}', { number: String(chapterNumber).padStart(2, '0') })}</span></div>
          <div className="title-row"><div><span className="chapter-kicker">{t('CHAPTER {number}', { number: String(chapterNumber).padStart(2, '0') })}</span><h1>{chapter?.english || t('Loading…')}</h1><p>{chapter?.meaning || t('A word-by-word grammar journey')} <span className="title-dot">·</span> {t('{count} ayahs', { count: chapter?.ayahs || '—' })}</p></div><div className="title-arabic" lang="ar" dir="rtl">{chapter?.arabic || 'القرآن'}</div></div>
          <div className="reader-toolbar"><button className="chapter-picker" onClick={openChapters}><BookOpen size={18} /> {t('Choose surah')} <ChevronDown size={16} /></button><div className="toolbar-right"><div className="toolbar-note"><span className="verb-key" /> {highlightVerbs ? t('Verb highlighted') : t('Tap any word to study')}</div><label className="reciter-select"><span>{t('Reciter')}</span><select value={reciter} onChange={event => { audio.stop(); setReciter(readReciter(event.target.value)) }}>{reciters.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label></div></div>
        {audio.error && <p className="audio-error" role="alert">{t(audio.error === 'unavailable' ? 'Audio is unavailable for this location.' : audio.error === 'load' ? 'Audio could not load. Check your connection and try again.' : 'Audio could not play. Check your connection and try again.')}</p>}
        </div>
        {chapterList.error && <div className="load-error" role="alert"><p>{t('Could not load the chapter list. Reconnect and try again.')}</p><button className="action-button" onClick={chapterList.retry}>{t('Retry chapter list')}</button></div>}
        {chapterData.error && <div className="load-error" role="alert"><p>{t('This chapter could not load. Reconnect and try again.')}</p><button className="action-button" onClick={chapterData.retry}>{t('Retry chapter')}</button></div>}
        {chapterData.loading && <div className="loading-message" role="status">{t('Opening the chapter…')}</div>}
        <VerseList verses={verses} chapters={chapters} reciter={reciter} selectedKey={selection?.key} selectedPosition={selection?.word.position} highlightVerbs={highlightVerbs} showArabicVerses={showArabicVerses} showWordMeanings={showWordMeanings} language={language} uiLanguage={uiLanguage} audioId={audio.id} audioStatus={audio.status} onToggleAudio={toggleVerseAudio} onSelect={selectWord} />
        <div className="chapter-pagination"><button disabled={chapterNumber <= 1} onClick={() => selectChapter(chapterNumber - 1)}><ChevronLeft size={17} /> {t('Previous surah')}</button><button disabled={chapterNumber >= 114} onClick={() => selectChapter(chapterNumber + 1)}>{t('Next surah')} <ChevronRight size={17} /></button></div>
        <footer className="reader-footer">{t('Quran text: Tanzil · Verse translations: Saheeh International and Muhiuddin Khan · Grammar: Quranic Arabic Corpus · Word meanings: GTAF.')} {t('Verse audio: Al Quran Cloud / Islamic Network · Word audio: Quran Foundation.')} <a href="/sources.html">{t('Sources & credits')}</a></footer>
      </main>

      {selection && <DeferredFeature componentKey={`${selection.key}:${selection.word.position}`} load={loadWordPanel} label={t('Word study')} uiLanguage={uiLanguage} onClose={() => setSelection(null)} componentProps={{ verseKey: selection.key, word: selection.word, saved: isSaved, onSave: toggleSave, onClose: () => setSelection(null), onNavigate: navigate, onResizeStart: startResize, onResizeKeyboard: resizeWithKeyboard, readerShare, minReaderShare, maxReaderShare, showVerbBn, showVerbEn, uiLanguage, audioStatus: audio.id === `word:${selection.key}:${selection.word.position}` ? audio.status : 'idle', onPlayWord: (key: string, position: number) => audio.toggle(`word:${key}:${position}`, wordAudioUrl(key, position)) }} />}
    </div>
  </div>
}
