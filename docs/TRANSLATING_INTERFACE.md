# Editing the Bangla interface

The single place to edit Bangla **interface labels** is [`src/i18n/locales/bn.ts`](../src/i18n/locales/bn.ts). Its `bangla` table maps an English label to the Bangla shown when a reader chooses **Display → Interface language → বাংলা**.

For example:

```ts
'Reciter': 'তিলাওয়াতকারী',
'Save for offline use': 'অফলাইনে ব্যবহারের জন্য সংরক্ষণ করুন',
```

Edit the text on the right. Keep the English key on the left unchanged unless you also change every component that calls `uiText` or its local `t` helper with that key. For a new interface label, add a row to the table, then use the exact English key in the component: `t('New label')` in `App.tsx`, or `uiText(uiLanguage, 'New label')` elsewhere.

Some labels contain placeholders such as `{count}`, `{saved}`, or `{total}`. Preserve those names in the Bangla value so the app can insert numbers. A missing Bangla key falls back to English, which makes an untranslated label visible rather than silently hiding it.

These labels are separate from Quran ayah translations, word meanings, and the printed verb-book text. Their source paths are documented in [CONTENT_SOURCES.md](CONTENT_SOURCES.md); do not edit that source text when only changing an interface button or heading.

After editing, run `npm test` and `npm run build`. Then use the Bangla interface in a local production preview to check the label in context, especially on a narrow mobile viewport. Once pushed to `main`, the Hostinger workflow deploys the change automatically after its tests and verification pass.
