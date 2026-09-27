# Where to edit Ayah Grammar

This guide describes the organized checkout. See [the architecture review](ARCHITECTURE_REVIEW.md) for the original findings and measured local results.

## Find the right kind of translation

| What you want to change | Current source | How it reaches the app |
| --- | --- | --- |
| Bangla buttons, menus, headings, and messages | [`src/i18n/locales/bn.ts`](../src/i18n/locales/bn.ts), the `bangla` table | Imported by React components |
| English interface text | English keys passed to `uiText()` or `t()` in `src/features/**/*.tsx` and `src/app/App.tsx`; explanatory text also lives in `src/domain/conjugation/formGuide.ts` and `src/domain/quran/study.ts` | English is the fallback text; update its Bangla dictionary key if changing it |
| Complete Bangla ayah translations | [`data/raw/tanzil-bn-bengali.txt`](../data/raw/tanzil-bn-bengali.txt) | `npm run data:build` writes `public/data/chapter-*.json` |
| Complete English ayah translations | [`data/raw/tanzil-en-sahih.txt`](../data/raw/tanzil-en-sahih.txt) | Same reader data build |
| Bangla word meanings | [`data/raw/gtaf-words-bn.db`](../data/raw/gtaf-words-bn.db) | Same reader data build |
| English word meanings | [`data/raw/gtaf-words-en.db`](../data/raw/gtaf-words-en.db) | Same reader data build |
| Printed book meanings and conjugation cells | [`data/books/quran-verbs-500.json`](../data/books/quran-verbs-500.json) | `python3 scripts/build_book_verb_meanings.py` writes `data/generated/bookVerbs.json` |

For interface edits, see [the translation guide](TRANSLATING_INTERFACE.md).
Keep placeholders such as `{count}` unchanged. Interface labels and Quran
translations are different datasets.

Quran text and translations are attributed source material. Verify corrections
against the named source and retain its notices. Do not paraphrase source text
or fill absent book meanings with invented translations. Editing a generated
chapter JSON alone is temporary: rebuilding overwrites it.

## Where is the database?

The deployed app is a static website. There is no application database server,
account database, or database connection string.

- **Source databases:** the two SQLite `.db` files under `data/raw/`. Each has a
  `quran` table containing a `tr` text column. The builder reads `tr` in `rowid`
  order, requiring exactly 77,429 nonempty word meanings in each database.
  Preserve this ordering: it is the alignment contract with the morphology
  corpus, not an explicit surah/ayah foreign key.
- **Runtime reading data:** `public/data/chapters.json` and the 114
  `public/data/chapter-N.json` files. A chapter contains ayahs, translations,
  words, and word grammar.
- **Runtime grammar data:** `build/verbDataPlugin.ts` uses `data/generated/verbs.json`,
  `data/generated/selectedParadigms.json`, and `data/generated/bookVerbs.json` to produce small root
  files. Production files live under `dist/assets/verb-*.json`; development
  serves them at `/data/roots/verb-*.json`.
- **Runtime library data:** `build/bookLibraryPlugin.ts` creates the search index
  and 500 individual entry files from `data/generated/bookVerbs.json`. These
  live under `dist/assets/book-*.json` in production and `/data/library/` in
  development. Search includes all conjugations and alternate readings; only
  the selected entry details are fetched. All files join the offline pack.
- **Personal browser data:** `localStorage` holds `ayah-*` reading preferences,
  saved words (`ayah-saved`), and the last library entry (`ayah-book-entry`).
  Cache Storage holds visited resources and the optional complete offline pack.

You can inspect a word database using any SQLite viewer. A read-only example:

```bash
sqlite3 -readonly data/raw/gtaf-words-bn.db \
  'SELECT rowid, tr FROM quran ORDER BY rowid LIMIT 10;'
```

## Find the feature you want to edit

| Feature | Current files |
| --- | --- |
| App composition and layout | `src/app/App.tsx` |
| Surah navigation and verse list | `src/features/reader/ChapterNavigation.tsx`, `src/features/reader/VerseList.tsx` |
| Display controls | `src/features/settings/DisplaySettings.tsx` |
| Saved words and persistence | `src/features/saved-words/SavedWords.tsx` |
| Ayah cards, Arabic text, word tiles, translations | `src/features/reader/VerseCard.tsx` |
| Word panel, grammar tabs, occurrences | `src/features/study/WordPanel.tsx`, `src/domain/quran/study.ts` |
| 500-verb library and search | `src/features/verb-library/VerbLibrary.tsx`, `src/features/verb-library/searchLibrary.ts` |
| Book chart and source matching | `src/features/study/BookChart.tsx`, `src/domain/books/bookData.ts` |
| Reciters and audio playback | `src/features/audio/audio.ts`, `src/features/audio/useAudioPlayer.ts` |
| Theme and size settings | `src/features/settings/theme.ts`, `src/features/settings/displayPreferences.ts` |
| JSON loading and in-memory cache | `src/shared/data/useJsonData.ts`, `src/shared/data/jsonCache.ts` |
| Lazy feature loading and retry | `src/shared/components/DeferredFeature.tsx`, `src/shared/components/deferredModule.ts` |
| Offline controls and behavior | `src/features/offline/OfflineControls.tsx`, `src/features/offline/offlinePack.ts`, `src/features/offline/offlineResources.ts`, `public/sw.js` |
| Visual styles | `src/styles/styles.css`, `src/styles/dark.css`, `src/features/study/bookStudy.css` |
| Production build and deployment | `vite.config.ts`, `build/`, `.github/workflows/`, `scripts/deploy-hostinger.sh` |

After source-data edits, run the relevant generator, inspect the generated diff,
then run `npm test` and `npm run build`. Check the affected screen using
`npm run preview`. Only `dist/` is deployed; personal PDFs are excluded.

Pushing to `main` triggers the Hostinger production workflow. See
[deployment instructions](DEPLOYMENT.md) before publishing.

## Folder ownership

`src/features/` owns screen behavior; `src/domain/` owns Quran, conjugation and
book matching rules; `src/shared/` owns reusable loading and UI helpers.
`src/i18n/locales/bn.ts` contains editable labels and `src/i18n/uiText.ts` contains
language fallback and placeholder handling. `data/generated/` is reproducible
build input. Edit its source files and rerun the corresponding generator.
Feature tests live beside their implementation; build and service-worker
integration tests live under `tests/`.
