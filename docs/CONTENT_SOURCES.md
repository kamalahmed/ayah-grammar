# Content sources and integrity

Ayah Grammar connects source text, translations and morphology through word locations. The study interface and its labels are separate from the source material.

## Datasets

| Layer | Source | Included files |
| --- | --- | --- |
| Arabic ayahs | [Tanzil Uthmani 1.1](https://tanzil.net/download/) | `data/raw/tanzil-uthmani-1.1.txt` |
| English ayahs | Saheeh International, via [Tanzil translations](https://tanzil.net/trans/) | `data/raw/tanzil-en-sahih.txt` |
| Bengali ayahs | Muhiuddin Khan, via Tanzil | `data/raw/tanzil-bn-bengali.txt` |
| Chapter metadata | [Tanzil Quran metadata](https://tanzil.net/docs/Quran_Metadata) | `data/raw/tanzil-quran-data.xml` |
| Word grammar | [Quranic Arabic Corpus v0.4](https://corpus.quran.com/download/) | `data/raw/quranic-corpus-morphology-0.4.txt` |
| English and Bengali word glosses | [Greentech Apps Foundation](https://github.com/GreentechApps/Al-Quran/tree/master/dbs) | `data/raw/gtaf-words-en.db`, `data/raw/gtaf-words-bn.db` |
| Reference and selected-root paradigms | Corpus citations and [Qutrub](https://github.com/linuxscout/qutrub) | `src/referenceParadigms.json`, `src/selectedParadigms.json` |
| Book conjugations and Bangla meanings | Quran words, Levels 1 and 2 | `public/books/`, `data/books/`, `src/bookVerbs.json` |

Original ownership and applicable source terms remain with the respective projects, translators and book publishers. This repository does not relicense third-party datasets or books. See the preserved [notices](../public/NOTICES.txt), the [Tanzil text license](https://tanzil.net/docs/Text_License) and each source's own terms. The GTAF repository does not identify a separate license for the word database files; do not infer one from their inclusion here. Qutrub is distributed under the GPL.

## Integrity rules

1. **Identify words by location.** The key is `(surah, ayah, word position)`, never spelling alone.
2. **Preserve Arabic source text.** Keep Tanzil characters, opening basmalahs and pause signs. The importer handles four word-boundary differences with the older morphology corpus explicitly.
3. **Keep Quran examples attested.** A dash means an applicable slot has no occurrence in the corpus. `n/a` means the imperative does not apply. The Corpus's gender-unmarked `2D` category is represented separately.
4. **Identify reference charts clearly.** Placeholder-root patterns and generated selected-root paradigms are teaching aids, not claims of Quran occurrence.
5. **Match book meanings carefully.** Root, form, voice, aspect, person and Arabic letters must match before a book meaning is attached to an independently generated form. A contextual gloss from another Quran word is never substituted for a conjugation translation.
6. **Respect book coverage.** Preserve absent feminine, dual and passive meanings. Retain distinct readings, source pages and known omissions.
7. **Keep corrections traceable.** Obvious printed Bangla corrections retain their original wording. Questionable printed Arabic forms are flagged. Automated checks and targeted visual review do not establish that every cell has been proofread.

See [Data preparation](DATA_PREPARATION.md) for reproduction and review details.
