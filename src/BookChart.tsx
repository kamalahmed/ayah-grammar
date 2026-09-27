import { ExternalLink } from 'lucide-react'
import { bookCell, bookPageUrl, bookPersons } from './bookData'
import type { BookAspect, BookVerb } from './bookData'
import { personLabels, pronounLabels } from './study'
import ConjugationHeader from './ConjugationHeader'
import type { UiLanguage } from './uiText'
import { uiText } from './uiText'

declare const __LOCAL_BOOK_PDFS__: number[]

const aspects: BookAspect[] = ['PERF', 'IMPF', 'IMPV']

export default function BookChart({ verb, showMeanings = true, uiLanguage = 'en' }: { verb: BookVerb; showMeanings?: boolean; uiLanguage?: UiLanguage }) {
  const t = (english: string, values?: Record<string, string | number>) => uiText(uiLanguage, english, values)
  const localBookAvailable = typeof __LOCAL_BOOK_PDFS__ !== 'undefined' && __LOCAL_BOOK_PDFS__.includes(verb.level)
  const corrections = verb.conjugations.some(c => c.correction_note_bn)
  const needsReview = verb.conjugations.some(c => c.review_note_bn)
  return <section className="book-chart-section" aria-label={t('Book conjugation {number}', { number: verb.entry_number })}>
    <div className="book-source-line"><span>{t('Book {level}', { level: verb.level })} <span aria-hidden="true">/</span> {t('Verb {number}', { number: verb.entry_number })}</span>{localBookAvailable ? <a href={bookPageUrl(verb)} target="_blank" rel="noreferrer">{t('Original page {page}', { page: verb.source.pdf_page })} <ExternalLink size={13} /></a> : <span>{t('Source page {page}', { page: verb.source.pdf_page })}</span>}</div>
    {verb.note_bn && <p className="book-exception" lang="bn">{verb.note_bn}</p>}
    {verb.conjugations.length > 0 && <div className="chart-scroll book-chart-scroll" tabIndex={0} aria-label={t('Conjugation table; scroll horizontally for all columns')}>
      <table className="verb-chart book-chart">
        <caption>{t('Book conjugation of {verb}, entry {number}; masculine and first-person forms', { verb: verb.headword_ar, number: verb.entry_number })}</caption>
        <ConjugationHeader language={uiLanguage} />
        <tbody>{bookPersons.map(person => <tr key={person}>
          <th><strong className="person-arabic" lang="ar" dir="rtl">{pronounLabels[person]}</strong><span className="person-english">{personLabels[person][0]}</span><small lang="bn">{personLabels[person][1]}</small></th>
          {aspects.map(aspect => {
            const cell = bookCell(verb, aspect, person)
            const applicable = aspect !== 'IMPV' || person === '2MS' || person === '2MP'
            return <td key={aspect} className={cell?.review_note_bn ? 'book-cell review-cell' : 'book-cell'}>
              {cell ? <><span className="conjugated-arabic" lang="ar" dir="rtl">{cell.ar}</span>{showMeanings ? <span className="book-verb-meaning" lang="bn">{cell.bn}{cell.correction_note_bn && <sup title={cell.correction_note_bn}>*</sup>}</span> : <span className="book-hidden-meaning" aria-label={t('Bangla meaning hidden')}>•••</span>}{cell.review_note_bn && (localBookAvailable ? <a className="book-review-link" href={bookPageUrl(verb, cell.source_page)} target="_blank" rel="noreferrer" title={cell.review_note_bn}>{t('Check printed form')} ↗</a> : <span className="book-review-link" title={cell.review_note_bn}>{t('Check source page {page}', { page: cell.source_page })}</span>)}</> : <span className="empty-cell" aria-label={t(applicable ? 'Not supplied in this book' : 'Not applicable')}>{applicable ? '—' : 'n/a'}</span>}
            </td>
          })}
        </tr>)}</tbody>
      </table>
    </div>}
    <p className="section-hint book-chart-note">{t('The book gives masculine and first-person forms. Feminine and dual forms are not supplied.')} {corrections && <span>{t('* An obvious printed Bangla typo has been corrected.')} </span>}{needsReview && <span>{t('Highlighted Arabic cells need checking against the printed source.')} </span>}<span lang="bn">অর্থগুলো বইয়ের অনুশীলনের জন্য; আয়াতভেদে অর্থ ভিন্ন হতে পারে।</span></p>
    <details className="book-source-details"><summary>{t('Source & transcription notes')}</summary><p>{t('Reference: Quran words, Level {level}, pages {pages}. The original books are not distributed with this app. Entry numbers and table completeness were checked, with targeted visual checks of the text. The entire collection has not been independently proofread. Consult your own copy when a form or meaning looks unusual.', { level: verb.level, pages: verb.source.pages.join(', ') })}</p>{corrections && <ul>{verb.conjugations.filter(c => c.bn_source).map(c => <li key={`${c.aspect}:${c.person}`} lang="bn">বইয়ে: {c.bn_source} → {c.bn}</li>)}</ul>}</details>
  </section>
}
