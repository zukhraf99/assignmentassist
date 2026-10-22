import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import GuideCard from "../../../components/GuideCard";
import { adminClient } from "@/lib/server";
import { listGuides } from "@/lib/guides";

export const revalidate = 3600;
export const dynamicParams = true;
export async function generateStaticParams() { return []; }

async function load(slug) {
  try {
    const { data } = await adminClient().from("subjects").select("id, name, slug").eq("slug", slug).maybeSingle();
    if (!data) return null;
    const list = await listGuides({ subjectSlug: slug, pageSize: 24 });
    return list.total ? { item: data, list } : null;
  } catch { return null; }
}

export async function generateMetadata({ params }) {
  const d = await load(params.slug);
  if (!d) return { title: "Not found", robots: { index: false } };
  return {
    title: `${d.item.name} assignment guides`,
    description: `Original guides to common ${d.item.name} assignments: structure, planning and common mistakes.`,
    alternates: { canonical: `/guides/subject/${d.item.slug}` },
    // a category page with a single guide is thin, so keep it out of Google until it has two
    robots: d.list.total < 2 ? { index: false, follow: true } : undefined,
  };
}

export default async function Page({ params }) {
  const d = await load(params.slug);
  if (!d) notFound();
  return (
    <>
      <Header />
      <main className="page">
        <div className="wrap mid">
          <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> / <Link href="/guides">Guides</Link> / <span>{d.item.name}</span></nav>
          <h1>{d.item.name} guides</h1>
          <p className="sub">{d.list.total} guide{d.list.total === 1 ? "" : "s"}</p>
          <ul className="pagelinks">{d.list.items.map((g) => <GuideCard key={g.id} g={g} />)}</ul>
          {d.list.total > d.list.items.length && <p><Link href={`/guides?subject=${d.item.slug}`}>See all {d.list.total} guides</Link></p>}
        </div>
      </main>
      <Footer />
    </>
  );
}
