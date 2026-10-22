"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function TaxonomyManager({ kind, title, extraLabel, items }) {
  const router = useRouter();
  const [msg, setMsg] = useState("");
  const [edits, setEdits] = useState({});
  const [merge, setMerge] = useState({});

  async function call(body) {
    setMsg("");
    const res = await fetch("/api/admin/taxonomy", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind, ...body }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { setMsg(data.error || "Failed."); return false; }
    router.refresh(); return true;
  }
  async function add(e) {
    e.preventDefault();
    const f = e.currentTarget, fd = new FormData(f);
    if (await call({ action: "create", name: fd.get("name"), extra: fd.get("extra") })) f.reset();
  }
  const val = (it, k) => edits[it.id]?.[k] ?? it[k];
  const edit = (id, k, v) => setEdits((p) => ({ ...p, [id]: { ...p[id], [k]: v } }));

  return (
    <section className="adm-section">
      <h2>{title}</h2>
      {msg && <p className="err">{msg}</p>}
      <div className="adm-table-wrap"><table className="adm-table">
        <thead><tr><th>Name</th><th>{extraLabel}</th><th>Actions</th></tr></thead>
        <tbody>
          {items.map((it) => (
            <tr key={it.id}>
              <td><input value={val(it, "name")} onChange={(e) => edit(it.id, "name", e.target.value)} /></td>
              <td><input value={val(it, "extra")} onChange={(e) => edit(it.id, "extra", e.target.value)} /></td>
              <td className="adm-actions">
                <button className="btn ghost sm" onClick={() => call({ action: "update", id: it.id, name: val(it, "name"), extra: val(it, "extra") })}>Save</button>
                <select value={merge[it.id] || ""} onChange={(e) => setMerge((p) => ({ ...p, [it.id]: e.target.value }))} aria-label="Merge into">
                  <option value="">Merge into…</option>{items.filter((o) => o.id !== it.id).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
                <button className="btn ghost sm" disabled={!merge[it.id]} onClick={() => confirm(`Merge "${it.name}" into the selected item? "${it.name}" will be removed.`) && call({ action: "merge", fromId: it.id, toId: merge[it.id] })}>Merge</button>
                <button className="btn ghost sm danger" onClick={() => confirm(`Delete "${it.name}"? Items using it become uncategorised.`) && call({ action: "delete", id: it.id })}>Delete</button>
              </td>
            </tr>))}
          {!items.length && <tr><td colSpan={3}>None yet.</td></tr>}
        </tbody>
      </table></div>
      <form className="adm-add" onSubmit={add}>
        <input name="name" placeholder={`New ${kind} name`} required maxLength={120} />
        <input name="extra" placeholder={extraLabel} />
        <button className="btn sm">Add</button>
      </form>
    </section>
  );
}
