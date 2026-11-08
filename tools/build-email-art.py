#!/usr/bin/env python3
"""Pictures for the auth emails (assets/email/). Code never draws art: this only scales and lays out the app's
approved critters and spots (couple_chat ios/CoupleChat/Resources) side by side, like reset.png.

    python3 tools/build-email-art.py [path to the couple_chat repo]   (default: ../couple_chat)

- <name>.png  : two critters with a spot between them (the code / link emails), 640 wide (height to fit), shown at 280.
- spot-<name>.png : one spot (the short notices), 192 square, shown at 96.
- app-icon.png : the app icon (AppIcon.appiconset), 96 square, shown at 48 in the header.
Transparent PNGs, quantized to stay small. Needs Pillow.
"""
import os, sys
from PIL import Image

SITE = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
APP = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else os.path.join(SITE, "..", "couple_chat"))
RES = os.path.join(APP, "ios/CoupleChat/Resources")
OUT = os.path.join(SITE, "assets", "email")

HEROES = {  # name: (left critter, spot, right critter)
    "confirm": ("critter-bear-wave", "spot-loveLetter", "critter-pup-wave"),
    "code": ("critter-bunny-wave", "spot-padlock", "critter-bear-wave"),
    "email-change": ("critter-cat-wave", "spot-mailbox", "critter-pup-wave"),
    "invite": ("critter-bunny-hug", "spot-twoHearts", "critter-bear-hug"),
}
SPOTS = {"password": "spot-padlock", "email": "spot-loveLetter", "linked": "spot-rings", "unlinked": "spot-key"}


def load(name):
    folder = "Critters" if name.startswith("critter") else "Spots"
    im = Image.open(os.path.join(RES, folder, name + ".webp")).convert("RGBA")
    return im.crop(im.getbbox())


def fit(im, width, height):
    scale = min(width / im.width, height / im.height)
    return im.resize((round(im.width * scale), round(im.height * scale)), Image.LANCZOS)


def save(im, name):
    small = im.quantize(colors=256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)
    small.save(os.path.join(OUT, name), optimize=True)


def hero(left, spot, right):
    W, H, edge = 640, 344, 8
    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    a, s, b = fit(load(left), 240, 316), fit(load(spot), 132, 132), fit(load(right), 240, 316)
    bottom = H - edge
    canvas.alpha_composite(a, (edge, bottom - a.height))
    canvas.alpha_composite(b, (W - edge - b.width, bottom - b.height))
    canvas.alpha_composite(s, ((W - s.width) // 2, round(H * 0.56 - s.height / 2)))
    top = canvas.getbbox()[1]
    return canvas.crop((0, max(0, top - edge), W, H))  # no empty band above the art


def spot_only(name):
    im = load(name)
    im.thumbnail((176, 176), Image.LANCZOS)
    canvas = Image.new("RGBA", (192, 192), (0, 0, 0, 0))
    canvas.alpha_composite(im, ((192 - im.width) // 2, (192 - im.height) // 2))
    return canvas


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for name, parts in HEROES.items():
        save(hero(*parts), name + ".png")
    for name, spot in SPOTS.items():
        save(spot_only(spot), f"spot-{name}.png")
    icon = Image.open(os.path.join(RES, "Assets.xcassets/AppIcon.appiconset/AppIcon.png")).convert("RGB")
    icon.resize((96, 96), Image.LANCZOS).save(os.path.join(OUT, "app-icon.png"), optimize=True)
