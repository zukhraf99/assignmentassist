// Admin session: a signed, expiring cookie. Uses Web Crypto so it works in middleware and routes.
export const COOKIE_NAME = "aa_admin";
const TTL_MS = 7 * 24 * 3600 * 1000;
export const SESSION_MAX_AGE = TTL_MS / 1000;
const enc = new TextEncoder();

const secret = () =>
  process.env.ADMIN_SESSION_SECRET || (process.env.ADMIN_PASSWORD ? process.env.ADMIN_PASSWORD + "|aa-session" : "");

async function hmac(msg) {
  const s = secret();
  if (!s) throw new Error("Admin is not configured");
  const key = await crypto.subtle.importKey("raw", enc.encode(s), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(msg));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sameString(a, b) {
  if (a.length !== b.length) return false;
  let r = 0;
  for (let i = 0; i < a.length; i++) r |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return r === 0;
}

export async function createSession() {
  const exp = Date.now() + TTL_MS;
  return `${exp}.${await hmac(String(exp))}`;
}

export async function verifySession(token) {
  try {
    if (!token || !secret()) return false;
    const [exp, sig] = String(token).split(".");
    if (!exp || !sig || !(Number(exp) > Date.now())) return false;
    return sameString(await hmac(exp), sig);
  } catch {
    return false;
  }
}

export async function passwordOk(input) {
  try {
    if (!process.env.ADMIN_PASSWORD) return false;
    // compare HMACs of both values so timing does not depend on the password length
    return sameString(await hmac("pw:" + String(input ?? "")), await hmac("pw:" + process.env.ADMIN_PASSWORD));
  } catch {
    return false;
  }
}
