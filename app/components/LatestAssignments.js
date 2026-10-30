import Link from "next/link";
import GuideCard from "./GuideCard";
import { listGuides, getFilterOptions } from "@/lib/guides";

// Home page: newest published posts, then the categories (subjects) that have posts.
// Renders nothing until at least one post is published.
export default async function LatestAssignments() {
  const [latest, opts] = await Promise.all([listGuides({ pageSize: 6 }), getFilterOptions()]);
  if (!latest.items.length) return null;
  return (
    <>
      <section id="latest">
        <div className="wrap">
          <h2>Latest assignments</h2>
          <p className="sub">Our newest assignment posts and guides.</p>
          <ul className="pagelinks">{latest.items.map((g) => <GuideCard key={g.id} g={g} />)}</ul>
          <p><Link className="btn ghost" href="/guides">View all assignments</Link></p>
        </div>
      </section>
      {opts.subjects.length > 0 && (
        <section id="categories" className="panel">
          <div className="wrap">
            <h2>Categories</h2>
            <p className="sub">Browse assignments by subject.</p>
            <p className="chips">
              {opts.subjects.map((s) => <Link key={s.id} href={`/guides/subject/${s.slug}`}>{s.name} ({s.count})</Link>)}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
