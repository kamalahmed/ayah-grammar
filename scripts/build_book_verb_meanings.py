"""Import the version 2 local-book export.

Usage: python3 scripts/build_book_verb_meanings.py [path/to/quran-verbs-500.json]
"""
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def compact(verb):
    result = {k: v for k, v in verb.items() if k not in ('conjugations', 'alternate_readings')}
    result['conjugations'] = [{k: v for k, v in cell.items() if k not in ('ar_bbox', 'bn_regions')} for cell in verb['conjugations']]
    if verb.get('alternate_readings'):
        result['alternate_readings'] = [compact(v) for v in verb['alternate_readings']]
    return result


def build(source):
    data = json.loads(source.read_text())
    if data.get('schema_version') != 2:
        raise ValueError('Expected the version 2 local-book export')
    verbs = data['verbs']
    if [v['entry_number'] for v in verbs] != list(range(1, 501)):
        raise ValueError('Expected exactly the numbered entries 1 through 500 in order')
    for v in verbs:
        for reading in [v] + v.get('alternate_readings', []):
            slots = set()
            for c in reading['conjugations']:
                slot = (c['aspect'], c['person'])
                if c['aspect'] not in ('PERF', 'IMPF', 'IMPV') or c['person'] not in ('3MS', '3MP', '2MS', '2MP', '1S', '1P') or slot in slots:
                    raise ValueError(f'Invalid or duplicate slot in entry {v["entry_number"]}: {slot}')
                if not c['ar'] or not c['bn'] or not c['source_page']:
                    raise ValueError(f'Missing content or provenance in entry {v["entry_number"]}')
                slots.add(slot)
    output = ROOT / 'src/bookVerbs.json'
    output.write_text(json.dumps([compact(v) for v in verbs], ensure_ascii=False, separators=(',', ':')) + '\n')
    print(f'Imported {len(verbs)} numbered entries into {output.relative_to(ROOT)}')


if __name__ == '__main__':
    source = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / 'data/books/quran-verbs-500.json'
    build(source)
