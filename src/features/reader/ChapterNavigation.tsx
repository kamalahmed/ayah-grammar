import { useMemo, useState } from 'react'
import { BookOpen, Search } from 'lucide-react'
import type { Chapter } from '../../domain/quran/types'
import { uiText, type UiLanguage } from '../../i18n/uiText'

export default function ChapterNavigation({ chapters, chapterNumber, chaptersOpen, surahMenu, selectChapter, uiLanguage }: { chapters: Chapter[]; chapterNumber: number; chaptersOpen: boolean; surahMenu: boolean; selectChapter: (number: number) => void; uiLanguage: UiLanguage }) {
  const t = (english: string, values?: Record<string, string | number>) => uiText(uiLanguage, english, values)
  const [search, setSearch] = useState('')
  const filteredChapters = useMemo(() => chapters.filter(item => `${item.number} ${item.english} ${item.meaning} ${item.arabic}`.toLowerCase().includes(search.toLowerCase())), [chapters, search])
  return <aside id="chapter-navigation" className={surahMenu ? 'chapter-sidebar open' : 'chapter-sidebar'} aria-label={t('Chapter navigation')} aria-hidden={!chaptersOpen} inert={!chaptersOpen}>
        <div className="sidebar-head"><div><span className="eyebrow">{t('EXPLORE THE QURAN')}</span><h2>{t('Surahs')}</h2></div></div>
        <label className="search-box"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder={t('Find a surah')} aria-label={t('Find a surah')} /></label>
        <div className="chapter-list">{filteredChapters.map(item => <button key={item.number} onClick={() => selectChapter(item.number)} className={item.number === chapterNumber ? 'chapter-item current' : 'chapter-item'}><span className="chapter-index">{String(item.number).padStart(2, '0')}</span><span className="chapter-names"><strong>{item.english}</strong><small>{item.meaning} · {t('{count} ayahs', { count: item.ayahs })}</small></span><span className="chapter-arabic" lang="ar">{item.arabic}</span></button>)}</div>
        <div className="sidebar-footer"><BookOpen size={16} /> <span>{t('Every word has a place to explore.')}</span></div>
      </aside>
}
