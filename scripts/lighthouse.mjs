// Measures before/ and after/ with Lighthouse (mobile preset, default simulated throttling), 3 runs each,
// and writes docs/lighthouse.json. Pages are served from a local http server on 127.0.0.1.
// Usage: node scripts/lighthouse.mjs [--runs 3]
import http from "node:http";
import { readFileSync, writeFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runsArg = process.argv.indexOf("--runs");
const RUNS = runsArg > 0 ? Number(process.argv[runsArg + 1]) : 3;
const chromePath = process.env.CHROME_PATH || (existsSync("/opt/pw-browsers/chromium") ? "/opt/pw-browsers/chromium" : undefined);
const MIME = { ".html": "text/html; charset=utf-8", ".css": "text/css", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".png": "image/png", ".gif": "image/gif", ".webp": "image/webp", ".avif": "image/avif", ".woff2": "font/woff2", ".svg": "image/svg+xml" };

const server = http.createServer((req, res) => {
  const file = path.join(root, decodeURIComponent(new URL(req.url, "http://x").pathname));
  if (!file.startsWith(root) || !existsSync(file) || !statSync(file).isFile()) { res.writeHead(404).end("not found"); return; }
  res.writeHead(200, { "content-type": MIME[path.extname(file)] || "application/octet-stream" }).end(readFileSync(file));
}); // no compression for either site, so the comparison is like for like
await new Promise((r) => server.listen(0, "127.0.0.1", r));
const base = `http://127.0.0.1:${server.address().port}`;

const median = (a) => { const s = [...a].sort((x, y) => x - y); const m = s.length >> 1; return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2; };
const chrome = await chromeLauncher.launch({ chromePath, chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu"] });
const out = { generatedAt: new Date().toISOString(), tool: `lighthouse ${JSON.parse(readFileSync(path.join(root, "node_modules/lighthouse/package.json"), "utf8")).version}`, preset: "mobile (Moto G Power emulation, simulated slow 4G, 4x CPU slowdown: Lighthouse defaults)", runsPerPage: RUNS, aggregate: "median of each metric across runs", servedFrom: "local http server on 127.0.0.1, no compression, same for both sites", pages: {} };
try {
  for (const name of ["before", "after"]) {
    const url = `${base}/${name}/index.html`;
    const runs = [];
    for (let i = 0; i < RUNS; i++) {
      const { lhr } = await lighthouse(url, { port: chrome.port, output: "json", logLevel: "error" }, undefined);
      const a = lhr.audits, cat = lhr.categories;
      runs.push({
        performance: Math.round(cat.performance.score * 100), accessibility: Math.round(cat.accessibility.score * 100),
        bestPractices: Math.round(cat["best-practices"].score * 100), seo: Math.round(cat.seo.score * 100),
        fcpMs: Math.round(a["first-contentful-paint"].numericValue), lcpMs: Math.round(a["largest-contentful-paint"].numericValue), speedIndexMs: Math.round(a["speed-index"].numericValue), cls: Number(a["cumulative-layout-shift"].numericValue.toFixed(3)),
        tbtMs: Math.round(a["total-blocking-time"].numericValue), totalBytes: Math.round(a["total-byte-weight"].numericValue),
      });
      console.log(name, `run ${i + 1}`, JSON.stringify(runs[i]));
    }
    const keys = Object.keys(runs[0]);
    out.pages[name] = { url: `${name}/index.html`, ...Object.fromEntries(keys.map((k) => [k, median(runs.map((r) => r[k]))])), runs };
  }
} finally { await chrome.kill(); server.close(); }
mkdirSync(path.join(root, "docs"), { recursive: true });
writeFileSync(path.join(root, "docs/lighthouse.json"), JSON.stringify(out, null, 2) + "\n");
console.log("wrote docs/lighthouse.json");
