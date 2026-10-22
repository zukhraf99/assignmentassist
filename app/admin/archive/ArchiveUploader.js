"use client";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { ocrBlob } from "@/lib/ocrClient";

const ALLOWED = ["pdf", "doc", "docx", "txt", "jpg", "jpeg", "png", "webp", "tif", "tiff", "gif"];
const MAX_BYTES = 50 * 1024 * 1024;
const CONCURRENCY = 3;
const MIME = {
  pdf: "application/pdf", doc: "application/msword", txt: "text/plain", jpg: "image/jpeg", jpeg: "image/jpeg",
  png: "image/png", webp: "image/webp", tif: "image/tiff", tiff: "image/tiff", gif: "image/gif",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};
const extOf = (n) => String(n).split(".").pop().toLowerCase();

async function sha256(file) {
  const h = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
  return [...new Uint8Array(h)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
async function post(url, body) {
  const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error || `Request failed (${r.status})`);
  return d;
}
const STATE_LABEL = { queued: "Waiting", hashing: "Checking", uploading: "Uploading", processing: "Reading text", ocr: "Reading scan (OCR)", done: "Done", review: "Done (needs review)", duplicate: "Duplicate, skipped", failed: "Failed" };

export default function ArchiveUploader() {
  const router = useRouter();
  const [items, setItems] = useState([]);
  const [batch, setBatch] = useState(() => new Date().toISOString().slice(0, 10));
  const [running, setRunning] = useState(false);
  const [note, setNote] = useState("");
  const [browserOcr, setBrowserOcr] = useState(true);
  const ocrOn = useRef(true);
  const seen = useRef(new Set());
  const supa = useRef(null);
  const itemsRef = useRef([]);

  const patch = (key, p) => { itemsRef.current = itemsRef.current.map((i) => (i.key === key ? { ...i, ...p } : i)); setItems(itemsRef.current); };

  async function expand(fileList) {
    const out = [];
    for (const f of fileList) {
      const e = extOf(f.name);
      if (e === "zip") {
        try {
          const JSZip = (await import("jszip")).default;
          const zip = await JSZip.loadAsync(f);
          for (const [path, entry] of Object.entries(zip.files)) {
            const base = path.split("/").pop();
            if (entry.dir || path.startsWith("__MACOSX/") || base.startsWith(".")) continue;
            if (!ALLOWED.includes(extOf(base))) { out.push({ name: base, size: 0, state: "failed", message: "Unsupported file type", sourcePath: `${f.name}/${path}` }); continue; }
            out.push({ name: base, size: 0, sourcePath: `${f.name}/${path}`, getFile: async () => new File([await entry.async("blob")], base, { type: MIME[extOf(base)] || "" }) });
          }
        } catch { out.push({ name: f.name, size: f.size, state: "failed", message: "Could not open this ZIP file" }); }
      } else if (!ALLOWED.includes(e)) {
        out.push({ name: f.name, size: f.size, state: "failed", message: "Unsupported file type" });
      } else {
        out.push({ name: f.name, size: f.size, sourcePath: f.webkitRelativePath || "", getFile: async () => f });
      }
    }
    return out.map((o, i) => ({ key: `${Date.now()}-${itemsRef.current.length + i}`, state: "queued", message: "", docId: null, ...o }));
  }

  async function handleFiles(fileList) {
    const files = Array.from(fileList || []);
    if (!files.length) return;
    setNote("Preparing files...");
    const added = await expand(files);
    itemsRef.current = [...itemsRef.current, ...added];
    setItems(itemsRef.current);
    setNote("");
    await run(added.filter((i) => i.state === "queued"));
  }

  async function work(item) {
    try {
      if (!item.docId) {
        patch(item.key, { state: "hashing", message: "" });
        const file = await item.getFile();
        if (file.size > MAX_BYTES) throw new Error("File is over 50 MB");
        const hash = await sha256(file);
        if (seen.current.has(hash)) { patch(item.key, { state: "duplicate", message: "Same file appears twice in this import" }); return; }
        seen.current.add(hash);
        const chk = await post("/api/admin/archive/check", { hash });
        if (chk.duplicate) { patch(item.key, { state: "duplicate", message: `Already in the archive as "${chk.duplicate.file_name}"` }); return; }
        patch(item.key, { state: "uploading", size: file.size });
        const up = await post("/api/admin/archive/upload-url", { filename: file.name });
        if (!supa.current) supa.current = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
        const { error } = await supa.current.storage.from("archive").uploadToSignedUrl(up.path, up.token, file, { contentType: MIME[extOf(file.name)] });
        if (error) throw new Error("Upload failed: " + error.message);
        const reg = await post("/api/admin/archive/register", { path: up.path, fileName: file.name, size: file.size, mime: MIME[extOf(file.name)], sha256: hash, batch, sourcePath: item.sourcePath });
        item.docId = reg.id;
        patch(item.key, { docId: reg.id });
      }
      patch(item.key, { state: "processing" });
      const r = await post("/api/admin/archive/process", { id: item.docId });
      if (r.status === "failed") { patch(item.key, { state: "failed", message: r.error || "Processing failed" }); return; }
      if (r.needsOcr && ocrOn.current) {
        patch(item.key, { state: "ocr", message: "Starting OCR (the first scan downloads the OCR engine)..." });
        try {
          const file = await item.getFile();
          const o = await ocrBlob(item.docId, file, file.name, (pr) =>
            patch(item.key, { message: `Page ${pr.page} of ${pr.pages}${pr.fraction ? ` · ${Math.round(pr.fraction * 100)}%` : ""}` }));
          patch(item.key, { state: o.error ? "review" : "done", message: o.error || "" });
        } catch (e) {
          patch(item.key, { state: "review", message: `Saved, but OCR failed: ${String(e.message || e)}. You can retry from the document page.` });
        }
        return;
      }
      patch(item.key, { state: r.error ? "review" : "done", message: r.error || "" });
    } catch (e) {
      patch(item.key, { state: "failed", message: String(e.message || e) });
    }
  }

  async function run(list) {
    if (!list.length) return;
    setRunning(true);
    let next = 0;
    const lane = async () => { while (next < list.length) { const it = itemsRef.current.find((x) => x.key === list[next++].key); if (it) await work(it); } };
    await Promise.all(Array.from({ length: Math.min(CONCURRENCY, list.length) }, lane));
    setRunning(false);
    router.refresh();
  }

  const count = (s) => items.filter((i) => i.state === s).length;
  const finished = items.filter((i) => ["done", "review", "duplicate", "failed"].includes(i.state)).length;
  const failed = items.filter((i) => i.state === "failed" && i.getFile);

  return (
    <section className="adm-section">
      <h2>Upload documents</h2>
      <p className="fine">PDF, Word (.doc/.docx), text, and images (JPG, PNG, WEBP, TIFF, GIF), up to 50 MB each. ZIP files are opened in your browser and each file is imported. Keep this tab open while it runs. Files go to private storage and are never public.</p>
      <label className="inline">Batch name <input value={batch} onChange={(e) => setBatch(e.target.value)} maxLength={80} /></label>
      <label className="check">
        <input type="checkbox" checked={browserOcr} onChange={(e) => { setBrowserOcr(e.target.checked); ocrOn.current = e.target.checked; }} />
        <span>Read scanned files and photos with free OCR in this browser (slower; nothing leaves your computer; keep this tab open)</span>
      </label>
      <div className="dropzone" onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}>
        <p>Drag files or a ZIP here</p>
        <div className="adm-actions">
          <label className="btn">Choose files<input type="file" multiple hidden accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.webp,.tif,.tiff,.gif,.zip" onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} /></label>
          <label className="btn ghost">Choose a folder<input type="file" hidden webkitdirectory="" directory="" multiple onChange={(e) => { handleFiles(e.target.files); e.target.value = ""; }} /></label>
        </div>
      </div>
      {note && <p className="fine">{note}</p>}
      {items.length > 0 && (
        <>
          <div className="progress" role="progressbar" aria-valuenow={finished} aria-valuemax={items.length}><div style={{ width: `${(finished / items.length) * 100}%` }} /></div>
          <p className="fine">{finished} of {items.length} finished · {count("done") + count("review")} imported · {count("duplicate")} duplicates · {count("failed")} failed{running ? " · working..." : ""}</p>
          <div className="adm-actions">
            {failed.length > 0 && !running && <button className="btn ghost sm" onClick={() => { failed.forEach((i) => patch(i.key, { state: "queued", message: "" })); run(failed); }}>Retry {failed.length} failed</button>}
            {!running && <button className="btn ghost sm" onClick={() => { itemsRef.current = []; setItems([]); seen.current = new Set(); }}>Clear list</button>}
          </div>
          <div className="adm-table-wrap upl-list"><table className="adm-table">
            <thead><tr><th>File</th><th>Status</th><th>Notes</th></tr></thead>
            <tbody>{items.slice(-300).map((i) => (
              <tr key={i.key}><td>{i.name}</td><td><span className={`badge ${i.state}`}>{STATE_LABEL[i.state]}</span></td><td className="fine">{i.message}</td></tr>))}
            </tbody>
          </table></div>
        </>
      )}
    </section>
  );
}
