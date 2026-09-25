"""Build teaching paradigms from libqutrub 1.2.4.1 (GPL).

Run with: python3 -m pip install libqutrub==1.2.4.1
          python3 scripts/build_reference_paradigms.py

These are conjugations of the placeholder roots فعل and فعلل, not Quran words.
"""

import json
from pathlib import Path

from libqutrub.conjugator import conjugate


PERSONS = {
    "1S": "أنا", "1P": "نحن", "2MS": "أنت", "2FS": "أنتِ",
    "2MD": "أنتما", "2FD": "أنتما مؤ", "2MP": "أنتم", "2FP": "أنتن",
    "3MS": "هو", "3FS": "هي", "3MD": "هما", "3FD": "هما مؤ",
    "3MP": "هم", "3FP": "هن",
}

PATTERNS = {
    "triliteral": {
        "I": "فَعَلَ", "II": "فَعَّلَ", "III": "فَاعَلَ", "IV": "أَفْعَلَ",
        "V": "تَفَعَّلَ", "VI": "تَفَاعَلَ", "VII": "اِنْفَعَلَ",
        "VIII": "اِفْتَعَلَ", "IX": "اِفْعَلَّ", "X": "اِسْتَفْعَلَ",
    },
    "quadriliteral": {"I": "فَعْلَلَ", "II": "تَفَعْلَلَ"},
}


def main():
    output = {}
    for family, patterns in PATTERNS.items():
        output[family] = {}
        for form, pattern in patterns.items():
            result = conjugate(pattern, "فتحة", alltense=False, past=True,
                               future=True, imperative=True, display_format="DICT")
            if not result:
                raise ValueError(f"Qutrub cannot conjugate {family} Form {form}")
            output[family][form] = {
                person: {
                    "perfect": result["الماضي المعلوم"][pronoun],
                    "imperfect": result["المضارع المعلوم"][pronoun],
                    "imperative": result["الأمر"][pronoun] or None,
                }
                for person, pronoun in PERSONS.items()
            }
    path = Path(__file__).resolve().parents[1] / "src" / "referenceParadigms.json"
    path.write_text(json.dumps(output, ensure_ascii=False, indent=2) + "\n")
    print(f"Wrote {path}")


if __name__ == "__main__":
    main()
