# Architecture and performance review

Date: 2026-09-28. Status: implemented and verified locally on
`refactor/feature-organization`. The original findings below describe the
pre-refactor baseline; final results and limitations follow.

## Implemented results

- Feature folders now own reader, study, library, settings, saved words, audio,
  and offline behavior. `src/` has only the entry point and virtual-module
  declarations at its top level. Domain rules, common loading, global styles,
  translations, and generated build inputs have dedicated folders.
- Edit Bangla interface labels in `src/i18n/locales/bn.ts`. The
  [editing guide](EDITING_GUIDE.md) maps source databases and every feature.
- Display controls, saved words, chapter navigation, and verse rendering are
  separate components. Verse callbacks and audio URLs remain stable across
  unrelated parent updates. A 286-verse component regression test renders zero
  cards for unchanged props and one for a single selected/audio verse. Restoring
  the old inline callback makes that test fail with 286 renders instead of one.
- Offline state belongs to a persistent component. Opening Display checks the
  package; closing it does not terminate an active save. The reader no longer
  requests the manifest or scans the full pack on startup. **The existing
  service worker still fetches the manifest during installation** for offline
  availability; this is not a zero-network installation claim.
- The full verb index is build input at `data/generated/verbs.json`, no longer
  published. All 19,352 attested occurrences remain in root-specific assets.
- The library loads generated search metadata and just the selected entry's
  details. All 500 entries, alternate readings, empty cells and provenance are
  preserved. Failed index/detail fetches each have a Retry button. Search parity
  tests cover every headword, meaning and conjugation plus filters and numerals.

### Local measurements

| Metric | Before | After |
| --- | ---: | ---: |
| Reader entry JavaScript | 283,229 bytes | 285,662 bytes |
| Library JavaScript | 1,112,499 bytes | 38,936 bytes |
| Library search JSON | Embedded in library JS | 531,493 bytes |
| CSS | 57,638 bytes | 57,638 bytes |
| Complete offline content | 44,847,429 bytes | 41,562,786 bytes |
| Offline files | 1,090 | 1,590 |

The library index reports about 64.72 kB gzip; the library JS about 9.65 kB.
Individual details add a request per selected entry, reused through the bounded
JSON cache. The complete offline package is 3,284,643 bytes smaller overall;
its additional files come from splitting the library. These are build sizes,
not measured phone latency improvements. No responsiveness claim is made from
file size alone.

### Verification

- 64 Vitest tests, one Node manifest test, four Python source alignment tests,
  and the TypeScript/production build pass.
- All 131 recorded source/generated files retain their SHA-256 hashes, including
  after rebuilding 6,236 ayahs, 77,429 words and 19,352 verb occurrences. Existing
  Bangla dictionary entries and stylesheet bytes are unchanged.
- The built manifest includes the library index and all 500 detail files,
  excludes the full verb source and purchased PDFs, and covers root data.
- Local Chromium production-preview checks: seven initial verses, all 500
  library results, Bangla-number search, entry 374's two readings, previous/next,
  simulated index/detail failures and retries, 390 px layout without horizontal
  overflow, Bangla interface, dark theme and opening word study.
- Full offline save completed while Display was closed/reopened. With browser
  networking disabled, reload and opening previously unvisited entry 500 worked.
- Fresh development loads exposed stale close events from the loading dialog.
  Reopened and detached dialogs now ignore these events; three fresh development
  loads and Escape dismissal pass, with a dedicated regression test.
- An independent code review found no important regression. Device playback,
  live deployment, and comparative phone timing were not tested in this work.

## Intended outcome

Make feature code, editable translations, source databases, generated datasets,
and verification tools easy to locate. Reduce unnecessary reader rendering and
offline work while preserving Quran content, audio controls, saved preferences,
study matching, and offline functionality.

## Original verified baseline

- `src/` contains 49 files at its top level, mixing components, data, styles,
  domain logic, browser services, and tests.
- `npm test`: 58 Vitest tests, one Node manifest test, and four Python source
  alignment tests pass.
- `npm run build`: passes; reports a library chunk above 500 kB.
- Production entry JavaScript: 283,229 bytes; CSS: 57,638 bytes.
- Library JavaScript: 1,112,499 bytes, about 95.26 kB gzip as reported by Vite.
- Offline manifest: 1,090 files, 44,847,429 bytes of listed content.
- Local Chromium production-preview check: seven first-surah verses render;
  opening the library renders 500 entry buttons. Initial requests include the
  143,946-byte offline manifest; library code is requested only when opened.

Sizes are local build measurements, not measurements of user-perceived speed
on a phone or of live server transfer sizes.

## Original findings and implementation rationale

### 1. Verse memoization is defeated by a changing callback

`VerseCard` already uses React `memo`, but `App.tsx` passes a fresh inline
`onToggleAudio` function inside `verses.map()`. Changes to visible ayah,
settings, sidebar search, and offline progress therefore invalidate every
verse's props, even when its displayed content has not changed.

Use one stable callback depending on the audio hook's already-stable `toggle`.
Extract a reader list boundary and memoize derived audio URLs by chapter and
reciter. Verify that unrelated updates do not render all 286 cards of surah 2,
while selection, language, appearance, and playback updates remain correct.

### 2. Offline checks compete with initial reading

On every production mount, `App.tsx` downloads the offline manifest and
`offlinePackStatus()` checks all 1,090 entries in batches of 24. Put the controls
and their state in an offline feature component mounted when Display settings
open. Keep an active download alive if the popover closes, preserve progress,
and refresh status appropriately when the reader reopens it.

Acceptance: a fresh reader load does not fetch the offline manifest or scan
the complete pack; opening offline controls still reports accurate status;
complete download, interrupted download, checksum checks, and offline reload
continue to work.

### 3. The offline package includes a redundant verb source file

`public/data/verbs.json` is 3,850,893 bytes. Application components use generated
root files, while the complete index is only consumed by the build and tests.
Because it is under `public/`, Vite also copies it into production and the
offline generator includes it.

Move this build input to `data/generated/verbs.json`, updating the Python
generator, Vite plugin, and tests together. Keep chapter URLs unchanged. This
should remove exactly that redundant input from newly built packs; verify the
manifest difference and preservation of every root occurrence. Existing
offline packs must remain usable until their replacement is complete.

### 4. Library data is compiled into a large JavaScript module

The library imports the entire compact book dataset and builds its search
strings at module evaluation. It is already lazy, so this affects opening the
library rather than initial reader load.

Use a generated compact search index and per-entry JSON details so searching
continues to include conjugated Arabic/Bangla text and alternate readings.
Load detail data for the selected entry through the existing bounded cache,
with loading, error, and retry states. Include both index and detail files in
the complete offline pack. Verify all 500 entries, entry 374's alternate
reading, Bangla-number search, filters, and previous/next navigation.

Treat this as a separate implementation stage because it changes the loading
contract. Moving the full dataset to one JSON file alone would not establish
faster opening or less parsing work.

### 5. Responsibilities and paths are difficult to discover

`App.tsx` owns settings, offline state, saved words, navigation, layout resizing,
theme effects, and reader rendering. `WordPanel.tsx` imports its runtime data
type from `build/verbShards.ts`. Generators and documentation contain literal
`src/*.json` paths. All of these must be updated with the file moves.

Keep shared domain types independent of build tools; split app orchestration
from settings, saved words, and chapter navigation. Keep tests beside the
feature they exercise; move build and service-worker integration tests to
`tests/`. Preserve stylesheet order while placing global and feature styling
in named locations.

## Implemented structure

```text
src/
  main.tsx                     # browser entry point
  app/                         # App, top-level composition and layout
  features/
    reader/                    # ayah cards, verse list, chapter navigation
    study/                     # word panel and grammar UI
    verb-library/              # library UI, search and selected entry loading
    settings/                  # display controls, theme and preference helpers
    saved-words/               # saved words UI and persistence
    audio/                     # reciter URLs and playback hook
    offline/                   # offline controls, pack/cache integration
  domain/
    quran/                     # Quran types and morphology helpers
    conjugation/               # paradigm types, matching and form guides
    books/                     # book types and exact-source matching
  i18n/
    locales/bn.ts              # editable Bangla interface dictionary
    uiText.ts                  # language selection, fallback and interpolation
  shared/
    components/                # deferred feature shell, common chart headers
    data/                      # bounded JSON cache and fetch hook
  styles/                      # global styles, fonts, dark-theme overrides
  vite-env.d.ts                # virtual module declarations
data/
  raw/                         # unchanged upstream text and SQLite sources
  books/                       # master book export, source references and CSV
  generated/                   # build inputs: verb index and paradigm/book data
public/
  data/                        # runtime chapter JSON at existing URLs
  sw.js                        # service worker at its required public URL
build/                         # Vite plugins and data asset generation
scripts/                       # documented generation, extraction, deploy tools
tests/                         # build, service-worker and Python integration tests
docs/                          # architecture, editing, sources and deployment
```

Prefer direct imports to each owning module; avoid broad barrel modules that
can accidentally pull large datasets into the entry bundle. Keep feature
folders shallow. Split files where responsibilities differ, rather than adding
layers for every function. English remains the existing source-key language;
changing the localization key system is outside this refactor.

Two alternatives were considered: moving files only into generic
`components/hooks/utils` folders would leave editing ownership unclear; adding
a backend database or replacing the app framework would introduce unnecessary
infrastructure. Feature folders with a small shared domain layer fit the
current static application.

## Implementation sequence (completed)

1. Move files and extract the Bangla dictionary without changing content.
   Update all imports, generators, build inputs, source links, and test paths.
   Run the existing suites and build; compare source/generated data hashes.
2. Extract settings, saved-word, chapter-navigation and reader composition from
   `App`. Preserve storage keys, DOM behavior, stylesheet order, and loading
   boundaries. Check desktop and 390 px mobile reading, both languages, dark
   mode, selected word, audio controls, and library navigation.
3. Fix callback stability and defer offline status work. Add focused render and
   lifecycle regression tests. Compare reader render counts on surah 2 before
   and after the change with the same interactions and instrumentation.
4. Move the redundant full verb index out of public assets. Verify complete
   occurrence preservation, manifest coverage and the measured package saving.
5. Split library index/detail data with search-parity tests, loading-failure
   checks and online/offline browser coverage. Measure library opening under
   the same network/CPU conditions before claiming a responsiveness gain.
6. Update the editing guide and README to the final paths, document measured
   results and limits, and run the complete tests and production build.

Preserve exact Arabic/Bangla source content and absent cells. Keep purchased
PDFs excluded from Git and production. A push to `main` deploys automatically;
these local changes have not published a release.
