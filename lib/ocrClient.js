// Browser-side helpers that run OCR on one file at a time and save the text through the admin API.
import { createOcr } from "./ocrBrowser";

let ocrPromise = null, idleTimer = null, chain = Promise.resolve();
const getOcr = () => (ocrPromise ||= createOcr());
function scheduleClose() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => { const p = ocrPromise; ocrPromise = null; if (p) (await p).close(); }, 60000);
}

// Runs jobs one after another so a big batch never overloads the browser.
function job(fn) {
  const run = chain.then(async () => {
    clearTimeout(idleTimer);
    try { return await fn(await getOcr()); } finally { scheduleClose(); }
  });
  chain = run.catch(() => {});
  return run;
}

async function saveResult(id, r) {
  const res = await fetch("/api/admin/archive/ocr-result", {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, text: r.text, pages: r.pages, truncated: r.truncated }),
  });
  const d = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(d.error || "Could not save the OCR text");
  return d; // { status, error, chars }
}

// You already hold the file (during upload).
export const ocrBlob = (docId, blob, fileName, onProgress) =>
  job(async (ocr) => saveResult(docId, await ocr.recognizeFile(blob, fileName, { onProgress })));

// The file is already in private storage: download it into this browser, read it, save the text.
export async function ocrStored(docId, fileName, onProgress) {
  const link = await (await fetch(`/api/admin/archive/file?id=${docId}&json=1`)).json();
  if (!link.url) throw new Error(link.error || "Could not open the file");
  const res = await fetch(link.url);
  if (!res.ok) throw new Error("Could not download the file");
  return ocrBlob(docId, await res.blob(), fileName, onProgress);
}

export const canOcr = (fileName) => ["pdf", "jpg", "jpeg", "png", "webp", "gif", "tif", "tiff"].includes(String(fileName).split(".").pop().toLowerCase());
