// Builds the rebuilt site: content/site.json -> after/*.html. Run: npm run build
import { readFileSync, writeFileSync, copyFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
import { renderPages } from "../src/render.mjs";
import { validateSite } from "../src/validate.mjs";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = JSON.parse(readFileSync(path.join(root, "content/site.json"), "utf8"));
const check = validateSite(site);
if (!check.ok) { console.error("content/site.json has problems:\n- " + check.errors.join("\n- ")); process.exit(1); }
const css = readFileSync(path.join(root, "src/after.css"), "utf8").replace(/\s*\n\s*/g, "");
const pages = renderPages(site, { css });
for (const [file, html] of Object.entries(pages)) writeFileSync(path.join(root, "after", file), html);
// edit.html reads site.json and validate.mjs from next to it, so after/ also works on its own (Netlify, any static host)
copyFileSync(path.join(root, "content/site.json"), path.join(root, "after/site.json"));
copyFileSync(path.join(root, "src/validate.mjs"), path.join(root, "after/validate.mjs"));
console.log(`built ${Object.keys(pages).length} pages from content/site.json`);
