"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import RichText from "../../components/RichText";
import { slugify } from "@/lib/slug";

export default function GuideForm({ guide, subjects, universities }) {
  const router = useRouter();
  const [g, setG] = useState({
    title: "", slug: "", summary: "", body: "", meta_title: "", meta_description: "", university_id: "", subject_id: "",
    module_code: "", topic: "", official_brief_url: "", original_confirmed: false, status: "draft", ...(guide || {}),
  });
  const [slugTouched, setSlugTouched] = useState(!!guide);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const set = (k, v) => setG((p) => ({ ...p, [k]: v }));

  async function save(status) {
    setBusy(true); setMsg({ type: "", text: "" });
    const payload = { ...g, status: status || g.status };
    const res = await fetch(guide ? `/api/admin/guides/${guide.id}` : "/api/admin/guides", {
      method: guide ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg({ type: "err", text: data.error || "Could not save." }); return; }
    if (!guide) { router.push(`/admin/guides/${data.id}`); router.refresh(); return; }
    set("status", payload.status);
    setMsg({ type: "ok", text: payload.status === "published" ? "Saved and published." : "Saved." });
    router.refresh();
  }

  async function remove() {
    if (!confirm("Delete this guide permanently?")) return;
    const res = await fetch(`/api/admin/guides/${guide.id}`, { method: "DELETE" });
    if (res.ok) { router.push("/admin/guides"); router.refresh(); } else setMsg({ type: "err", text: "Could not delete." });
  }

  return (
    <div className="helpform">
      <label>Title<input value={g.title} maxLength={140} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></label>
      <label>Page address (/guides/…)<input value={g.slug} maxLength={80} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} /></label>
      <label>Short summary (shown in lists)<textarea rows={2} maxLength={300} value={g.summary || ""} onChange={(e) => set("summary", e.target.value)} /></label>
      <div className="row">
        <label>Subject<select value={g.subject_id || ""} onChange={(e) => set("subject_id", e.target.value)}><option value="">None</option>{subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</select></label>
        <label>University (optional)<select value={g.university_id || ""} onChange={(e) => set("university_id", e.target.value)}><option value="">None</option>{universities.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}</select></label>
      </div>
      <div className="row">
        <label>Module code (optional)<input value={g.module_code || ""} maxLength={30} onChange={(e) => set("module_code", e.target.value)} /></label>
        <label>Topic / assignment type<input value={g.topic || ""} maxLength={60} placeholder="e.g. Report, Case study, Lab report" onChange={(e) => set("topic", e.target.value)} /></label>
      </div>
      <label>Link to the official brief (optional, must start with https://)<input value={g.official_brief_url || ""} onChange={(e) => set("official_brief_url", e.target.value)} placeholder="https://…" /></label>
      <label>Guide text
        <textarea rows={16} value={g.body} onChange={(e) => set("body", e.target.value)}
          placeholder={"## A heading\nA paragraph.\n\n- bullet point\n1. numbered step\n\n**bold**  and  [link text](https://example.com)"} />
      </label>
      <p className="fine">Format: <code>## Heading</code>, <code>### Sub-heading</code>, <code>- bullet</code>, <code>1. step</code>, <code>**bold**</code>, <code>[text](https://link)</code>. Write in your own words. Do not paste text from a client's brief or any university document.</p>
      <button type="button" className="btn ghost" onClick={() => setPreview(!preview)}>{preview ? "Hide preview" : "Show preview"}</button>
      {preview && <div className="card"><RichText body={g.body} /></div>}
      <label>SEO title (optional, up to 70 characters)<input value={g.meta_title || ""} maxLength={70} onChange={(e) => set("meta_title", e.target.value)} /></label>
      <label>SEO description (50–170 characters, required to publish)<textarea rows={2} maxLength={170} value={g.meta_description || ""} onChange={(e) => set("meta_description", e.target.value)} /></label>
      <label className="check">
        <input type="checkbox" checked={!!g.original_confirmed} onChange={(e) => set("original_confirmed", e.target.checked)} />
        <span>I wrote this guide myself. It does not copy an assignment brief, a client's work or any other published material.</span>
      </label>
      {msg.text && <p className={msg.type === "err" ? "err" : "ok"} role="status">{msg.text}</p>}
      <div className="adm-actions">
        <button className="btn ghost" disabled={busy} onClick={() => save("draft")}>Save as draft</button>
        <button className="btn" disabled={busy} onClick={() => save("published")}>{g.status === "published" ? "Save & keep published" : "Publish"}</button>
        {guide && <button className="btn ghost danger" disabled={busy} onClick={remove}>Delete</button>}
      </div>
    </div>
  );
}
