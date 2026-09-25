import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import { BookOpen, Bookmark, ChevronDown, ChevronLeft, ChevronRight, Highlighter, Menu, Search, Settings2, X } from 'lucide-react'
import WordPanel from './WordPanel'
import VerbLibrary from './VerbLibrary'
import type { Chapter, VerbIndex, Verse, Word } from './types'
import { readThemePreference, resolveTheme } from './theme'
import { clampReaderShare, readFontScale, readReaderShare, readerShareBounds } from './displayPreferences'

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
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [chapterNumber, setChapterNumber] = useState(storedChapter)
  const [verses, setVerses] = useState<Verse[]>([])
  const [selection, setSelection] = useState<Selection | null>(null)
  const [verbIndex, setVerbIndex] = useState<VerbIndex | null>(null)
  const [language, setLanguage] = useState<LanguageMode>(() => (localStorage.getItem('ayah-language') as LanguageMode) || 'both')
  const [highlightVerbs, setHighlightVerbs] = useState(() => localStorage.getItem('ayah-highlight') !== 'false')
  const [showWordMeanings, setShowWordMeanings] = useState(() => localStorage.getItem('ayah-word-meanings') !== 'false')
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
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [savedOpen, setSavedOpen] = useState(false)
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [loadError, setLoadError] = useState('')
  const [savedWords, setSavedWords] = useState<SavedEntry[]>(storedSaved)
  const [target, setTarget] = useState<{ key: string; position: number } | null>(null)
  const studyRef = useRef<HTMLDivElement>(null)
  const workspaceRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/data/chapters.json').then(response => {
      if (!response.ok) throw new Error('Chapter list unavailable')
      return response.json()
    }).then(setChapters).catch(() => setLoadError('Could not load the chapter list. Please reconnect and try again.'))
  }, [])

  useEffect(() => {
    let active = true
    setVerses([])
    setLoadError('')
    fetch(`/data/chapter-${chapterNumber}.json`).then(response => {
      if (!response.ok) throw new Error('Chapter unavailable')
      return response.json()
    }).then((data: Verse[]) => { if (active) setVerses(data) }).catch(() => { if (active) setLoadError('This chapter is not available yet. Please reconnect and try again.') })
    localStorage.setItem('ayah-chapter', String(chapterNumber))
    return () => { active = false }
  }, [chapterNumber])

  useEffect(() => {
    if (!selection || selection.word.pos !== 'V' || verbIndex) return
    fetch('/data/verbs.json').then(response => {
      if (!response.ok) throw new Error('Verb index unavailable')
      return response.json()
    }).then(setVerbIndex).catch(() => setLoadError('The verb index could not load. Word meanings remain available.'))
  }, [selection, verbIndex])

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
  useEffect(() => { localStorage.setItem('ayah-highlight', String(highlightVerbs)) }, [highlightVerbs])
  useEffect(() => { localStorage.setItem('ayah-word-meanings', String(showWordMeanings)) }, [showWordMeanings])
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
  const selectWord = (key: string, word: Word) => { setSelection({ key, word }); setVisibleVerseKey(key) }
  const selectChapter = (number: number) => { setChapterNumber(number); setVisibleVerseKey(`${number}:1`); setSurahMenu(false); setSelection(null); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const navigate = (key: string, position: number) => {
    const number = Number(key.split(':')[0])
    setTarget({ key, position })
    if (number !== chapterNumber) { setChapterNumber(number); setVisibleVerseKey(key) }
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
    if (window.matchMedia('(min-width: 1351px)').matches) setSidebarCollapsed(value => !value)
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

  return <div className="app-shell" style={{ '--font-scale': fontScale } as CSSProperties}>
    <header className="topbar">
      <div className="brand"><span className="brand-mark" aria-hidden="true">۞</span><div><strong>AYAH <em>GRAMMAR</em></strong><small>READ DEEPLY</small></div></div>
      <nav className="top-actions" aria-label="Reader controls">
        <button className="top-button book-library-trigger" onClick={() => { setLibraryOpen(true); setSettingsOpen(false); setSavedOpen(false) }} aria-label="Open 500 verbs library"><BookOpen size={18} /><span>500 verbs</span></button>
        <button className={highlightVerbs ? 'top-button active' : 'top-button'} onClick={() => setHighlightVerbs(value => !value)} aria-pressed={highlightVerbs}><Highlighter size={17} /><span>Verbs</span></button>
        <button className="top-button" onClick={() => { setSavedOpen(value => !value); setSettingsOpen(false) }} aria-expanded={savedOpen} aria-label={`Saved words, ${savedWords.length}`}><Bookmark size={17} /><span>Saved {savedWords.length || ''}</span></button>
        <button className="top-button settings-trigger" onClick={() => { setSettingsOpen(value => !value); setSavedOpen(false) }} aria-expanded={settingsOpen} aria-label="Display settings"><Settings2 size={18} /><span>Display</span></button>
        <button className="top-button menu-trigger" onClick={toggleChapters} aria-label="Toggle chapters"><Menu size={20} /></button>
      </nav>
      {settingsOpen && <div className="settings-popover">
        <div className="popover-head"><strong>Reading display</strong><button className="icon-button" aria-label="Close display settings" onClick={() => setSettingsOpen(false)}><X size={17} /></button></div>
        <p>Meanings to show</p>
        <div className="segmented-control">{(['both', 'bn', 'en'] as const).map(mode => <button key={mode} className={language === mode ? 'selected' : ''} onClick={() => setLanguage(mode)}>{mode === 'both' ? 'Both' : mode === 'bn' ? 'বাংলা' : 'English'}</button>)}</div>
        <p>Theme</p>
        <div className="segmented-control theme-control" role="group" aria-label="Theme">{(['system', 'light', 'dark'] as const).map(theme => <button key={theme} className={themePreference === theme ? 'selected' : ''} aria-pressed={themePreference === theme} onClick={() => setThemePreference(theme)}>{theme === 'system' ? 'System' : theme === 'light' ? 'Light' : 'Dark'}</button>)}</div>
        <label className="font-scale-setting" htmlFor="font-scale"><span>Text size</span><strong>{fontScale.toFixed(1)}×</strong></label>
        <input id="font-scale" className="font-scale-slider" type="range" min="0.8" max="1.4" step="0.1" value={fontScale} onChange={event => setFontScale(Number(event.target.value))} aria-label="Text size" />
        <p>Verb study meanings</p>
        <label className="setting-toggle"><span>বাংলা book meanings</span><input type="checkbox" checked={showVerbBn} onChange={event => setShowVerbBn(event.target.checked)} /></label>
        <label className="setting-toggle"><span>English Quran example</span><input type="checkbox" checked={showVerbEn} onChange={event => setShowVerbEn(event.target.checked)} /></label>
        <label className="setting-toggle"><span>Word-by-word meanings</span><input type="checkbox" checked={showWordMeanings} onChange={event => setShowWordMeanings(event.target.checked)} /></label>
        <label className="setting-toggle"><span>Highlight verbs</span><input type="checkbox" checked={highlightVerbs} onChange={event => setHighlightVerbs(event.target.checked)} /></label>
      </div>}
      {savedOpen && <div className="settings-popover saved-popover">
        <div className="popover-head"><strong>Saved words</strong><button className="icon-button" aria-label="Close saved words" onClick={() => setSavedOpen(false)}><X size={17} /></button></div>
        {savedWords.length === 0 ? <p>Tap “Save word” while studying to keep it here.</p> : <div className="saved-list">{savedWords.map(item => <button key={item.id} onClick={() => { const [surah, ayah, position] = item.id.split(':'); navigate(`${surah}:${ayah}`, Number(position)); setSavedOpen(false) }}><span className="saved-ref">{item.id}</span><strong lang="ar" dir="rtl">{item.arabic}</strong><span lang="bn">{item.bn}</span><small>{item.en}</small></button>)}</div>}
      </div>}
    </header>

    {libraryOpen && <VerbLibrary onClose={() => setLibraryOpen(false)} />}

    <div ref={workspaceRef} className={`workspace ${selection ? 'is-studying' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${surahMenu ? 'surah-open' : ''} ${resizing ? 'is-resizing' : ''}`} style={{ '--reader-fr': `${readerShare * 100}fr`, '--panel-fr': `${(1 - readerShare) * 100}fr` } as CSSProperties}>
      <button className="surah-rail-toggle" onClick={toggleChapters} aria-label="Toggle Surah list" title="Toggle Surah list"><Menu size={18} /></button>
      <aside className={surahMenu ? 'chapter-sidebar open' : 'chapter-sidebar'} aria-label="Chapter navigation">
        <div className="sidebar-head"><div><span className="eyebrow">EXPLORE THE QURAN</span><h2>Surahs</h2></div><button className="icon-button sidebar-collapse" onClick={() => setSidebarCollapsed(true)} aria-label="Collapse chapter sidebar"><ChevronLeft size={20} /></button><button className="icon-button sidebar-close" onClick={() => setSurahMenu(false)} aria-label="Close chapters"><X size={20} /></button></div>
        <label className="search-box"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Find a surah" aria-label="Find a surah" /></label>
        <div className="chapter-list">{filteredChapters.map(item => <button key={item.number} onClick={() => selectChapter(item.number)} className={item.number === chapterNumber ? 'chapter-item current' : 'chapter-item'}><span className="chapter-index">{String(item.number).padStart(2, '0')}</span><span className="chapter-names"><strong>{item.english}</strong><small>{item.meaning} · {item.ayahs} ayahs</small></span><span className="chapter-arabic" lang="ar">{item.arabic}</span></button>)}</div>
        <div className="sidebar-footer"><BookOpen size={16} /> <span>Every word has a place to explore.</span></div>
      </aside>
      {surahMenu && <button className="mobile-scrim" aria-label="Close chapter list" onClick={() => setSurahMenu(false)} />}

      <main className="reader" id="quran-reader" ref={studyRef}>
        <div className="reading-location" aria-label="Current reading location"><button onClick={openChapters} aria-label="Choose Surah"><BookOpen size={15} /><span>Surah {String(chapterNumber).padStart(2, '0')}</span><strong>{chapter?.english || 'Loading…'}</strong><ChevronDown size={13} /></button><span className="reading-location-ayah">Ayah {visibleVerseKey}</span></div>
        <div className="reader-intro">
          <div className="breadcrumbs"><span>THE QURAN</span><ChevronRight size={13} /><span>SURAH {String(chapterNumber).padStart(2, '0')}</span></div>
          <div className="title-row"><div><span className="chapter-kicker">CHAPTER {String(chapterNumber).padStart(2, '0')}</span><h1>{chapter?.english || 'Loading…'}</h1><p>{chapter?.meaning || 'A word-by-word grammar journey'} <span className="title-dot">·</span> {chapter?.ayahs || '—'} ayahs</p></div><div className="title-arabic" lang="ar" dir="rtl">{chapter?.arabic || 'القرآن'}</div></div>
          <div className="reader-toolbar"><button className="chapter-picker" onClick={openChapters}><BookOpen size={18} /> Choose surah <ChevronDown size={16} /></button><div className="toolbar-note"><span className="verb-key" /> {highlightVerbs ? 'Verb highlighted' : 'Tap any word to study'}</div></div>
        </div>
        {loadError && <div className="load-error" role="alert">{loadError}</div>}
        {!verses.length && !loadError && <div className="loading-message">Opening the chapter…</div>}
        {verses.length > 0 && <div className="verses">
          {verses[0].opening && <div className="basmalah" lang="ar" dir="rtl">{verses[0].opening}</div>}
          {verses.map((verse, index) => <article id={`ayah-${verse.key}`} className={selection?.key === verse.key ? 'verse active-verse' : 'verse'} key={verse.key}>
            <div className="verse-top"><span className="verse-number">{String(index + 1).padStart(2, '0')}</span><span className="verse-reference">{verse.key}</span></div>
            <div className="arabic-verse" lang="ar" dir="rtl">{verse.parts.map((part, i) => <span key={i}>{part.word ? <button lang="ar" className={`arabic-word ${highlightVerbs && verse.words[part.word - 1]?.pos === 'V' ? 'is-verb' : ''} ${selection?.key === verse.key && selection.word.position === part.word ? 'is-selected' : ''}`} onClick={() => selectWord(verse.key, verse.words[part.word! - 1])} aria-label={`Study ${part.text}, word ${part.word}`}>{part.text}</button> : <span className="pause-mark">{part.text}</span>}{i < verse.parts.length - 1 ? ' ' : ''}</span>)}</div>
            {showWordMeanings && <div className="word-glosses" dir="rtl">{verse.words.map(word => <button className={selection?.key === verse.key && selection.word.position === word.position ? 'gloss selected' : 'gloss'} key={word.position} onClick={() => selectWord(verse.key, word)}><span className="gloss-arabic" lang="ar">{word.arabic}</span>{language !== 'en' && <span className="gloss-bn" lang="bn">{word.bn}</span>}{language !== 'bn' && <span className="gloss-en" lang="en">{word.en}</span>}</button>)}</div>}
            <div className="ayah-translations">{language !== 'en' && <p lang="bn" className="ayah-bn"><span className="translation-label">বাংলা</span>{verse.bn}</p>}{language !== 'bn' && <p className="ayah-en"><span className="translation-label">ENGLISH</span>{verse.en}</p>}</div>
          </article>)}
        </div>}
        <div className="chapter-pagination"><button disabled={chapterNumber <= 1} onClick={() => selectChapter(chapterNumber - 1)}><ChevronLeft size={17} /> Previous surah</button><button disabled={chapterNumber >= 114} onClick={() => selectChapter(chapterNumber + 1)}>Next surah <ChevronRight size={17} /></button></div>
        <footer className="reader-footer">Quran text: Tanzil · Verse translations: Saheeh International and Muhiuddin Khan · Grammar: Quranic Arabic Corpus · Word meanings: GTAF. <a href="/sources.html">Sources & credits</a></footer>
      </main>

      {selection && <WordPanel key={`${selection.key}:${selection.word.position}`} verseKey={selection.key} word={selection.word} occurrences={selection.word.root ? verbIndex?.[selection.word.root] || null : null} saved={isSaved} onSave={toggleSave} onClose={() => setSelection(null)} onNavigate={navigate} onResizeStart={startResize} onResizeKeyboard={resizeWithKeyboard} readerShare={readerShare} minReaderShare={minReaderShare} maxReaderShare={maxReaderShare} showVerbBn={showVerbBn} showVerbEn={showVerbEn} />}
    </div>
  </div>
}
