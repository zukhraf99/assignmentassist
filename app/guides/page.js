import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import GuideCard from "../components/GuideCard";
import Pagination from "../components/Pagination";
import { listGuides, getFilterOptions } from "@/lib/guides";

export const dynamic = "force-dynamic";
const KEYS = ["q", "subject", "university", "module", "topic"];

export function generateMetadata({ searchParams }) {
  const filtered = KEYS.some((k) => searchParams?.[k]) || (parseInt(searchParams?.page, 10) || 1) > 1;
  return {
    title: "Assignment Guides by Subject and University",
    description: "Original study guides that explain how to approach common assignment types: structure, planning, common mistakes and referencing. Browse by subject, university or module code.",
    alternates: { canonical: "/guides" },
    // search and filter results are not useful pages for Google, so keep them out of the index
    robots: filtered ? { index: false, follow: true } : undefined,
  };
}

export default async function GuidesIndex({ searchParams }) {
  const sp = searchParams || {};
  const params = Object.fromEntries(KEYS.map((k) => [k, typeof sp[k] === "string" ? sp[k].slice(0, 80) : ""]));
  const [result, opts] = await Promise.all([
    listGuides({ q: params.q, subjectSlug: params.subject, universitySlug: params.university, module: params.module, topic: params.topic, page: sp.page }),
    getFilterOptions(),
  ]);
  const filtered = KEYS.some((k) => params[k]);

  return (
    <>
      <Header />
      <main className="page">
        <div className="wrap mid">
          <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link> / <span>Guides</span></nav>
          <h1>Assignment guides</h1>
          <p className="sub">Our own explanations of common assignment types: what the task asks, how to plan it, how to structure it and what to avoid. Written to help you do your own work.</p>

          <form method="get" action="/guides" className="gfilters">
            <input name="q" defaultValue={params.q} placeholder="Search guides" aria-label="Search guides" />
            <select name="subject" defaultValue={params.subject} aria-label="Subject">
              <option value="">All subjects</option>
              {opts.subjects.map((s) => <option key={s.id} value={s.slug}>{s.name} ({s.count})</option>)}
            </select>
            <select name="university" defaultValue={params.university} aria-label="University">
              <option value="">All universities</option>
              {opts.universities.map((u) => <option key={u.id} value={u.slug}>{u.name} ({u.count})</option>)}
            </select>
            <input name="module" defaultValue={params.module} placeholder="Module code" aria-label="Module code" />
            <select name="topic" defaultValue={params.topic} aria-label="Topic">
              <option value="">All topics</option>
              {opts.topics.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <button className="btn" type="submit">Search</button>
            {filtered && <Link className="btn ghost" href="/guides">Clear</Link>}
          </form>

          {result.error && <p className="err">Guides could not be loaded right now. Please try again shortly.</p>}
          {!result.error && result.items.length === 0 && (
            <p>{filtered ? "No guides match your search. Try fewer filters." : "Guides are coming soon."}</p>
          )}
          {result.items.length > 0 && (
            <>
              <p className="fine">{result.total} guide{result.total === 1 ? "" : "s"}</p>
              <ul className="pagelinks">{result.items.map((g) => <GuideCard key={g.id} g={g} />)}</ul>
              <Pagination base="/guides" params={params} page={result.page} pages={result.pages} />
            </>
          )}

          {!filtered && (opts.subjects.length > 0 || opts.universities.length > 0) && (
            <>
              {opts.subjects.length > 0 && (<><h2>Browse by subject</h2>
                <p className="chips">{opts.subjects.map((s) => <Link key={s.id} href={`/guides/subject/${s.slug}`}>{s.name}</Link>)}</p></>)}
              {opts.universities.length > 0 && (<><h2>Browse by university</h2>
                <p className="chips">{opts.universities.map((u) => <Link key={u.id} href={`/guides/university/${u.slug}`}>{u.name}</Link>)}</p></>)}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
