import { slugify, validSlug } from "./slug";
import { cleanStr, isUuid } from "./archive";

export function normalizeGuide(b) {
  return {
    title: cleanStr(b.title, 140),
    slug: slugify(b.slug || b.title),
    summary: cleanStr(b.summary, 300),
    body: String(b.body || "").replace(/\u0000/g, "").slice(0, 60000),
    meta_title: cleanStr(b.meta_title, 70),
    meta_description: cleanStr(b.meta_description, 170),
    university_id: isUuid(b.university_id) ? b.university_id : null,
    subject_id: isUuid(b.subject_id) ? b.subject_id : null,
    module_code: cleanStr(b.module_code, 30),
    topic: cleanStr(b.topic, 60),
    official_brief_url: b.official_brief_url ? String(b.official_brief_url).trim().slice(0, 500) : null,
    original_confirmed: b.original_confirmed === true,
    status: b.status === "published" ? "published" : "draft",
  };
}

export function validateGuide(g) {
  const errors = [];
  if (!g.title || g.title.length < 5) errors.push("Title must be at least 5 characters.");
  if (!validSlug(g.slug)) errors.push("The page address can only use lowercase letters, numbers and hyphens, and cannot be 'subject', 'university' or 'new'.");
  if (g.official_brief_url && !/^https:\/\/[^\s<>"]+$/i.test(g.official_brief_url)) errors.push("The official brief link must start with https://");
  if (g.status === "published") {
    if (!g.original_confirmed) errors.push("Tick the box confirming this guide is your own original writing before publishing.");
    if (!g.meta_description || g.meta_description.length < 50) errors.push("Write a meta description of at least 50 characters before publishing.");
    if (g.body.length < 300) errors.push("The guide needs at least 300 characters of content before publishing.");
  }
  return errors;
}
