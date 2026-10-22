import { NextResponse } from "next/server";
import { guard } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";
import { BUCKET, isUuid, cleanStr, toKeywords } from "@/lib/archive";

// Apply one change to many documents at once.
export async function PATCH(req) {
  const denied = await guard(req); if (denied) return denied;
  try {
    const { ids, action, value } = await req.json();
    if (!Array.isArray(ids) || !ids.length || ids.length > 500 || !ids.every(isUuid)) {
      return NextResponse.json({ error: "Select between 1 and 500 documents." }, { status: 400 });
    }
    const db = adminClient();
    const now = new Date().toISOString();

    if (action === "delete") {
      const { data } = await db.from("archive_documents").select("storage_path").in("id", ids);
      const paths = (data || []).map((d) => d.storage_path);
      if (paths.length) await db.storage.from(BUCKET).remove(paths);
      const { error } = await db.from("archive_documents").delete().in("id", ids);
      if (error) throw error;
      return NextResponse.json({ ok: true, count: ids.length });
    }

    let patch;
    if (action === "set_university") patch = { university_id: value && isUuid(value) ? value : null };
    else if (action === "set_subject") patch = { subject_id: value && isUuid(value) ? value : null };
    else if (action === "set_type") patch = { doc_type: cleanStr(value, 60) };
    else if (action === "set_status" && ["reviewed", "needs_review", "archived"].includes(value)) patch = { status: value };
    else if (action === "add_keywords") {
      const add = toKeywords(value);
      if (!add.length) return NextResponse.json({ error: "No keywords given." }, { status: 400 });
      const { data } = await db.from("archive_documents").select("id, keywords").in("id", ids);
      for (const d of data || []) {
        await db.from("archive_documents").update({ keywords: [...new Set([...(d.keywords || []), ...add])].slice(0, 30), updated_at: now }).eq("id", d.id);
      }
      return NextResponse.json({ ok: true, count: ids.length });
    } else return NextResponse.json({ error: "Unknown action." }, { status: 400 });

    const { error } = await db.from("archive_documents").update({ ...patch, updated_at: now }).in("id", ids);
    if (error) throw error;
    return NextResponse.json({ ok: true, count: ids.length });
  } catch {
    return NextResponse.json({ error: "Bulk update failed." }, { status: 500 });
  }
}
