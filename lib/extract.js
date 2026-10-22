// Pulls text out of an uploaded file. Runs on the server (Node).
export const MAX_PROCESS_BYTES = 25 * 1024 * 1024; // larger files are stored but not processed
const IMAGE_EXT = ["jpg", "jpeg", "png", "webp", "tif", "tiff", "gif"];
export const ALLOWED_EXT = ["pdf", "doc", "docx", "txt", ...IMAGE_EXT];

export const extOf = (name) => String(name || "").split(".").pop().toLowerCase();
export const isImage = (name) => IMAGE_EXT.includes(extOf(name));

export function cleanText(t) {
  return String(t || "")
    .replace(/\u0000/g, "")                 // Postgres cannot store NUL characters
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{4,}/g, "\n\n\n")
    .trim()
    .slice(0, 300000);
}

// Returns { text, source, pages, needsOcr, error }
export async function extractText(buffer, fileName) {
  const ext = extOf(fileName);
  try {
    if (ext === "pdf") {
      const { getDocumentProxy, extractText: pdfText } = await import("unpdf");
      const pdf = await getDocumentProxy(new Uint8Array(buffer));
      const r = await pdfText(pdf, { mergePages: true });
      const text = cleanText(r.text);
      return { text, source: "pdf", pages: r.totalPages || null, needsOcr: text.length < 40 };
    }
    if (ext === "docx") {
      const mammoth = (await import("mammoth")).default;
      const r = await mammoth.extractRawText({ buffer });
      return { text: cleanText(r.value), source: "docx", pages: null, needsOcr: false };
    }
    if (ext === "doc") {
      const WordExtractor = (await import("word-extractor")).default;
      const doc = await new WordExtractor().extract(buffer);
      return { text: cleanText(doc.getBody()), source: "doc", pages: null, needsOcr: false };
    }
    if (ext === "txt") {
      return { text: cleanText(buffer.toString("utf8")), source: "txt", pages: null, needsOcr: false };
    }
    if (IMAGE_EXT.includes(ext)) {
      return { text: "", source: "none", pages: 1, needsOcr: true };
    }
    return { text: "", source: "none", pages: null, needsOcr: false, error: `Unsupported file type: .${ext}` };
  } catch (e) {
    return { text: "", source: "none", pages: null, needsOcr: false, error: `Could not read the file: ${String(e.message || e).slice(0, 200)}` };
  }
}
