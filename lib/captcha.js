import crypto from "crypto";
import { adminClient } from "./server";

// Uses CAPTCHA_SECRET if you set it, otherwise your existing Supabase secret key.
const secret = () => process.env.CAPTCHA_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || "dev-only-secret";
const sign = (nonce, exp, code) =>
  crypto.createHmac("sha256", secret()).update(`${nonce}.${exp}.${code}`).digest("hex");

// Stroke-drawn digits (x 0-10, y 0-16). Drawn as paths, so there is no readable text in the image.
const GLYPHS = {
  0: [[[1,1],[9,1],[9,15],[1,15],[1,1]]],
  1: [[[3,4],[6,1],[6,15]]],
  2: [[[1,3],[3,1],[8,1],[9,3],[9,6],[1,15],[9,15]]],
  3: [[[1,1],[9,1],[5,7],[9,9],[9,13],[7,15],[2,15],[1,13]]],
  4: [[[8,15],[8,1],[1,10],[10,10]]],
  5: [[[9,1],[1,1],[1,7],[7,6],[9,9],[9,13],[7,15],[1,14]]],
  6: [[[8,1],[3,1],[1,4],[1,13],[3,15],[7,15],[9,13],[9,9],[7,7],[1,8]]],
  7: [[[1,1],[9,1],[4,15]]],
  8: [[[3,1],[7,1],[9,3],[9,6],[7,8],[3,8],[1,6],[1,3],[3,1]],
      [[3,8],[7,8],[9,10],[9,13],[7,15],[3,15],[1,13],[1,10],[3,8]]],
  9: [[[9,8],[3,9],[1,7],[1,3],[3,1],[7,1],[9,3],[9,13],[7,15],[2,15]]],
};

const rnd = (a, b) => a + Math.random() * (b - a);
const COLORS = ["#1c3fb7", "#1a2233", "#0b6b38", "#8a1c3a"];

function drawSvg(code) {
  const W = 200, H = 64;
  let body = "";
  // background noise lines
  for (let i = 0; i < 4; i++) {
    body += `<path d="M${rnd(0,W)} ${rnd(0,H)} Q${rnd(0,W)} ${rnd(0,H)} ${rnd(0,W)} ${rnd(0,H)}" stroke="${COLORS[i % 4]}" stroke-opacity=".35" stroke-width="1.6" fill="none"/>`;
  }
  // digits
  [...code].forEach((d, i) => {
    const s = rnd(1.5, 2.0), ang = rnd(-0.35, 0.35);
    const cx = 22 + i * 36 + rnd(-3, 3), cy = 32 + rnd(-4, 4);
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    for (const line of GLYPHS[d]) {
      const pts = line.map(([x, y]) => {
        const px = (x - 5 + rnd(-0.5, 0.5)) * s, py = (y - 8 + rnd(-0.5, 0.5)) * s;
        return [cx + px * Math.cos(ang) - py * Math.sin(ang), cy + px * Math.sin(ang) + py * Math.cos(ang)];
      });
      body += `<polyline points="${pts.map((p) => p.map((n) => n.toFixed(1)).join(",")).join(" ")}" stroke="${color}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;
    }
  });
  // foreground noise
  for (let i = 0; i < 3; i++) {
    body += `<path d="M0 ${rnd(8,56)} Q${rnd(40,160)} ${rnd(0,64)} ${W} ${rnd(8,56)}" stroke="#1a2233" stroke-opacity=".5" stroke-width="1.4" fill="none"/>`;
  }
  for (let i = 0; i < 30; i++) {
    body += `<circle cx="${rnd(0,W).toFixed(1)}" cy="${rnd(0,H).toFixed(1)}" r="1.1" fill="#1a2233" fill-opacity=".5"/>`;
  }
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="${W}" height="${H}" fill="#f3f7fc"/>${body}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createChallenge() {
  const code = Array.from({ length: 5 }, () => crypto.randomInt(0, 10)).join("");
  const nonce = crypto.randomBytes(8).toString("hex");
  const exp = Date.now() + 5 * 60 * 1000;
  return { token: `${nonce}.${exp}.${sign(nonce, exp, code)}`, image: drawSvg(code) };
}

export async function verifyCaptcha(token, answer) {
  try {
    const [nonce, expStr, sig] = String(token || "").split(".");
    const exp = Number(expStr);
    const code = String(answer || "").replace(/\s/g, "");
    if (!nonce || !sig || !exp || Date.now() > exp || !/^\d{5}$/.test(code)) return false;

    // Burn the challenge on EVERY attempt, so a wrong guess can't be retried on the same image.
    const db = adminClient();
    const { error } = await db.from("captcha_used").insert({ nonce });
    if (error) return false;
    db.from("captcha_used").delete().lt("created_at", new Date(Date.now() - 3600e3).toISOString()).then(() => {});

    const expected = Buffer.from(sign(nonce, exp, code), "hex");
    const given = Buffer.from(sig, "hex");
    return expected.length === given.length && crypto.timingSafeEqual(expected, given);
  } catch {
    return false;
  }
}
