import { SITE } from "@/lib/config";
import { SUBJECT_PAGES } from "@/lib/subjects";
import { sitemapGuides } from "@/lib/guides";

// Built on every request so new guides appear straight away (falls back to the fixed pages if the database is down)
export const dynamic = "force-dynamic";

export default async function sitemap() {
  const now = new Date();
  const main = [
    { url: SITE.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE.url}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE.url}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/referral`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
  const subjects = SUBJECT_PAGES.map((s) => ({ url: `${SITE.url}/${s.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.8 }));

  // Guides: only published ones. Category pages are listed only when they hold 2 or more guides.
  const g = await sitemapGuides();
  const guides = g.guides.length || g.subjects.length ? [
    { url: `${SITE.url}/guides`, lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    ...g.guides.map((x) => ({ url: `${SITE.url}/guides/${x.slug}`, lastModified: x.updated && !isNaN(new Date(x.updated)) ? new Date(x.updated) : now, changeFrequency: "monthly", priority: 0.7 })),
    ...g.subjects.map((s) => ({ url: `${SITE.url}/guides/subject/${s}`, lastModified: now, changeFrequency: "weekly", priority: 0.5 })),
    ...g.universities.map((u) => ({ url: `${SITE.url}/guides/university/${u}`, lastModified: now, changeFrequency: "weekly", priority: 0.5 })),
  ] : [];
  return [...main, ...subjects, ...guides];
}
