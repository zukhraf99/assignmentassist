# Guides + private archive: setup and notes

## 1. What was added
* **Public Guides** (`/guides`): searchable directory, guide pages, subject and university pages, SEO, WhatsApp/email buttons that name the guide, optional link to a university's own brief.
* **Admin area** (`/admin`, password protected): write/publish guides, manage universities and subjects, and the **private archive** (bulk upload, ZIP import, text extraction, suggestions, search, duplicates, bulk edit).
* The archive is private by design. Files live in a private storage bucket, database rows are only readable by the server, and no public page, link or sitemap entry points at the archive.

## 2. Setup (about 15 minutes)
1. **Database:** Supabase > SQL Editor > paste all of `supabase/archive_and_guides.sql` > Run. (Safe to run twice.)
2. **Vercel environment variables:** add `ADMIN_PASSWORD` and `ADMIN_SESSION_SECRET` (see `.env.example`). Mark both Sensitive. Optional: `OCR_SPACE_API_KEY` (not needed, browser OCR is free).
3. **Packages:** `package.json` and `package-lock.json` changed (new: `jszip`, `mammoth`, `word-extractor`, `unpdf`, `tesseract.js`, `@tesseract.js-data/eng`, and an automatic `postinstall` step). Copy both files, plus `scripts/copy-ocr-assets.js` and the updated `.gitignore` (it ignores `public/tesseract/`), then push.
4. **Styles:** paste `admin-and-guides-styles.css` at the end of `app/globals.css`.
5. Push to GitHub, wait for Vercel to show Ready, then open `/admin`.
6. Optional: add `<Link href="/guides">Guides</Link>` to `app/components/Header.js` (and the footer) so visitors can find the directory.

## 3. How the archive works
1. Drag files, a folder, or a ZIP onto **Admin > Private archive**.
2. For each file the browser: checks size, computes a SHA-256, asks the server whether it already exists (duplicates are skipped), uploads **straight to private storage** (no Vercel size limit), then asks the server to read it.
3. The server extracts text (PDF via `unpdf`, DOCX via `mammoth`, DOC via `word-extractor`, TXT directly). Scanned PDFs and images go to OCR if configured.
4. It suggests title, university, subject, module code, type and keywords, each with a confidence. Only suggestions at 80%+ fill the real fields automatically; the rest appear as "Use:" buttons. Nothing is invented.
5. Documents land in **needs review**. Preview, edit, bulk-edit, mark reviewed, archive or delete.

### Limits you should know
* Files up to **50 MB** (Supabase free-plan limit). Text is only read for files up to 25 MB.
* ZIP files are opened **in your browser** and the whole ZIP is held in memory. Keep each ZIP under roughly 300 MB; split bigger collections.
* The browser is the "queue": keep the tab open while a batch runs (3 files at a time). Failed items have a **Retry** button, and anything can be re-read later with **Re-read text**.
* Processing runs per file in a serverless function with a 60 second limit. Very large or slow files may time out and be marked **failed**; retry them.
* Duplicate detection is exact (same file bytes). Near-duplicates (same text, different file) are not detected.

### OCR for scanned files and photos (free, runs in your browser)
* Default: **browser OCR with Tesseract**. When a PDF has no text layer, or a file is a photo/scan, the admin page reads it **inside your own browser**. The document never leaves your computer; only the extracted text is saved.
* During an upload batch it runs automatically (untick the OCR box to skip it). Afterwards you can run it on any document ("Run OCR in this browser" on its page) or on many at once (select rows, then the same button in the bulk bar).
* The OCR engine files (about 15 MB: worker, WebAssembly core, English language data) are copied into `public/tesseract/` by `scripts/copy-ocr-assets.js` every time packages are installed, and are served from your own site, not a third-party CDN. They are git-ignored, so do not commit them.
* Limits: English only; the first **40 pages** of each PDF; one file at a time (about 1 to 10 seconds per page depending on your computer); keep the tab open. The first scan of a session downloads the engine (about 7 MB, then cached by the browser). Very large photos use a lot of memory; use a laptop or desktop, not a phone. GIF files are converted by the browser first. TIFF files may not be readable; convert them to PNG or JPG.
* Accuracy: excellent on clean, straight scans; weaker on blurry, skewed, handwritten or low-contrast pages. Always check the text on the document page.
* Optional extra: **OCR.space** (external service, paid plan needed for normal PDFs). Set `OCR_SPACE_API_KEY` only if you want the server to try it first. It is not needed.

## 4. Security notes
* One shared admin password. Use a long random one. Logins are slowed after a wrong password but not locked out, so do not reuse a weak password.
* The login cookie is HttpOnly, SameSite=Strict, Secure on https, and expires after 7 days. Every admin page and API checks it twice (middleware and inside the route).
* Archive previews and downloads use 5-minute signed links created only for a logged-in admin.
* Admin pages send `noindex` and `no-store` headers, and `robots.txt` disallows `/admin/`.
* Guide text is rendered without raw HTML, so pasted `<script>` is shown as text, not run.
* Publishing a guide requires: a tick confirming it is your own writing, a meta description (50+ characters) and at least 300 characters of text. The official-brief field only accepts `https://` links and opens the university's own website.

## 5. What was and was not tested
Tested here:
* The SQL migration on a real local PostgreSQL (tables, constraints, indexes, full-text search, safe to re-run). This found and fixed a bug before it could reach your database.
* Text extraction on real PDF, DOCX, DOC, TXT and image files, including a corrupt PDF; suggestion logic and module-code detection.
* **Browser OCR engine** on generated scans: 100% word accuracy on a clean scan, a noisy rotated JPEG, and a 2-page image-only PDF, plus the 40-page cap. These are synthetic test pages, which are easier than real-world scans.
* Saving OCR text through the app (blank text, bad input, invalid ids, NUL characters, truncated PDFs, reviewed documents keep their status) and serving the OCR engine files from the site.
* The whole server side (login, cookie checks, upload links, duplicate checks, registering, processing, bulk edit, manual edit, delete, private file links, guide create/publish/unpublish, sitemap, category pages, search and filters) on a production build against a stand-in Supabase server.
* Admin and public screens rendering with data, and the access-control matrix (every admin page and API is blocked without a login, including forged and expired cookies).
* OCR response handling with mocked replies; ZIP filtering logic in Node.

NOT tested (needs you to try it once live):
* A real Supabase project (storage signed uploads from the browser, row-level security, real PostgREST joins and search). The stand-in server mimics them but is not the real thing.
* The upload screen in an actual browser (drag and drop, folder picker, ZIP opened in the browser, progress display) and clicking through the admin forms.
* **OCR inside a real browser**: loading the engine in a web worker, SIMD detection, rendering PDF pages to a canvas, downloading the private file from Supabase into the browser (needs Supabase to allow it), and memory use on large scans. Only the same code running in Node was tested.
* The optional OCR.space service (no key was available), and the 60-second function limit on your Vercel plan.

First live check: log in, upload two or three small files, open one, press Save, create a guide, publish it, and open it from a private window.
