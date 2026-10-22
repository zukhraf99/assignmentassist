import { suggest, autoFields } from "./suggest";

// Saves extracted text + suggestions for one document. Never overwrites fields an admin already filled in.
export async function saveExtraction(db, doc, { text, source, pages, note }) {
  const [{ data: universities }, { data: subjects }] = await Promise.all([
    db.from("universities").select("id, name, aliases"),
    db.from("subjects").select("id, name, keywords"),
  ]);
  const sug = suggest({ text, fileName: doc.file_name, universities: universities || [], subjects: subjects || [] });
  const auto = autoFields(sug);
  const update = {
    extracted_text: text || null, text_source: source, page_count: pages ?? doc.page_count ?? null,
    suggested: sug, error: note || null, updated_at: new Date().toISOString(),
  };
  for (const [k, v] of Object.entries(auto)) if (!doc[k]) update[k] = v;
  update.status = ["duplicate", "reviewed", "archived"].includes(doc.status) ? doc.status : "needs_review";
  if (!doc.keywords?.length && sug.keywords) update.keywords = sug.keywords.value;
  const { error } = await db.from("archive_documents").update(update).eq("id", doc.id);
  return { error, update };
}
