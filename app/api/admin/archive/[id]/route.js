import { NextResponse } from "next/server";
import { guard } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";
import { BUCKET, isUuid, cleanStr, toKeywords, STATUSES } from "@/lib/archive";
import { slugify } from "@/lib/slug";

async function findOrCreate(db, table, name) {
  const clean = cleanStr(name, 120);
  if (!clean) return null;
  const { data: found } = await db.from(table).select("id").ilike("name", clean.replace(/[%_]/g, "")).limit(1);
  if (found?.[0]) return found[0].id;
  const { data, error } = await db.from(table).insert({ name: clean, slug: slugify(clean) || crypto.randomUUID().slice(0, 8) }).select("id").single();
  if (error) throw error;
  return data.id;
}

export async function PATCH(req, { params }) {
  const denied = await guard(req); if (denied) return denied;
  if (!isUuid(params.id)) return NextResponse.json({ error: "Bad id." }, { status: 400 });
  try {
    const b = await req.json();
    const db = adminClient();
    const patch = { updated_at: new Date().toISOString() };
    if ("title" in b) patch.title = cleanStr(b.title, 200);
    if ("module_code" in b) patch.module_code = cleanStr(b.module_code, 30);
    if ("doc_type" in b) patch.doc_type = cleanStr(b.doc_type, 60);
    if ("notes" in b) patch.notes = cleanStr(b.notes, 2000);
    if ("keywords" in b) patch.keywords = toKeywords(b.keywords);
    if ("status" in b) {
      if (!STATUSES.includes(b.status)) return NextResponse.json({ error: "Bad status." }, { status: 400 });
      patch.status = b.status;
    }
    if ("university_id" in b) patch.university_id = isUuid(b.university_id) ? b.university_id : null;
    if ("subject_id" in b) patch.subject_id = isUuid(b.subject_id) ? b.subject_id : null;
    if (b.university_name) patch.university_id = await findOrCreate(db, "universities", b.university_name);
    if (b.subject_name) patch.subject_id = await findOrCreate(db, "subjects", b.subject_name);
    const { error } = await db.from("archive_documents").update(patch).eq("id", params.id);
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save." }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const denied = await guard(req); if (denied) return denied;
  if (!isUuid(params.id)) return NextResponse.json({ error: "Bad id." }, { status: 400 });
  const db = adminClient();
  const { data } = await db.from("archive_documents").select("storage_path").eq("id", params.id).maybeSingle();
  if (data?.storage_path) await db.storage.from(BUCKET).remove([data.storage_path]);
  const { error } = await db.from("archive_documents").delete().eq("id", params.id);
  return error ? NextResponse.json({ error: "Could not delete." }, { status: 500 }) : NextResponse.json({ ok: true });
}
