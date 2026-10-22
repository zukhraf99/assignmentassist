import { SITE } from "@/lib/config";
import { SUBJECT_PAGES } from "@/lib/subjects";

export default function sitemap() {
  const now = new Date();
  const main = [
    { url: SITE.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/about`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE.url}/contact`, lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${SITE.url}/privacy`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/terms`, lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE.url}/referral`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
  const subjects = SUBJECT_PAGES.map((s) => ({
    url: `${SITE.url}/${s.slug}`, lastModified: now, changeFrequency: "monthly", priority: 0.8,
  }));
  return [...main, ...subjects];
}
