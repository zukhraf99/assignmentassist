import { notFound } from "next/navigation";
import { requireAdminPage } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";
import { isUuid } from "@/lib/archive";
import GuideForm from "../GuideForm";

export const dynamic = "force-dynamic";

export default async function EditGuide({ params }) {
  await requireAdminPage();
  if (!isUuid(params.id)) notFound();
  const db = adminClient();
  const [{ data: guide }, { data: subjects }, { data: universities }] = await Promise.all([
    db.from("guides").select("*").eq("id", params.id).maybeSingle(),
    db.from("subjects").select("id, name").order("name"), db.from("universities").select("id, name").order("name"),
  ]);
  if (!guide) notFound();
  return (<><h1 className="h1s">Edit guide</h1><GuideForm guide={guide} subjects={subjects || []} universities={universities || []} /></>);
}
