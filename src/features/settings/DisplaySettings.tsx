import type { Dispatch, SetStateAction } from 'react'
import { X } from 'lucide-react'
import { uiText, type UiLanguage } from '../../i18n/uiText'
import type { ThemePreference } from './theme'
import OfflineControls from '../offline/OfflineControls'

interface Props {
  open: boolean;
  onClose: () => void;
  language: 'both' | 'bn' | 'en';
  setLanguage: Dispatch<SetStateAction<'both' | 'bn' | 'en'>>;
  uiLanguage: UiLanguage;
  setUiLanguage: Dispatch<SetStateAction<UiLanguage>>;
  themePreference: ThemePreference;
  setThemePreference: Dispatch<SetStateAction<ThemePreference>>;
  fontScale: number;
  setFontScale: Dispatch<SetStateAction<number>>;
  arabicScale: number;
  setArabicScale: Dispatch<SetStateAction<number>>;
  showArabicVerses: boolean;
  setShowArabicVerses: Dispatch<SetStateAction<boolean>>;
  showWordMeanings: boolean;
  setShowWordMeanings: Dispatch<SetStateAction<boolean>>;
  highlightVerbs: boolean;
  setHighlightVerbs: Dispatch<SetStateAction<boolean>>;
  showVerbBn: boolean;
  setShowVerbBn: Dispatch<SetStateAction<boolean>>;
  showVerbEn: boolean;
  setShowVerbEn: Dispatch<SetStateAction<boolean>>
}

export default function DisplaySettings({ open, onClose, language, setLanguage, uiLanguage, setUiLanguage, themePreference, setThemePreference, fontScale, setFontScale, arabicScale, setArabicScale, showArabicVerses, setShowArabicVerses, showWordMeanings, setShowWordMeanings, highlightVerbs, setHighlightVerbs, showVerbBn, setShowVerbBn, showVerbEn, setShowVerbEn }: Props) {
  const t = (english: string, values?: Record<string, string | number>) => uiText(uiLanguage, english, values)
  return       <div className="settings-popover" style={{ display: open ? undefined : 'none' }}>
        <div className="popover-head"><strong>{t('Reading display')}</strong><button className="icon-button" aria-label={t('Close display settings')} onClick={() => onClose()}><X size={17} /></button></div>
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
        {import.meta.env.PROD && <OfflineControls active={open} uiLanguage={uiLanguage} />}
      </div>
}
