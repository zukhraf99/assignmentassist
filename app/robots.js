import { SITE } from "@/lib/config";
export default function robots() {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/api/", "/admin/", "/moderate"] }],
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
