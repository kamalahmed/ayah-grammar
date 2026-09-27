import { useMemo, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { ArrowLeft, Bookmark, BookOpen, CircleHelp, ExternalLink, Pause, Volume2, X } from 'lucide-react'
import { arabicRoot, aspectLabels, attestedChart, chartSlotApplies, personLabels, personOrder, posLabels, pronounLabels, referencePatternPersons, verbFormNumber, verbFormPattern } from './study'
import { quadriliteralGuide, triliteralGuide, verbFormsSource } from './formGuide'
import { referenceParadigm } from './referenceParadigm'
import verbUrls from 'virtual:verb-data'
import { studyCache, useJsonData } from './useJsonData'
import type { VerbStudyData } from '../build/verbShards'
import { bookCell, findBookReading, meaningForBookReading } from './bookData'
import type { BookVerb } from './bookData'
import { englishPatternExample } from './patternMeaning'
import BookChart from './BookChart'
import ConjugationHeader from './ConjugationHeader'
import type { AudioStatus } from './useAudioPlayer'
import type { UiLanguage } from './uiText'
import { uiText } from './uiText'
import type { VerbOccurrence, Word } from './types'

interface Props {
  word: Word
  verseKey: string
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
  uiLanguage: UiLanguage
  audioStatus: AudioStatus
  onPlayWord: (key: string, position: number) => void
}

const aspects = ['PERF', 'IMPF', 'IMPV']
const formOrder = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII']
const referencePersons = personOrder.filter(person => person !== '2D')

export default function WordPanel({ word, verseKey, saved, onSave, onClose, onNavigate, onResizeStart, onResizeKeyboard, readerShare, minReaderShare, maxReaderShare, showVerbBn, showVerbEn, uiLanguage, audioStatus, onPlayWord }: Props) {
  const t = (english: string, values?: Record<string, string | number>) => uiText(uiLanguage, english, values)
  const [tab, setTab] = useState<'chart' | 'paradigm' | 'selected' | 'occurrences'>('chart')
  const [showAll, setShowAll] = useState(false)
  const [showAllArabic, setShowAllArabic] = useState(false)
  const [showAllPattern, setShowAllPattern] = useState(false)
  const isVerb = word.pos === 'V'
  const study = useJsonData<VerbStudyData>(isVerb && word.root ? verbUrls[word.root] || null : null, studyCache)
  const occurrences = study.data?.occurrences ?? null
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
  const selectedParadigm = study.data?.paradigms[selectedForm]?.[selectedVoice] ?? null
  const books = study.data?.books ?? []
  const bookVerb = findBookReading(books, word.root, selectedForm, selectedVoice, selectedParadigm?.['3MS'].perfect)
  const meaningVerb = findBookReading(books, word.root, selectedForm, selectedVoice)
  const patternStudy = useJsonData<VerbStudyData>(isVerb && isTriliteral && paradigm ? verbUrls.fEl || null : null, studyCache)
  const patternBook = findBookReading(patternStudy.data?.books || [], 'fEl', selectedForm, 'ACT', paradigm?.['3MS'].perfect)
  const patternPair = (label: string, past: string, present: string, book: BookVerb | null, examples: VerbOccurrence[], patternVoice: string, note: string) => <div className="pattern-column">
    <span>{t(label)}</span>
    <div className="pattern-readings">{([{ aspect: 'PERF', arabic: past, tense: 'Past' }, { aspect: 'IMPF', arabic: present, tense: 'Present / future' }] as const).map(({ aspect, arabic, tense }) => {
      const bangla = showVerbBn && meaningForBookReading(book, aspect, '3MS', arabic)
      const english = showVerbEn && englishPatternExample(examples, arabic, selectedForm, patternVoice, aspect)
      return <div className="pattern-reading" key={aspect}>
        <div><small className="pattern-tense">{t(tense)}</small><strong className="pattern-arabic" lang="ar" dir="rtl">{arabic}</strong></div>
        <div className="pattern-glosses">
          {bangla && <span lang="bn">{bangla}</span>}
          {english && <span lang="en">{english.en}<button className="pattern-source" onClick={() => onNavigate(english.key, english.position)} title={t('English in context: {word}', { word: english.arabic })}>{t('Quran')} {english.key}:{english.position}</button></span>}
        </div>
      </div>
    })}</div>
    <small className="pattern-note">{t(note)}{showVerbBn && book ? ` · ${t('বাংলা: Book {level}, p. {page}', { level: book.level, page: book.source.pdf_page })}` : ''}</small>
  </div>
  const selectedCell = (person: string, aspect: 'PERF' | 'IMPF' | 'IMPV') => {
    const arabic = aspect === 'PERF' ? selectedParadigm?.[person]?.perfect : aspect === 'IMPF' ? selectedParadigm?.[person]?.imperfect : selectedParadigm?.[person]?.imperative
    const bangla = showVerbBn && meaningForBookReading(meaningVerb, aspect, person, arabic)
    return <td key={aspect} className="selected-paradigm-cell"><span className="conjugated-arabic" lang="ar" dir="rtl">{arabic || '—'}</span>{bangla && <span className="book-verb-meaning" lang="bn" title={t('Bangla conjugation meaning from the supplied verb list')}>{bangla}</span>}</td>
  }

  return <aside className="study-panel" aria-label={t('Word study panel')}>
    <div className="study-resize-handle" role="separator" tabIndex={0} aria-label={t('Resize Quran and study panels')} aria-orientation="vertical" aria-valuemin={Math.round(minReaderShare * 100)} aria-valuemax={Math.round(maxReaderShare * 100)} aria-valuenow={Math.round(readerShare * 100)} aria-controls="quran-reader" onPointerDown={onResizeStart} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); onResizeKeyboard(event.key === 'ArrowRight' ? 1 : -1) } }}><span aria-hidden="true" /></div>
    <div className="panel-header">
      <div>
        <span className="eyebrow">{t('WORD STUDY')} <span className="dot">·</span> {verseKey}:{word.position}</span>
        <div className="panel-heading">{t('A closer look')}</div>
      </div>
      <button className="icon-button close-panel" onClick={onClose} aria-label={t('Close study panel')}><X size={19} /></button>
    </div>
    <div className="panel-scroll">
      <div className="selected-word-card">
        <span className="selected-arabic" lang="ar" dir="rtl">{word.arabic}</span>
        <div className="selected-glosses">
          <div><span>{t('বাংলা অর্থ')}</span><strong lang="bn">{word.bn}</strong></div>
          <div><span>{t('ENGLISH MEANING')}</span><strong>{word.en}</strong></div>
        </div>
      </div>

      {isVerb && <div className="verb-overview" aria-label={t('Verb grammar summary')}>
        <span><small>{uiLanguage === 'bn' ? 'ধাতু' : 'ROOT · ধাতু'}</small><strong className="overview-root" lang="ar" dir="rtl">{arabicRoot(word.root)}</strong></span>
        <span><small>{uiLanguage === 'bn' ? 'রূপ' : 'FORM · রূপ'}</small><strong>{originalNumber ? `${form} · ${originalNumber}` : form}</strong></span>
        <span><small>{uiLanguage === 'bn' ? 'কাল' : 'ASPECT · কাল'}</small><strong>{aspectLabels[word.aspect || '']?.[uiLanguage === 'bn' ? 1 : 0] || word.aspect || '—'}</strong></span>
        <span><small>{uiLanguage === 'bn' ? 'পুরুষ' : 'PERSON · পুরুষ'}</small><strong>{personLabels[word.person || '']?.[uiLanguage === 'bn' ? 1 : 0] || word.person || '—'}</strong></span>
      </div>}

      <div className="panel-actions">
        <button onClick={onSave} className={saved ? 'action-button active' : 'action-button'}><Bookmark size={17} fill={saved ? 'currentColor' : 'none'} />{t(saved ? 'Saved' : 'Save word')}</button>
        <button onClick={() => onNavigate(verseKey, word.position)} className="action-button"><BookOpen size={17} />{t('View in ayah')}</button>
        <button onClick={() => onPlayWord(verseKey, word.position)} className="action-button word-audio-button" aria-label={audioStatus === 'playing' || audioStatus === 'loading' ? t('Pause word') : t('Hear word')} title={t('Word audio uses a separate recording from Quran Foundation.')}>{audioStatus === 'playing' || audioStatus === 'loading' ? <Pause size={17} /> : <Volume2 size={17} />}{audioStatus === 'playing' || audioStatus === 'loading' ? t('Pause word') : t('Hear word')}</button>
      </div>

      {!isVerb && <section className="grammar-summary">
        <div className="section-title"><span className="section-number">01</span> {t('Grammar identity')}</div>
        <div className="facts-grid">
          <div className="fact"><span>{t('WORD TYPE')}</span><strong>{posLabels[word.pos || '']?.[uiLanguage === 'bn' ? 1 : 0] || word.pos || '—'}</strong><small lang="bn">{posLabels[word.pos || '']?.[1] || ''}</small></div>
          <div className="fact"><span>{t('ROOT · الجذر')}</span><strong className="arabic-fact" lang="ar" dir="rtl">{arabicRoot(word.root)}</strong><small>{word.root || t('Not assigned')}</small></div>
        </div>
        <details className="source-tags"><summary>{t('See original morphology tags')}</summary><div>{word.segments.map((segment, i) => <code key={i}>{segment.features}</code>)}</div></details>
      </section>}

      {isVerb && word.root && study.loading && <p className="loading-message" role="status">{t('Loading this verb’s examples and conjugations…')}</p>}
      {isVerb && word.root && study.error && <div className="load-error" role="alert"><p>{t('This verb’s study data could not load. Word meanings remain available.')}</p><button className="action-button" onClick={study.retry}>{t('Try again')}</button></div>}
      {isVerb && word.root && study.data && <section className="verb-section">
        <div className="section-title"><span className="section-number">01</span> {t('Explore this verb')}</div>
        <div className="form-identity with-meanings">
          <div className="form-selection"><span>{t('SELECTED VERB FORM')}</span><strong>{t('Form {form}', { form: selectedForm })}{selectedNumber ? ` · ${selectedNumber}` : ''}</strong><small>{t(selectedVoice === 'PASS' ? 'Passive examples' : 'Active examples')}</small></div>
          {patternPair('FORM PATTERN · HE', paradigm?.['3MS'].perfect || selectedPattern || '—', paradigm?.['3MS'].imperfect || '—', patternBook, patternStudy.data?.occurrences || [], 'ACT', 'Active teaching pattern')}
          {patternPair('THIS VERB · HE', (bookVerb && bookCell(bookVerb, 'PERF', '3MS')?.ar) || selectedParadigm?.['3MS'].perfect || '—', (bookVerb && bookCell(bookVerb, 'IMPF', '3MS')?.ar) || selectedParadigm?.['3MS'].imperfect || '—', bookVerb, occurrences || [], selectedVoice, selectedVoice === 'PASS' ? 'Passive' : 'Active')}
          {patternExample ? <button className="form-example" onClick={() => onNavigate(patternExample.key, patternExample.position)}><span>{t('QURAN EXAMPLE')}</span><strong lang="ar" dir="rtl">{patternExample.arabic}</strong><small>{patternExample.key}:{patternExample.position} · {uiLanguage === 'bn' ? patternExample.bn : patternExample.en}</small></button> : <div><span>{t('QURAN EXAMPLE')}</span><strong>—</strong><small>{t('No matching occurrence')}</small></div>}
        </div>
        {(showVerbBn || showVerbEn) && <p className="section-hint pattern-meaning-note">{t('বাংলা: matching book forms. English: linked Quran examples, whose meaning depends on context. Meanings appear only where a source matches.')}</p>}
        {formGuide[selectedForm] && <details className="form-help"><summary><CircleHelp size={16} /> {t('What does Form {form} mean?', { form: selectedForm })}</summary><p>{t(formGuide[selectedForm])} {t('A form suggests a common pattern of meaning; the actual sense depends on the verb and its context.')} <a href={verbFormsSource} target="_blank" rel="noreferrer">{t('Read the Corpus guide')}</a>.</p></details>}
        {isTriliteral && <details className="form-help all-forms-help"><summary><CircleHelp size={16} /> {t('Explain all ten three-letter forms')}</summary><div className="form-guide-list">{Object.entries(triliteralGuide).map(([number, explanation]) => <div key={number}><strong>{t('Form {form}', { form: number })}</strong><span className="guide-pattern" lang="ar" dir="rtl">{verbFormPattern(number, word.root)}</span><span>{t(explanation)}</span></div>)}</div><p>{t('These are teaching patterns. A root does not necessarily occur in every form.')} <a href={verbFormsSource} target="_blank" rel="noreferrer">{t('Source: Quranic Arabic Corpus')}</a>.</p></details>}
        {forms.length > 1 && <div className="form-filter"><span>{t('Compare patterns')}</span><div>{forms.map(item => <button key={item} className={item === selectedForm ? 'selected' : ''} onClick={() => { setSelectedForm(item); if (!(occurrences || []).some(entry => entry.form === item && entry.voice === selectedVoice)) setSelectedVoice((occurrences || []).find(entry => entry.form === item)?.voice || 'ACT'); if (!referenceParadigm(item, word.root?.length || 0)) setTab('chart'); setShowAll(false) }}>{t('Form {form}', { form: item })}</button>)}</div></div>}
        {voices.length > 1 && <div className="form-filter voice-filter"><span>{t('Voice')}</span><div>{voices.map(item => <button key={item} className={item === selectedVoice ? 'selected' : ''} onClick={() => { setSelectedVoice(item); setShowAll(false) }}>{t(item === 'PASS' ? 'Passive' : 'Active')}</button>)}</div></div>}
        <div className="panel-tabs" role="tablist" aria-label={t('Verb study view')}>
          <button role="tab" aria-selected={tab === 'chart'} className={tab === 'chart' ? 'selected' : ''} onClick={() => setTab('chart')}>{t('Quran examples')}</button>
          {paradigm && <button role="tab" aria-selected={tab === 'paradigm'} className={tab === 'paradigm' ? 'selected' : ''} onClick={() => setTab('paradigm')}>{t('Full pattern')}</button>}
          <button role="tab" aria-selected={tab === 'selected'} className={tab === 'selected' ? 'selected' : ''} onClick={() => setTab('selected')}>{t('Full conjugation')}</button>
          <button role="tab" aria-selected={tab === 'occurrences'} className={tab === 'occurrences' ? 'selected' : ''} onClick={() => setTab('occurrences')}>{t('In the Quran')}</button>
        </div>
        {tab === 'chart' ? <div className="chart-scroll"><table className="verb-chart"><caption>{t('Form {form}: attested Quranic verb examples by person and aspect', { form: selectedForm + (selectedNumber ? ` (${selectedNumber})` : '') })}</caption><thead><tr><th>{t('Who')}</th>{aspects.map(aspect => <th key={aspect}>{aspectLabels[aspect][uiLanguage === 'bn' ? 1 : 0]}<small lang={uiLanguage === 'bn' ? 'en' : 'bn'}>{aspectLabels[aspect][uiLanguage === 'bn' ? 0 : 1]}</small></th>)}</tr></thead><tbody>{personOrder.map(person => <tr key={person}><th><strong className="person-arabic" lang="ar" dir="rtl">{pronounLabels[person]}</strong><span className="person-english">{personLabels[person][0]}</span><small lang="bn">{personLabels[person][1]}</small></th>{aspects.map(aspect => {
          const cell = chart[`${aspect}:${person}`]
          const current = selectedForm === form && selectedVoice === voice && word.aspect === aspect && word.person === person
          return <td key={aspect} className={current ? 'current-cell' : ''}>{cell ? <button className="chart-cell" onClick={() => onNavigate(cell.key, cell.position)}><span className="cell-arabic" lang="ar" dir="rtl">{cell.arabic}</span><span className="cell-bn" lang="bn">{cell.bn}</span><span className="cell-en">{cell.en}</span><span className="cell-ref">{cell.key}:{cell.position} · {t('{count} occurrences', { count: cell.count })} <ArrowLeft size={12} /></span></button> : <span className="empty-cell" aria-label={chartSlotApplies(aspect, person) ? t('Not attested in this corpus') : t('Not applicable')}>{chartSlotApplies(aspect, person) ? '—' : 'n/a'}</span>}</td>
        })}</tr>)}</tbody></table></div> : tab === 'paradigm' && paradigm ? <div className="chart-scroll"><table id="reference-pattern-chart" className="verb-chart reference-chart"><caption>{t('Full active reference conjugation for Form {form}, using the placeholder root {root}', { form: selectedForm, root: isTriliteral ? 'فعل' : 'فعلل' })}</caption><ConjugationHeader language={uiLanguage} /><tbody>{referencePatternPersons(showAllPattern).map(person => <tr key={person}><th><strong className="person-arabic" lang="ar" dir="rtl">{pronounLabels[person]}</strong><span className="person-english">{personLabels[person][0]}</span><small lang="bn">{personLabels[person][1]}</small></th><td lang="ar" dir="rtl">{paradigm[person].perfect}</td><td lang="ar" dir="rtl">{paradigm[person].imperfect}</td><td lang="ar" dir="rtl">{paradigm[person].imperative || '—'}</td></tr>)}</tbody></table></div> : tab === 'selected' ? bookVerb && !showAllArabic ? <BookChart verb={bookVerb} showMeanings={showVerbBn} uiLanguage={uiLanguage} /> : selectedParadigm ? <><p className="section-hint selected-word-context">{t('Selected Quran word ({key}):', { key: `${verseKey}:${word.position}` })} <span lang="ar" dir="rtl">{word.arabic}</span>{showVerbBn && <span lang="bn">{word.bn}</span>}{showVerbEn && <span lang="en">{word.en}</span>}</p><div className="chart-scroll"><table className="verb-chart reference-chart selected-paradigm-chart"><caption>{t('Full {voice} conjugation of {verb} · Form {form}', { voice: t(selectedVoice === 'PASS' ? 'passive' : 'active'), verb: selectedParadigm['3MS'].perfect, form: selectedForm })}</caption><ConjugationHeader language={uiLanguage} /><tbody>{referencePersons.map(person => <tr key={person}><th><strong className="person-arabic" lang="ar" dir="rtl">{pronounLabels[person]}</strong><span className="person-english">{personLabels[person][0]}</span><small lang="bn">{personLabels[person][1]}</small></th>{selectedCell(person, 'PERF')}{selectedCell(person, 'IMPF')}{selectedCell(person, 'IMPV')}</tr>)}</tbody></table></div></> : <p className="section-hint unavailable-paradigm">{t('A reliable full conjugation is not available for this root and form yet. The Quran examples and reference pattern remain available.')}</p> : <div className="occurrence-list">{displayed.map(item => <button key={`${item.key}:${item.position}`} onClick={() => onNavigate(item.key, item.position)} className="occurrence"><span className="occ-ref">{item.key}:{item.position}</span><span className="occ-arabic" lang="ar" dir="rtl">{item.arabic}</span><span className="occ-bn" lang="bn">{item.bn}</span><span className="occ-en">{item.en}</span><ExternalLink size={15} /></button>)}{!showAll && sameForm.length > displayed.length && <button className="show-more" onClick={() => setShowAll(true)}>{t('Show all {count} occurrences', { count: sameForm.length })}</button>}</div>}
        {tab === 'paradigm' && paradigm && <button className="action-button book-view-toggle" aria-controls="reference-pattern-chart" aria-expanded={showAllPattern} onClick={() => setShowAllPattern(value => !value)}>{t(showAllPattern ? 'Hide feminine & dual' : 'Show feminine & dual')}</button>}
        {tab === 'selected' && bookVerb && selectedParadigm && <button className="action-button book-view-toggle" onClick={() => setShowAllArabic(v => !v)}>{t(showAllArabic ? 'Show book chart · বাংলা' : 'Show all Arabic persons · feminine & dual')}</button>}
        {tab === 'chart' && <p className="section-hint chart-note">{t('Chart entries are Quranic word examples and contextual meanings. — means unattested here; n/a means the imperative does not apply to that person.')}</p>}
        {tab === 'paradigm' && <p className="section-hint chart-note">{t('Reference conjugation of the placeholder root')} {isTriliteral ? 'فعل' : 'فعلل'}, {t('generated with')} <a href="https://github.com/linuxscout/qutrub" target="_blank" rel="noreferrer">Qutrub</a>. {t('These are not Quranic word examples or verified conjugations of the selected root. Form I shows one standard vowel pattern; weak roots may conjugate differently.')}</p>}
        {tab === 'selected' && selectedParadigm && (!bookVerb || showAllArabic) && <p className="section-hint chart-note">{t('Root-specific Arabic forms generated with')} <a href="https://github.com/linuxscout/qutrub" target="_blank" rel="noreferrer">Qutrub</a> {t('from a Corpus-matched verb citation. Bangla meanings come from the two local verb books only where the root, form, voice, Arabic spelling, aspect, and person match this cell. The book covers common masculine and first-person forms; other cells remain Arabic only. See Quran examples for contextual word meanings.')}</p>}
        <div className="occurrence-stats">
          <div><strong>{exact.length}</strong><span>{t('Exact written form')}</span></div>
          <div><strong>{sameForm.length}</strong><span>{t('Root + form {form} + {voice}', { form: selectedForm, voice: t(selectedVoice === 'PASS' ? 'passive' : 'active') })}</span></div>
          <div><strong>{occurrences?.length ?? '…'}</strong><span>{t('Verb root total')}</span></div>
        </div>
      </section>}
      {isVerb && <section className="grammar-summary verb-details">
        <div className="section-title"><span className="section-number">02</span> {t('Grammar identity')}</div>
        <div className="facts-grid">
          <div className="fact"><span>{t('WORD TYPE')}</span><strong>{t('Verb')}</strong><small lang="bn">ক্রিয়াপদ</small></div>
          <div className="fact"><span>{t('ROOT · الجذر')}</span><strong className="arabic-fact" lang="ar" dir="rtl">{arabicRoot(word.root)}</strong><small>{word.root || t('Not assigned')}</small></div>
          <div className="fact"><span>{t('VERB FORM · بَاب')}</span><strong>{t('Form {form}', { form })}</strong><small>{t('Corpus classification')}</small></div>
          <div className="fact"><span>{t('ASPECT')}</span><strong>{aspectLabels[word.aspect || '']?.[uiLanguage === 'bn' ? 1 : 0] || word.aspect || '—'}</strong><small lang="bn">{aspectLabels[word.aspect || '']?.[1] || ''}</small></div>
          <div className="fact"><span>{t('PERSON')}</span><strong>{personLabels[word.person || '']?.[uiLanguage === 'bn' ? 1 : 0] || word.person || '—'}</strong><small lang="bn">{personLabels[word.person || '']?.[1] || ''}</small></div>
          <div className="fact"><span>{t('VOICE')}</span><strong>{t(voice === 'PASS' ? 'Passive' : 'Active')}</strong><small>{word.mood ? t('Mood: {mood}', { mood: word.mood }) : t('Corpus annotation')}</small></div>
        </div>
        <details className="source-tags"><summary>{t('See original morphology tags')}</summary><div>{word.segments.map((segment, i) => <code key={i}>{segment.features}</code>)}</div></details>
      </section>}
      <p className="panel-source">{t('Grammar: Quranic Arabic Corpus v0.4 · Meanings: GTAF word databases.')} <a href="/sources.html">{t('View source details')}</a></p>
    </div>
  </aside>
}
