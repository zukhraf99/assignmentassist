import { NextResponse } from "next/server";
import { guard } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";
import { normalizeGuide, validateGuide } from "@/lib/guideValidate";
import { revalidateGuides } from "@/lib/revalidate";

export async function POST(req) {
  const denied = await guard(req); if (denied) return denied;
  try {
    const g = normalizeGuide(await req.json());
    const errors = validateGuide(g);
    if (errors.length) return NextResponse.json({ error: errors[0], errors }, { status: 400 });
    const { data, error } = await adminClient().from("guides")
      .insert({ ...g, published_at: g.status === "published" ? new Date().toISOString() : null }).select("id").single();
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "That page address is already used by another guide." }, { status: 409 });
      throw error;
    }
    revalidateGuides();
    return NextResponse.json({ ok: true, id: data.id });
  } catch {
    return NextResponse.json({ error: "Could not save the guide." }, { status: 500 });
  }
}
