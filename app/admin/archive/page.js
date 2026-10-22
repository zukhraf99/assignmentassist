import Link from "next/link";
import { requireAdminPage } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";
import { STATUSES, isUuid } from "@/lib/archive";
import ArchiveUploader from "./ArchiveUploader";
import ArchiveTable from "./ArchiveTable";

export const dynamic = "force-dynamic";
const PAGE = 25;

export default async function ArchivePage({ searchParams }) {
  await requireAdminPage();
  const sp = searchParams || {};
  const s = (k) => (typeof sp[k] === "string" ? sp[k].slice(0, 80) : "");
  const page = Math.max(1, parseInt(sp.page, 10) || 1);
  const db = adminClient();
  const [{ data: universities }, { data: subjects }] = await Promise.all([
    db.from("universities").select("id, name").order("name"), db.from("subjects").select("id, name").order("name"),
  ]);

  let q = db.from("archive_documents")
    .select("id, file_name, title, module_code, doc_type, status, error, created_at, university:universities(name), subject:subjects(name)", { count: "exact" });
  if (STATUSES.includes(s("status"))) q = q.eq("status", s("status"));
  if (isUuid(s("university"))) q = q.eq("university_id", s("university"));
  if (isUuid(s("subject"))) q = q.eq("subject_id", s("subject"));
  if (s("module")) q = q.ilike("module_code", `%${s("module").replace(/[%,()*\\]/g, " ")}%`);
  if (s("q").replace(/[%,()*\\]/g, " ").trim()) q = q.textSearch("tsv", s("q").replace(/[%,()*\\]/g, " ").trim(), { type: "websearch", config: "english" });
  const { data: rows, count, error } = await q.order("created_at", { ascending: false }).range((page - 1) * PAGE, page * PAGE - 1);
  const pages = Math.max(1, Math.ceil((count || 0) / PAGE));
  const link = (n) => { const p = new URLSearchParams(); for (const k of ["q", "status", "university", "subject", "module"]) if (s(k)) p.set(k, s(k)); if (n > 1) p.set("page", n); return `/admin/archive?${p}`; };

  return (
    <>
      <h1 className="h1s">Private archive</h1>
      <p className="notice">Private. Nothing in this archive is public: files sit in a private bucket, and no page on the website lists or links to them.</p>
      <ArchiveUploader />
      <section className="adm-section">
        <h2>Documents {count != null && <small>({count})</small>}</h2>
        <form method="get" className="gfilters">
          <input name="q" defaultValue={s("q")} placeholder="Search text, title, file name" />
          <select name="status" defaultValue={s("status")}><option value="">Any status</option>{STATUSES.map((x) => <option key={x} value={x}>{x.replace("_", " ")}</option>)}</select>
          <select name="university" defaultValue={s("university")}><option value="">Any university</option>{(universities || []).map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
          <select name="subject" defaultValue={s("subject")}><option value="">Any subject</option>{(subjects || []).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</select>
          <input name="module" defaultValue={s("module")} placeholder="Module code" />
          <button className="btn" type="submit">Filter</button><Link className="btn ghost" href="/admin/archive">Clear</Link>
        </form>
        {error && <p className="err">Could not load documents.</p>}
        <ArchiveTable rows={rows || []} universities={universities || []} subjects={subjects || []} />
        {pages > 1 && (<nav className="pager">{page > 1 ? <Link href={link(page - 1)}>← Previous</Link> : <span />}<span>Page {page} of {pages}</span>{page < pages ? <Link href={link(page + 1)}>Next →</Link> : <span />}</nav>)}
      </section>
    </>
  );
}
