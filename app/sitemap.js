import { SITE } from "@/lib/config";
export default function sitemap() {
  const now = new Date();
  return [
    { url: SITE.url, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE.url}/referral`, lastModified: now, changeFrequency: "monthly", priority: 0.6 },
  ];
}
