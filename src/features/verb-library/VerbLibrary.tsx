import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Eye, EyeOff, Search, X } from 'lucide-react'
import BookChart from '../study/BookChart'
import { bookReadings, type BookVerb } from '../../domain/books/bookData'
import { searchLibrary, type LibraryEntry } from './searchLibrary'
import { studyCache, useJsonData } from '../../shared/data/useJsonData'
import { indexUrl, entryUrls } from 'virtual:book-library'
import type { UiLanguage } from '../../i18n/uiText'
import { uiText } from '../../i18n/uiText'

function lastEntry(): number {
  try { const n = Number(localStorage.getItem('ayah-book-entry')); return Number.isInteger(n) && n >= 1 && n <= 500 ? n : 1 } catch { return 1 }
}

export default function VerbLibrary({ onClose, uiLanguage = 'en' }: { onClose: () => void; uiLanguage?: UiLanguage }) {
  const t = (english: string, values?: Record<string, string | number>) => uiText(uiLanguage, english, values)
  const dialog = useRef<HTMLDialogElement>(null)
  const studyPane = useRef<HTMLElement>(null)
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState(0)
  const [form, setForm] = useState('')
  const [entry, setEntry] = useState(lastEntry)
  const [reading, setReading] = useState(0)
  const [showMeanings, setShowMeanings] = useState(true)
  const index = useJsonData<LibraryEntry[]>(indexUrl, studyCache)
  const detail = useJsonData<BookVerb>(entryUrls[entry], studyCache)
  const matches = useMemo(() => searchLibrary(index.data ?? [], query, level, form), [index.data, query, level, form])
  const verb = detail.data
  const readings = verb ? bookReadings(verb) : []
  const active = readings[reading] || verb
  const position = matches.findIndex(v => v.entry_number === entry)
  const choose = (number: number) => { setEntry(number); setReading(0); studyPane.current?.scrollTo({ top: 0 }) }
  useEffect(() => { dialog.current?.showModal(); return () => dialog.current?.close() }, [])
  useEffect(() => { try { localStorage.setItem('ayah-book-entry', String(entry)) } catch { /* Study still works without storage. */ } }, [entry])

  return <dialog ref={dialog} className="book-library" onClose={event => { if (event.currentTarget.isConnected && !event.currentTarget.open) onClose() }} aria-labelledby="book-library-title">
    <header className="book-library-header"><div><span className="eyebrow">{t('YOUR GRAMMAR COMPANION')}</span><h1 id="book-library-title">{t('500 verbs')} {uiLanguage === 'en' && <span lang="bn">ক্রিয়াপদ</span>}</h1></div><button className="icon-button" onClick={onClose} aria-label={t('Close verb library')}><X size={23} /></button></header>
    <div className="book-library-layout">
      <aside className="book-library-index" aria-label={t('Find a book verb')}>
        <label className="search-box"><Search size={18} /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder={t('আরবি, বাংলা, or number…')} aria-label={t('Search 500 verbs')} /></label>
        <div className="book-filters"><label>{t('Book')}<select value={level} onChange={e => setLevel(Number(e.target.value))}><option value={0}>{t('Both levels')}</option><option value={1}>{t('Level 1 · 1–200')}</option><option value={2}>{t('Level 2 · 201–500')}</option></select></label><label>{t('Form')}<select value={form} onChange={e => setForm(e.target.value)}><option value="">{t('All forms')}</option>{['I','II','III','IV','V','VI','VII','VIII','IX','X'].map(f => <option key={f} value={f}>{t('Form {form}', { form: f })}</option>)}</select></label></div>
        {index.loading && <p role="status">{t('Loading…')}</p>}
        {index.error && <div role="alert"><p>{t('Could not load the verb library. Reconnect and try again.')}</p><button className="action-button" onClick={index.retry}>{t('Retry')}</button></div>}
        <div className="book-result-count" aria-live="polite">{t('{count} of 500 verbs', { count: matches.length })}</div>
        <div className="book-result-list">{matches.map(v => <button key={v.entry_number} onClick={() => choose(v.entry_number)} className={`book-result ${entry === v.entry_number ? 'selected' : ''}`} aria-current={entry === v.entry_number ? 'true' : undefined}><span className="book-entry-number">{String(v.entry_number).padStart(3, '0')}</span><strong lang="ar" dir="rtl">{v.headword_ar}</strong><span lang="bn">{v.meaning_bn}</span><small>{t('Level {level}', { level: v.level })} · {v.form}</small></button>)}{index.data && matches.length === 0 && <div className="book-no-results"><BookOpen size={24} /><p>{t('No matching verb.')}</p><button className="action-button" onClick={() => { setQuery(''); setLevel(0); setForm('') }}>{t('Clear filters')}</button></div>}</div>
      </aside>
      <main ref={studyPane} className="book-library-study">
        {detail.loading && <p role="status">{t('Loading…')}</p>}
        {detail.error && <div role="alert"><p>{t('Could not load this verb. Reconnect and try again.')}</p><button className="action-button" onClick={detail.retry}>{t('Retry')}</button></div>}
        {active && <><div className="book-entry-heading"><div><span className="eyebrow">{String(entry).padStart(3, '0')} / 500 <span className="dot">·</span> {t('Level {level}', { level: active.level })}</span><h2 lang="bn">{active.meaning_bn}</h2><p>{t('Root')} <span lang="ar" dir="rtl">{active.root_ar}</span><span className="dot">·</span> {t('Form {form}', { form: active.form })}</p></div><strong className="book-headword" lang="ar" dir="rtl">{active.headword_ar}</strong></div>
        {readings.length > 1 && <div className="book-reading-options"><span>{t('Two readings in the book')}</span>{readings.map((r, i) => <button key={i} lang="bn" className={reading === i ? 'selected' : ''} onClick={() => setReading(i)}>{r.meaning_bn}</button>)}</div>}
        <div className="book-study-toolbar"><span>{t('Read. Cover. Recall.')}</span><button className="action-button" onClick={() => setShowMeanings(v => !v)} aria-pressed={!showMeanings}>{showMeanings ? <EyeOff size={16} /> : <Eye size={16} />}{t(showMeanings ? 'Hide meanings' : 'Show meanings')}</button></div>
        <BookChart verb={active} showMeanings={showMeanings} uiLanguage={uiLanguage} />
        </>}
        <nav className="book-pagination" aria-label={t('Browse book verbs')}><button className="action-button" disabled={position <= 0} onClick={() => choose(matches[position - 1].entry_number)}><ChevronLeft size={17} /> {t('Previous')}</button><span>{position >= 0 ? `${position + 1} / ${matches.length}` : t('Current verb is outside your filters')}</span><button className="action-button" disabled={position < 0 || position >= matches.length - 1} onClick={() => choose(matches[position + 1].entry_number)}>{t('Next')} <ChevronRight size={17} /></button></nav>
      </main>
    </div>
  </dialog>
}
