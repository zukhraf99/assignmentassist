import { NextResponse } from "next/server";
import { guard } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";
import { isUuid } from "@/lib/archive";
import { normalizeGuide, validateGuide } from "@/lib/guideValidate";
import { revalidateGuides } from "@/lib/revalidate";

export async function PATCH(req, { params }) {
  const denied = await guard(req); if (denied) return denied;
  if (!isUuid(params.id)) return NextResponse.json({ error: "Bad id." }, { status: 400 });
  try {
    const g = normalizeGuide(await req.json());
    const errors = validateGuide(g);
    if (errors.length) return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    const db = adminClient();
    const { data: old } = await db.from("guides").select("published_at").eq("id", params.id).maybeSingle();
    if (!old) return NextResponse.json({ error: "Guide not found." }, { status: 404 });
    const published_at = g.status === "published" ? old.published_at || new Date().toISOString() : old.published_at;
    const { error } = await db.from("guides").update({ ...g, published_at, updated_at: new Date().toISOString() }).eq("id", params.id);
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "That page address is already used by another guide." }, { status: 409 });
      throw error;
    }
    revalidateGuides();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not save the guide." }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  const denied = await guard(req); if (denied) return denied;
  if (!isUuid(params.id)) return NextResponse.json({ error: "Bad id." }, { status: 400 });
  const { error } = await adminClient().from("guides").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: "Could not delete." }, { status: 500 });
  revalidateGuides();
  return NextResponse.json({ ok: true });
}
