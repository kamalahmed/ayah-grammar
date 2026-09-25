"""Paths for the local, reproducible book extraction workflow."""
import os
from pathlib import Path
SCRIPTS = Path(__file__).resolve().parent
APP = Path(os.environ.get('QURAN_APP_DIR', SCRIPTS.parents[1])).resolve()
BOOK = Path(os.environ.get('QURAN_BOOK_DIR', APP / 'public/books')).resolve()
WORK = Path(os.environ.get('QURAN_EXTRACT_WORK', APP / 'data/book-extraction-work')).resolve()
WORK.mkdir(parents=True, exist_ok=True)
TESSDATA = Path(os.environ.get('QURAN_TESSDATA_DIR', SCRIPTS / 'tessdata')).resolve()

def book_pdf(level):
    original = BOOK / f'Quran words - level{level}.pdf'
    return original if original.exists() else BOOK / f'level-{level}.pdf'
