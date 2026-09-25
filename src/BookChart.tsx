import { ExternalLink } from 'lucide-react'
import { bookCell, bookPageUrl, bookPersons } from './bookVerbs'
import type { BookAspect, BookVerb } from './bookVerbs'
import { personLabels, pronounLabels } from './study'

declare const __LOCAL_BOOK_PDFS__: number[]

const aspects: { id: BookAspect; en: string; bn: string; ar: string }[] = [
  { id: 'PERF', en: 'Past', bn: 'অতীত', ar: 'ماضٍ' },
  { id: 'IMPF', en: 'Present / future', bn: 'বর্তমান / ভবিষ্যৎ', ar: 'مضارع' },
  { id: 'IMPV', en: 'Command', bn: 'আদেশ', ar: 'أمر' },
]

export default function BookChart({ verb, showMeanings = true }: { verb: BookVerb; showMeanings?: boolean }) {
  const localBookAvailable = typeof __LOCAL_BOOK_PDFS__ !== 'undefined' && __LOCAL_BOOK_PDFS__.includes(verb.level)
  const corrections = verb.conjugations.some(c => c.correction_note_bn)
  const needsReview = verb.conjugations.some(c => c.review_note_bn)
  return <section className="book-chart-section" aria-label={`Book conjugation ${verb.entry_number}`}>
    <div className="book-source-line"><span>BOOK {verb.level} <span aria-hidden="true">/</span> VERB {verb.entry_number}</span>{localBookAvailable ? <a href={bookPageUrl(verb)} target="_blank" rel="noreferrer">Original page {verb.source.pdf_page} <ExternalLink size={13} /></a> : <span>Source page {verb.source.pdf_page}</span>}</div>
    {verb.note_bn && <p className="book-exception" lang="bn">{verb.note_bn}</p>}
    {verb.conjugations.length > 0 && <div className="chart-scroll book-chart-scroll" tabIndex={0} aria-label="Conjugation table; scroll horizontally for all columns">
      <table className="verb-chart book-chart">
        <caption>Book conjugation of {verb.headword_ar}, entry {verb.entry_number}; masculine and first-person forms</caption>
        <thead><tr><th>Who <small lang="bn">পুরুষ</small></th>{aspects.map(a => <th key={a.id}>{a.en}<small lang="bn">{a.bn}</small><span className="book-tense-ar" lang="ar" dir="rtl">{a.ar}</span></th>)}</tr></thead>
        <tbody>{bookPersons.map(person => <tr key={person}>
          <th><strong className="person-arabic" lang="ar" dir="rtl">{pronounLabels[person]}</strong><span className="person-english">{personLabels[person][0]}</span><small lang="bn">{personLabels[person][1]}</small></th>
          {aspects.map(a => {
            const cell = bookCell(verb, a.id, person)
            const applicable = a.id !== 'IMPV' || person === '2MS' || person === '2MP'
            return <td key={a.id} className={cell?.review_note_bn ? 'book-cell review-cell' : 'book-cell'}>
              {cell ? <><span className="conjugated-arabic" lang="ar" dir="rtl">{cell.ar}</span>{showMeanings ? <span className="book-verb-meaning" lang="bn">{cell.bn}{cell.correction_note_bn && <sup title={cell.correction_note_bn}>*</sup>}</span> : <span className="book-hidden-meaning" aria-label="Bangla meaning hidden">•••</span>}{cell.review_note_bn && (localBookAvailable ? <a className="book-review-link" href={bookPageUrl(verb, cell.source_page)} target="_blank" rel="noreferrer" title={cell.review_note_bn}>Check printed form ↗</a> : <span className="book-review-link" title={cell.review_note_bn}>Check source page {cell.source_page}</span>)}</> : <span className="empty-cell" aria-label={applicable ? 'Not supplied in this book' : 'Not applicable'}>{applicable ? '—' : 'n/a'}</span>}
            </td>
          })}
        </tr>)}</tbody>
      </table>
    </div>}
    <p className="section-hint book-chart-note">The book gives masculine and first-person forms. Feminine and dual forms are not supplied. {corrections && <span>* An obvious printed Bangla typo has been corrected. </span>}{needsReview && <span>Highlighted Arabic cells need checking against the printed source. </span>}<span lang="bn">অর্থগুলো বইয়ের অনুশীলনের জন্য; আয়াতভেদে অর্থ ভিন্ন হতে পারে।</span></p>
    <details className="book-source-details"><summary>Source & transcription notes</summary><p>Reference: Quran words, Level {verb.level}, pages {verb.source.pages.join(', ')}. The original books are not distributed with this app. Entry numbers and table completeness were checked, with targeted visual checks of the text. The entire collection has not been independently proofread. Consult your own copy when a form or meaning looks unusual.</p>{corrections && <ul>{verb.conjugations.filter(c => c.bn_source).map(c => <li key={`${c.aspect}:${c.person}`} lang="bn">বইয়ে: {c.bn_source} → {c.bn}</li>)}</ul>}</details>
  </section>
}
