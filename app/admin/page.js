import Link from "next/link";
import { requireAdminPage } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";

export const dynamic = "force-dynamic";

async function count(db, table, filter) {
  let q = db.from(table).select("id", { count: "exact", head: true });
  if (filter) q = q.eq(filter[0], filter[1]);
  const { count } = await q;
  return count ?? "?";
}

export default async function Dashboard() {
  await requireAdminPage();
  const db = adminClient();
  const [pub, draft, docs, review, failed, dup] = await Promise.all([
    count(db, "guides", ["status", "published"]), count(db, "guides", ["status", "draft"]),
    count(db, "archive_documents"), count(db, "archive_documents", ["status", "needs_review"]),
    count(db, "archive_documents", ["status", "failed"]), count(db, "archive_documents", ["status", "duplicate"]),
  ]);
  return (
    <>
      <h1 className="h1s">Admin</h1>
      <div className="adm-grid">
        <div className="card">
          <h2>Guides (public)</h2>
          <p>{pub} published · {draft} drafts</p>
          <Link className="btn" href="/admin/guides">Manage guides</Link>
        </div>
        <div className="card">
          <h2>Private archive</h2>
          <p>{docs} documents · {review} need review · {failed} failed · {dup} duplicates</p>
          <p className="fine">Nothing in the archive is ever public.</p>
          <Link className="btn" href="/admin/archive">Open archive</Link>
        </div>
        <div className="card">
          <h2>Universities &amp; subjects</h2>
          <p>Shared categories used by guides and the archive.</p>
          <Link className="btn ghost" href="/admin/taxonomy">Manage categories</Link>
        </div>
      </div>
    </>
  );
}
