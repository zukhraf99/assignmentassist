// Copies the OCR engine into public/tesseract so it is served from YOUR site (no third-party CDN).
// Runs automatically after `npm install` (so on every Vercel build). Safe to run again.
const fs = require("fs");
const path = require("path");

const out = path.join(__dirname, "..", "public", "tesseract");
const find = (spec) => {
  try { return path.dirname(require.resolve(spec + "/package.json")); } catch { return null; }
};

try {
  const js = find("tesseract.js"), core = find("tesseract.js-core"), eng = find("@tesseract.js-data/eng");
  if (!js || !core || !eng) throw new Error("OCR packages are not installed");
  fs.mkdirSync(path.join(out, "lang"), { recursive: true });
  const copies = [
    [path.join(js, "dist", "worker.min.js"), "worker.min.js"],
    [path.join(core, "tesseract-core-lstm.wasm.js"), "tesseract-core-lstm.wasm.js"],
    [path.join(core, "tesseract-core-simd-lstm.wasm.js"), "tesseract-core-simd-lstm.wasm.js"],
    [path.join(core, "tesseract-core-relaxedsimd-lstm.wasm.js"), "tesseract-core-relaxedsimd-lstm.wasm.js"],
    [path.join(eng, "4.0.0_best_int", "eng.traineddata.gz"), path.join("lang", "eng.traineddata.gz")],
  ];
  for (const [from, to] of copies) fs.copyFileSync(from, path.join(out, to));
  console.log("OCR engine copied to public/tesseract");
} catch (e) {
  // Never break the website build over OCR. Browser OCR will just report that it is unavailable.
  console.warn("OCR engine files were not copied:", e.message);
}
