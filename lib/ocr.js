// OCR through the OCR.space API (external service). Needs OCR_SPACE_API_KEY in Vercel.
// Free keys have limits (about 1 MB per file and 3 PDF pages); see README_ADMIN.md.
import { cleanText, extOf } from "./extract";

export const ocrConfigured = () => !!process.env.OCR_SPACE_API_KEY;

export async function ocrFromUrl(fileUrl, fileName) {
  if (!ocrConfigured()) return { error: "OCR is not set up (add OCR_SPACE_API_KEY in Vercel)." };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 45000);
  try {
    const body = new URLSearchParams({
      apikey: process.env.OCR_SPACE_API_KEY, url: fileUrl, language: "eng", OCREngine: "2",
      scale: "true", isOverlayRequired: "false", filetype: extOf(fileName).toUpperCase(),
    });
    const res = await fetch("https://api.ocr.space/parse/image", {
      method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body, signal: ctrl.signal,
    });
    const j = await res.json();
    if (j.IsErroredOnProcessing) {
      const m = Array.isArray(j.ErrorMessage) ? j.ErrorMessage.join(" ") : String(j.ErrorMessage || "OCR failed");
      return { error: `OCR failed: ${m}`.slice(0, 300) };
    }
    const text = cleanText((j.ParsedResults || []).map((p) => p.ParsedText || "").join("\n"));
    return text ? { text } : { error: "OCR found no readable text." };
  } catch (e) {
    return { error: e.name === "AbortError" ? "OCR timed out." : `OCR failed: ${String(e.message || e).slice(0, 200)}` };
  } finally {
    clearTimeout(timer);
  }
}
