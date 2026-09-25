"""Build root-specific conjugations from Corpus v0.4 and Qutrub 1.2.4.1.

The Corpus identifies a root, form and lemma for each verb stem. Qutrub's
dictionary supplies the lexical Form I perfect and imperfect vowel. For
derived forms, only an attested third-person singular perfect stem (or a
lemma corroborated by an imperfect stem) is used as a citation form.
Ambiguous or uncorroborated candidates are omitted.
"""

import json
import re
from collections import Counter, defaultdict
from pathlib import Path

from libqutrub.conjugator import conjugate
from libqutrub.triverbtable import TriVerbTable


ROOT = Path(__file__).resolve().parents[1]
BUCKWALTER = {
    "'": "ء", "|": "آ", ">": "أ", "<": "إ", "&": "ؤ", "}": "ئ", "A": "ا",
    "b": "ب", "p": "ة", "t": "ت", "v": "ث", "j": "ج", "H": "ح", "x": "خ",
    "d": "د", "*": "ذ", "r": "ر", "z": "ز", "s": "س", "$": "ش", "S": "ص",
    "D": "ض", "T": "ط", "Z": "ظ", "E": "ع", "g": "غ", "f": "ف", "q": "ق",
    "k": "ك", "l": "ل", "m": "م", "n": "ن", "h": "ه", "w": "و", "Y": "ى",
    "y": "ي", "{": "ٱ", "a": "َ", "i": "ِ", "u": "ُ", "o": "ْ",
    "~": "ّ", "`": "ٰ", "[": "إ", "^": "ٓ", "#": "ۜ",
}
PERSONS = {
    "1S": "أنا", "1P": "نحن", "2MS": "أنت", "2FS": "أنتِ",
    "2MD": "أنتما", "2FD": "أنتما مؤ", "2MP": "أنتم", "2FP": "أنتن",
    "3MS": "هو", "3FS": "هي", "3MD": "هما", "3FD": "هما مؤ",
    "3MP": "هم", "3FP": "هن",
}
DERIVED_PATTERNS = {
    "II": "فَعَّلَ", "III": "فَاعَلَ", "IV": "أَفْعَلَ", "V": "تَفَعَّلَ",
    "VI": "تَفَاعَلَ", "VII": "اِنْفَعَلَ", "VIII": "اِفْتَعَلَ",
    "IX": "اِفْعَلَّ", "X": "اِسْتَفْعَلَ",
}


def arabic(value):
    return "".join(BUCKWALTER.get(char, char) for char in value)


def comparable(value):
    return (value.replace("ءَا", "آ").replace("آ", "ا").replace("ى", "ي").replace("ٱ", "ا").replace("ٰ", "")
            .replace("ٓ", "").replace("ۜ", "").replace("ْ", "")
            .replace("اِ", "ا")
            .replace("أ", "ء").replace("إ", "ء").replace("ؤ", "ء").replace("ئ", "ء"))


def corpus_verbs():
    records = defaultdict(lambda: {"lemmas": Counter(), "perfect": Counter(), "imperfect": Counter(), "attested": Counter()})
    path = ROOT / "data/raw/quranic-corpus-morphology-0.4.txt"
    for line in path.open(encoding="utf-8-sig"):
        parts = line.rstrip().split("\t")
        if len(parts) != 4 or parts[2] != "V":
            continue
        stem, features = parts[1], parts[3]
        root = re.search(r"(?:^|\|)ROOT:([^|]+)", features)
        lemma = re.search(r"(?:^|\|)LEM:([^|]+)", features)
        if not root or not lemma:
            continue
        form = re.search(r"\|\(([^)]+)\)", features)
        item = records[(root.group(1), form.group(1) if form else "I")]
        item["lemmas"][arabic(lemma.group(1))] += 1
        person = next((code for code in PERSONS if f"|{code}" in features), None)
        aspect = next((code for code in ("PERF", "IMPF", "IMPV") if f"|{code}" in features), None)
        if "|PASS" not in features and person and aspect:
            if aspect != "IMPF" or "MOOD:SUBJ" not in features and "MOOD:JUS" not in features:
                item["attested"][(aspect, person, arabic(stem))] += 1
            if person == "3MS":
                if aspect == "PERF":
                    item["perfect"][arabic(stem)] += 1
                elif aspect == "IMPF" and "MOOD:SUBJ" not in features and "MOOD:JUS" not in features:
                    item["imperfect"][arabic(stem)] += 1
    return records


def conjugation(verb, vowel):
    try:
        verb = verb.replace("ءَا", "آ").replace("ٱ", "اِ").replace("ٰ", "")
        return conjugate(verb, vowel, alltense=False, past=True, future=True,
                         passive=True, imperative=True, transitive=True, display_format="DICT")
    except (TypeError, ValueError, KeyError):
        return None


def derived_candidates(root, form):
    pattern = DERIVED_PATTERNS.get(form)
    radicals = arabic(root)
    if not pattern or len(radicals) != 3:
        return []
    value = "".join(dict(zip("فعل", radicals)).get(char, char) for char in pattern)
    candidates = {value}
    if radicals[-1] in "وي":
        candidates.add(value.replace(radicals[-1] + "َ", "ى" + "َ"))
        candidates.add(value.replace(radicals[-1] + "َ", "ى"))
    if radicals[1] in "وي":
        candidates.add(value.replace("ْ" + radicals[1] + "َ", "َا"))
    return [(candidate, "فتحة") for candidate in candidates]


def attested_score(generated, evidence):
    columns = {"PERF": "الماضي المعلوم", "IMPF": "المضارع المعلوم", "IMPV": "الأمر"}
    score = 0
    for (aspect, person, value), count in evidence["attested"].items():
        generated_value = generated[columns[aspect]][PERSONS[person]]
        if generated_value and comparable(generated_value) == comparable(value):
            score += count * 10
    return score


def select_candidate(root, form, evidence, lexicon):
    if form == "I":
        candidates = [(entry["verb"], entry["haraka"]) for entry in lexicon.get(arabic(root), [])]
    else:
        candidates = [(verb, "فتحة") for verb in evidence["perfect"]]
        candidates += [(verb, "فتحة") for verb in evidence["lemmas"]]
        candidates += derived_candidates(root, form)
    unique = {}
    for verb, vowel in candidates:
        generated = conjugation(verb, vowel)
        if not generated:
            continue
        past = generated["الماضي المعلوم"]["هو"]
        present = generated["المضارع المعلوم"]["هو"]
        score = attested_score(generated, evidence)
        score += sum(n for v, n in evidence["lemmas"].items() if comparable(v) == comparable(past))
        unique[(past, present)] = (score, generated)
    if not unique:
        return None
    ordered = sorted(unique.values(), key=lambda entry: entry[0], reverse=True)
    if len(ordered) > 1 and ordered[0][0] == ordered[1][0]:
        return None
    if ordered[0][0] == 0:
        return None
    return ordered[0][1]


def main():
    lexicon = defaultdict(list)
    for entry in TriVerbTable.values():
        lexicon[entry["root"]].append(entry)
    output = {}
    for (root, form), evidence in corpus_verbs().items():
        generated = select_candidate(root, form, evidence, lexicon)
        if not generated:
            continue
        output.setdefault(root, {})[form] = {
            voice: {
                person: {
                    "perfect": generated["الماضي المعلوم" if voice == "ACT" else "الماضي المجهول"][pronoun],
                    "imperfect": generated["المضارع المعلوم" if voice == "ACT" else "المضارع المجهول"][pronoun],
                    "imperative": generated["الأمر"][pronoun] or None if voice == "ACT" else None,
                }
                for person, pronoun in PERSONS.items()
            }
            for voice in ("ACT", "PASS")
        }
    path = ROOT / "src/selectedParadigms.json"
    path.write_text(json.dumps(output, ensure_ascii=False, separators=(",", ":")) + "\n")
    print(f"Wrote {sum(len(forms) for forms in output.values())} root/form paradigms to {path}")


if __name__ == "__main__":
    main()
