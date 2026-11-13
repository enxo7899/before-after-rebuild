// Rules the owner's edits must satisfy before they are accepted. Used by edit.html and the demo.
const TIME = /^([01]\d|2[0-3]):[0-5]\d$/;
export function validateSite(site) {
  const errors = [];
  const need = (cond, msg) => { if (!cond) errors.push(msg); };
  need(site?.business?.name?.trim(), "Business name cannot be empty.");
  need(/^\+?[\d\s()-]{6,}$/.test(site?.contact?.phone || ""), "Phone number looks wrong.");
  need(/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(site?.contact?.email || ""), "Email address looks wrong.");
  for (const h of site?.hours || []) {
    if (h.opens === null) continue;
    need(TIME.test(h.opens) && TIME.test(h.closes), `${h.label}: use times like 06:30.`);
    if (TIME.test(h.opens) && TIME.test(h.closes)) need(h.opens < h.closes, `${h.label}: closing time must be after opening time.`);
  }
  for (const k of site?.menu?.categories || []) for (const i of k.items) {
    need(i.name?.trim(), `A ${k.name} item has no name.`);
    need(Number.isInteger(i.price) && i.price > 0 && i.price < 100000, `${i.name || "Item"}: price must be a whole number above zero.`);
  }
  return { ok: errors.length === 0, errors };
}
