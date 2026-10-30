"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ocrStored, canOcr } from "@/lib/ocrClient";
import PublishPanel from "./PublishPanel";

const STATUS = ["needs_review", "reviewed", "archived", "uploaded", "failed", "duplicate"];
const extOf = (n) => String(n).split(".").pop().toLowerCase();

export default function ArchiveEditor({ doc, text, textLength, universities, subjects }) {
  const router = useRouter();
  const sug = doc.suggested || {};
  const [f, setF] = useState({
    title: doc.title || "", university_id: doc.university_id || "", university_name: "", subject_id: doc.subject_id || "", subject_name: "",
    module_code: doc.module_code || "", doc_type: doc.doc_type || "", keywords: (doc.keywords || []).join(", "), notes: doc.notes || "", status: doc.status,
  });
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const ext = extOf(doc.file_name);

  async function save() {
    setBusy(true); setMsg("");
    const body = { ...f };
    if (!body.university_name) delete body.university_name;
    if (!body.subject_name) delete body.subject_name;
    const res = await fetch(`/api/admin/archive/${doc.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    setMsg(res.ok ? "Saved." : d.error || "Could not save.");
    if (res.ok) router.refresh();
  }
  async function reprocess() {
    setBusy(true); setMsg("Reading the file again...");
    const res = await fetch("/api/admin/archive/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: doc.id }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false); setMsg(res.ok ? `Done${d.error ? ": " + d.error : "."}` : d.error || "Failed.");
    router.refresh();
  }
  async function runOcr() {
    setBusy(true); setMsg("Starting OCR (the first run downloads the OCR engine)...");
    try {
      const o = await ocrStored(doc.id, doc.file_name, (p) => setMsg(`Reading page ${p.page} of ${p.pages}${p.fraction ? ` · ${Math.round(p.fraction * 100)}%` : ""}`));
      setMsg(o.error ? `OCR finished: ${o.error}` : "OCR finished. Text and suggestions updated.");
    } catch (e) { setMsg(`OCR failed: ${String(e.message || e)}`); }
    setBusy(false); router.refresh();
  }
  async function remove() {
    if (!confirm("Permanently delete this document and its file?")) return;
    const res = await fetch(`/api/admin/archive/${doc.id}`, { method: "DELETE" });
    if (res.ok) { router.push("/admin/archive"); router.refresh(); } else setMsg("Could not delete.");
  }

  const Chip = ({ label, onUse }) => (<button type="button" className="chip" onClick={onUse}>Use: {label}</button>);
  const pct = (s) => `${Math.round((s.confidence || 0) * 100)}%`;

  return (
    <div className="adm-two">
      <div>
        <div className="card">
          <p><span className={`badge ${doc.status}`}>{doc.status.replace("_", " ")}</span> {doc.size_bytes ? `· ${(doc.size_bytes / 1024).toFixed(0)} KB` : ""} {doc.text_source && doc.text_source !== "none" ? `· text from ${doc.text_source}` : ""}</p>
          {doc.error && <p className="err">{doc.error}</p>}
          {doc.duplicate_of && <p className="notice">Duplicate of <Link href={`/admin/archive/${doc.duplicate_of}`}>another document</Link>.</p>}
          {doc.source_path && <p className="fine">From: {doc.source_path}</p>}
          <div className="adm-actions">
            <a className="btn ghost sm" href={`/api/admin/archive/file?id=${doc.id}&download=1`}>Download</a>
            <button className="btn ghost sm" disabled={busy} onClick={reprocess}>Re-read text</button>
            {canOcr(doc.file_name) && <button className="btn ghost sm" disabled={busy} onClick={runOcr}>Run OCR in this browser</button>}
            <button className="btn ghost sm danger" disabled={busy} onClick={remove}>Delete</button>
          </div>
        </div>
        <h2>Preview</h2>
        {ext === "pdf" && <iframe title="PDF preview" className="preview" src={`/api/admin/archive/file?id=${doc.id}`} />}
        {["jpg", "jpeg", "png", "webp", "gif"].includes(ext) && <img className="preview-img" alt={doc.file_name} src={`/api/admin/archive/file?id=${doc.id}`} />}
        {!["pdf", "jpg", "jpeg", "png", "webp", "gif"].includes(ext) && <p className="fine">No visual preview for this file type. Use Download, or read the extracted text below.</p>}
        <h2>Extracted text {textLength > text.length && <small>(first {text.length} of {textLength} characters)</small>}</h2>
        {text ? <pre className="extracted">{text}</pre> : <p className="fine">No text was extracted.</p>}
      </div>

      <div className="helpform">
        <h2>Details</h2>
        <label>Title{sug.title && <Chip label={`${sug.title.value} (${pct(sug.title)})`} onUse={() => set("title", sug.title.value)} />}
          <input value={f.title} onChange={(e) => set("title", e.target.value)} maxLength={200} /></label>
        <label>University{sug.university && <Chip label={`${sug.university.value} (${pct(sug.university)})`} onUse={() => sug.university.id ? set("university_id", sug.university.id) : set("university_name", sug.university.value)} />}
          <select value={f.university_id} onChange={(e) => { set("university_id", e.target.value); set("university_name", ""); }}><option value="">None</option>{universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
          <input placeholder="…or type a new university" value={f.university_name} onChange={(e) => set("university_name", e.target.value)} /></label>
        <label>Subject{sug.subject && <Chip label={`${sug.subject.value} (${pct(sug.subject)})`} onUse={() => { set("subject_id", sug.subject.id); set("subject_name", ""); }} />}
          <select value={f.subject_id} onChange={(e) => { set("subject_id", e.target.value); set("subject_name", ""); }}><option value="">None</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label>Module code{sug.module_code && <Chip label={`${sug.module_code.value} (${pct(sug.module_code)})`} onUse={() => set("module_code", sug.module_code.value)} />}
          <input value={f.module_code} onChange={(e) => set("module_code", e.target.value)} maxLength={30} /></label>
        <label>Document type{sug.doc_type && <Chip label={`${sug.doc_type.value} (${pct(sug.doc_type)})`} onUse={() => set("doc_type", sug.doc_type.value)} />}
          <input value={f.doc_type} onChange={(e) => set("doc_type", e.target.value)} maxLength={60} /></label>
        <label>Keywords (comma separated){sug.keywords && <Chip label={sug.keywords.value.join(", ")} onUse={() => set("keywords", sug.keywords.value.join(", "))} />}
          <input value={f.keywords} onChange={(e) => set("keywords", e.target.value)} /></label>
        <label>Private notes<textarea rows={3} value={f.notes} onChange={(e) => set("notes", e.target.value)} maxLength={2000} /></label>
        <label>Status<select value={f.status} onChange={(e) => set("status", e.target.value)}>{STATUS.map((s) => <option key={s} value={s}>{s.replace("_", " ")}</option>)}</select></label>
        {msg && <p className="fine" role="status">{msg}</p>}
        <button className="btn" disabled={busy} onClick={save}>Save</button>
        <PublishPanel doc={doc} form={f} />
      </div>
    </div>
  );
}
