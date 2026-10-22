import { adminClient } from "./server";

// Public queries. Every one of them only ever returns PUBLISHED guides.
const LIST_COLS = "id, slug, title, summary, topic, module_code, published_at, updated_at, subject:subjects(name, slug), university:universities(name, slug)";
const strip = (s) => String(s || "").replace(/[%,()*\\]/g, " ").trim().slice(0, 80);

export async function getGuide(slug) {
  try {
    const { data } = await adminClient().from("guides")
      .select("*, subject:subjects(name, slug), university:universities(name, slug)")
      .eq("slug", slug).eq("status", "published").maybeSingle();
    return data || null;
  } catch { return null; }
}

export async function listGuides({ q, subjectSlug, universitySlug, module, topic, page = 1, pageSize = 12 } = {}) {
  const empty = { items: [], total: 0, page: 1, pages: 1 };
  try {
    const db = adminClient();
    let query = db.from("guides").select(LIST_COLS, { count: "exact" }).eq("status", "published");
    if (subjectSlug) {
      const { data } = await db.from("subjects").select("id").eq("slug", subjectSlug).maybeSingle();
      if (!data) return empty;
      query = query.eq("subject_id", data.id);
    }
    if (universitySlug) {
      const { data } = await db.from("universities").select("id").eq("slug", universitySlug).maybeSingle();
      if (!data) return empty;
      query = query.eq("university_id", data.id);
    }
    if (strip(module)) query = query.ilike("module_code", `%${strip(module)}%`);
    if (strip(topic)) query = query.eq("topic", strip(topic));
    if (strip(q)) query = query.textSearch("tsv", strip(q), { type: "websearch", config: "english" });
    const p = Math.max(1, parseInt(page, 10) || 1);
    const { data, count, error } = await query.order("published_at", { ascending: false }).range((p - 1) * pageSize, p * pageSize - 1);
    if (error) throw error;
    return { items: data || [], total: count || 0, page: p, pages: Math.max(1, Math.ceil((count || 0) / pageSize)) };
  } catch { return { ...empty, error: true }; }
}

// Options for the filter menus: only values that have at least one published guide.
export async function getFilterOptions() {
  try {
    const db = adminClient();
    const { data } = await db.from("guides").select("subject_id, university_id, topic").eq("status", "published").limit(2000);
    const rows = data || [];
    const count = (key) => rows.reduce((m, r) => (r[key] ? m.set(r[key], (m.get(r[key]) || 0) + 1) : m), new Map());
    const subj = count("subject_id"), uni = count("university_id");
    const [{ data: subjects }, { data: universities }] = await Promise.all([
      subj.size ? db.from("subjects").select("id, name, slug").in("id", [...subj.keys()]) : { data: [] },
      uni.size ? db.from("universities").select("id, name, slug").in("id", [...uni.keys()]) : { data: [] },
    ]);
    const topics = [...new Set(rows.map((r) => r.topic).filter(Boolean))].sort();
    return {
      subjects: (subjects || []).map((s) => ({ ...s, count: subj.get(s.id) })).sort((a, b) => a.name.localeCompare(b.name)),
      universities: (universities || []).map((u) => ({ ...u, count: uni.get(u.id) })).sort((a, b) => a.name.localeCompare(b.name)),
      topics,
    };
  } catch { return { subjects: [], universities: [], topics: [] }; }
}

export async function getRelated(guide, limit = 4) {
  try {
    const parts = [];
    if (guide.subject_id) parts.push(`subject_id.eq.${guide.subject_id}`);
    if (guide.university_id) parts.push(`university_id.eq.${guide.university_id}`);
    if (!parts.length) return [];
    const { data } = await adminClient().from("guides").select(LIST_COLS).eq("status", "published")
      .neq("id", guide.id).or(parts.join(",")).order("published_at", { ascending: false }).limit(limit);
    return data || [];
  } catch { return []; }
}

// For the sitemap: published guides, and category pages that have at least 2 guides.
export async function sitemapGuides() {
  try {
    const db = adminClient();
    const { data } = await db.from("guides").select("slug, updated_at, subject:subjects(slug), university:universities(slug)").eq("status", "published").limit(5000);
    const rows = data || [];
    const tally = (pick) => rows.reduce((m, r) => { const s = pick(r); return s ? m.set(s, (m.get(s) || 0) + 1) : m; }, new Map());
    const subjects = [...tally((r) => r.subject?.slug)].filter(([, n]) => n >= 2).map(([s]) => s);
    const universities = [...tally((r) => r.university?.slug)].filter(([, n]) => n >= 2).map(([s]) => s);
    return { guides: rows.map((r) => ({ slug: r.slug, updated: r.updated_at })), subjects, universities };
  } catch { return { guides: [], subjects: [], universities: [] }; }
}
