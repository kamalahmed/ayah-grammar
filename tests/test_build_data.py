import sys
import unittest
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / "scripts"))
from build_data import build_dataset


class DatasetTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.verses, cls.verb_index = build_dataset(Path(__file__).resolve().parents[1] / "data" / "raw")

    def test_every_source_word_aligns(self):
        self.assertEqual(len(self.verses), 6236)
        self.assertEqual(sum(len(v["words"]) for v in self.verses), 77429)
        self.assertTrue(all(w["en"] and w["bn"] for v in self.verses for w in v["words"]))

    def test_newer_tanzil_split_stays_visible_but_maps_to_one_word(self):
        verse = next(v for v in self.verses if v["key"] == "2:181")
        self.assertIn("بَعْدَ مَا", [w["arabic"] for w in verse["words"]])
        self.assertIn("بَعْدَ مَا", verse["text"])

    def test_verb_annotation_comes_from_corpus(self):
        verse = next(v for v in self.verses if v["key"] == "2:30")
        verb = verse["words"][1]
        self.assertEqual(verb["pos"], "V")
        self.assertEqual(verb["root"], "qwl")
        self.assertEqual(verb["aspect"], "PERF")
        self.assertEqual(verb["person"], "3MS")
        self.assertIn("qwl", self.verb_index)

    def test_opening_basmalah_is_not_assigned_word_meanings(self):
        verse = next(v for v in self.verses if v["key"] == "2:1")
        self.assertTrue(verse["opening"])
        self.assertEqual(len(verse["words"]), 1)


if __name__ == "__main__":
    unittest.main()
