import { revalidatePath } from "next/cache";

// Makes public guide pages, category pages and the sitemap refresh right after an admin change.
export function revalidateGuides() {
  revalidatePath("/");
  revalidatePath("/guides");
  revalidatePath("/guides/[slug]", "page");
  revalidatePath("/guides/subject/[slug]", "page");
  revalidatePath("/guides/university/[slug]", "page");
  revalidatePath("/sitemap.xml");
}
