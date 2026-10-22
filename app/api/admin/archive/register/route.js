import { NextResponse } from "next/server";
import { guard } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";
import { cleanStr } from "@/lib/archive";
import { ALLOWED_EXT, extOf } from "@/lib/extract";

const PATH_RE = /^\d{4}-\d{2}-\d{2}\/[0-9a-f-]{36}-[A-Za-z0-9._-]+$/;

// Called after the browser has uploaded a file straight to private storage.
export async function POST(req) {
  const denied = await guard(req); if (denied) return denied;
  try {
    const b = await req.json();
    const fileName = cleanStr(b.fileName, 200);
    if (!PATH_RE.test(String(b.path)) || !fileName || !/^[a-f0-9]{64}$/.test(String(b.sha256)) || !ALLOWED_EXT.includes(extOf(fileName))) {
      return NextResponse.json({ error: "Invalid file details." }, { status: 400 });
    }
    const db = adminClient();
    const { data: same } = await db.from("archive_documents").select("id").eq("sha256", b.sha256).neq("status", "duplicate").limit(1);
    const dupOf = same?.[0]?.id || null;
    const { data, error } = await db.from("archive_documents").insert({
      batch: cleanStr(b.batch, 80), file_name: fileName, source_path: cleanStr(b.sourcePath, 300),
      storage_path: b.path, mime: cleanStr(b.mime, 100), size_bytes: Math.max(0, Number(b.size) || 0),
      sha256: b.sha256, status: dupOf ? "duplicate" : "uploaded", duplicate_of: dupOf,
    }).select("id").single();
    if (error) throw error;
    return NextResponse.json({ id: data.id, duplicate: !!dupOf });
  } catch {
    return NextResponse.json({ error: "Could not save the file record." }, { status: 500 });
  }
}
