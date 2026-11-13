import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { renderPages, jsonLd } from "../src/render.mjs";
import { validateSite } from "../src/validate.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (p) => readFileSync(path.join(root, p), "utf8");
const site = JSON.parse(read("content/site.json"));
const css = read("src/after.css").replace(/\s*\n\s*/g, "");
const afterPages = readdirSync(path.join(root, "after")).filter((f) => f.endsWith(".html"));
const beforePages = readdirSync(path.join(root, "before")).filter((f) => f.endsWith(".html"));
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const clone = () => structuredClone(site);

test("the built after/ pages match what the build function renders from site.json", () => {
  const pages = renderPages(site, { css });
  for (const [file, html] of Object.entries(pages)) assert.equal(read(`after/${file}`), html, `${file} is stale: run npm run build`);
});

test("after/site.json is the same file as content/site.json", () => {
  assert.equal(read("after/site.json"), read("content/site.json"));
  assert.equal(read("after/validate.mjs"), read("src/validate.mjs"));
});

test("every menu item name and price from site.json appears on the rebuilt menu page", () => {
  const html = decode(read("after/menu.html"));
  for (const k of site.menu.categories) for (const i of k.items) {
    assert.ok(html.includes(i.name), `missing ${i.name}`);
    assert.ok(html.includes(`${i.price} ${site.business.currency}`), `missing price of ${i.name}`);
  }
});

test("changing a price in site.json changes the rebuilt page and nothing else on the menu", () => {
  const s = clone(); s.menu.categories[2].items[0].price = 999;
  const a = renderPages(site, { css })["menu.html"], b = renderPages(s, { css })["menu.html"];
  assert.ok(b.includes("999 lek") && !a.includes("999 lek"));
  assert.equal(a.replaceAll("250 lek", "999 lek"), b);
});

test("opening hours on the home and contact pages come from site.json", () => {
  const s = clone(); s.hours[0].opens = "05:45";
  for (const f of ["index.html", "contact.html"]) assert.ok(renderPages(s, { css })[f].includes("05:45"));
});

test("the old and the rebuilt site carry the same prices and hours", () => {
  const old = decode(read("before/menu.html"));
  for (const k of site.menu.categories) for (const i of k.items) assert.ok(old.includes(i.name) && old.includes(`${i.price} lek`), i.name);
  for (const h of site.hours) assert.ok(decode(read("before/contact.html")).includes(`${h.opens} - ${h.closes}`));
});

test("every rebuilt page has a language, a viewport meta tag, a title and a description", () => {
  assert.ok(afterPages.length >= 5);
  for (const f of afterPages) {
    const h = read(`after/${f}`);
    assert.match(h, /<html lang="[a-z]{2}"/, f);
    assert.match(h, /<meta name="viewport" content="width=device-width, initial-scale=1">/, f);
    assert.match(h, /<title>[^<]{5,}<\/title>/, f);
    assert.match(h, /<meta name="description" content="[^"]{20,}"/, f);
  }
});

test("the old pages really lack a viewport tag and language (that is the problem being fixed)", () => {
  for (const f of beforePages) { const h = read(`before/${f}`); assert.doesNotMatch(h, /name="viewport"/); assert.doesNotMatch(h, /<html[^>]*lang=/); }
});

test("every image on the rebuilt pages has alt text and explicit width and height", () => {
  for (const f of afterPages) for (const tag of read(`after/${f}`).match(/<img\b[^>]*>/g) || []) {
    assert.match(tag, /\salt="[^"]+"/, `${f}: ${tag}`);
    assert.match(tag, /\swidth="\d+"/); assert.match(tag, /\sheight="\d+"/);
  }
});

test("each rebuilt page stays under its byte budget including images, fonts and styles", () => {
  const budget = 120 * 1024; // HTML + the files one page actually loads (avif where supported)
  for (const f of ["index.html", "menu.html", "about.html", "contact.html"]) {
    const html = read(`after/${f}`);
    let total = statSync(path.join(root, "after", f)).size;
    total += 2 * 26000; // two preloaded latin woff2 fonts, measured below
    const imgs = [...html.matchAll(/<img src="(img\/[^"]+)"/g)].map((m) => m[1].replace(/-1200\.webp$/, "-1200.avif"));
    for (const i of new Set(imgs)) total += statSync(path.join(root, "after", i)).size;
    assert.ok(total < budget, `${f} is ${total} bytes`);
  }
  for (const font of ["young-serif", "karla"]) assert.ok(statSync(path.join(root, `after/fonts/${font}.woff2`)).size < 30000);
  for (const f of afterPages) assert.ok(statSync(path.join(root, "after", f)).size < 30 * 1024, `${f} HTML too big`);
});

test("the rebuilt pages need no JavaScript to show their content", () => {
  for (const f of ["index.html", "menu.html", "about.html", "contact.html"]) assert.doesNotMatch(read(`after/${f}`), /<script(?![^>]*ld\+json)[^>]*>/, f);
});

test("every local link and image on both sites points at a file that exists", () => {
  for (const dir of ["before", "after"]) for (const f of readdirSync(path.join(root, dir)).filter((x) => x.endsWith(".html"))) {
    const h = read(`${dir}/${f}`);
    const refs = [...h.matchAll(/(href|src|srcset)="([^"]+)"/g)].filter((m) => !m[2].startsWith("data:")).flatMap((m) => (m[1] === "srcset" ? m[2].split(",") : [m[2]]).map((x) => x.trim().split(" ")[0]));
    for (const ref of refs) {
      if (/^(https?:|mailto:|tel:|data:|#)/.test(ref) || !ref) continue;
      const file = ref.split("#")[0];
      assert.ok(existsSync(path.join(root, dir, file)), `${dir}/${f} links to missing ${ref}`);
      if (ref.includes("#")) assert.ok(existsSync(path.join(root, dir, file)));
    }
    for (const [, id] of h.matchAll(/href="#([^"]+)"/g)) if (id) assert.ok(h.includes(`id="${id}"`), `${dir}/${f}: #${id} has no target`);
  }
});

test("structured data describes a LocalBusiness with address, phone and opening hours", () => {
  const html = read("after/index.html");
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
  assert.deepEqual(ld, JSON.parse(JSON.stringify(jsonLd(site))));
  assert.ok(ld["@type"].includes("Bakery"));
  assert.equal(ld.address.addressLocality, "Shkodër");
  assert.equal(ld.openingHoursSpecification.length, 3);
  assert.equal(ld.openingHoursSpecification[2].dayOfWeek[0], "Sunday");
});

test("the owner's edit is refused when a price is zero, negative or not a whole number", () => {
  for (const bad of [0, -50, 12.5, NaN, "free"]) { const s = clone(); s.menu.categories[0].items[0].price = bad; assert.equal(validateSite(s).ok, false, String(bad)); }
  assert.equal(validateSite(site).ok, true);
});

test("the owner's edit is refused when a shop would close before it opens", () => {
  const s = clone(); s.hours[0].opens = "21:00"; s.hours[0].closes = "06:30";
  const r = validateSite(s); assert.equal(r.ok, false); assert.match(r.errors[0], /closing time/);
  const t = clone(); t.hours[2].opens = null; t.hours[2].closes = null; assert.equal(validateSite(t).ok, true, "a closed day is allowed");
});

test("the rebuilt site uses terracotta as its single accent and the assigned fonts", () => {
  assert.match(css, /--accent:#a3412a/);
  assert.ok(css.includes("Young Serif") && css.includes("Karla"));
});

test("Lighthouse results exist, were measured over 3 runs, and the rebuilt site scores at least as well on every category", () => {
  const lh = JSON.parse(read("docs/lighthouse.json"));
  assert.equal(lh.runsPerPage, 3);
  for (const side of ["before", "after"]) assert.equal(lh.pages[side].runs.length, 3);
  for (const k of ["performance", "accessibility", "bestPractices", "seo"]) assert.ok(lh.pages.after[k] >= lh.pages.before[k], k);
  assert.ok(lh.pages.after.totalBytes < lh.pages.before.totalBytes);
  assert.ok(lh.pages.after.lcpMs <= lh.pages.before.lcpMs);
});
