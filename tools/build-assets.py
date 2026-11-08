#!/usr/bin/env python3
"""Copies and prepares the app's approved art for the site. Code never draws art; this only crops,
resizes and picks frames from what the app already ships.

    python3 tools/build-assets.py [path to the couple_chat repo]   (default: ../couple_chat)

- assets/stickers/<kind>-<id>.webp : the animated sticker (ios/CoupleChat/Resources/Stickers), as shipped.
  <kind>-<id>-still.webp : the frame the app shows under Reduce Motion (LiveSticker.stillFraction).
  <kind>-<id>-end.webp   : the last frame, where the app rests after three plays.
- assets/faces/<kind>.webp : the happy mood face (ios/Shared/Art), for the critter picker.
- assets/widgets/... : widget screenshots (docs/mvp/screenshots/widgets) for the hidden widget wall.
- with --screens DIR (captures from tools/capture-screens.sh):
  assets/screens/<lang>-<scheme>-<n>-<w>.webp : real app screens for the story, status bar and the strip under
  the tab bar cropped off; assets/art/shot-<lang>-<n>-<name>.webp : the same, light, for /couple-app/'s JSON-LD.
Needs Pillow.
"""
import os, subprocess, sys
from PIL import Image

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
APP = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("-") else os.path.join(SITE, "..", "couple_chat"))
KINDS = ["cat", "bunny", "bear", "pup"]
STICKERS = {"hug": 0.7, "love": 0.7, "missyou": 0.25, "night": 0.7}  # id → stillFraction (LiveStickers.swift)


def out(*parts):
    path = os.path.join(SITE, "assets", *parts)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    return path


def frames(path):
    im = Image.open(path)
    durations = [int(x) for x in
                 [line.split()[6] for line in subprocess.check_output(["webpmux", "-info", path], text=True).splitlines()
                  if line.strip()[:1].isdigit() and ":" in line.split()[0]]]
    images = []
    for i in range(im.n_frames):
        im.seek(i)
        images.append(im.convert("RGBA").copy())
    return images, durations


def stickers():
    for kind in KINDS:
        for sid, fraction in STICKERS.items():
            src = os.path.join(APP, "ios/CoupleChat/Resources/Stickers", f"sticker-{kind}-{sid}.webp")
            with open(src, "rb") as f, open(out("stickers", f"{kind}-{sid}.webp"), "wb") as g:
                g.write(f.read())
            images, durations = frames(src)
            total = sum(durations)
            t, index = total * fraction, len(durations) - 1
            end = 0
            for i, d in enumerate(durations):
                end += d
                if end > t:
                    index = i
                    break
            images[index].save(out("stickers", f"{kind}-{sid}-still.webp"), quality=90, method=6)
            images[-1].save(out("stickers", f"{kind}-{sid}-end.webp"), quality=90, method=6)
            print(kind, sid, "ms", total)


MARK_POSES = {"bear": ["neutral", "blink", "wave", "happy", "hug"]}


def mark_poses():
    """The bear in the U: the app's own pose drawings (Android drawable-nodpi), all at one pixel scale."""
    src = os.path.join(APP, "android/app/src/main/res/drawable-nodpi")
    for kind, poses in MARK_POSES.items():
        for pose in poses:
            with open(os.path.join(src, f"critter_{kind}_{pose}.webp"), "rb") as f, open(out("mark", f"{kind}-{pose}.webp"), "wb") as g:
                g.write(f.read())


def faces():
    for kind in KINDS:
        im = Image.open(os.path.join(APP, "ios/Shared/Art", f"face-{kind}-happy.webp")).convert("RGBA")
        im.thumbnail((128, 128), Image.LANCZOS)
        im.save(out("faces", f"{kind}.webp"), quality=90, method=6)


def widgets():
    for lang, src in [("zh", "zh-Hant"), ("en", "en")]:
        im = Image.open(os.path.join(APP, "docs/mvp/screenshots/widgets/ios", f"home-{src}-light.png")).convert("RGB")
        w, h = im.size
        crop = im.crop((0, int(h * 0.095), w, int(h * 0.93)))
        crop.thumbnail((720, 2000), Image.LANCZOS)
        crop.save(out("widgets", f"home-{lang}.webp"), quality=82, method=6)


STEPS = ["1", "2", "3", "10", "5", "6"]  # capture ids, in story order
SHOTS = {"1-us": "1", "2-chat": "2", "3-onboarding": "12", "4-pairing": "13"}


def screens(src):
    def crop(path):
        im = Image.open(path).convert("RGB")
        w, h = im.size
        s = w / 390  # points → pixels
        return im.crop((0, round(54 * s), w, round(816 * s)))
    for lang in ["zh", "en"]:
        for scheme in ["light", "dark"]:
            for n, cap in enumerate(STEPS, 1):
                im = crop(os.path.join(src, f"{lang}-{scheme}-{cap}.png"))
                for width in (360, 720):
                    im.resize((width, round(im.height * width / im.width)), Image.LANCZOS).save(
                        out("screens", f"{lang}-{scheme}-{n}-{width}.webp"), quality=80, method=6)
        for name, cap in SHOTS.items():
            im = crop(os.path.join(src, f"{lang}-light-{cap}.png"))
            im.resize((540, round(im.height * 540 / im.width)), Image.LANCZOS).save(
                out("art", f"shot-{lang}-{name}.webp"), quality=82, method=6)


if __name__ == "__main__":
    if "--screens" in sys.argv:
        screens(sys.argv[sys.argv.index("--screens") + 1])
    else:
        stickers(); faces(); widgets(); mark_poses()
