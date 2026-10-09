"""Subset the Arabic heading font (Amiri) for /ar/.

Keeps the whole basic Arabic alphabet, diacritics, digits and punctuation
(so future copy edits stay covered) plus every character used in
src/i18n/ar.mjs, with all OpenType layout features for correct letter joining.

Requires: pip install fonttools brotli   (run: python3 scripts/fonts.py)
"""
import os

from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "node_modules/@fontsource/amiri/files/amiri-arabic-400-normal.woff2")
OUT = os.path.join(ROOT, "src/static/assets/fonts/amiri-arabic-400.woff2")

base = "".join(chr(c) for c in list(range(0x0621, 0x0653)) + list(range(0x0660, 0x066A)) + [0x060C, 0x061B, 0x061F, 0x0640, 0x066A, 0x066B, 0x066C, 0x200C, 0x200D])
with open(os.path.join(ROOT, "src/i18n/ar.mjs"), encoding="utf-8") as f:
    used = {ch for ch in f.read() if ord(ch) >= 0x0600}
text = "".join(sorted(set(base) | used)) + " .,:;!?()-–·0123456789"

options = subset.Options()
options.flavor = "woff2"
options.layout_features = ["*"]
options.name_IDs = ["*"]
options.notdef_outline = True
font = subset.load_font(SRC, options)
subsetter = subset.Subsetter(options)
subsetter.populate(text=text)
subsetter.subset(font)
subset.save_font(font, OUT, options)
print("amiri subset ->", OUT, os.path.getsize(OUT), "bytes")
