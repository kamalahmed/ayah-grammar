import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import { uiText, type UiLanguage } from '../../i18n/uiText'

type SavedEntry = { id: string; arabic: string; en: string; bn: string }

function storedSaved(): SavedEntry[] {
  try {
    const value = JSON.parse(localStorage.getItem('ayah-saved') || '[]')
    return Array.isArray(value) ? value.filter((item): item is SavedEntry => item && typeof item.id === 'string' && typeof item.arabic === 'string' && typeof item.en === 'string' && typeof item.bn === 'string') : []
  } catch { return [] }
}

export function useSavedWords() {
  const [savedWords, setSavedWords] = useState<SavedEntry[]>(storedSaved)
  useEffect(() => { localStorage.setItem('ayah-saved', JSON.stringify(savedWords)) }, [savedWords])
  return [savedWords, setSavedWords] as const
}

export default function SavedWords({ savedWords, navigate, onClose, uiLanguage }: { savedWords: SavedEntry[]; navigate: (key: string, position: number) => void; onClose: () => void; uiLanguage: UiLanguage }) {
  const t = (english: string, values?: Record<string, string | number>) => uiText(uiLanguage, english, values)
  return       <div className="settings-popover saved-popover">
        <div className="popover-head"><strong>{t('Saved words')}</strong><button className="icon-button" aria-label={t('Close saved words')} onClick={() => onClose()}><X size={17} /></button></div>
        {savedWords.length === 0 ? <p>{t('Tap “Save word” while studying to keep it here.')}</p> : <div className="saved-list">{savedWords.map(item => <button key={item.id} onClick={() => { const [surah, ayah, position] = item.id.split(':'); navigate(`${surah}:${ayah}`, Number(position)); onClose() }}><span className="saved-ref">{item.id}</span><strong lang="ar" dir="rtl">{item.arabic}</strong><span lang="bn">{item.bn}</span><small>{item.en}</small></button>)}</div>}
      </div>
}
