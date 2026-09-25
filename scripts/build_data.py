"""Build a location-checked, source-attributed study index from unchanged inputs."""

import json
import re
import sqlite3
import xml.etree.ElementTree as ET
from collections import defaultdict
from contextlib import closing
from pathlib import Path


JOINED_IN_OLD_CORPUS = {
    "2:181": ("بَعْدَ", "مَا"),
    "8:6": ("بَعْدَ", "مَا"),
    "13:37": ("بَعْدَ", "مَا"),
    "37:130": ("إِلْ", "يَاسِينَ"),
}
LOCATION = re.compile(r"^\((\d+):(\d+):(\d+):(\d+)\)$")


def load_lines(path):
    rows = {}
    for line in path.read_text(encoding="utf-8-sig").splitlines():
        if not line or line.startswith("#"):
            continue
        surah, ayah, text = line.split("|", 2)
        key = f"{int(surah)}:{int(ayah)}"
        if key in rows:
            raise ValueError(f"Duplicate ayah {key} in {path}")
        rows[key] = text
    if len(rows) != 6236:
        raise ValueError(f"Expected 6236 ayahs in {path}; found {len(rows)}")
    return rows


def load_glosses(path):
    with closing(sqlite3.connect(path)) as connection:
        values = [row[0] for row in connection.execute("SELECT tr FROM quran ORDER BY rowid")]
    if len(values) != 77429 or any(not value or not value.strip() for value in values):
        raise ValueError(f"Incomplete word glosses in {path}")
    return values


def load_morphology(path):
    words = {}
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.startswith("("):
            continue
        location, _form, tag, features = line.split("\t")
        match = LOCATION.fullmatch(location)
        if not match:
            raise ValueError(f"Bad corpus location {location}")
        surah, ayah, word, _segment = map(int, match.groups())
        key = (surah, ayah, word)
        record = words.setdefault(key, {"pos": None, "root": None, "lemma": None,
                                        "form": None, "aspect": None, "person": None,
                                        "voice": None, "mood": None, "segments": []})
        tokens = features.split("|")
        record["segments"].append({"tag": tag, "features": features})
        if "STEM" not in tokens:
            continue
        record["pos"] = tag
        for token in tokens:
            if token.startswith("ROOT:"):
                record["root"] = token[5:]
            elif token.startswith("LEM:"):
                record["lemma"] = token[4:]
            elif token.startswith("(") and token.endswith(")"):
                record["form"] = token[1:-1]
            elif token in ("PERF", "IMPF", "IMPV"):
                record["aspect"] = token
            elif re.fullmatch(r"[123][MF]?[SDP]", token):
                record["person"] = token
            elif token in ("ACT", "PASS"):
                record["voice"] = token
            elif token in ("IND", "SUBJ", "JUS"):
                record["mood"] = token
    if len(words) != 77429:
        raise ValueError(f"Expected 77429 corpus words; found {len(words)}")
    return words


def is_standalone_mark(token):
    return all("\u06d6" <= char <= "\u06ed" for char in token)


def tokenize_ayah(key, text, expected_count):
    tokens = text.split(" ")
    opening = ""
    surah, ayah = map(int, key.split(":"))
    if ayah == 1 and surah not in (1, 9) and len(tokens) >= 5 and tokens[1].startswith("ٱللَّه"):
        opening = " ".join(tokens[:4])
        tokens = tokens[4:]
    visible_text = " ".join(tokens)
    parts = []
    words = []
    index = 0
    while index < len(tokens):
        token = tokens[index]
        if is_standalone_mark(token):
            parts.append({"text": token, "word": None})
            index += 1
            continue
        pair = JOINED_IN_OLD_CORPUS.get(key)
        if pair and token == pair[0] and index + 1 < len(tokens) and tokens[index + 1] == pair[1]:
            token += " " + tokens[index + 1]
            index += 1
        words.append(token)
        parts.append({"text": token, "word": len(words)})
        index += 1
    if len(words) != expected_count:
        raise ValueError(f"Word alignment failed at {key}: Tanzil={len(words)} corpus={expected_count}")
    if " ".join(part["text"] for part in parts) != visible_text:
        raise ValueError(f"Arabic text reconstruction failed at {key}")
    return opening, visible_text, parts, words


def build_dataset(raw):
    arabic = load_lines(raw / "tanzil-uthmani-1.1.txt")
    english_ayah = load_lines(raw / "tanzil-en-sahih.txt")
    bengali_ayah = load_lines(raw / "tanzil-bn-bengali.txt")
    english_words = load_glosses(raw / "gtaf-words-en.db")
    bengali_words = load_glosses(raw / "gtaf-words-bn.db")
    morphology = load_morphology(raw / "quranic-corpus-morphology-0.4.txt")
    word_counts = defaultdict(int)
    for surah, ayah, position in morphology:
        word_counts[f"{surah}:{ayah}"] = max(word_counts[f"{surah}:{ayah}"], position)
    verses = []
    verb_index = defaultdict(list)
    global_position = 0
    for key, source_text in arabic.items():
        opening, text, parts, word_texts = tokenize_ayah(key, source_text, word_counts[key])
        surah, ayah = map(int, key.split(":"))
        words = []
        for position, surface in enumerate(word_texts, 1):
            annotation = morphology[(surah, ayah, position)]
            word = {"position": position, "arabic": surface,
                    "en": english_words[global_position], "bn": bengali_words[global_position],
                    **annotation}
            words.append(word)
            if word["pos"] == "V" and word["root"]:
                verb_index[word["root"]].append({
                    "key": key, "position": position, "arabic": surface,
                    "en": word["en"], "bn": word["bn"], "form": word["form"] or "I",
                    "aspect": word["aspect"], "person": word["person"],
                    "voice": word["voice"] or "ACT", "mood": word["mood"] or "IND"
                })
            global_position += 1
        verses.append({"key": key, "opening": opening, "text": text,
                       "parts": parts, "words": words,
                       "en": english_ayah[key], "bn": bengali_ayah[key]})
    if global_position != 77429:
        raise ValueError(f"Mapped {global_position} words, expected 77429")
    return verses, dict(verb_index)


def main():
    root = Path(__file__).resolve().parents[1]
    verses, verb_index = build_dataset(root / "data" / "raw")
    destination = root / "public" / "data"
    destination.mkdir(parents=True, exist_ok=True)
    chapters = ET.parse(root / "data" / "raw" / "tanzil-quran-data.xml")
    metadata = [{"number": int(s.attrib["index"]), "arabic": s.attrib["name"],
                 "english": s.attrib["tname"], "meaning": s.attrib["ename"],
                 "ayahs": int(s.attrib["ayas"])}
                for s in chapters.findall("./suras/sura")]
    if len(metadata) != 114:
        raise ValueError("Tanzil surah metadata is incomplete")
    (destination / "chapters.json").write_text(json.dumps(metadata, ensure_ascii=False, separators=(",", ":")))
    by_chapter = defaultdict(list)
    for verse in verses:
        by_chapter[int(verse["key"].split(":")[0])].append(verse)
    for number, chapter_verses in by_chapter.items():
        (destination / f"chapter-{number}.json").write_text(
            json.dumps(chapter_verses, ensure_ascii=False, separators=(",", ":")))
    (destination / "verbs.json").write_text(json.dumps(verb_index, ensure_ascii=False, separators=(",", ":")))
    print(f"Built {len(verses)} ayahs, {sum(len(v['words']) for v in verses)} words, "
          f"{sum(len(v) for v in verb_index.values())} verb occurrences")


if __name__ == "__main__":
    main()
