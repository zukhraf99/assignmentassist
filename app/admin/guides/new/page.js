import { requireAdminPage } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";
import GuideForm from "../GuideForm";

export const dynamic = "force-dynamic";

export default async function NewGuide() {
  await requireAdminPage();
  const db = adminClient();
  const [{ data: subjects }, { data: universities }] = await Promise.all([
    db.from("subjects").select("id, name").order("name"), db.from("universities").select("id, name").order("name"),
  ]);
  return (<><h1 className="h1s">New guide</h1><GuideForm subjects={subjects || []} universities={universities || []} /></>);
}
