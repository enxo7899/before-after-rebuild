// Pure rendering of the rebuilt site from content/site.json. No file or DOM access, so the same
// function runs in Node (scripts/build.mjs) and in the browser (the "try editing" panel).
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const SCHEMA_DAY = { Monday: "Monday", Tuesday: "Tuesday", Wednesday: "Wednesday", Thursday: "Thursday", Friday: "Friday", Saturday: "Saturday", Sunday: "Sunday" };
export const money = (site, n) => `${n} ${site.business.currency}`;
export const hoursText = (h) => (h.opens ? `${h.opens}–${h.closes}` : "Closed");

function picture(site, key, { sizes, eager = false, widths = [480, 800, 1200] } = {}) {
  const im = site.images[key];
  const set = (ext) => widths.map((w) => `img/${key}-${w}.${ext} ${w}w`).join(", ");
  const big = widths[widths.length - 1];
  return `<picture><source type="image/avif" srcset="${set("avif")}" sizes="${sizes}"><source type="image/webp" srcset="${set("webp")}" sizes="${sizes}"><img src="img/${key}-${big}.webp" srcset="${set("webp")}" sizes="${sizes}" width="${im.w}" height="${im.h}" alt="${esc(im.alt)}"${eager ? ' fetchpriority="high"' : ' loading="lazy" decoding="async"'}></picture>`;
}

export function jsonLd(site) {
  const c = site.contact;
  const prices = site.menu.categories.flatMap((k) => k.items.map((i) => i.price));
  return {
    "@context": "https://schema.org",
    "@type": ["Bakery", "CafeOrCoffeeShop"],
    name: site.business.name,
    description: site.business.tagline,
    foundingDate: String(site.business.established),
    telephone: c.phone,
    email: c.email,
    priceRange: `${Math.min(...prices)}-${Math.max(...prices)} ${site.business.currency}`,
    servesCuisine: "Albanian",
    address: { "@type": "PostalAddress", streetAddress: c.street, addressLocality: c.city, postalCode: c.postcode, addressCountry: c.country },
    geo: { "@type": "GeoCoordinates", latitude: c.lat, longitude: c.lng },
    openingHoursSpecification: site.hours.filter((h) => h.opens).map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.days.map((d) => SCHEMA_DAY[d]), opens: h.opens, closes: h.closes })),
  };
}

export function renderPages(site, { css = "" } = {}) {
  const b = site.business, c = site.contact;
  const nav = [["index.html", "Home"], ["menu.html", "Menu"], ["about.html", "About"], ["contact.html", "Contact"]];
  const hoursDl = `<dl class="hours">${site.hours.map((h) => `<dt>${esc(h.label)}</dt><dd>${esc(hoursText(h))}</dd>`).join("")}</dl>`;
  const address = `<address>${esc(c.street)}<br>${esc(c.postcode)} ${esc(c.city)}</address>`;
  const tel = `<a href="tel:${esc(c.phone.replace(/[^+\d]/g, ""))}">${esc(c.phone)}</a>`;
  const mail = `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`;
  const ld = `<script type="application/ld+json">${JSON.stringify(jsonLd(site))}</script>`;
  const featured = site.menu.categories.flatMap((k) => k.items.filter((i) => i.featured));
  const item = (i) => `<li><div><h3>${esc(i.name)}</h3><p>${esc(i.desc)}</p></div><span class="price">${esc(money(site, i.price))}</span></li>`;

  const shell = (file, title, description, body, { preload = "" } = {}) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)} | ${esc(b.name)}, ${esc(c.city)}</title>
<meta name="description" content="${esc(description)}">
<meta name="theme-color" content="#a3412a">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='6' fill='%23a3412a'/%3E%3Ctext x='16' y='23' font-size='20' text-anchor='middle' fill='white' font-family='Georgia'%3EF%3C/text%3E%3C/svg%3E">
<link rel="preload" href="fonts/young-serif.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="fonts/karla.woff2" as="font" type="font/woff2" crossorigin>
${preload}<style>${css}</style>
${ld}
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<header><div class="wrap">
<a class="brand" href="index.html">${esc(b.name)}<small>${esc(b.type)} in ${esc(c.city)}</small></a>
<nav aria-label="Main"><ul>${nav.map(([h, t]) => `<li><a href="${h}"${h === file ? ' aria-current="page"' : ""}>${t}</a></li>`).join("")}</ul></nav>
</div></header>
<main id="main"><div class="wrap">
${body}
</div></main>
<footer><div class="wrap">
<div><h2>${esc(b.name)}</h2><p>${esc(b.tagline)}</p></div>
<div><h2>Visit</h2>${address}<p>${tel}<br>${mail}</p></div>
<div><h2>Hours</h2>${site.hours.map((h) => `<p>${esc(h.label)}: ${esc(hoursText(h))}</p>`).join("")}<p><a href="edit.html">Owner: edit this site</a></p></div>
</div></footer>
</body>
</html>
`;

  const pages = {};
  pages["index.html"] = shell("index.html", b.name, `${b.name} is a family bakery and café in ${c.city}. ${b.tagline}.`, `
<h1>${esc(site.home.headline)}</h1>
<p class="lede">${esc(site.home.intro)}</p>
<figure>${picture(site, "hero", { sizes: "(min-width: 66rem) 64rem, 100vw", eager: true })}</figure>
<div class="cols">
<section aria-labelledby="today"><h2 id="today">${esc(site.home.featuredTitle)}</h2>
<ul class="items">${featured.map(item).join("")}</ul>
<p><a class="btn" href="menu.html">See the full menu</a></p></section>
<section aria-labelledby="visit"><h2 id="visit">${esc(site.home.visitTitle)}</h2>
${hoursDl}
<p style="margin-top:1rem">${address}</p><p>${tel}</p></section>
</div>`, { preload: `<link rel="preload" as="image" href="img/hero-800.avif" type="image/avif" imagesrcset="img/hero-480.avif 480w, img/hero-800.avif 800w, img/hero-1200.avif 1200w" imagesizes="(min-width: 66rem) 64rem, 100vw" fetchpriority="high">\n` });

  pages["menu.html"] = shell("menu.html", site.menu.title, `Menu and prices at ${b.name}: bread, byrek, sweets and coffee, baked in ${c.city}.`, `
<h1>${esc(site.menu.title)}</h1>
<p class="lede">${esc(site.menu.intro)}</p>
<ul class="cat-nav">${site.menu.categories.map((k) => `<li><a href="#${esc(k.id)}">${esc(k.name)}</a></li>`).join("")}</ul>
<div class="cols even"><figure>${picture(site, "bread", { sizes: "(min-width: 48rem) 32rem, 100vw" })}</figure><figure>${picture(site, "pastry", { sizes: "(min-width: 48rem) 32rem, 100vw" })}</figure></div>
${site.menu.categories.map((k) => `<section aria-labelledby="${esc(k.id)}"><h2 id="${esc(k.id)}">${esc(k.name)}</h2><p class="sec-intro">${esc(k.intro)}</p><ul class="items">${k.items.map(item).join("")}</ul></section>`).join("\n")}`);

  pages["about.html"] = shell("about.html", site.about.title, `The story of ${b.name}, a family bakery in ${c.city} open since ${b.established}.`, `
<h1>${esc(site.about.title)}</h1>
<div class="cols"><div>${site.about.paragraphs.map((p, i) => `<p${i === 0 ? ' class="lede"' : ""}>${esc(p)}</p>`).join("")}
<h2>At a glance</h2><ul class="facts">${site.about.facts.map((f) => `<li>${esc(f)}</li>`).join("")}</ul></div>
<figure>${picture(site, "cafe", { sizes: "(min-width: 48rem) 26rem, 100vw", eager: true })}</figure></div>`);

  pages["contact.html"] = shell("contact.html", site.contactPage.title, `Address, opening hours and phone for ${b.name} in ${c.city}.`, `
<h1>${esc(site.contactPage.title)}</h1>
<p class="lede">${esc(site.contactPage.intro)}</p>
<div class="cols">
<div><h2>Address and phone</h2>${address}<p style="margin-top:1rem">${tel}<br>${mail}</p>
<h2>Opening hours</h2>${hoursDl}
<h2>Directions</h2><p>${esc(site.contactPage.directions)}</p>
<h2>Ordering ahead</h2><p>${esc(site.contactPage.ordering)}</p></div>
<figure>${picture(site, "map", { sizes: "(min-width: 48rem) 26rem, 100vw", eager: true })}</figure></div>`);
  return pages;
}
