"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ocrStored, canOcr } from "@/lib/ocrClient";

export default function ArchiveTable({ rows, universities, subjects }) {
  const router = useRouter();
  const [sel, setSel] = useState(new Set());
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [uni, setUni] = useState(""), [sub, setSub] = useState(""), [type, setType] = useState(""), [kw, setKw] = useState("");

  const toggle = (id) => setSel((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const all = rows.length > 0 && rows.every((r) => sel.has(r.id));
  const ids = [...sel];

  async function bulk(action, value) {
    if (!ids.length) return;
    setBusy(true); setMsg("");
    const res = await fetch("/api/admin/archive/bulk", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, action, value }) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg(d.error || "Failed."); return; }
    setMsg(`Updated ${d.count} document${d.count === 1 ? "" : "s"}.`);
    if (action === "delete") setSel(new Set());
    router.refresh();
  }

  async function runOcr() {
    const targets = rows.filter((r) => sel.has(r.id) && canOcr(r.file_name));
    if (!targets.length) { setMsg("None of the selected files is a PDF or image."); return; }
    setBusy(true);
    let n = 0, ok = 0, bad = 0;
    for (const r of targets) {
      n++;
      const label = `OCR ${n} of ${targets.length}: ${r.file_name}`;
      setMsg(label + "...");
      try {
        const o = await ocrStored(r.id, r.file_name, (p) => setMsg(`${label} (page ${p.page}/${p.pages})`));
        o.error ? bad++ : ok++;
      } catch { bad++; }
    }
    setBusy(false); setMsg(`OCR finished: ${ok} read, ${bad} could not be read.`); router.refresh();
  }

  async function reprocess() {
    setBusy(true);
    let n = 0;
    for (const id of ids) {
      setMsg(`Reprocessing ${++n} of ${ids.length}...`);
      await fetch("/api/admin/archive/process", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) }).catch(() => {});
    }
    setBusy(false); setMsg(`Reprocessed ${ids.length}.`); router.refresh();
  }

  return (
    <>
      {ids.length > 0 && (
        <div className="bulkbar">
          <b>{ids.length} selected</b>
          <span><select value={uni} onChange={(e) => setUni(e.target.value)}><option value="">University…</option><option value="none">(clear)</option>{universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select>
            <button className="btn ghost sm" disabled={busy || !uni} onClick={() => bulk("set_university", uni === "none" ? null : uni)}>Apply</button></span>
          <span><select value={sub} onChange={(e) => setSub(e.target.value)}><option value="">Subject…</option><option value="none">(clear)</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
            <button className="btn ghost sm" disabled={busy || !sub} onClick={() => bulk("set_subject", sub === "none" ? null : sub)}>Apply</button></span>
          <span><input placeholder="Type, e.g. Report" value={type} onChange={(e) => setType(e.target.value)} /><button className="btn ghost sm" disabled={busy || !type} onClick={() => bulk("set_type", type)}>Apply</button></span>
          <span><input placeholder="Add keywords" value={kw} onChange={(e) => setKw(e.target.value)} /><button className="btn ghost sm" disabled={busy || !kw} onClick={() => bulk("add_keywords", kw)}>Add</button></span>
          <button className="btn ghost sm" disabled={busy} onClick={() => bulk("set_status", "reviewed")}>Mark reviewed</button>
          <button className="btn ghost sm" disabled={busy} onClick={() => bulk("set_status", "archived")}>Archive</button>
          <button className="btn ghost sm" disabled={busy} onClick={reprocess}>Re-read text</button>
          <button className="btn ghost sm" disabled={busy} onClick={runOcr}>Run OCR in this browser</button>
          <button className="btn ghost sm danger" disabled={busy} onClick={() => confirm(`Permanently delete ${ids.length} document(s) and their files?`) && bulk("delete")}>Delete</button>
        </div>
      )}
      {msg && <p className="fine">{msg}</p>}
      <div className="adm-table-wrap"><table className="adm-table">
        <thead><tr>
          <th><input type="checkbox" checked={all} onChange={() => setSel(all ? new Set() : new Set(rows.map((r) => r.id)))} aria-label="Select all on this page" /></th>
          <th>Document</th><th>University</th><th>Subject</th><th>Module</th><th>Type</th><th>Status</th><th>Added</th>
        </tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id}>
              <td><input type="checkbox" checked={sel.has(r.id)} onChange={() => toggle(r.id)} aria-label={`Select ${r.file_name}`} /></td>
              <td><Link href={`/admin/archive/${r.id}`}>{r.title || r.file_name}</Link>{r.title && <div className="fine">{r.file_name}</div>}</td>
              <td>{r.university?.name || "-"}</td><td>{r.subject?.name || "-"}</td><td>{r.module_code || "-"}</td><td>{r.doc_type || "-"}</td>
              <td><span className={`badge ${r.status}`} title={r.error || ""}>{r.status.replace("_", " ")}</span>{r.error && <span title={r.error}> ⚠</span>}</td>
              <td className="fine">{new Date(r.created_at).toLocaleDateString()}</td>
            </tr>))}
          {!rows.length && <tr><td colSpan={8}>No documents match.</td></tr>}
        </tbody>
      </table></div>
    </>
  );
}
