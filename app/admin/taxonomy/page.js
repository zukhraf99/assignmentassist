import { requireAdminPage } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";
import TaxonomyManager from "./TaxonomyManager";

export const dynamic = "force-dynamic";

export default async function Taxonomy() {
  await requireAdminPage();
  const db = adminClient();
  const [{ data: universities }, { data: subjects }] = await Promise.all([
    db.from("universities").select("id, name, aliases").order("name"), db.from("subjects").select("id, name, keywords").order("name"),
  ]);
  return (
    <>
      <h1 className="h1s">Universities &amp; subjects</h1>
      <p className="sub">Shared by guides and the private archive. Aliases and keywords help the archive suggest the right category automatically.</p>
      <TaxonomyManager kind="university" title="Universities" extraLabel="Aliases (comma separated)" items={(universities || []).map((u) => ({ id: u.id, name: u.name, extra: (u.aliases || []).join(", ") }))} />
      <TaxonomyManager kind="subject" title="Subjects" extraLabel="Keywords (comma separated)" items={(subjects || []).map((s) => ({ id: s.id, name: s.name, extra: (s.keywords || []).join(", ") }))} />
    </>
  );
}
