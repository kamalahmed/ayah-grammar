import { useEffect, useMemo, useRef, useState } from 'react'
import { BookOpen, ChevronLeft, ChevronRight, Eye, EyeOff, Search, X } from 'lucide-react'
import BookChart from './BookChart'
import { bookReadings, bookVerbs, searchBookVerbs } from './bookVerbs'

function lastEntry(): number {
  try { const n = Number(localStorage.getItem('ayah-book-entry')); return Number.isInteger(n) && n >= 1 && n <= 500 ? n : 1 } catch { return 1 }
}

export default function VerbLibrary({ onClose }: { onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null)
  const studyPane = useRef<HTMLElement>(null)
  const [query, setQuery] = useState('')
  const [level, setLevel] = useState(0)
  const [form, setForm] = useState('')
  const [entry, setEntry] = useState(lastEntry)
  const [reading, setReading] = useState(0)
  const [showMeanings, setShowMeanings] = useState(true)
  const matches = useMemo(() => searchBookVerbs(query, level, form), [query, level, form])
  const verb = bookVerbs[entry - 1]
  const readings = bookReadings(verb)
  const active = readings[reading] || verb
  const position = matches.findIndex(v => v.entry_number === entry)
  const choose = (number: number) => { setEntry(number); setReading(0); studyPane.current?.scrollTo({ top: 0 }) }
  useEffect(() => { dialog.current?.showModal(); return () => dialog.current?.close() }, [])
  useEffect(() => { try { localStorage.setItem('ayah-book-entry', String(entry)) } catch { /* Study still works without storage. */ } }, [entry])

  return <dialog ref={dialog} className="book-library" onClose={onClose} aria-labelledby="book-library-title">
    <header className="book-library-header"><div><span className="eyebrow">YOUR GRAMMAR COMPANION</span><h1 id="book-library-title">500 verbs <span lang="bn">ক্রিয়াপদ</span></h1></div><button className="icon-button" onClick={onClose} aria-label="Close verb library"><X size={23} /></button></header>
    <div className="book-library-layout">
      <aside className="book-library-index" aria-label="Find a book verb">
        <label className="search-box"><Search size={18} /><input autoFocus value={query} onChange={e => setQuery(e.target.value)} placeholder="আরবি, বাংলা, or number…" aria-label="Search 500 verbs" /></label>
        <div className="book-filters"><label>Book<select value={level} onChange={e => setLevel(Number(e.target.value))}><option value={0}>Both levels</option><option value={1}>Level 1 · 1–200</option><option value={2}>Level 2 · 201–500</option></select></label><label>Form<select value={form} onChange={e => setForm(e.target.value)}><option value="">All forms</option>{['I','II','III','IV','V','VI','VII','VIII','IX','X'].map(f => <option key={f} value={f}>Form {f}</option>)}</select></label></div>
        <div className="book-result-count" aria-live="polite">{matches.length} of 500 verbs</div>
        <div className="book-result-list">{matches.map(v => <button key={v.entry_number} onClick={() => choose(v.entry_number)} className={`book-result ${entry === v.entry_number ? 'selected' : ''}`} aria-current={entry === v.entry_number ? 'true' : undefined}><span className="book-entry-number">{String(v.entry_number).padStart(3, '0')}</span><strong lang="ar" dir="rtl">{v.headword_ar}</strong><span lang="bn">{v.meaning_bn}</span><small>Level {v.level} · {v.form}</small></button>)}{matches.length === 0 && <div className="book-no-results"><BookOpen size={24} /><p>No matching verb.</p><button className="action-button" onClick={() => { setQuery(''); setLevel(0); setForm('') }}>Clear filters</button></div>}</div>
      </aside>
      <main ref={studyPane} className="book-library-study">
        <div className="book-entry-heading"><div><span className="eyebrow">{String(entry).padStart(3, '0')} / 500 <span className="dot">·</span> LEVEL {active.level}</span><h2 lang="bn">{active.meaning_bn}</h2><p>Root <span lang="ar" dir="rtl">{active.root_ar}</span><span className="dot">·</span> Form {active.form}</p></div><strong className="book-headword" lang="ar" dir="rtl">{active.headword_ar}</strong></div>
        {readings.length > 1 && <div className="book-reading-options"><span>Two readings in the book</span>{readings.map((r, i) => <button key={i} lang="bn" className={reading === i ? 'selected' : ''} onClick={() => setReading(i)}>{r.meaning_bn}</button>)}</div>}
        <div className="book-study-toolbar"><span>Read. Cover. Recall.</span><button className="action-button" onClick={() => setShowMeanings(v => !v)} aria-pressed={!showMeanings}>{showMeanings ? <EyeOff size={16} /> : <Eye size={16} />}{showMeanings ? 'Hide meanings' : 'Show meanings'}</button></div>
        <BookChart verb={active} showMeanings={showMeanings} />
        <nav className="book-pagination" aria-label="Browse book verbs"><button className="action-button" disabled={position <= 0} onClick={() => choose(matches[position - 1].entry_number)}><ChevronLeft size={17} /> Previous</button><span>{position >= 0 ? `${position + 1} / ${matches.length}` : 'Current verb is outside your filters'}</span><button className="action-button" disabled={position < 0 || position >= matches.length - 1} onClick={() => choose(matches[position + 1].entry_number)}>Next <ChevronRight size={17} /></button></nav>
      </main>
    </div>
  </dialog>
}
