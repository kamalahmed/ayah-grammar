import type { UiLanguage } from '../../i18n/uiText'
import { uiText } from '../../i18n/uiText'

const columns = [
  { en: 'Past', bn: 'অতীত', ar: 'ماضٍ' },
  { en: 'Present / future', bn: 'বর্তমান / ভবিষ্যৎ', ar: 'مضارع' },
  { en: 'Command', bn: 'আদেশ', ar: 'أمر' },
]

export default function ConjugationHeader({ language }: { language: UiLanguage }) {
  return <thead><tr>
    <th>{uiText(language, 'Who')} <small lang={language === 'bn' ? 'en' : 'bn'}>{language === 'bn' ? 'Who' : 'পুরুষ'}</small></th>
    {columns.map(column => <th key={column.en}>
      {language === 'bn' ? column.bn : column.en}
      <small lang={language === 'bn' ? 'en' : 'bn'}>{language === 'bn' ? column.en : column.bn}</small>
      <span className="book-tense-ar" lang="ar" dir="rtl">{column.ar}</span>
    </th>)}
  </tr></thead>
}
