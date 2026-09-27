# Repository organization and performance implementation

Design: ../ARCHITECTURE_REVIEW.md. Resumed with the user's instruction to continue.

Preserve exact Quran/book data, storage keys, chapter URLs, stylesheet order,
source provenance, and the static deployment contract. Work on the local
refactor branch; publishing is separate from local verification.

- [x] Organize feature/domain/shared files and generated inputs. Extract Bangla
  dictionary. Update imports, generators, tests and documentation. Compare data
  hashes and run existing tests/build.
- [x] Extract display settings, saved words, chapter sidebar and verse list from
  App. Keep event and DOM contracts; stabilize verse callbacks and audio URLs.
- [x] Move offline state into a persistent feature boundary activated by opening
  Display; verify no startup scan and close/reopen during an active download.
- [x] Keep full verb index as build input only; compare offline manifest and
  verify all root occurrences with the existing shard tests.
- [x] Generate library search metadata and individual details, with search parity
  against every source reading and recoverable fetch errors. Verify offline
  manifest includes every entry.
- [x] Run tests/build, browser checks, source hash comparison and code review.
  Update architecture results and editing instructions to implemented paths.

## Progress and decisions

- Baseline: existing 58 Vitest, 1 Node and 4 Python tests pass.
- Existing draft review and editing guide recovered; no application changes
  existed from the interrupted session.
- Work in the existing checkout on refactor/feature-organization to preserve
  the recovered drafts and the user's workspace context.

- Completed: feature/domain/shared moves, dictionary extraction, app composition,
  persistent offline controls, private build index, split library index/details.
- Verification: 64 Vitest + 1 Node + 4 Python tests; production build; 131 unchanged
  data hashes; library search parity and 500-entry manifest coverage.
- Local browser: retries, navigation, Bangla/dark mode, 390px overflow, study panel,
  complete pack saving through close/reopen, and offline reload/unvisited entry.
- Rendering regression: original callback mutation fails (286 vs 1 render);
  stable implementation passes (one affected card, zero on unchanged props).
- Review: no important regression found. The existing service-worker install
  still requests the offline manifest; only App's startup scan/request was removed.
- Library index adds 531,493 bytes of JSON; do not claim measured latency gains.
- Results and remaining device/live limitations recorded in ARCHITECTURE_REVIEW.md.
- Final development check fixed stale dialog close events during StrictMode and
  lazy loading. Three fresh loads, Escape dismissal and a regression test pass.
