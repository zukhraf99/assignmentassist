import { NextResponse } from "next/server";
import { guard } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";
import { isUuid } from "@/lib/archive";
import { slugify } from "@/lib/slug";
import { normalizeGuide, validateGuide } from "@/lib/guideValidate";
import { revalidateGuides } from "@/lib/revalidate";

const MIGRATION_MSG = "Run supabase/archive_publish.sql in the Supabase SQL Editor first (adds the guide_id column).";

// Turns extracted/OCR text into the simple guide format: blank-line separated paragraphs.
// Stray "#" markers are removed so OCR noise doesn't become headings by accident.
function cleanBody(text) {
  return String(text || "").replace(/\u0000/g, "").replace(/\r\n?/g, "\n").replace(/\f/g, "\n\n")
    .split("\n").map((l) => l.replace(/[ \t]+/g, " ").trim().replace(/^#{2,}\s*/, ""))
    .join("\n").replace(/\n{3,}/g, "\n\n").trim().slice(0, 60000);
}

async function freeSlug(db, base, ownGuideId) {
  const root = slugify(base) || "guide";
  for (let i = 0; i < 50; i++) {
    const s = i === 0 ? root : `${root.slice(0, 74)}-${i + 1}`;
    const { data } = await db.from("guides").select("id").eq("slug", s).maybeSingle();
    if (!data || data.id === ownGuideId) return s;
  }
  return `${root.slice(0, 70)}-${Date.now().toString(36)}`;
}

// GET: suggested post fields built from the archive document (nothing is saved).
export async function GET(req, { params }) {
  const denied = await guard(req); if (denied) return denied;
  if (!isUuid(params.id)) return NextResponse.json({ error: "Bad id." }, { status: 400 });
  try {
    const db = adminClient();
    const { data: doc, error } = await db.from("archive_documents")
      .select("id, file_name, title, extracted_text, module_code, doc_type, guide_id").eq("id", params.id).maybeSingle();
    if (error) return NextResponse.json({ error: /guide_id/.test(error.message || "") ? MIGRATION_MSG : "Could not load the document." }, { status: 500 });
    if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });

    let guide = null;
    if (doc.guide_id) {
      const { data } = await db.from("guides").select("*").eq("id", doc.guide_id).maybeSingle();
      guide = data || null;
    }
    if (guide) {
      return NextResponse.json({ ok: true, existing: true, guide: {
        id: guide.id, title: guide.title, slug: guide.slug, summary: guide.summary || "", body: guide.body,
        meta_title: guide.meta_title || "", meta_description: guide.meta_description || "", status: guide.status,
        original_confirmed: guide.original_confirmed,
      } });
    }
    const body = cleanBody(doc.extracted_text);
    const title = (doc.title || doc.file_name.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ")).trim().slice(0, 140);
    const firstPara = body.split(/\n\n/).find((p) => p.length > 60) || body;
    const summary = firstPara.replace(/\s+/g, " ").slice(0, 200).replace(/\s\S*$/, "").trim();
    return NextResponse.json({ ok: true, existing: false, guide: {
      title, slug: await freeSlug(db, title), summary, body, meta_title: "",
      meta_description: summary.length >= 50 ? summary.slice(0, 160) : "", status: "draft", original_confirmed: false,
    } });
  } catch {
    return NextResponse.json({ error: "Could not prepare the post." }, { status: 500 });
  }
}

// POST: create (or update) the public guide for this archive document.
export async function POST(req, { params }) {
  const denied = await guard(req); if (denied) return denied;
  if (!isUuid(params.id)) return NextResponse.json({ error: "Bad id." }, { status: 400 });
  try {
    const b = await req.json();
    const db = adminClient();
    const { data: doc, error: dErr } = await db.from("archive_documents")
      .select("id, guide_id, subject_id, university_id, module_code, doc_type").eq("id", params.id).maybeSingle();
    if (dErr) return NextResponse.json({ error: /guide_id/.test(dErr.message || "") ? MIGRATION_MSG : "Could not load the document." }, { status: 500 });
    if (!doc) return NextResponse.json({ error: "Document not found." }, { status: 404 });

    // Category/university/module/type come from the document's details form (the values sent by the page).
    const g = normalizeGuide({
      ...b,
      subject_id: b.subject_id ?? doc.subject_id, university_id: b.university_id ?? doc.university_id,
      module_code: b.module_code ?? doc.module_code, topic: b.topic ?? doc.doc_type,
    });
    const errors = validateGuide(g);
    if (g.status === "published" && !g.subject_id) errors.unshift("Choose a Subject for this document first. The post is filed under its subject.");
    if (errors.length) return NextResponse.json({ error: errors[0], errors }, { status: 400 });

    let guideId = null, oldPublished = null;
    if (doc.guide_id) {
      const { data: old } = await db.from("guides").select("id, published_at").eq("id", doc.guide_id).maybeSingle();
      if (old) { guideId = old.id; oldPublished = old.published_at; }
    }
    const now = new Date().toISOString();
    if (guideId) {
      const published_at = g.status === "published" ? oldPublished || now : oldPublished;
      const { error } = await db.from("guides").update({ ...g, published_at, updated_at: now }).eq("id", guideId);
      if (error) throw error;
    } else {
      const { data, error } = await db.from("guides").insert({ ...g, published_at: g.status === "published" ? now : null }).select("id").single();
      if (error) throw error;
      guideId = data.id;
      const { error: lErr } = await db.from("archive_documents").update({ guide_id: guideId }).eq("id", doc.id);
      if (lErr) return NextResponse.json({ error: MIGRATION_MSG }, { status: 500 });
    }
    revalidateGuides();
    return NextResponse.json({ ok: true, guideId, slug: g.slug, status: g.status });
  } catch (e) {
    if (e?.code === "23505") return NextResponse.json({ error: "That page address is already used by another guide. Change it and try again." }, { status: 409 });
    return NextResponse.json({ error: "Could not publish." }, { status: 500 });
  }
}
