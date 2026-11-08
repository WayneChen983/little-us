#!/bin/zsh
# Captures the app's real screens from the demo build on the one shared simulator (never create or boot another).
#   tools/capture-screens.sh <lang zh|en> <scheme light|dark> [screens...]   then   python3 tools/build-assets.py --screens <dir>
# Screens: 1 Us 08:00 · 2 chat · 3 date spinner · 10 Us scrolled to the daily question and note · 5 Us at night
# after a goodnight · 6 memories · 12 onboarding · 13 pairing. The status bar is cropped off by build-assets.py
# (the site's phone frame draws its own 9:41). Afterwards: `xcrun simctl ui <udid> appearance dark` if that was the setting.
U=3A87F5FB-70FA-44AA-9DCA-010A5F983C2A
S=${CAPTURE_DIR:-/tmp/little-us-screens}; mkdir -p $S
L=$1; C=$2; shift 2
if [[ $L == zh ]]; then LA=(-AppleLanguages "(zh-Hant)" -AppleLocale zh_TW); else LA=(-AppleLanguages "(en)" -AppleLocale en_US); fi
xcrun simctl ui $U appearance $C
for n in "$@"; do
  case $n in
    1) A=(-tab us -clock 08:00); W=6;;
    2) A=(-tab chat); W=6;;
    3) A=(-open spinner -spin now); W=10;;
    4) A=(-tab us -clock 21:00 -scroll 620); W=7;;
    5) A=(-tab us -sky night -goodnight partner -clock 23:30); W=7;;
    6) A=(-tab memories); W=7;;
    7) A=(-tab together); W=6;;
    8) A=(-open drawGuess); W=8;;
    9) A=(-open lists); W=7;;
    10) A=(-tab us -clock 21:00 -scroll 905); W=7;;
    12) A=(-demoStage onboarding); W=7;;
    13) A=(-demoStage unpaired); W=7;;
    11) A=(-tab us -clock 21:00 -scroll 1600); W=7;;
  esac
  if [[ $n == 1[23] ]]; then ST=(); else ST=(-demoStage paired); fi
  xcrun simctl launch --terminate-running-process $U tw.tw466376.couplechat $ST -skipPrompts yes $A $LA >/dev/null
  sleep $W
  xcrun simctl io $U screenshot $S/$L-$C-$n.png >/dev/null 2>&1
done
