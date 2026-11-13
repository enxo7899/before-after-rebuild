// Draws the five illustrations as SVG, renders them to large PNGs with Playwright (the unoptimised
// originals the old site used), then makes responsive AVIF/WebP versions for the rebuilt site with sharp.
// Usage: node scripts/make-images.mjs
import { createRequire } from "node:module";
import { mkdirSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import sharp from "sharp";
const { chromium } = createRequire(import.meta.url)("playwright");
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// small seeded random so the art is identical on every run
let seed = 7;
const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const r = (a, b) => a + rnd() * (b - a);

const noise = `<filter id="grain" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="3" seed="4"/><feColorMatrix values="0 0 0 0 0.2  0 0 0 0 0.12  0 0 0 0 0.05  0 0 0 0.16 0"/></filter>`;
const grain = `<rect width="1200" height="800" filter="url(#grain)"/>`;
const wrap = (body) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 800" width="1200" height="800"><defs>${noise}</defs>${body}${grain}</svg>`;

function loaf(cx, cy, rx, ry, tone = "#b9763a", score = "#e8c58f") {
  let s = `<ellipse cx="${cx}" cy="${cy + ry * 0.12}" rx="${rx * 1.02}" ry="${ry}" fill="#7a4620" opacity=".35"/>`;
  s += `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${tone}"/>`;
  s += `<ellipse cx="${cx - rx * 0.2}" cy="${cy - ry * 0.3}" rx="${rx * 0.6}" ry="${ry * 0.38}" fill="#d49a58" opacity=".55"/>`;
  for (let i = -1; i <= 1; i++) s += `<path d="M${cx + i * rx * 0.38 - rx * 0.16} ${cy - ry * 0.5} q ${rx * 0.12} ${ry * 0.5} ${rx * 0.02} ${ry}" stroke="${score}" stroke-width="${Math.max(3, rx * 0.06)}" fill="none" stroke-linecap="round"/>`;
  return s;
}
function wood(x, y, w, h, a = "#8a5a33", b = "#7a4d2a") {
  let s = `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="${a}"/>`;
  for (let i = 0; i < h; i += 14) s += `<rect x="${x}" y="${y + i}" width="${w}" height="2" fill="${b}" opacity=".6"/>`;
  return s;
}

const scenes = {
  hero() {
    let s = `<rect width="1200" height="800" fill="#efe1c8"/>`;
    s += `<rect y="0" width="1200" height="470" fill="#e8d4b0"/>`;
    // window
    s += `<rect x="820" y="70" width="300" height="270" fill="#a9c3c6"/><path d="M820 340 L900 250 L960 300 L1040 200 L1120 290 L1120 340Z" fill="#7c9aa0"/><path d="M820 70h300v270h-300z M970 70v270 M820 205h300" stroke="#5b3b22" stroke-width="12" fill="none"/>`;
    // shelves with loaves
    for (let row = 0; row < 3; row++) {
      const y = 140 + row * 110;
      s += wood(60, y + 62, 700, 16);
      for (let i = 0; i < 6; i++) s += loaf(130 + i * 112 + r(-6, 6), y + 28, r(44, 56), r(26, 34), ["#b9763a", "#a8652c", "#c88542"][(i + row) % 3]);
    }
    // lamps
    for (const x of [200, 470, 740]) s += `<path d="M${x} 0 V50" stroke="#3a2a1d" stroke-width="4"/><path d="M${x - 34} 92 q34 -62 68 0z" fill="#b4472b"/>`;
    // counter
    s += `<rect x="0" y="470" width="1200" height="330" fill="#6d4a2c"/>`;
    s += `<rect x="0" y="455" width="1200" height="26" fill="#c9a779"/>`;
    s += `<rect x="70" y="500" width="720" height="230" fill="#e9f0ee" opacity=".92"/><path d="M70 500h720v230H70z" stroke="#3b3b3b" stroke-width="6" fill="none"/>`;
    for (let i = 0; i < 5; i++) { const x = 110 + i * 135; s += `<rect x="${x}" y="612" width="110" height="60" rx="8" fill="${["#c98b46", "#d9a45c", "#b4472b", "#c98b46", "#9a6a2c"][i]}"/><rect x="${x + 12}" y="620" width="86" height="14" rx="6" fill="#f5deb0" opacity=".7"/>`; }
    s += `<rect x="70" y="672" width="720" height="10" fill="#bdbdbd"/>`;
    // till and cups
    s += `<rect x="900" y="400" width="140" height="62" fill="#3a3a3a"/><rect x="920" y="415" width="60" height="26" fill="#9cc8a5"/>`;
    s += `<rect x="1070" y="395" width="62" height="64" fill="#f6efe0"/><rect x="1130" y="410" width="16" height="30" rx="8" fill="none" stroke="#f6efe0" stroke-width="6"/>`;
    s += `<rect x="850" y="520" width="300" height="200" fill="#5a3b22"/><text x="1000" y="640" text-anchor="middle" font-family="Georgia, serif" font-size="54" fill="#efe1c8">FURRA</text>`;
    return wrap(s);
  },
  bread() {
    let s = `<rect width="1200" height="800" fill="#d7bf94"/>`;
    s += wood(0, 330, 1200, 470, "#9b6a3e", "#85572f");
    s += `<rect x="90" y="290" width="1020" height="440" rx="30" fill="#c79a62"/><rect x="90" y="290" width="1020" height="440" rx="30" fill="none" stroke="#7a4d2a" stroke-width="8"/>`;
    s += loaf(330, 500, 190, 130, "#b9763a") + loaf(760, 480, 200, 135, "#a8652c") + loaf(590, 620, 150, 90, "#c88542", "#efd3a1");
    s += `<ellipse cx="930" cy="610" rx="120" ry="62" fill="#8c5a2b"/><ellipse cx="930" cy="596" rx="116" ry="56" fill="#9a6633"/>` + [0, 1, 2, 3].map((i) => `<path d="M${860 + i * 38} 560 l16 66" stroke="#d9b27a" stroke-width="7" stroke-linecap="round"/>`).join("");
    for (let i = 0; i < 7; i++) { const x = 90 + i * 28; s += `<path d="M${x} 240 q8 -90 -6 -190" stroke="#c9a24d" stroke-width="5" fill="none"/>`; for (let k = 0; k < 7; k++) s += `<ellipse cx="${x + (k % 2 ? 7 : -7)}" cy="${60 + k * 22}" rx="6" ry="14" fill="#d3ad55" transform="rotate(${k % 2 ? 28 : -28} ${x} ${60 + k * 22})"/>`; }
    return wrap(s);
  },
  pastry() {
    let s = `<rect width="1200" height="800" fill="#e7d6bd"/>`;
    s += `<rect x="70" y="80" width="740" height="640" rx="24" fill="#bcbcbc"/><rect x="95" y="105" width="690" height="590" rx="14" fill="#d9d9d9"/>`;
    for (let row = 0; row < 5; row++) for (let col = 0; col < 6; col++) {
      const cx = 160 + col * 108 + (row % 2) * 54, cy = 175 + row * 100;
      if (cx > 740) continue;
      s += `<path d="M${cx} ${cy - 44} L${cx + 50} ${cy} L${cx} ${cy + 44} L${cx - 50} ${cy}Z" fill="#c8923b"/><path d="M${cx} ${cy - 30} L${cx + 34} ${cy} L${cx} ${cy + 30} L${cx - 34} ${cy}Z" fill="#dcac52"/><circle cx="${cx}" cy="${cy}" r="8" fill="#7e9c4a"/>`;
    }
    s += `<rect x="850" y="120" width="290" height="250" rx="12" fill="#f6efe0"/><rect x="850" y="120" width="290" height="70" rx="12" fill="#b9763a"/><rect x="850" y="190" width="290" height="180" fill="#f3e3b8"/><path d="M850 190 q36 28 72 0 t72 0 t72 0 t72 0" fill="#f6efe0"/>`;
    s += `<rect x="850" y="420" width="290" height="250" rx="12" fill="#f6efe0"/><rect x="850" y="420" width="290" height="70" rx="12" fill="#b9763a"/><rect x="850" y="490" width="290" height="180" fill="#f3e3b8"/>`;
    s += `<circle cx="780" cy="740" r="60" fill="#fdfaf2"/><circle cx="780" cy="740" r="44" fill="#6a3d1d"/>`;
    return wrap(s);
  },
  cafe() {
    let s = `<rect width="1200" height="800" fill="#ecdcc0"/>`;
    s += `<rect x="130" y="70" width="940" height="450" fill="#aecbd0"/><path d="M130 520 V390 L330 280 L500 360 L640 240 L760 330 L900 250 L1070 340 V520Z" fill="#86a6a0"/><path d="M130 520 V450 q200 -60 400 0 t540 -20 V520Z" fill="#6e8f8c"/>`;
    s += `<path d="M660 240 h120 v-30 h-20 v-20 h-20 v20 h-20 v-30 h-20 v30 h-20 v20 h-20z" fill="#4b5a55"/>`;
    s += `<path d="M130 70h940v450H130z M600 70v450 M130 295h940" stroke="#5b3b22" stroke-width="14" fill="none"/>`;
    s += `<rect y="540" width="1200" height="260" fill="#6d4a2c"/><rect y="520" width="1200" height="40" fill="#c9a779"/>`;
    for (const x of [330, 760]) s += `<ellipse cx="${x}" cy="660" rx="150" ry="44" fill="#fdfaf2"/><ellipse cx="${x}" cy="650" rx="92" ry="26" fill="#fdfaf2" stroke="#d7cdb8" stroke-width="4"/><path d="M${x - 70} 600 h140 v36 q-70 50 -140 0z" fill="#fdfaf2" stroke="#d7cdb8" stroke-width="4"/><ellipse cx="${x}" cy="602" rx="70" ry="14" fill="#5a2f17"/><path d="M${x + 70} 612 q50 6 0 44" stroke="#fdfaf2" stroke-width="12" fill="none"/>`;
    s += `<rect x="520" y="620" width="160" height="100" rx="10" fill="#f6efe0"/><rect x="540" y="640" width="120" height="14" fill="#b4472b"/>`;
    return wrap(s);
  },
  map() {
    let s = `<rect width="1200" height="800" fill="#f1e8d6"/>`;
    s += `<path d="M900 0 L1200 0 L1200 800 L760 800 Q820 400 900 0Z" fill="#a9c3c6"/>`;
    for (const [x1, y1, x2, y2, w] of [[0, 330, 900, 300, 46], [0, 620, 800, 580, 30], [250, 0, 300, 800, 30], [560, 0, 590, 800, 38], [0, 120, 880, 90, 24]]) s += `<path d="M${x1} ${y1} L${x2} ${y2}" stroke="#fffaf0" stroke-width="${w}" stroke-linecap="round"/><path d="M${x1} ${y1} L${x2} ${y2}" stroke="#d9ccb2" stroke-width="${w + 6}" stroke-linecap="round" opacity=".4"/>`;
    for (let i = 0; i < 28; i++) { const x = r(20, 780), y = r(20, 760); if (Math.abs(y - (330 - x * 0.033)) > 60) s += `<rect x="${x}" y="${y}" width="${r(40, 90)}" height="${r(30, 70)}" fill="${["#e2d3b6", "#d9c9a8", "#e8dcc3"][i % 3]}"/>`; }
    s += `<circle cx="420" cy="318" r="70" fill="#7e9c4a" opacity=".5"/>`;
    s += `<path d="M590 250 a34 34 0 1 1 0.1 0 l-0.1 0 -28 64 28 -22z" fill="#b4472b"/><circle cx="590" cy="215" r="13" fill="#fffaf0"/>`;
    s += `<text x="1000" y="400" font-family="Georgia, serif" font-size="40" fill="#5f7f84" text-anchor="middle" transform="rotate(-80 1000 400)">LAKE ROAD</text>`;
    return wrap(s);
  },
};

mkdirSync(path.join(root, "before/img"), { recursive: true });
mkdirSync(path.join(root, "after/img"), { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 800 }, deviceScaleFactor: 2 });
for (const [name, draw] of Object.entries(scenes)) {
  seed = 7;
  await page.setContent(`<body style="margin:0">${draw()}</body>`);
  const pngPath = path.join(root, "before/img", `${name}.png`);
  await page.screenshot({ path: pngPath, clip: { x: 0, y: 0, width: 1200, height: 800 } }); // 2400x1600 PNG, as unoptimised as a 2012 camera export
  for (const w of [480, 800, 1200]) {
    const base = sharp(pngPath).resize({ width: w });
    await base.clone().avif({ quality: 45, effort: 6 }).toFile(path.join(root, `after/img/${name}-${w}.avif`));
    await base.clone().webp({ quality: 72, effort: 6 }).toFile(path.join(root, `after/img/${name}-${w}.webp`));
  }
  console.log("made", name);
}
await browser.close();
