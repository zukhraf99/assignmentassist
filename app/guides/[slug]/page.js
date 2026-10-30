import Link from "next/link";
import { notFound } from "next/navigation";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import GuideCard from "../../components/GuideCard";
import GuideContact from "../../components/GuideContact";
import RichText from "../../components/RichText";
import PostWhatsAppButton from "../../components/PostWhatsAppButton";
import { SITE } from "@/lib/config";
import { getGuide, getRelated } from "@/lib/guides";

export const revalidate = 3600;
export const dynamicParams = true;
export async function generateStaticParams() { return []; } // pages are built on first visit

export async function generateMetadata({ params }) {
  const g = await getGuide(params.slug);
  if (!g) return { title: "Guide not found", robots: { index: false } };
  const title = g.meta_title || g.title;
  const description = g.meta_description || g.summary || undefined;
  return {
    title, description, alternates: { canonical: `/guides/${g.slug}` },
    openGraph: { title, description, url: `${SITE.url}/guides/${g.slug}`, type: "article" },
  };
}

export default async function GuidePage({ params }) {
  const g = await getGuide(params.slug);
  if (!g) notFound();
  const related = await getRelated(g);
  const url = `${SITE.url}/guides/${g.slug}`;

  const crumbs = [{ name: "Home", url: SITE.url }, { name: "Guides", url: `${SITE.url}/guides` }];
  if (g.subject) crumbs.push({ name: g.subject.name, url: `${SITE.url}/guides/subject/${g.subject.slug}` });
  crumbs.push({ name: g.title, url });
  const jsonLd = [
    { "@context": "https://schema.org", "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })) },
    { "@context": "https://schema.org", "@type": "Article", headline: g.title, description: g.meta_description || g.summary || undefined,
      datePublished: g.published_at, dateModified: g.updated_at, mainEntityOfPage: url,
      author: { "@type": "Organization", name: SITE.name }, publisher: { "@type": "Organization", name: SITE.name } },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="page">
        <article className="wrap mid">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link> / <Link href="/guides">Guides</Link> /{" "}
            {g.subject && (<><Link href={`/guides/subject/${g.subject.slug}`}>{g.subject.name}</Link> / </>)}
            <span>{g.title}</span>
          </nav>
          <h1>{g.title}</h1>
          {g.summary && <p className="sub">{g.summary}</p>}
          <p className="gmeta">
            {[g.subject && <Link key="s" href={`/guides/subject/${g.subject.slug}`}>{g.subject.name}</Link>,
              g.university && <Link key="u" href={`/guides/university/${g.university.slug}`}>{g.university.name}</Link>,
              g.module_code && <span key="m">{g.module_code}</span>, g.topic && <span key="t">{g.topic}</span>]
              .filter(Boolean).map((el, i) => <span key={i}>{i > 0 && " · "}{el}</span>)}
          </p>

          <RichText body={g.body} />
          <PostWhatsAppButton guide={g} />

          {g.official_brief_url && (
            <div className="card">
              <b>Official assignment brief</b>
              <p>The university publishes its own brief. This link opens the university's website. We don't host or copy it.</p>
              <a className="btn ghost" href={g.official_brief_url} target="_blank" rel="noopener noreferrer nofollow">Open the official brief</a>
            </div>
          )}

          <div className="card">
            <b>Want help with your own assignment?</b>
            <p>We coach you through your own work: explanations, planning and feedback on your drafts. We usually reply within {SITE.replyTime}.</p>
            <GuideContact guide={g} />
          </div>

          <p className="fine">
            This is an independent guide written by {SITE.name}.
            {g.university ? ` It is not affiliated with or endorsed by ${g.university.name}.` : ""}
          </p>

          {related.length > 0 && (<><h2>Related guides</h2><ul className="pagelinks">{related.map((r) => <GuideCard key={r.id} g={r} />)}</ul></>)}
        </article>
      </main>
      <Footer />
    </>
  );
}
