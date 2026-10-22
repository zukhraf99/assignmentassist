import { NextResponse } from "next/server";
import { guard } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";
import { isUuid } from "@/lib/archive";
import { cleanText } from "@/lib/extract";
import { saveExtraction } from "@/lib/archiveProcess";

// Receives the text that the admin's browser read from a scanned file (browser OCR).
export async function POST(req) {
  const denied = await guard(req); if (denied) return denied;
  try {
    const b = await req.json();
    if (!isUuid(b.id) || typeof b.text !== "string" || b.text.length > 2_000_000) {
      return NextResponse.json({ error: "Invalid OCR result." }, { status: 400 });
    }
    const db = adminClient();
    const { data: doc } = await db.from("archive_documents").select("*").eq("id", b.id).maybeSingle();
    if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const text = cleanText(b.text);
    const pages = Number.isFinite(b.pages) ? Math.max(0, Math.floor(b.pages)) : null;
    if (text.length < 10) {
      await db.from("archive_documents").update({ error: "OCR found no readable text. The scan may be too faint or blurry.", updated_at: new Date().toISOString() }).eq("id", b.id);
      return NextResponse.json({ status: doc.status, error: "OCR found no readable text.", chars: text.length });
    }
    const note = b.truncated ? `OCR read the first ${pages} pages only.` : null;
    const { error, update } = await saveExtraction(db, doc, { text, source: "ocr-browser", pages, note });
    if (error) return NextResponse.json({ error: "Could not save the OCR text." }, { status: 500 });
    return NextResponse.json({ status: update.status, error: note, chars: text.length });
  } catch {
    return NextResponse.json({ error: "Could not save the OCR text." }, { status: 500 });
  }
}
