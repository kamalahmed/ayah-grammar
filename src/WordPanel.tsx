import { useMemo, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { ArrowLeft, Bookmark, BookOpen, CircleHelp, ExternalLink, X } from 'lucide-react'
import { arabicRoot, aspectLabels, attestedChart, chartSlotApplies, personLabels, personOrder, posLabels, pronounLabels, verbFormNumber, verbFormPattern } from './study'
import { quadriliteralGuide, triliteralGuide, verbFormsSource } from './formGuide'
import { referenceParadigm, selectedVerbParadigm } from './paradigms'
import { bookVerbMeaning } from './bookVerbMeanings'
import { bookCell, findBookVerb } from './bookVerbs'
import BookChart from './BookChart'
import type { VerbOccurrence, Word } from './types'

interface Props {
  word: Word
  verseKey: string
  occurrences: VerbOccurrence[] | null
  saved: boolean
  onSave: () => void
  onClose: () => void
  onNavigate: (key: string, position: number) => void
  onResizeStart: (event: ReactPointerEvent<HTMLDivElement>) => void
  onResizeKeyboard: (direction: number) => void
  readerShare: number
  minReaderShare: number
  maxReaderShare: number
  showVerbBn: boolean
  showVerbEn: boolean
}

const aspects = ['PERF', 'IMPF', 'IMPV']
const formOrder = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const referencePersons = personOrder.filter(person => person !== '2D')

export default function WordPanel({ word, verseKey, occurrences, saved, onSave, onClose, onNavigate, onResizeStart, onResizeKeyboard, readerShare, minReaderShare, maxReaderShare, showVerbBn, showVerbEn }: Props) {
  const [tab, setTab] = useState<'chart' | 'paradigm' | 'selected' | 'occurrences'>('chart')
  const [showAll, setShowAll] = useState(false)
  const [showAllArabic, setShowAllArabic] = useState(false)
  const isVerb = word.pos === 'V'
  const form = word.form || 'I'
  const [selectedForm, setSelectedForm] = useState(form)
  const voice = word.voice || 'ACT'
  const [selectedVoice, setSelectedVoice] = useState(voice)
  const chart = useMemo(() => attestedChart(occurrences || [], selectedForm, selectedVoice, { key: verseKey, position: word.position }), [occurrences, selectedForm, selectedVoice, verseKey, word.position])
  const sameForm = useMemo(() => (occurrences || []).filter(item => item.form === selectedForm && item.voice === selectedVoice), [occurrences, selectedForm, selectedVoice])
  const exact = useMemo(() => (occurrences || []).filter(item => item.arabic === word.arabic), [occurrences, word.arabic])
  const forms = useMemo(() => [...new Set((occurrences || []).map(item => item.form))].sort((a, b) => formOrder.indexOf(a) - formOrder.indexOf(b)), [occurrences])
  const voices = useMemo(() => [...new Set((occurrences || []).filter(item => item.form === selectedForm).map(item => item.voice))], [occurrences, selectedForm])
  const displayed = showAll ? sameForm : sameForm.slice(0, 18)
  const patternExample = sameForm.find(item => item.aspect === 'PERF' && item.person === '3MS') || sameForm[0]
  const selectedPattern = verbFormPattern(selectedForm, word.root)
  const selectedNumber = verbFormNumber(selectedForm)
  const originalNumber = verbFormNumber(form)
  const isTriliteral = word.root?.length === 3
  const formGuide = isTriliteral ? triliteralGuide : quadriliteralGuide
  const paradigm = referenceParadigm(selectedForm, word.root?.length || 0)
  const selectedParadigm = selectedVerbParadigm(word.root, selectedForm, selectedVoice)
  const bookVerb = findBookVerb(word.root, selectedForm, selectedVoice, selectedParadigm?.['3MS'].perfect)
  const selectedCell = (person: string, aspect: 'PERF' | 'IMPF' | 'IMPV') => {
    const arabic = aspect === 'PERF' ? selectedParadigm?.[person]?.perfect : aspect === 'IMPF' ? selectedParadigm?.[person]?.imperfect : selectedParadigm?.[person]?.imperative
    const bangla = showVerbBn && bookVerbMeaning(word.root, selectedForm, selectedVoice, aspect, person, arabic)
    return <td key={aspect} className="selected-paradigm-cell"><span className="conjugated-arabic" lang="ar" dir="rtl">{arabic || '—'}</span>{bangla && <span className="book-verb-meaning" lang="bn" title="Bangla conjugation meaning from the supplied verb list">{bangla}</span>}</td>
  }

  return <aside className="study-panel" aria-label="Word study panel">
    <div className="study-resize-handle" role="separator" tabIndex={0} aria-label="Resize Quran and study panels" aria-orientation="vertical" aria-valuemin={Math.round(minReaderShare * 100)} aria-valuemax={Math.round(maxReaderShare * 100)} aria-valuenow={Math.round(readerShare * 100)} aria-controls="quran-reader" onPointerDown={onResizeStart} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); onResizeKeyboard(event.key === 'ArrowRight' ? 1 : -1) } }}><span aria-hidden="true" /></div>
    <div className="panel-header">
      <div>
        <span className="eyebrow">WORD STUDY <span className="dot">·</span> {verseKey}:{word.position}</span>
        <div className="panel-heading">A closer look</div>
      </div>
      <button className="icon-button close-panel" onClick={onClose} aria-label="Close study panel"><X size={19} /></button>
    </div>
    <div className="panel-scroll">
      <div className="selected-word-card">
        <span className="selected-arabic" lang="ar" dir="rtl">{word.arabic}</span>
        <div className="selected-glosses">
          <div><span>বাংলা অর্থ</span><strong lang="bn">{word.bn}</strong></div>
          <div><span>ENGLISH MEANING</span><strong>{word.en}</strong></div>
        </div>
      </div>

      {isVerb && <div className="verb-overview" aria-label="Verb grammar summary">
        <span><small>ROOT · ধাতু</small><strong className="overview-root" lang="ar" dir="rtl">{arabicRoot(word.root)}</strong></span>
        <span><small>FORM · রূপ</small><strong>{originalNumber ? `${form} · ${originalNumber}` : form}</strong></span>
        <span><small>ASPECT · কাল</small><strong>{aspectLabels[word.aspect || '']?.[0] || word.aspect || '—'}</strong></span>
        <span><small>PERSON · পুরুষ</small><strong>{personLabels[word.person || '']?.[0] || word.person || '—'}</strong></span>
      </div>}

      <div className="panel-actions">
        <button onClick={onSave} className={saved ? 'action-button active' : 'action-button'}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />{saved ? 'Saved' : 'Save word'}</button>
        <button onClick={() => onNavigate(verseKey, word.position)} className="action-button"><BookOpen size={17} />View in ayah</button>
      </div>

      {!isVerb && <section className="grammar-summary">
        <div className="section-title"><span className="section-number">01</span> Grammar identity</div>
        <div className="facts-grid">
          <div className="fact"><span>WORD TYPE</span><strong>{posLabels[word.pos || '']?.[0] || word.pos || '—'}</strong><small lang="bn">{posLabels[word.pos || '']?.[1] || ''}</small></div>
          <div className="fact"><span>ROOT · الجذر</span><strong className="arabic-fact" lang="ar" dir="rtl">{arabicRoot(word.root)}</strong><small>{word.root || 'Not assigned'}</small></div>
        </div>
        <details className="source-tags"><summary>See original morphology tags</summary><div>{word.segments.map((segment, i) => <code key={i}>{segment.features}</code>)}</div></details>
      </section>}

      {isVerb && word.root && <section className="verb-section">
        <div className="section-title"><span className="section-number">01</span> Explore this verb</div>
        <div className="form-identity">
          <div><span>SELECTED VERB FORM</span><strong>Form {selectedForm}{selectedNumber ? ` · ${selectedNumber}` : ''}</strong><small>{selectedVoice === 'PASS' ? 'Passive examples' : 'Active examples'}</small></div>
          <div><span>FORM PATTERN · HE</span><strong className="pattern-pair" lang="ar" dir="ltr"><b dir="rtl">{paradigm?.['3MS'].perfect || selectedPattern || '—'}</b><b dir="rtl">{paradigm?.['3MS'].imperfect || '—'}</b></strong><small>Past · Present <a href="https://corpus.quran.com/documentation/verbforms.jsp" target="_blank" rel="noreferrer">pattern guide</a></small></div>
          <div><span>THIS VERB · HE</span><strong className="pattern-pair" lang="ar" dir="ltr"><b dir="rtl">{(bookVerb && bookCell(bookVerb, 'PERF', '3MS')?.ar) || selectedParadigm?.['3MS'].perfect || '—'}</b><b dir="rtl">{(bookVerb && bookCell(bookVerb, 'IMPF', '3MS')?.ar) || selectedParadigm?.['3MS'].imperfect || '—'}</b></strong><small>Past · Present{selectedVoice === 'PASS' ? ' · Passive' : ''}</small></div>
          {patternExample ? <button className="form-example" onClick={() => onNavigate(patternExample.key, patternExample.position)}><span>QURAN EXAMPLE</span><strong lang="ar" dir="rtl">{patternExample.arabic}</strong><small>{patternExample.key}:{patternExample.position} · {patternExample.en}</small></button> : <div><span>QURAN EXAMPLE</span><strong>—</strong><small>No matching occurrence</small></div>}
        </div>
        {formGuide[selectedForm] && <details className="form-help"><summary><CircleHelp size={16} /> What does Form {selectedForm} mean?</summary><p>{formGuide[selectedForm]} A form suggests a common pattern of meaning; the actual sense depends on the verb and its context. <a href={verbFormsSource} target="_blank" rel="noreferrer">Read the Corpus guide</a>.</p></details>}
        {isTriliteral && <details className="form-help all-forms-help"><summary><CircleHelp size={16} /> Explain all ten three-letter forms</summary><div className="form-guide-list">{Object.entries(triliteralGuide).map(([number, explanation]) => <div key={number}><strong>Form {number}</strong><span className="guide-pattern" lang="ar" dir="rtl">{verbFormPattern(number, word.root)}</span><span>{explanation}</span></div>)}</div><p>These are teaching patterns. A root does not necessarily occur in every form. <a href={verbFormsSource} target="_blank" rel="noreferrer">Source: Quranic Arabic Corpus</a>.</p></details>}
        {forms.length > 1 && <div className="form-filter"><span>Compare patterns</span><div>{forms.map(item => <button key={item} className={item === selectedForm ? 'selected' : ''} onClick={() => { setSelectedForm(item); if (!(occurrences || []).some(entry => entry.form === item && entry.voice === selectedVoice)) setSelectedVoice((occurrences || []).find(entry => entry.form === item)?.voice || 'ACT'); if (!referenceParadigm(item, word.root?.length || 0)) setTab('chart'); setShowAll(false) }}>Form {item}</button>)}</div></div>}
        {voices.length > 1 && <div className="form-filter voice-filter"><span>Voice</span><div>{voices.map(item => <button key={item} className={item === selectedVoice ? 'selected' : ''} onClick={() => { setSelectedVoice(item); setShowAll(false) }}>{item === 'PASS' ? 'Passive' : 'Active'}</button>)}</div></div>}
        <div className="panel-tabs" role="tablist" aria-label="Verb study view">
          <button role="tab" aria-selected={tab === 'chart'} className={tab === 'chart' ? 'selected' : ''} onClick={() => setTab('chart')}>Quran examples</button>
          {paradigm && <button role="tab" aria-selected={tab === 'paradigm'} className={tab === 'paradigm' ? 'selected' : ''} onClick={() => setTab('paradigm')}>Full pattern</button>}
          <button role="tab" aria-selected={tab === 'selected'} className={tab === 'selected' ? 'selected' : ''} onClick={() => setTab('selected')}>Full conjugation</button>
          <button role="tab" aria-selected={tab === 'occurrences'} className={tab === 'occurrences' ? 'selected' : ''} onClick={() => setTab('occurrences')}>In the Quran</button>
        </div>
        {tab === 'chart' ? <div className="chart-scroll"><table className="verb-chart"><caption>Form {selectedForm}{selectedNumber ? ` (${selectedNumber})` : ''}: attested Quranic verb examples by person and aspect</caption><thead><tr><th>Who</th>{aspects.map(aspect => <th key={aspect}>{aspectLabels[aspect][0]}<small lang="bn">{aspectLabels[aspect][1]}</small></th>)}</tr></thead><tbody>{personOrder.map(person => <tr key={person}><th><strong className="person-arabic" lang="ar" dir="rtl">{pronounLabels[person]}</strong><span className="person-english">{personLabels[person][0]}</span><small lang="bn">{personLabels[person][1]}</small></th>{aspects.map(aspect => {
          const cell = chart[`${aspect}:${person}`]
          const current = selectedForm === form && selectedVoice === voice && word.aspect === aspect && word.person === person
          return <td key={aspect} className={current ? 'current-cell' : ''}>{cell ? <button className="chart-cell" onClick={() => onNavigate(cell.key, cell.position)}><span className="cell-arabic" lang="ar" dir="rtl">{cell.arabic}</span><span className="cell-bn" lang="bn">{cell.bn}</span><span className="cell-en">{cell.en}</span><span className="cell-ref">{cell.key}:{cell.position} · {cell.count} occurrences <ArrowLeft size={12} /></span></button> : <span className="empty-cell" aria-label={chartSlotApplies(aspect, person) ? 'Not attested in this corpus' : 'Not applicable'}>{chartSlotApplies(aspect, person) ? '—' : 'n/a'}</span>}</td>
        })}</tr>)}</tbody></table></div> : tab === 'paradigm' && paradigm ? <div className="chart-scroll"><table className="verb-chart reference-chart"><caption>Full active reference conjugation for Form {selectedForm}, using the placeholder root {isTriliteral ? 'فعل' : 'فعلل'}</caption><thead><tr><th>Who</th><th>Perfect</th><th>Imperfect</th><th>Imperative</th></tr></thead><tbody>{referencePersons.map(person => <tr key={person}><th><strong className="person-arabic" lang="ar" dir="rtl">{pronounLabels[person]}</strong><span className="person-english">{personLabels[person][0]}</span><small lang="bn">{personLabels[person][1]}</small></th><td lang="ar" dir="rtl">{paradigm[person].perfect}</td><td lang="ar" dir="rtl">{paradigm[person].imperfect}</td><td lang="ar" dir="rtl">{paradigm[person].imperative || '—'}</td></tr>)}</tbody></table></div> : tab === 'selected' ? bookVerb && !showAllArabic ? <BookChart verb={bookVerb} showMeanings={showVerbBn} /> : selectedParadigm ? <><p className="section-hint selected-word-context">Selected Quran word ({verseKey}:{word.position}): <span lang="ar" dir="rtl">{word.arabic}</span>{showVerbBn && <span lang="bn">{word.bn}</span>}{showVerbEn && <span lang="en">{word.en}</span>}</p><div className="chart-scroll"><table className="verb-chart reference-chart selected-paradigm-chart"><caption>Full {selectedVoice === 'PASS' ? 'passive' : 'active'} conjugation of {selectedParadigm['3MS'].perfect} · Form {selectedForm}</caption><thead><tr><th>Who</th><th>Past</th><th>Present</th><th>Command</th></tr></thead><tbody>{referencePersons.map(person => <tr key={person}><th><strong className="person-arabic" lang="ar" dir="rtl">{pronounLabels[person]}</strong><span className="person-english">{personLabels[person][0]}</span><small lang="bn">{personLabels[person][1]}</small></th>{selectedCell(person, 'PERF')}{selectedCell(person, 'IMPF')}{selectedCell(person, 'IMPV')}</tr>)}</tbody></table></div></> : <p className="section-hint unavailable-paradigm">A reliable full conjugation is not available for this root and form yet. The Quran examples and reference pattern remain available.</p> : <div className="occurrence-list">{displayed.map(item => <button key={`${item.key}:${item.position}`} onClick={() => onNavigate(item.key, item.position)} className="occurrence"><span className="occ-ref">{item.key}:{item.position}</span><span className="occ-arabic" lang="ar" dir="rtl">{item.arabic}</span><span className="occ-bn" lang="bn">{item.bn}</span><span className="occ-en">{item.en}</span><ExternalLink size={15} /></button>)}{!showAll && sameForm.length > displayed.length && <button className="show-more" onClick={() => setShowAll(true)}>Show all {sameForm.length} occurrences</button>}</div>}
        {tab === 'selected' && bookVerb && selectedParadigm && <button className="action-button book-view-toggle" onClick={() => setShowAllArabic(v => !v)}>{showAllArabic ? 'Show book chart · বাংলা' : 'Show all Arabic persons · feminine & dual'}</button>}
        {tab === 'chart' && <p className="section-hint chart-note">Chart entries are Quranic word examples and contextual meanings. — means unattested here; n/a means the imperative does not apply to that person.</p>}
        {tab === 'paradigm' && <p className="section-hint chart-note">Reference conjugation of the placeholder root {isTriliteral ? 'فعل' : 'فعلل'}, generated with <a href="https://github.com/linuxscout/qutrub" target="_blank" rel="noreferrer">Qutrub</a>. These are not Quranic word examples or verified conjugations of the selected root. Form I shows one standard vowel pattern; weak roots may conjugate differently.</p>}
        {tab === 'selected' && selectedParadigm && (!bookVerb || showAllArabic) && <p className="section-hint chart-note">Root-specific Arabic forms generated with <a href="https://github.com/linuxscout/qutrub" target="_blank" rel="noreferrer">Qutrub</a> from a Corpus-matched verb citation. Bangla meanings come from the two local verb books only where the root, form, voice, Arabic spelling, aspect, and person match this cell. The book covers common masculine and first-person forms; other cells remain Arabic only. See Quran examples for contextual word meanings.</p>}
        <div className="occurrence-stats">
          <div><strong>{exact.length}</strong><span>Exact written form</span></div>
          <div><strong>{sameForm.length}</strong><span>Root + form {selectedForm} + {selectedVoice === 'PASS' ? 'passive' : 'active'}</span></div>
          <div><strong>{occurrences?.length ?? '…'}</strong><span>Verb root total</span></div>
        </div>
      </section>}
      {isVerb && <section className="grammar-summary verb-details">
        <div className="section-title"><span className="section-number">02</span> Grammar identity</div>
        <div className="facts-grid">
          <div className="fact"><span>WORD TYPE</span><strong>Verb</strong><small lang="bn">ক্রিয়াপদ</small></div>
          <div className="fact"><span>ROOT · الجذر</span><strong className="arabic-fact" lang="ar" dir="rtl">{arabicRoot(word.root)}</strong><small>{word.root || 'Not assigned'}</small></div>
          <div className="fact"><span>VERB FORM · بَاب</span><strong>Form {form}</strong><small>Corpus classification</small></div>
          <div className="fact"><span>ASPECT</span><strong>{aspectLabels[word.aspect || '']?.[0] || word.aspect || '—'}</strong><small lang="bn">{aspectLabels[word.aspect || '']?.[1] || ''}</small></div>
          <div className="fact"><span>PERSON</span><strong>{personLabels[word.person || '']?.[0] || word.person || '—'}</strong><small lang="bn">{personLabels[word.person || '']?.[1] || ''}</small></div>
          <div className="fact"><span>VOICE</span><strong>{voice === 'PASS' ? 'Passive' : 'Active'}</strong><small>{word.mood ? `Mood: ${word.mood}` : 'Corpus annotation'}</small></div>
        </div>
        <details className="source-tags"><summary>See original morphology tags</summary><div>{word.segments.map((segment, i) => <code key={i}>{segment.features}</code>)}</div></details>
      </section>}
      <p className="panel-source">Grammar: Quranic Arabic Corpus v0.4 · Meanings: GTAF word databases. <a href="/sources.html">View source details</a></p>
    </div>
  </aside>
}
