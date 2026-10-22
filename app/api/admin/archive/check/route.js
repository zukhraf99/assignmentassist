import { NextResponse } from "next/server";
import { guard } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";

// Is a file with this SHA-256 already in the archive?
export async function POST(req) {
  const denied = await guard(req); if (denied) return denied;
  try {
    const { hash } = await req.json();
    if (!/^[a-f0-9]{64}$/.test(String(hash))) return NextResponse.json({ error: "Bad hash." }, { status: 400 });
    const { data, error } = await adminClient().from("archive_documents")
      .select("id, file_name").eq("sha256", hash).neq("status", "duplicate").limit(1);
    if (error) throw error;
    return NextResponse.json({ duplicate: data?.[0] || null });
  } catch {
    return NextResponse.json({ error: "Could not check for duplicates." }, { status: 500 });
  }
}
