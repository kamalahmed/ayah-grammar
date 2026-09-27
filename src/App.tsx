import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { BookOpen, Bookmark, ChevronDown, ChevronLeft, ChevronRight, Highlighter, Search, Settings2, X } from 'lucide-react'
import DeferredFeature from './DeferredFeature'
import { deferModule } from './deferredModule'
import { useJsonData } from './useJsonData'
import VerseCard from './VerseCard'

import type { Chapter, Verse, Word } from './types'
import { readThemePreference, resolveTheme } from './theme'
import { clampReaderShare, readArabicScale, readFontScale, readReaderShare, readerShareBounds } from './displayPreferences'
import { readReciter, reciters, verseAudioUrl, wordAudioUrl } from './audio'
import { useAudioPlayer } from './useAudioPlayer'
import { readUiLanguage, uiText } from './uiText'
import { getOfflineManifest, offlinePackStatus, saveOfflinePack, type OfflineManifest } from './offlinePack'

const loadWordPanel = deferModule(() => import('./WordPanel'))
const loadVerbLibrary = deferModule(() => import('./VerbLibrary'))

type LanguageMode = 'both' | 'bn' | 'en'
type Selection = { key: string; word: Word }
type SavedEntry = { id: string; arabic: string; en: string; bn: string }

function storedSaved(): SavedEntry[] {
  try {
    const value = JSON.parse(localStorage.getItem('ayah-saved') || '[]')
    return Array.isArray(value) ? value.filter((item): item is SavedEntry => item && typeof item.id === 'string' && typeof item.arabic === 'string' && typeof item.en === 'string' && typeof item.bn === 'string') : []
  } catch { return [] }
}

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
  const [offlineManifest, setOfflineManifest] = useState<OfflineManifest | null>(null)
  const [offlineState, setOfflineState] = useState<'checking' | 'available' | 'saving' | 'ready' | 'error'>('checking')
  const [offlineProgress, setOfflineProgress] = useState({ saved: 0, total: 0 })
  const [savedOpen, setSavedOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [savedWords, setSavedWords] = useState<SavedEntry[]>(storedSaved)
  const [target, setTarget] = useState<{ key: string; position: number } | null>(null)
  const studyRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)
  const chapterToggleRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!import.meta.env.PROD) return
    let active = true
    getOfflineManifest().then(async manifest => {
      const status = await offlinePackStatus(manifest)
      if (!active) return
      setOfflineManifest(manifest)
      setOfflineProgress({ saved: status.saved, total: status.total })
      setOfflineState(status.ready ? 'ready' : 'available')
    }).catch(() => { if (active) setOfflineState('error') })
    return () => { active = false }
  }, [])

  const saveOffline = async () => {
    if (offlineState === 'saving') return
    setOfflineState('saving')
    try {
      const manifest = offlineManifest ?? await getOfflineManifest()
      setOfflineManifest(manifest)
      if (navigator.storage?.persist) await navigator.storage.persist().catch(() => false)
      await saveOfflinePack(manifest, progress => {
        if (progress.saved % 10 === 0 || progress.saved === progress.total) setOfflineProgress(progress)
      })
      setOfflineProgress({ saved: manifest.files.length, total: manifest.files.length })
      setOfflineState('ready')
    } catch { setOfflineState('error') }
  }

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
  useEffect(() => { localStorage.setItem('ayah-saved', JSON.stringify(savedWords)) }, [savedWords])
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
  const filteredChapters = useMemo(() => chapters.filter(item => `${item.number} ${item.english} ${item.meaning} ${item.arabic}`.toLowerCase().includes(search.toLowerCase())), [chapters, search])
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
      {settingsOpen && <div className="settings-popover">
        <div className="popover-head"><strong>{t('Reading display')}</strong><button className="icon-button" aria-label={t('Close display settings')} onClick={() => setSettingsOpen(false)}><X size={17} /></button></div>
        <p>{t('Interface language')}</p>
        <div className="segmented-control" role="group" aria-label={t('Interface language')}>{(['en', 'bn'] as const).map(mode => <button key={mode} className={uiLanguage === mode ? 'selected' : ''} aria-pressed={uiLanguage === mode} onClick={() => setUiLanguage(mode)}>{mode === 'en' ? 'English' : 'বাংলা'}</button>)}</div>
        <p>{t('Meanings to show')}</p>
        <div className="segmented-control">{(['both', 'bn', 'en'] as const).map(mode => <button key={mode} className={language === mode ? 'selected' : ''} onClick={() => setLanguage(mode)}>{mode === 'both' ? t('Both') : mode === 'bn' ? 'বাংলা' : 'English'}</button>)}</div>
        <p>{t('Theme')}</p>
        <div className="segmented-control theme-control" role="group" aria-label={t('Theme')}>{(['system', 'light', 'dark'] as const).map(theme => <button key={theme} className={themePreference === theme ? 'selected' : ''} aria-pressed={themePreference === theme} onClick={() => setThemePreference(theme)}>{t(theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark')}</button>)}</div>
        <label className="font-scale-setting" htmlFor="font-scale"><span>{t('Text size')}</span><strong>{fontScale.toFixed(1)}×</strong></label>
        <input id="font-scale" className="font-scale-slider" type="range" min="0.8" max="1.4" step="0.1" value={fontScale} onChange={event => setFontScale(Number(event.target.value))} aria-label={t('Text size')} />
        <label className="font-scale-setting" htmlFor="arabic-scale"><span>{t('Arabic verse size')}</span><strong>{arabicScale.toFixed(1)}×</strong></label>
        <input id="arabic-scale" className="font-scale-slider" type="range" min="0.8" max="2" step="0.1" value={arabicScale} onChange={event => setArabicScale(Number(event.target.value))} aria-label={t('Arabic verse size')} aria-valuetext={t('{count} percent', { count: Math.round(arabicScale * 100) })} />
        <small className="setting-hint">{t('Only the Arabic ayah text and opening basmalah.')}</small>
        <p>{t('Reading content')}</p>
        <label className="setting-toggle"><span>{t('Arabic verses')}</span><input type="checkbox" checked={showArabicVerses} onChange={event => setShowArabicVerses(event.target.checked)} /></label>
        <label className="setting-toggle"><span>{t('Word-by-word meanings')}</span><input type="checkbox" checked={showWordMeanings} onChange={event => setShowWordMeanings(event.target.checked)} /></label>
        <label className="setting-toggle"><span>{t('Highlight verbs')}</span><input type="checkbox" checked={highlightVerbs} onChange={event => setHighlightVerbs(event.target.checked)} /></label>
        <p>{t('Verb study meanings')}</p>
        <label className="setting-toggle"><span>{t('বাংলা book meanings')}</span><input type="checkbox" checked={showVerbBn} onChange={event => setShowVerbBn(event.target.checked)} /></label>
        <label className="setting-toggle"><span>{t('English Quran example')}</span><input type="checkbox" checked={showVerbEn} onChange={event => setShowVerbEn(event.target.checked)} /></label>
        {import.meta.env.PROD && <div className="offline-pack-control">
          <p>{t('Offline reading')}</p>
          <small className="setting-hint">{t('Save all surahs, word meanings, verb study, and the 500-verb library on this device. Audio and external links still need internet.')}</small>
          {offlineManifest && <small className="setting-hint">{t('About {count} MB on this device.', { count: Math.ceil(offlineManifest.totalBytes / 1_000_000) })}</small>}
          <button className="action-button" onClick={saveOffline} disabled={offlineState === 'checking' || offlineState === 'saving' || offlineState === 'ready'}>{t(offlineState === 'ready' ? 'Saved for offline use' : offlineState === 'saving' ? 'Saving offline files…' : offlineState === 'error' ? 'Retry offline save' : 'Save for offline use')}</button>
          {offlineState === 'saving' && <progress value={offlineProgress.saved} max={offlineProgress.total || 1} aria-label={t('Offline save progress')} />}
          <small className="setting-hint" role="status">{offlineState === 'ready' ? t('All reading and study files are saved on this device.') : offlineState === 'error' ? t('Offline save stopped. Reconnect and retry; saved files will be reused.') : offlineState === 'saving' ? t('{saved} of {total} files saved. Keep this page open.', offlineProgress) : offlineState === 'checking' ? t('Checking offline files…') : t('Save once while online before reading without a connection.')}</small>
        </div>}
      </div>}
      {savedOpen && <div className="settings-popover saved-popover">
        <div className="popover-head"><strong>{t('Saved words')}</strong><button className="icon-button" aria-label={t('Close saved words')} onClick={() => setSavedOpen(false)}><X size={17} /></button></div>
        {savedWords.length === 0 ? <p>{t('Tap “Save word” while studying to keep it here.')}</p> : <div className="saved-list">{savedWords.map(item => <button key={item.id} onClick={() => { const [surah, ayah, position] = item.id.split(':'); navigate(`${surah}:${ayah}`, Number(position)); setSavedOpen(false) }}><span className="saved-ref">{item.id}</span><strong lang="ar" dir="rtl">{item.arabic}</strong><span lang="bn">{item.bn}</span><small>{item.en}</small></button>)}</div>}
      </div>}
    </header>

    {libraryOpen && <DeferredFeature load={loadVerbLibrary} componentProps={{ onClose: () => setLibraryOpen(false), uiLanguage }} label={t('500 verbs')} uiLanguage={uiLanguage} onClose={() => setLibraryOpen(false)} modal />}

    <div ref={workspaceRef} className={`workspace ${selection ? 'is-studying' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${surahMenu ? 'surah-open' : ''} ${resizing ? 'is-resizing' : ''}`} style={{ '--reader-fr': `${readerShare * 100}fr`, '--panel-fr': `${(1 - readerShare) * 100}fr` } as CSSProperties}>
      <button ref={chapterToggleRef} className="surah-rail-toggle" onClick={toggleChapters} aria-controls="chapter-navigation" aria-expanded={chaptersOpen} aria-label={t(chaptersOpen ? 'Close surah sidebar' : 'Open surah sidebar')} title={t(chaptersOpen ? 'Close surah sidebar' : 'Open surah sidebar')}><ChevronLeft size={20} aria-hidden="true" /></button>
      <aside id="chapter-navigation" className={surahMenu ? 'chapter-sidebar open' : 'chapter-sidebar'} aria-label={t('Chapter navigation')} aria-hidden={!chaptersOpen} inert={!chaptersOpen}>
        <div className="sidebar-head"><div><span className="eyebrow">{t('EXPLORE THE QURAN')}</span><h2>{t('Surahs')}</h2></div></div>
        <label className="search-box"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={t('Find a surah')} aria-label={t('Find a surah')} /></label>
        <div className="chapter-list">{filteredChapters.map(item => <button key={item.number} onClick={() => selectChapter(item.number)} className={item.number === chapterNumber ? 'chapter-item current' : 'chapter-item'}><span className="chapter-index">{String(item.number).padStart(2, '0')}</span><span className="chapter-names"><strong>{item.english}</strong><small>{item.meaning} · {t('{count} ayahs', { count: item.ayahs })}</small></span><span className="chapter-arabic" lang="ar">{item.arabic}</span></button>)}</div>
        <div className="sidebar-footer"><BookOpen size={16} /> <span>{t('Every word has a place to explore.')}</span></div>
      </aside>
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
        {verses.length > 0 && <div className="verses">
          {showArabicVerses && verses[0].opening && <div className="basmalah" lang="ar" dir="rtl">{verses[0].opening}</div>}
          {verses.map((verse, index) => <VerseCard key={verse.key} verse={verse} index={index} selectedPosition={selection?.key === verse.key ? selection.word.position : undefined} highlightVerbs={highlightVerbs} showArabicVerses={showArabicVerses} showWordMeanings={showWordMeanings} language={language} uiLanguage={uiLanguage} audioUrl={verseAudioUrl(verse.key, chapters, reciter)} audioStatus={audio.id === `verse:${verse.key}` ? audio.status : 'idle'} onToggleAudio={(key, url) => audio.toggle(`verse:${key}`, url)} onSelect={selectWord} />)}
        </div>}
        <div className="chapter-pagination"><button disabled={chapterNumber <= 1} onClick={() => selectChapter(chapterNumber - 1)}><ChevronLeft size={17} /> {t('Previous surah')}</button><button disabled={chapterNumber >= 114} onClick={() => selectChapter(chapterNumber + 1)}>{t('Next surah')} <ChevronRight size={17} /></button></div>
        <footer className="reader-footer">{t('Quran text: Tanzil · Verse translations: Saheeh International and Muhiuddin Khan · Grammar: Quranic Arabic Corpus · Word meanings: GTAF.')} {t('Verse audio: Al Quran Cloud / Islamic Network · Word audio: Quran Foundation.')} <a href="/sources.html">{t('Sources & credits')}</a></footer>
      </main>

      {selection && <DeferredFeature componentKey={`${selection.key}:${selection.word.position}`} load={loadWordPanel} label={t('Word study')} uiLanguage={uiLanguage} onClose={() => setSelection(null)} componentProps={{ verseKey: selection.key, word: selection.word, saved: isSaved, onSave: toggleSave, onClose: () => setSelection(null), onNavigate: navigate, onResizeStart: startResize, onResizeKeyboard: resizeWithKeyboard, readerShare, minReaderShare, maxReaderShare, showVerbBn, showVerbEn, uiLanguage, audioStatus: audio.id === `word:${selection.key}:${selection.word.position}` ? audio.status : 'idle', onPlayWord: (key: string, position: number) => audio.toggle(`word:${key}:${position}`, wordAudioUrl(key, position)) }} />}
    </div>
  </div>
}
