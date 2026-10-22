import { NextResponse } from "next/server";
import { guard } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";
import { BUCKET, isUuid } from "@/lib/archive";
import { extractText, MAX_PROCESS_BYTES } from "@/lib/extract";
import { ocrFromUrl, ocrConfigured } from "@/lib/ocr";
import { saveExtraction } from "@/lib/archiveProcess";

export const maxDuration = 60;

// Reads one stored file, extracts its text (OCR if needed), suggests metadata and saves everything.
export async function POST(req) {
  const denied = await guard(req); if (denied) return denied;
  const { id } = await req.json().catch(() => ({}));
  if (!isUuid(id)) return NextResponse.json({ error: "Bad id." }, { status: 400 });
  const db = adminClient();
  const fail = async (msg) => {
    await db.from("archive_documents").update({ status: "failed", error: String(msg).slice(0, 300), updated_at: new Date().toISOString() }).eq("id", id);
    return NextResponse.json({ status: "failed", error: msg });
  };
  try {
    const { data: doc } = await db.from("archive_documents").select("*").eq("id", id).maybeSingle();
    if (!doc) return NextResponse.json({ error: "Not found." }, { status: 404 });
    await db.from("archive_documents").update({ status: "processing", error: null }).eq("id", id);

    if ((doc.size_bytes || 0) > MAX_PROCESS_BYTES) {
      await db.from("archive_documents").update({ status: "needs_review", error: "File is over 25 MB, so its text was not read. Add details by hand.", updated_at: new Date().toISOString() }).eq("id", id);
      return NextResponse.json({ status: "needs_review", error: "File over 25 MB; not processed." });
    }

    const dl = await db.storage.from(BUCKET).download(doc.storage_path);
    if (dl.error || !dl.data) return await fail("Could not read the file from storage.");
    const buffer = Buffer.from(await dl.data.arrayBuffer());

    const r = await extractText(buffer, doc.file_name);
    let note = r.error || null;
    if (r.needsOcr && !r.error && ocrConfigured()) {
      // optional external OCR (OCR.space); if it is not set up, the admin's browser can do the OCR instead
      const signed = await db.storage.from(BUCKET).createSignedUrl(doc.storage_path, 300);
      const o = signed.data?.signedUrl ? await ocrFromUrl(signed.data.signedUrl, doc.file_name) : { error: "Could not create a link for OCR." };
      if (o.text) { r.text = o.text; r.source = "ocr"; } else note = o.error;
    }
    if (!r.text && r.error && !r.needsOcr) return await fail(r.error);

    const stillNeedsOcr = !r.text && r.needsOcr && !r.error;
    if (stillNeedsOcr && !note) note = 'Scanned file: text not read yet. Use "Run OCR in this browser".';
    const { error, update } = await saveExtraction(db, doc, { text: r.text, source: r.source, pages: r.pages, note });
    if (error) return await fail("Could not save the extracted details.");
    return NextResponse.json({ status: update.status, error: note, needsOcr: stillNeedsOcr, source: r.source, chars: (r.text || "").length });
  } catch (e) {
    return await fail(`Processing error: ${String(e.message || e).slice(0, 200)}`);
  }
}
