// Renders assets/share.png (1200×630) from the live hero. Needs a local server on :8765 and playwright-core.
//   node tools/og-image.mjs assets/share.png
import { chromium } from "playwright-core";
const b = await chromium.launch({ executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" });
const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1, colorScheme: "light", reducedMotion: "reduce" });
await p.goto("http://localhost:8765/#zh", { waitUntil: "networkidle" });
await p.addStyleTag({ content: `.top,.lede,.actions,.platforms,.promises-row{display:none!important} .home .hero{padding-top:92px} main > :not(.hero), footer{display:none!important} .home .hero{min-height:630px} .mark{--fs:250px} .home .hero h1{font-size:48px}` });
await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(600);
await p.screenshot({ path: process.argv[2] });
await b.close();
