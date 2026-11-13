// Writes the four "before" pages (the dated 2012-style site) from the same content/site.json,
// so the before and after sites carry identical words and prices. Output is frozen HTML in before/.
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const site = JSON.parse(readFileSync(path.join(root, "content/site.json"), "utf8"));
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const c = site.contact, b = site.business;
const hoursHtml = site.hours.map((h) => `<b>${esc(h.label)}</b><br />${h.opens ? `${h.opens} - ${h.closes}` : "Closed"}<br /><br />`).join("\n");
const nav = [["index.html", "HOME"], ["menu.html", "OUR MENU"], ["about.html", "ABOUT US"], ["contact.html", "CONTACT"]];

function page(file, title, main, extraHead = "") {
  const cells = nav.map(([h, t]) => `<td class="nav" width="25%"><a href="${h}">${t}</a></td>`).join("\n");
  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
<title>${esc(b.name)} - ${esc(title)}</title>
<meta name="keywords" content="bakery, bread, byrek, baklava, shkoder, shkodra, furra, cafe" />
<link rel="stylesheet" type="text/css" href="css/style.css" />
<script type="text/javascript" src="js/jquery-1.12.4.min.js"></script>
<script type="text/javascript" src="js/jquery.slideshow.js"></script>
<script type="text/javascript" src="js/jquery.hoverfx.js"></script>
<script type="text/javascript" src="js/site.js"></script>
${extraHead}</head>
<body onload="MM_preloadImages('img/hero.png','img/bread.png','img/pastry.png','img/cafe.png','img/map.png')">
<table width="800" border="0" align="center" cellpadding="0" cellspacing="0" id="wrapper" style="margin-top:12px;margin-bottom:12px">
<tr><td colspan="4" bgcolor="#6e5230" height="64" style="padding:8px 16px">
  <font face="Times New Roman, Times, serif" size="6" color="#e0c88f"><b>${esc(b.name)}</b></font><br />
  <font face="Verdana" size="1" color="#b39a68">${esc(b.type)} &middot; ${esc(c.city)} &middot; Tel. ${esc(c.phone)}</font>
</td></tr>
<tr><td colspan="4"><img src="img/hero.png" width="800" height="200" style="display:block" /></td></tr>
<tr>
${cells}
</tr>
<tr><td colspan="4">
<table width="100%" border="0" cellpadding="0" cellspacing="0"><tr>
<td valign="top" style="padding:16px 18px" width="590">
${main}
</td>
<td class="side" width="190">
<b>OPENING HOURS</b><br /><br />
${hoursHtml}
<b>FIND US</b><br />${esc(c.street)}<br />${esc(c.postcode)} ${esc(c.city)}<br /><br />
<b>ORDER BY PHONE</b><br />${esc(c.phone)}<br /><br />
<span class="new">NEW!</span> Cakes and trays for the next morning, order before 18:00.
</td></tr></table>
</td></tr>
<tr><td colspan="4" class="footer">Copyright &copy; <span id="year">2012</span> ${esc(b.name)}. All rights reserved. | <a href="#" class="top">Top of page</a><br />Best viewed in Internet Explorer 8 or Firefox at 1024x768</td></tr>
</table>
</body>
</html>
`;
}

const featured = site.menu.categories.flatMap((cat) => cat.items.filter((i) => i.featured));
const price = (p) => `${p} ${b.currency}`;
const home = `<h1>Welcome to ${esc(b.name)}</h1>
<div id="slides">${["hero", "bread", "pastry", "cafe"].map((n) => `<img src="img/${n}.png" width="580" height="387" />`).join("")}</div>
<p>&nbsp;</p>
<p><b>${esc(site.home.headline)}</b></p>
<p>${esc(site.home.intro)}</p>
<h2>${esc(site.home.featuredTitle)}</h2>
<table class="menutable">
${featured.map((i) => `<tr><td><b>${esc(i.name)}</b><br />${esc(i.desc)}</td><td class="price">${price(i.price)}</td></tr>`).join("\n")}
</table>
<p>&nbsp;</p>
<p><a href="menu.html">See the full menu &raquo;</a></p>`;

const menu = `<h1>${esc(site.menu.title)}</h1>
<p>${esc(site.menu.intro)}</p>
<p><img src="img/bread.png" width="270" height="180" alt="bread" /> <img src="img/pastry.png" width="270" height="180" /></p>
${site.menu.categories.map((cat) => `<h2>${esc(cat.name)}</h2>
<p class="small">${esc(cat.intro)}</p>
<table class="menutable">
${cat.items.map((i) => `<tr><td><b>${esc(i.name)}</b><br />${esc(i.desc)}</td><td class="price">${price(i.price)}</td></tr>`).join("\n")}
</table>`).join("\n")}`;

const about = `<h1>${esc(site.about.title)}</h1>
<p><img src="img/cafe.png" width="260" height="173" align="right" hspace="8" />${site.about.paragraphs.map(esc).join("</p>\n<p>")}</p>
<h2>At a glance</h2>
<ul>
${site.about.facts.map((f) => `<li>${esc(f)}</li>`).join("\n")}
</ul>`;

const contact = `<h1>${esc(site.contactPage.title)}</h1>
<p>${esc(site.contactPage.intro)}</p>
<p><b>${esc(b.name)}</b><br />${esc(c.street)}<br />${esc(c.postcode)} ${esc(c.city)}<br />Tel: ${esc(c.phone)}<br />E-mail: <a href="mailto:${esc(c.email)}">${esc(c.email)}</a></p>
<p><img src="img/map.png" width="540" height="360" /></p>
<h2>Directions</h2>
<p>${esc(site.contactPage.directions)}</p>
<h2>Ordering</h2>
<p>${esc(site.contactPage.ordering)}</p>`;

const out = { "index.html": ["Home", home], "menu.html": ["Menu", menu], "about.html": ["About us", about], "contact.html": ["Contact", contact] };
for (const [f, [t, m]] of Object.entries(out)) writeFileSync(path.join(root, "before", f), page(f, t, m));
console.log("wrote", Object.keys(out).join(", "));
