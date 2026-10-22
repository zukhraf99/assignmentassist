import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactButtons from "../components/ContactButtons";
import SubjectsGrid from "../components/SubjectsGrid";
import { SITE } from "@/lib/config";
import { SUBJECT_PAGES, getSubject } from "@/lib/subjects";

// Only the pages listed in lib/subjects.js exist. Any other address shows the normal 404.
export const dynamicParams = false;

export function generateStaticParams() {
  return SUBJECT_PAGES.map((s) => ({ slug: s.slug }));
}

export function generateMetadata({ params }) {
  const s = getSubject(params.slug);
  if (!s) return {};
  return {
    title: s.title,
    description: s.description,
    alternates: { canonical: `/${s.slug}` },
    openGraph: { title: s.title, description: s.description, url: `${SITE.url}/${s.slug}`, type: "article" },
  };
}

export default function SubjectPage({ params }) {
  const s = getSubject(params.slug);
  const parent = s.parent ? getSubject(s.parent) : null;

  const crumbs = [{ name: "Home", url: SITE.url }];
  if (parent) crumbs.push({ name: parent.name, url: `${SITE.url}/${parent.slug}` });
  crumbs.push({ name: s.name, url: `${SITE.url}/${s.slug}` });

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: crumbs.map((c, i) => ({ "@type": "ListItem", position: i + 1, name: c.name, item: c.url })),
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: s.faqs.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })),
    },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Header />
      <main className="page">
        <div className="wrap mid">
          <nav className="crumbs" aria-label="Breadcrumb">
            <Link href="/">Home</Link> /{" "}
            {parent && (<><Link href={`/${parent.slug}`}>{parent.name}</Link> / </>)}
            <span>{s.name}</span>
          </nav>

          <h1>{s.h1}</h1>
          <p className="sub">{s.intro}</p>
          <div className="cta-row">
            <Link className="btn" href="/#request">Send a request</Link>
            <ContactButtons compact />
          </div>
          <p className="fine" style={{ marginTop: 14 }}>
            We coach you through your own work with explanations, planning, feedback and examples. We don't write assignments for you to submit.
          </p>

          <h2>What we help with</h2>
          <ul className="help">
            {s.helps.map(([t, d]) => (<li key={t}><b>{t}</b><span>{d}</span></li>))}
          </ul>

          {s.sections.map((sec) => (
            <section className="sec" key={sec.h}>
              <h2>{sec.h}</h2>
              {sec.p && sec.p.map((t, i) => <p key={i}>{t}</p>)}
              {sec.list && <ul>{sec.list.map((t) => <li key={t}>{t}</li>)}</ul>}
              {sec.steps && <ol>{sec.steps.map((t) => <li key={t}>{t}</li>)}</ol>}
              {sec.linkSlugs && (
                <ul className="pagelinks">
                  {sec.linkSlugs.map((slug) => {
                    const t = getSubject(slug);
                    return t ? (<li key={slug}><Link href={`/${slug}`}><b>{t.name}</b><span>{t.short}</span></Link></li>) : null;
                  })}
                </ul>
              )}
            </section>
          ))}

          <section className="sec">
            <h2>Common mistakes to avoid</h2>
            <ul>{s.mistakes.map((t) => <li key={t}>{t}</li>)}</ul>
          </section>

          <section className="sec faq">
            <h2>Common questions</h2>
            {s.faqs.map(([q, a]) => (<details key={q}><summary>{q}</summary><p>{a}</p></details>))}
          </section>

          <div className="card">
            <b>Need help with your {s.name} assignment?</b>
            <p>Tell us what you are working on and when it is due. We usually reply within {SITE.replyTime}.</p>
            <Link className="btn" href="/#request">Send a request</Link>
          </div>

          <h2>More subjects</h2>
          <SubjectsGrid exclude={s.slug} />
        </div>
      </main>
      <Footer />
    </>
  );
}
