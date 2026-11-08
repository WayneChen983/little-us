# Little Us website: design

The marketing site for Little Us (https://little-us.app). zh-Hant first, English second. Static files on
GitHub Pages; no framework, no build step, no trackers.

The app's design rules bind the site too (couple_chat repo: `design/DESIGN_SYSTEM.md`, `VISUAL_RULES.md`,
`ART_DIRECTION.md`, `CHARACTER_BIBLE.md`). Where a "premium web" habit fights them, the rules win.

## Concept: 一本會動的繪本 (a picture book that moves)

Premium here means *restraint and craft*, not size or gloss. Think of a beautifully bound picture book on a
desk: calm cream paper, small careful type, lots of air, and big, approved drawings that come alive when you
touch them. Every page has one thing to look at and one thing to do.

The story the site tells, top to bottom: **two of you, apart → you meet → one day together → you send a hug →
you count your days → everything else, as a table of contents → goodnight.**

What makes it feel expensive:

- **Rhythm, not volume.** Type never leaves the app's six sizes. Hierarchy comes from space (48 and 96 between
  blocks), weight of colour (ink vs soft ink), and the drawings' scale.
- **Interaction that means something.** Every animation is something the app really does (critters hop, cut
  between drawings, the hug sticker plays three times then rests, the days count) — no decoration with no job.
- **The real thing.** Real App Store art, real stickers, real critter drawings. Nothing drawn in code.
- **Finish.** Focus rings, reduced motion, dark mode, both languages, 375 px to 1440+, no layout shift.

## Web extension (owner approved, option A, 2026-11-08)

The app's design system still governs the site: its colours only, no emoji as icons or art, no characters or
illustrations drawn in code, approved art and real app screenshots only, one primary action per section,
accessibility and Reduce Motion. **For the website only** (never the apps) these are also allowed:

- **Display type far beyond 44.** The wordmark fills the hero (≈ 300 px Jua on desktop, ≈ 25 vw on phones);
  the hero line and chapter titles run 40–72 px (fluid with `clamp()`); the days counter 96 px.
- **Editorial layouts**: asymmetric compositions, art at large scale, type and art layered (critters sit on and
  peek from behind the letters).
- **Cinematic scroll motion**: pinned sections, a phone that turns in 3D and pushes in, layered parallax,
  scroll-driven scene changes (the page turns to night). Transforms and opacity only; 60 fps; off under
  Reduce Motion.
- **Depth**: soft shadows beyond paper/float and subtle gradients where they serve the art (the phone's glass
  edge, the night sky). Never glassmorphism or blur, never a gradient to make a flat box look designed.

Web type scale on top of the app's six: `hero-mark` clamp(96px, 24vw, 320px) Jua · `hero` clamp(32px, 4.4vw,
64px) · `chapter` clamp(32px, 4vw, 56px) · `count` clamp(64px, 9vw, 112px). Body sizes stay the app's.

## Tokens (from DESIGN_SYSTEM.md; nothing new)

Colour: `paper #FFF8EE / #221B19`, `paperDeep #FAEDDD / #2B2220`, `card #FFFDF8 / #2F2623`, `ink #4A3A33 /
#F6EBE2`, `softInk #76635A / #BDA99D`, `line #EFDFCD / #40332E`, `cocoa #4A3A33`, `rose #F28B9D` (fill only),
`roseEnd #F49AA4`, `roseInk #AB4C60 / #F28B9D` (accent as text), `onRose = cocoa`, pastels `blush #F7B3BD`,
`peach #FFCFAE`, `butter #FFE39B`, `sage #C5DDB9`, `leaf #8CBB82`, `sky #BFE0F4`, `lavender #DCCDF4`.

- Text on rose is cocoa (never white). Accent text is roseInk. Text on pastels is cocoa.
- The only gradient on the page is the primary button (rose → roseEnd). Photos and the App Store art carry
  their own. No blur, no glass, no glow.
- Shadows: `paper` and `float` only. Radii: 10 / 20 / 28 / capsule (buttons only).
- Spacing: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 48. Page edges 20; between big chapters two 48s stacked (96).

### Type scale

The app's six sizes, the same on every screen width (they don't grow on desktop; the art does):

| Token | Size / line | Web use |
|---|---|---|
| display | 44 / 1.15 | One per page: the hero line, the days counter |
| title | 26 / 1.35 | Chapter titles (h2) |
| headline | 18 / 1.5 | Story step titles, card titles, FAQ questions |
| body | 16 / 1.75 | Running text, buttons |
| subhead | 14 / 1.65 | Supporting lines, nav |
| caption | 12 / 1.5 | Eyebrows (time of day, chapter numbers), footnotes |

Faces: **jf open huninn 粉圓** (the app's default "Cute" face) for everything, subset to the characters the site
uses (`tools/subset-font.py`). The wordmark "Little Us" is set in **Jua**, as on the launch screen ("Little" in
ink, "Us" in the accent — roseInk on the web for contrast), subset to a handful of glyphs.

## Motion language

From ART_DIRECTION.md "Motion" and DESIGN_SYSTEM.md "Motion":

- **Drawings cut, never crossfade.** A pose change is a cut hidden by a squash-and-pop (scale 1.06/.92 → 1).
- **Idle**: breathe 1.00 ↔ 1.02 over 3.6 s. **Hop**: 0.95 s, crouch → 15 % arc → squash → settle.
  **Lean**: a curious tilt of at most ±4° toward the pointer.
- **Press**: primary 0.97, soft 0.95, things 0.96; down at once, back on a 0.25 s spring without bounce.
- **Reveal**: content rises 16 px and fades in once, 600 ms, `cubic-bezier(.2,.7,.2,1)`. Transforms and
  opacity only (no layout, 60 fps).
- **Screens change by wiping** (a clip from the bottom, 700 ms), like turning a page; never a crossfade of two
  drawings.
- **Language**: a 250 ms fade of the page (View Transitions) when supported.
- **Pages**: cross-document view transition, 250 ms fade.
- **Reduce Motion**: no idle, no reveal, no scroll-linked motion; the hero shows the hug; stickers show their
  still; wipes become cuts.

## Signature interactions

1. **相遇 (hero)** — the bunny and the bear start apart, waving. As you scroll the first half screen they come
   together; at the middle they cut to their hug drawings with a pop, and the two-hearts spot pops above. They
   lean toward your pointer; a tap makes one hop.
2. **一天的你們 (pinned story)** — a pinned App Store page (phone, washi tape, the couple) and six moments of a
   day: 08:00 → 12:30 → 18:00 → 21:00 → 23:30 → "years later". Each step wipes to its screen and tints the
   panel with that moment's pastel. A small time-of-day rail shows where you are; dots jump to a step.
3. **傳一個抱抱 (live sticker demo)** — choose your critter (their real mood faces) and a sticker (hug, love,
   miss you, goodnight), press Send: a bubble arrives in a mini chat and the real animated sticker plays three
   times, then rests on its last frame, exactly like the app. The partner answers.
4. **在一起第幾天 (counter)** — pick your date; the days roll up like an odometer, with the next milestone
   (100, 365, 500, 1000 …). Kept only in this browser.
5. **Finish touches** — magnetic store buttons (fine pointers only), a smooth language switch, page transitions,
   a header that turns to paper once you scroll, store buttons that put your platform first.
6. **小工具牆 (widget wall)** — built but `hidden`: the widget screenshots are the MVP set still being built.
   Turn it on when those widgets ship (search `ADD WHEN SHIPPED`).

## Storyboard (home)

| # | Section | What you see | Does |
|---|---|---|---|
| 0 | Header | Wordmark, chapters, 中文/EN | Turns to paper with a hairline once scrolled |
| 1 | Hero 相遇 | Eyebrow, display line, lede, App Store (primary) + Google Play (soft), the meadow-less stage: plant, bunny, hearts, bear, plant on one ground line | Critters meet on scroll |
| 2 | Promises | Three spot stickers in a row: only you two · no ads, no selling data · iPhone ↔ Android | — |
| 3 | 一天的你們 | Pinned App Store art on a tinted panel; six steps of text | Wipes per step |
| 4 | 傳一個抱抱 | Picker + mini chat card | Plays the sticker |
| 5 | 在一起第幾天 | Date field, odometer, next milestone, two cheering critters | Counts |
| 6 | 目錄 Contents | Everything else as a picture-book table of contents: chapter number, spot, title, dotted leader, one line | — |
| 7 | (hidden) Widget wall | | |
| 8 | Help | The FAQ (unchanged answers) | Accordions |
| 9 | Goodnight | Sleeping bunny, "今晚，從一聲晚安開始", store buttons (primary) | — |
| 10 | Contact + footer | Mailbox card, cheering critters on the footer line | — |

Other pages share the header, footer, type and tokens: `/couple-app/` (SEO landing, zh only; its meta,
Open Graph and JSON-LD unchanged) reuses the hero and the story; `/r/` (referral) keeps its script; the legal
pages (`/privacy/`, `/terms/`, `/delete-account/`) keep their text word for word and are only restyled.

## Assets

- `assets/art/` — the app's approved critter, plant and spot drawings (unchanged).
- `assets/screens/` — real app screens from the demo build (`tools/capture-screens.sh` → `tools/build-assets.py
  --screens`), 360 and 720 wide, zh/en, light/dark.
- `assets/stickers/` — the app's animated stickers (`ios/CoupleChat/Resources/Stickers`), the still frame the
  app shows under Reduce Motion, and the last frame it rests on. Loaded only when the demo is near.
- `assets/faces/` — the critters' mood faces (`ios/Shared/Art`), for the picker.
- `assets/fonts/` — huninn in two subsets (`tools/subset-font.py`): the first screens' characters, preloaded,
  and the rest (`rest.css`, added by site.js after `load`), plus the Jua wordmark subset (2 KB).

## Budgets

Lighthouse mobile ≥ 95 performance / accessibility / SEO. Initial JS < 60 KB gzipped (site.js + home.js ≈ 7 KB).
Every image has width and height. Story pictures carry `data-src` until their chapter is near; stickers load
only when the demo is near or you press Send. No third-party requests, cookies or analytics at all.

## Review log (art direction passes on the screenshots)

1. Hero: padding on the hero dropped the 20 px page edge on phones → fixed; the Chinese line now breaks
   「只屬於你們 / 兩個人的小天地」 so it never orphans one character on a phone.
2. Hero: the hug happened only as the hero left the screen → they now meet a third of the way down, and the
   two-hearts sit between their heads instead of under the top bar.
3. Story on phones: the caption under the pinned screen described the *next* screen → trigger line moved to
   84 % and steps shortened to 30 svh, so the picture and the words always match.
4. Story: dimmed steps used opacity and failed contrast → they use softInk (AA) and turn ink when current.
5. Hug demo: the title sat above the whole grid and the phone ran off a 900 px screen → title in the left
   column, phone 580 tall; nested spans picked up the chip style → `.choice > span`; the chat opens with a
   morning message and Amy's sticker (facing the other way, as the app draws theirs).
6. Performance: story pictures (both languages) loaded with the first screen → deferred; header icon 23 KB PNG
   → 1 KB WebP; font split into first-screen and later halves.

## Round 2 (2026-11-08)

- **Hero**: the wordmark "Little Us" in Jua fills the width (mixed case: it is the logo's own letterforms and
  reads warmer; `?wm=upper` shows LITTLE US for comparison). Letters rise in one by one, the bunny lands on
  the "e", the bear peeks out of the "U" (it sits behind the letter). The mark drifts at 0.28× scroll.
- **一天的你們**: real screens captured from the demo build (`tools/capture-screens.sh`, simulator
  3A87F5FB only), zh/en × light/dark, shown in a CSS phone (status bar redrawn as 9:41). The phone turns a
  little for each step and pushes in as the chapter arrives. Screens chosen to show only shipped features
  (no 小屋, no distance widget, no streaks, no shared board).
- **Wow: the page turns to night.** The last chapter is pinned for two screens: a peach dusk turns lavender,
  then night; the moon rises, stars come out, the bunny and bear walk in, hug, and cut to their sleeping
  drawings side by side; the header turns dark with it. Reduce Motion shows the night at once.
- **No old promo art anywhere**: the App Store promo crops are deleted; `shot-*.webp` and `share.png` are
  regenerated from fresh captures and the new hero. Critters were zoom-checked (no cheek tufts).
