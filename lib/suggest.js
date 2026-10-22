// Suggests metadata for an archive document from its text and file name.
// Every suggestion has a confidence from 0 to 1. Nothing is invented: if a field cannot be
// found, it is simply left out.
export const AUTO_ACCEPT = 0.8; // suggestions at or above this are filled in automatically

const STOP = new Set(("about above after again against also among because been before being below between both but could does doing down during each few from further had has have having here how into its just more most must name not now off once only other our out over own same should some such than that the their them then there these they this those through under until very was were what when where which while who whom why will with would you your students student marks marking assessment assignment module unit task tasks question questions page pages submit submission deadline word words total report using use used include including following provide provided discuss explain describe critically analyse analyze evaluate").split(" "));

const CODE_BAD = new Set(["ISO", "RFC", "NIST", "IEEE", "ISBN", "ISSN", "HTTP", "HTTPS", "UTF", "PDF", "DOC", "DOCX", "PAGE", "FIG", "TABLE", "FIGURE", "SECTION", "TASK", "PART", "COVID", "ACT", "APA", "MLA", "CVSS", "CVE", "TLS", "SSL", "WPA", "USB", "PC", "IP", "VLAN", "OSI", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "SEPT", "OCT", "NOV", "DEC", "JANUARY", "FEBRUARY", "MARCH", "APRIL", "JUNE", "JULY", "AUGUST", "OCTOBER", "NOVEMBER", "DECEMBER"]);

const TYPES = [
  [/case study/i, "Case study"], [/reflective|reflection/i, "Reflective essay"], [/lab(oratory)? report|\blab\b/i, "Lab report"],
  [/presentation|slides/i, "Presentation"], [/dissertation|thesis/i, "Dissertation"], [/portfolio/i, "Portfolio"],
  [/\bessay\b/i, "Essay"], [/\bexam(ination)?\b/i, "Exam"], [/programming|coding|source code/i, "Programming task"],
  [/\breport\b/i, "Report"],
];

const prettyName = (f) =>
  String(f || "").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/[_\-]+/g, " ").replace(/\s+/g, " ").trim();

function suggestModuleCode(text, fileName) {
  const re = /\b([A-Z]{2,5})[\s_-]?(\d{3,5})(?!\d)([A-Z](?![a-z]))?/g;
  const tally = new Map();
  const consider = (src, weight) => {
    let m;
    re.lastIndex = 0;
    while ((m = re.exec(src))) {
      const letters = m[1], digits = m[2];
      if (CODE_BAD.has(letters)) continue;
      const code = `${letters} ${digits}${m[3] || ""}`;
      tally.set(code, (tally.get(code) || 0) + weight);
    }
  };
  consider(String(fileName || "").replace(/\.[a-z0-9]{2,5}$/i, "").replace(/_/g, " ").toUpperCase(), 4);
  consider(String(text || "").slice(0, 3000), 1);
  if (!tally.size) return null;
  const ranked = [...tally.entries()].sort((a, b) => b[1] - a[1]);
  const [code, score] = ranked[0];
  const rival = ranked[1]?.[1] || 0;
  let conf = score >= 4 ? 0.85 : score >= 2 ? 0.6 : 0.45;
  if (rival && rival >= score * 0.7) conf = Math.min(conf, 0.45); // several candidates: unsure
  return { value: code, confidence: conf };
}

function suggestUniversity(text, fileName, universities) {
  const hay = `${fileName || ""}\n${String(text || "").slice(0, 4000)}`.toLowerCase();
  for (const u of universities) {
    const names = [u.name, ...(u.aliases || [])].filter(Boolean);
    if (names.some((n) => hay.includes(String(n).toLowerCase()))) {
      return { value: u.name, id: u.id, confidence: 0.9 };
    }
  }
  const re = /\b(University of [A-Z][\w&'’-]*(?: (?:of |the |and )?[A-Z][\w&'’-]*){0,3}|[A-Z][\w&'’-]*(?: [A-Z][\w&'’-]*){0,3} (?:University|College|Institute of Technology))\b/;
  const m = String(text || "").slice(0, 3000).match(re);
  if (m && m[1].length < 80) return { value: m[1].trim(), id: null, confidence: 0.5, isNew: true };
  return null;
}

function suggestSubject(text, title, subjects) {
  const hay = `${title || ""}\n${String(text || "").slice(0, 20000)}`.toLowerCase();
  const scored = subjects.map((s) => {
    let score = 0;
    for (const k of s.keywords || []) {
      const kw = String(k).toLowerCase().trim();
      if (!kw) continue;
      const count = hay.split(kw).length - 1;
      score += Math.min(count, 5);
    }
    return { s, score };
  }).sort((a, b) => b.score - a.score);
  const top = scored[0], second = scored[1]?.score || 0;
  if (!top || top.score < 3 || top.score < second * 1.5) return null;
  const conf = Math.min(0.9, top.score / (top.score + second + 3));
  return { value: top.s.name, id: top.s.id, confidence: Number(conf.toFixed(2)) };
}

function suggestType(text, fileName) {
  const hay = `${fileName || ""}\n${String(text || "").slice(0, 1500)}`;
  for (const [re, label] of TYPES) if (re.test(hay)) return { value: label, confidence: 0.6 };
  return null;
}

function suggestTitle(text, fileName) {
  const lines = String(text || "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 15);
  for (const l of lines) {
    const words = l.split(/\s+/);
    if (words.length >= 3 && words.length <= 16 && l.length >= 10 && l.length <= 140 && !/^\d/.test(l) && !/^page\b/i.test(l)) {
      return { value: l, confidence: 0.5 };
    }
  }
  const f = prettyName(fileName);
  return f ? { value: f, confidence: 0.4 } : null;
}

function suggestKeywords(text) {
  const counts = new Map();
  for (const w of String(text || "").slice(0, 20000).toLowerCase().match(/[a-z][a-z-]{3,}/g) || []) {
    if (STOP.has(w)) continue;
    counts.set(w, (counts.get(w) || 0) + 1);
  }
  const top = [...counts.entries()].filter(([, c]) => c >= 3).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([w]) => w);
  return top.length ? { value: top, confidence: 0.5 } : null;
}

export function suggest({ text, fileName, universities = [], subjects = [] }) {
  const title = suggestTitle(text, fileName);
  const out = {
    title, university: suggestUniversity(text, fileName, universities),
    subject: suggestSubject(text, title?.value, subjects), module_code: suggestModuleCode(text, fileName),
    doc_type: suggestType(text, fileName), keywords: suggestKeywords(text),
  };
  for (const k of Object.keys(out)) if (!out[k]) delete out[k];
  return out;
}

// Which suggestions are confident enough to fill the real fields automatically.
export function autoFields(s) {
  const f = {};
  if (s.title?.confidence >= AUTO_ACCEPT) f.title = s.title.value;
  if (s.university?.id && s.university.confidence >= AUTO_ACCEPT) f.university_id = s.university.id;
  if (s.subject?.id && s.subject.confidence >= AUTO_ACCEPT) f.subject_id = s.subject.id;
  if (s.module_code?.confidence >= AUTO_ACCEPT) f.module_code = s.module_code.value;
  if (s.doc_type?.confidence >= AUTO_ACCEPT) f.doc_type = s.doc_type.value;
  return f;
}
