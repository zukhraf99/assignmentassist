import Link from "next/link";
import { requireAdminPage } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";

export const dynamic = "force-dynamic";

export default async function GuidesAdmin() {
  await requireAdminPage();
  const { data, error } = await adminClient().from("guides")
    .select("id, slug, title, status, module_code, updated_at, subject:subjects(name), university:universities(name)")
    .order("updated_at", { ascending: false }).limit(500);
  return (
    <>
      <div className="adm-head"><h1 className="h1s">Guides</h1><Link className="btn" href="/admin/guides/new">+ New guide</Link></div>
      {error && <p className="err">Could not load guides.</p>}
      {!error && !data?.length && <p>No guides yet. Click "New guide" to write your first one.</p>}
      {data?.length > 0 && (
        <div className="adm-table-wrap"><table className="adm-table">
          <thead><tr><th>Title</th><th>Subject</th><th>University</th><th>Module</th><th>Status</th><th></th></tr></thead>
          <tbody>{data.map((g) => (
            <tr key={g.id}>
              <td><Link href={`/admin/guides/${g.id}`}>{g.title}</Link></td>
              <td>{g.subject?.name || "-"}</td><td>{g.university?.name || "-"}</td><td>{g.module_code || "-"}</td>
              <td><span className={`badge ${g.status}`}>{g.status}</span></td>
              <td>{g.status === "published" && <Link href={`/guides/${g.slug}`} target="_blank">View</Link>}</td>
            </tr>))}
          </tbody>
        </table></div>
      )}
    </>
  );
}
