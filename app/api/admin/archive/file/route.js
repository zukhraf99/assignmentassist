import { NextResponse } from "next/server";
import { guard } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";
import { BUCKET, isUuid } from "@/lib/archive";

export const dynamic = "force-dynamic";

// Admin-only: sends the browser to a short-lived (5 minute) private link for one file.
export async function GET(req) {
  const denied = await guard(req); if (denied) return denied;
  const id = req.nextUrl.searchParams.get("id");
  if (!isUuid(id)) return NextResponse.json({ error: "Bad id." }, { status: 400 });
  const db = adminClient();
  const { data: doc } = await db.from("archive_documents").select("storage_path, file_name").eq("id", id).maybeSingle();
  if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });
  const download = req.nextUrl.searchParams.get("download") === "1" ? doc.file_name : undefined;
  const { data, error } = await db.storage.from(BUCKET).createSignedUrl(doc.storage_path, 300, download ? { download } : undefined);
  if (error || !data?.signedUrl) return NextResponse.json({ error: "Could not open the file." }, { status: 500 });
  if (req.nextUrl.searchParams.get("json") === "1") {
    return NextResponse.json({ url: data.signedUrl, name: doc.file_name }, { headers: { "Cache-Control": "no-store" } });
  }
  const res = NextResponse.redirect(data.signedUrl);
  res.headers.set("Cache-Control", "no-store");
  return res;
}
