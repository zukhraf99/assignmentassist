import { NextResponse } from "next/server";
import { guard } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";
import { BUCKET, safeName } from "@/lib/archive";
import { ALLOWED_EXT, extOf } from "@/lib/extract";

export async function POST(req) {
  const denied = await guard(req); if (denied) return denied;
  try {
    const { filename } = await req.json();
    if (!ALLOWED_EXT.includes(extOf(filename))) {
      return NextResponse.json({ error: `Unsupported file type: .${extOf(filename)}` }, { status: 400 });
    }
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safeName(filename)}`;
    const { data, error } = await adminClient().storage.from(BUCKET).createSignedUploadUrl(path);
    if (error) throw error;
    return NextResponse.json({ path: data.path, token: data.token });
  } catch {
    return NextResponse.json({ error: "Could not prepare the upload." }, { status: 500 });
  }
}
