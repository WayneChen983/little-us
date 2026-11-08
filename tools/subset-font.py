#!/usr/bin/env python3
"""Cuts the app's fonts down to the characters the site uses (SIL OFL 1.1 allows a modified copy under a new name).

    python3 tools/subset-font.py [path to the couple_chat repo]   (default: ../couple_chat)

- assets/fonts/little-us-rounded.woff2: jf open huninn 2.1 with the characters of every page's first screen (up to
  FOLD, plus a little after it) and printable ASCII: small, preloaded, so the first screen never waits.
- assets/fonts/little-us-rounded-2.woff2: every other character in the site's HTML and JS.
  Both are one family. site.css holds the first face (between the fonts:start/end markers); the second is in
  assets/fonts/rest.css, which site.js adds once the page has loaded, so it never holds up the first screen.
  Run again after adding text.
- assets/fonts/little-us-wordmark.woff2: Jua, only "Little Us".
Needs fonttools and brotli (pip install fonttools brotli). Both copies are renamed, as the OFL asks of a
modified font with Reserved Font Names ("open huninn", "huninn").
"""
import glob, os, sys
from fontTools import subset as ftsubset
from fontTools.ttLib import TTFont

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
APP = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(SITE, "..", "couple_chat"))
FONTS = os.path.join(APP, "ios/CoupleChat/Resources/Fonts")

chars = set(chr(c) for c in range(0x20, 0x7F))
chars |= set("，。、；：？！「」『』（）《》〈〉…—–‧·・→←↔‘’“”×÷％＋０１２３４５６７８９ ")
FOLD = ['class="stage"', "<article", 'class="card how"']
everything, first = set(chars), set(chars)
for path in glob.glob(os.path.join(SITE, "**/*.html"), recursive=True) + glob.glob(os.path.join(SITE, "assets/*.js")):
    if "/node_modules/" in path:
        continue
    with open(path, encoding="utf-8") as f:
        text = f.read()
    everything |= set(text)
    if path.endswith(".html"):
        body = text[text.index("<body"):]
        cut = min([body.index(m) for m in FOLD if m in body] or [len(body)])
        first |= set(body[:cut + 400])
everything = {c for c in everything if ord(c) >= 0x20}
first = {c for c in first if ord(c) >= 0x20}
rest = everything - first


def ranges(text):
    points = sorted(ord(c) for c in text)
    out, start, prev = [], None, None
    for p in points:
        if start is None:
            start = prev = p
        elif p == prev + 1:
            prev = p
        else:
            out.append((start, prev)); start = prev = p
    if start is not None:
        out.append((start, prev))
    return ", ".join(f"U+{a:X}" if a == b else f"U+{a:X}-{b:X}" for a, b in out)


def subset(src, out, text, family):
    options = ftsubset.Options()
    options.flavor = "woff2"
    options.layout_features = ["*"]
    options.name_IDs = [0, 1, 2, 3, 4, 5, 6, 13, 14, 16, 17]
    options.desubroutinize = True
    font = TTFont(src)
    sub = ftsubset.Subsetter(options)
    sub.populate(text="".join(sorted(text)))
    sub.subset(font)
    names = font["name"]
    for record in list(names.names):
        if record.nameID in (1, 4, 16):
            record.string = family
        elif record.nameID == 3:
            record.string = family.replace(" ", "") + "-Regular-subset"
        elif record.nameID == 6:
            record.string = family.replace(" ", "")
        elif record.nameID == 17:
            record.string = "Regular"
    font.flavor = "woff2"
    font.save(out)
    print(os.path.relpath(out, SITE), os.path.getsize(out) // 1024, "KB,", len(text), "characters")


HUNINN = os.path.join(FONTS, "jf-openhuninn-2.1.ttf")
subset(HUNINN, os.path.join(SITE, "assets/fonts/little-us-rounded.woff2"), first, "Little Us Rounded")
subset(HUNINN, os.path.join(SITE, "assets/fonts/little-us-rounded-2.woff2"), rest, "Little Us Rounded")
css_path = os.path.join(SITE, "assets/site.css")
with open(css_path, encoding="utf-8") as f:
    css = f.read()
faces = f"""/* fonts:start (written by tools/subset-font.py) */
@font-face {{
  /* jf open huninn (SIL OFL 1.1), cut down to the characters this site uses and renamed as the
     licence asks for a modified copy. See fonts/OFL.txt. Two files: the first screens, then the rest. */
  font-family: "Little Us Rounded";
  src: url("fonts/little-us-rounded.woff2") format("woff2");
  font-display: swap;
  unicode-range: {ranges(first)};
}}
/* fonts:end */"""
a, b = css.index("/* fonts:start"), css.index("/* fonts:end */") + len("/* fonts:end */")
with open(css_path, "w", encoding="utf-8") as f:
    f.write(css[:a] + faces + css[b:])
with open(os.path.join(SITE, "assets/fonts/rest.css"), "w", encoding="utf-8") as f:
    f.write(f"""/* The rest of the site's characters (tools/subset-font.py); site.js adds this after the page has loaded. */
@font-face {{
  font-family: "Little Us Rounded";
  src: url("little-us-rounded-2.woff2") format("woff2");
  font-display: swap;
  unicode-range: {ranges(rest)};
}}
""")
subset(os.path.join(FONTS, "Jua-Regular.ttf"), os.path.join(SITE, "assets/fonts/little-us-wordmark.woff2"), set("Little Us"), "Little Us Wordmark")
