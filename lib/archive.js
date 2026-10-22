export const BUCKET = "archive";
export const STATUSES = ["uploaded", "processing", "needs_review", "reviewed", "failed", "duplicate", "archived"];
export const isUuid = (s) => typeof s === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
export const safeName = (name) =>
  String(name || "file").replace(/[^a-zA-Z0-9._-]/g, "_").replace(/_+/g, "_").slice(-100) || "file";
export const cleanStr = (v, max) => {
  const s = String(v ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);
  return s || null;
};
export const toKeywords = (v) => {
  const arr = Array.isArray(v) ? v : String(v || "").split(",");
  return [...new Set(arr.map((k) => String(k).toLowerCase().replace(/[^\p{L}\p{N} -]/gu, "").trim()).filter(Boolean))].slice(0, 30);
};
