import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";
import { isUuid } from "@/lib/archive";
import ArchiveEditor from "./ArchiveEditor";

export const dynamic = "force-dynamic";

export default async function ArchiveDoc({ params }) {
  await requireAdminPage();
  if (!isUuid(params.id)) notFound();
  const db = adminClient();
  const [{ data: doc }, { data: universities }, { data: subjects }] = await Promise.all([
    db.from("archive_documents").select("*").eq("id", params.id).maybeSingle(),
    db.from("universities").select("id, name").order("name"), db.from("subjects").select("id, name").order("name"),
  ]);
  if (!doc) notFound();
  const { extracted_text, ...rest } = doc;
  return (
    <>
      <p><Link href="/admin/archive">← Back to archive</Link></p>
      <h1 className="h1s">{doc.title || doc.file_name}</h1>
      <ArchiveEditor doc={rest} text={(extracted_text || "").slice(0, 6000)} textLength={(extracted_text || "").length} universities={universities || []} subjects={subjects || []} />
    </>
  );
}
