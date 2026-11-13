// Regenerates docs/*.png. Run `npm run dev` in another terminal, then `npm run screenshots`.
// Also writes the two phone screenshots the before/after slider uses. Exits non-zero on console errors.
import { createRequire } from "node:module";
const { chromium, devices } = createRequire(import.meta.url)("playwright");
const base = process.env.BASE || "http://127.0.0.1:5181/";
const out = process.env.OUT || "docs";
const browser = await chromium.launch();
const errors = [];
async function shot(name, url, { device, viewport = { width: 1400, height: 1000 }, full = false, clip, before, fullPhone = false, ignore404 = false } = {}) {
  const ctx = await browser.newContext(device ? { ...devices[device], ...(viewport.height === 844 ? { viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 } : {}) } : { viewport, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  page.on("console", (m) => m.type() === "error" && !(ignore404 && /404/.test(m.text())) && errors.push(`${name}: ${m.text()}`));
  page.on("pageerror", (e) => errors.push(`${name}: ${e.message}`));
  await page.goto(base + url, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  if (before) await before(page);
  const target = clip ? page.locator(clip) : page;
  await target.screenshot({ path: `${out}/${name}.png`, fullPage: full && !clip });
  await ctx.close();
}
// slider pairs: what a phone really shows (the old site has no viewport tag; its missing favicon is a 404 by design)
await shot("slider-before", "before/index.html", { device: "iPhone 13", viewport: { width: 390, height: 844 }, ignore404: true });
await shot("slider-after", "after/index.html", { device: "iPhone 13", viewport: { width: 390, height: 844 } });
await shot("overview", "?mode=desktop&try=1", { viewport: { width: 1400, height: 1000 }, full: true });
await shot("live-phone", "", { viewport: { width: 1200, height: 900 }, clip: "#live" });
await shot("scores", "", { viewport: { width: 1200, height: 900 }, clip: "#scores" });
await shot("try-editing", "?try=1", { viewport: { width: 1200, height: 900 }, clip: "#edit" });
await shot("edit-rejected", "?bad=1", { viewport: { width: 1200, height: 900 }, clip: "#edit" });
await shot("mobile", "", { device: "iPhone 13" });
await shot("mobile-compare", "?slide=45", { device: "iPhone 13", before: async (p) => { await p.locator("#slider").scrollIntoViewIfNeeded(); await p.evaluate(() => document.querySelector("#slider").scrollIntoView()); await p.waitForTimeout(800); } });
await browser.close();
// keep every PNG under 1 MB: quantise the big ones (flat illustrations lose nothing visible)
import sharp from "sharp";
import { readdirSync, statSync, readFileSync, writeFileSync } from "node:fs";
for (const f of readdirSync(out).filter((x) => x.endsWith(".png"))) {
  if (statSync(`${out}/${f}`).size > 900_000) writeFileSync(`${out}/${f}`, await sharp(readFileSync(`${out}/${f}`)).png({ palette: true, quality: 90, compressionLevel: 9 }).toBuffer());
}
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("no console errors");
