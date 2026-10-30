"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import RichText from "../../../components/RichText";
import { slugify } from "@/lib/slug";

// Moves an archive document to the public site as a Guide (post), filed under its subject / university.
export default function PublishPanel({ doc, form }) {
  const router = useRouter();
  const [g, setG] = useState(null);
  const [existing, setExisting] = useState(!!doc.guide_id);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const set = (k, v) => setG((p) => ({ ...p, [k]: v }));

  async function open() {
    setBusy(true); setMsg({ type: "", text: "" });
    const res = await fetch(`/api/admin/archive/${doc.id}/publish`);
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg({ type: "err", text: d.error || "Could not prepare the post." }); return; }
    setExisting(d.existing); setSlugTouched(d.existing); setG(d.guide);
  }

  async function submit(status) {
    setBusy(true); setMsg({ type: "", text: "" });
    const payload = {
      ...g, status, topic: form.doc_type, module_code: form.module_code,
      subject_id: form.subject_id || null, university_id: form.university_id || null,
    };
    const res = await fetch(`/api/admin/archive/${doc.id}/publish`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const d = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) { setMsg({ type: "err", text: d.error || "Could not publish." }); return; }
    setExisting(true); set("status", status);
    setMsg({ type: "ok", text: status === "published" ? "Published. It now shows on the site under its subject." : "Saved as a draft guide (not public)." });
    router.refresh();
  }

  const live = g?.status === "published";
  return (
    <div className="card">
      <h2>Publish to site</h2>
      {!g && (
        <>
          <p className="fine">{existing ? "This document already has a post on the site." : "Turn this document into a public post (a Guide). The file itself stays private; only the text you approve is published."}</p>
          <button className="btn" disabled={busy} onClick={open}>{existing ? "Edit published post" : "Prepare post"}</button>
        </>
      )}
      {g && (
        <div className="helpform">
          <p className="fine">Filed under: <b>{form.subject_id ? "selected subject" : "no subject yet"}</b>{form.university_id ? " · university selected" : ""}. Subject, university, module and type come from the Details form on this page. Save it first if you changed them.</p>
          <label>Title<input value={g.title} maxLength={140} onChange={(e) => { set("title", e.target.value); if (!slugTouched) set("slug", slugify(e.target.value)); }} /></label>
          <label>Page address (/guides/…)<input value={g.slug} maxLength={80} onChange={(e) => { setSlugTouched(true); set("slug", e.target.value); }} /></label>
          <label>Short summary (shown in lists)<textarea rows={2} maxLength={300} value={g.summary} onChange={(e) => set("summary", e.target.value)} /></label>
          <label>Post text (edit freely; this is what the public sees)
            <textarea rows={14} value={g.body} onChange={(e) => set("body", e.target.value)} /></label>
          <p className="fine">Format: <code>## Heading</code>, <code>- bullet</code>, <code>**bold**</code>. Blank line = new paragraph. Remove names, personal details and anything you do not want public.</p>
          <button type="button" className="btn ghost sm" onClick={() => setPreview(!preview)}>{preview ? "Hide preview" : "Show preview"}</button>
          {preview && <div className="card"><RichText body={g.body} /></div>}
          <label>SEO title (optional)<input value={g.meta_title} maxLength={70} onChange={(e) => set("meta_title", e.target.value)} /></label>
          <label>SEO description (50–170 characters, required to publish)<textarea rows={2} maxLength={170} value={g.meta_description} onChange={(e) => set("meta_description", e.target.value)} /></label>
          <label className="check">
            <input type="checkbox" checked={!!g.original_confirmed} onChange={(e) => set("original_confirmed", e.target.checked)} />
            <span>I own this content and am happy for it to be public. It does not copy a university brief, a client's private work or other people's published material.</span>
          </label>
          {msg.text && <p className={msg.type === "err" ? "err" : "ok"} role="status">{msg.text}</p>}
          <div className="adm-actions">
            <button className="btn" disabled={busy} onClick={() => submit("published")}>{live ? "Save & keep published" : "Publish"}</button>
            <button className="btn ghost" disabled={busy} onClick={() => submit("draft")}>{live ? "Unpublish (make draft)" : "Save as draft"}</button>
            {doc.guide_id && <Link className="btn ghost" href={`/admin/guides/${doc.guide_id}`}>Open in Guides</Link>}
            {live && <a className="btn ghost" href={`/guides/${g.slug}`} target="_blank" rel="noopener noreferrer">View live post</a>}
          </div>
        </div>
      )}
      {!g && msg.text && <p className={msg.type === "err" ? "err" : "ok"} role="status">{msg.text}</p>}
    </div>
  );
}
