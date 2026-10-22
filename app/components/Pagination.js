import Link from "next/link";

// base: "/guides"   params: current filters   page / pages: numbers
export default function Pagination({ base, params = {}, page, pages }) {
  if (pages <= 1) return null;
  const href = (n) => {
    const sp = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) if (v && k !== "page") sp.set(k, v);
    if (n > 1) sp.set("page", String(n));
    const qs = sp.toString();
    return qs ? `${base}?${qs}` : base;
  };
  return (
    <nav className="pager" aria-label="Pagination">
      {page > 1 ? <Link href={href(page - 1)} rel="prev">← Previous</Link> : <span />}
      <span>Page {page} of {pages}</span>
      {page < pages ? <Link href={href(page + 1)} rel="next">Next →</Link> : <span />}
    </nav>
  );
}
