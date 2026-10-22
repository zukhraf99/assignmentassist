// Free OCR that runs inside the admin's own browser (Tesseract). Documents never leave your computer;
// only the OCR engine files (hosted on this site under /tesseract) are downloaded.
export const OCR_MAX_PAGES = 40;   // pages read per PDF
const TARGET_SCALE = 2.5;          // PDF page zoom used for reading (about 180 dpi)
const MAX_SIDE = 3200;             // never render bigger than this many pixels
const extOf = (n) => String(n || "").split(".").pop().toLowerCase();

// opts (all optional, mainly for tests): workerOptions, canvas, toImage
export async function createOcr(opts = {}) {
  const { createWorker } = await import("tesseract.js");
  const base = typeof window !== "undefined" ? `${window.location.origin}/tesseract` : "";
  const hosted = typeof window !== "undefined"
    ? { workerPath: `${base}/worker.min.js`, corePath: base, langPath: `${base}/lang`, gzip: true }
    : {};
  let onLog = null;
  const worker = await createWorker("eng", 1, { ...hosted, ...(opts.workerOptions || {}), logger: (m) => onLog && onLog(m) });

  const toImage = opts.toImage || ((buf) => new Blob([buf], { type: "image/png" }));
  const read = async (image) => (await worker.recognize(image)).data.text || "";

  async function viaCanvas(blob) { // turns GIF (and anything else the browser can show) into PNG for the reader
    const bmp = await createImageBitmap(blob);
    const c = document.createElement("canvas");
    c.width = bmp.width; c.height = bmp.height;
    c.getContext("2d").drawImage(bmp, 0, 0);
    return await new Promise((res) => c.toBlob(res, "image/png"));
  }

  return {
    // blob: File or Blob (or a Buffer in tests). Returns { text, pages, totalPages, truncated }
    async recognizeFile(blob, fileName, { maxPages = OCR_MAX_PAGES, onProgress } = {}) {
      onLog = (m) => { if (m.status === "recognizing text" && onProgress) onProgress({ ...cur, fraction: m.progress }); };
      let cur = { page: 1, pages: 1 };
      const ext = extOf(fileName);
      if (ext === "pdf") {
        const { getDocumentProxy, renderPageAsImage } = await import("unpdf");
        const data = new Uint8Array(blob instanceof Uint8Array ? blob : await blob.arrayBuffer());
        const pdf = await getDocumentProxy(data.slice());
        const total = pdf.numPages, n = Math.min(total, maxPages), parts = [];
        for (let p = 1; p <= n; p++) {
          cur = { page: p, pages: n };
          if (onProgress) onProgress({ ...cur, fraction: 0 });
          const page = await pdf.getPage(p);
          const vp = page.getViewport({ scale: 1 });
          const scale = Math.min(TARGET_SCALE, MAX_SIDE / Math.max(vp.width, vp.height));
          // In the browser the open document is reused; the test setup passes raw bytes with its own canvas.
          const png = await renderPageAsImage(opts.canvas ? data.slice() : pdf, p, { scale, canvas: opts.canvas });
          parts.push((await read(toImage(png))).trim());
          if (page.cleanup) page.cleanup();
        }
        return { text: parts.join("\n\n"), pages: n, totalPages: total, truncated: total > n };
      }
      let image = blob;
      if (typeof document !== "undefined" && ext === "gif") image = await viaCanvas(blob);
      if (onProgress) onProgress({ page: 1, pages: 1, fraction: 0 });
      return { text: await read(image), pages: 1, totalPages: 1, truncated: false };
    },
    async close() { try { await worker.terminate(); } catch {} },
  };
}
