# Data preparation

The repository includes the data needed to run and verify the app.

## Reader data

```bash
npm run data:build
npm test
```

The Python builder reads the original text, translation, SQLite word and morphology files in `data/raw/`. It writes chapter JSON, chapter metadata and the verb occurrence index into `public/data/`.

Words are aligned by surah, ayah and position. Four known word-boundary differences between Tanzil 1.1 and Corpus v0.4 are handled explicitly; source Arabic characters and pause marks stay intact.

## Book data

- `data/books/quran-verbs-500.json`: full export with PDF page/cell coordinates and correction records.
- `data/books/quran-verbs-500.csv`: spreadsheet-friendly UTF-8 export.
- `src/bookVerbs.json`: compact application copy.

The original PDF books are **not included in the repository**. They are not required to run the app or import the bundled study data. Local PDF files are ignored by Git.

```bash
python3 scripts/build_book_verb_meanings.py
```

The importer accepts the version 2 master export. It checks numbered entry coverage, person/aspect slots, duplicate cells and required content before updating the app copy.

The collection contains 500 numbered entries, 501 readings and 6,978 conjugation cells. The identical repeat of entry 202 is deduplicated. Entry 374 has two different readings, both retained. Entries 91 and 190 have no conjugation tables; entry 30 contains past forms only.

### Extracting again from the PDFs

This optional step requires your own copies of the source books. The defaults look for `public/books/level-1.pdf` and `public/books/level-2.pdf` locally; both are ignored by Git. Set `QURAN_BOOK_DIR` to use another local folder.

`npm run dev` enables original-page links only for the local PDFs found when the server starts. `npm run build` excludes `books/` from the output and renders source-page citations without PDF download links. Deploy the generated `dist/` directory.

The books' embedded Unicode maps are inconsistent with their rendered glyphs. The extraction scripts use a reviewed glyph map, table geometry, Bengali character reordering and Tesseract OCR for Level 2 entry numbers. Corrections and known questionable printed forms are recorded in the master export.

```bash
python3 -m venv .venv-book-extract
.venv-book-extract/bin/pip install -r scripts/book_extract/requirements.txt
.venv-book-extract/bin/python scripts/book_extract/extract.py
.venv-book-extract/bin/python scripts/book_extract/parse_rows.py
.venv-book-extract/bin/python scripts/book_extract/group_entries.py
.venv-book-extract/bin/python scripts/book_extract/number_entries.py
.venv-book-extract/bin/python scripts/book_extract/build_entries.py
.venv-book-extract/bin/python scripts/book_extract/publish.py
```

This optional workflow also requires Tesseract 5 on the command line. The Bengali model is bundled with its Apache-2.0 license. Defaults use your local PDF copies and save temporary tables under ignored `data/book-extraction-work/`. `QURAN_APP_DIR`, `QURAN_BOOK_DIR`, `QURAN_EXTRACT_WORK` and `QURAN_TESSDATA_DIR` override these locations.

The glyph map and numbering corrections apply to the exact source editions whose hashes are recorded in the master. A different edition needs a fresh layout review. Re-extracting regenerates the export; preserve any additional manual corrections before doing so.

### Review status

All entry numbers and expected table slots have been checked. Targeted visual checks cover glyph ligatures, source numbering, boundary errors and suspicious cells. The entire collection has not been independently proofread. A structurally complete table is not a guarantee that every printed form is correct; use the page links when a form or meaning looks unusual.
