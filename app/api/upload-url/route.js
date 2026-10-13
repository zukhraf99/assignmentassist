import { NextResponse } from "next/server";
import { adminClient } from "@/lib/server";

const ALLOWED = ["pdf", "doc", "docx", "txt", "ppt", "pptx", "xls", "xlsx", "png", "jpg", "jpeg", "zip"];

export async function POST(req) {
  try {
    const { filename } = await req.json();
    const ext = String(filename || "").split(".").pop().toLowerCase();
    if (!ALLOWED.includes(ext)) return NextResponse.json({ error: "That file type isn't supported." }, { status: 400 });
    const safe = String(filename).replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
    const path = `${new Date().toISOString().slice(0, 10)}/${crypto.randomUUID()}-${safe}`;
    const { data, error } = await adminClient().storage.from("submissions").createSignedUploadUrl(path);
    if (error) throw error;
    return NextResponse.json({ path: data.path, token: data.token });
  } catch (e) {
    return NextResponse.json({ error: "Could not prepare the upload." }, { status: 500 });
  }
}
