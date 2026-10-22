import { NextResponse } from "next/server";
import { createSession, passwordOk, COOKIE_NAME, SESSION_MAX_AGE } from "@/lib/adminAuth";

export async function POST(req) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Admin is not set up. Add ADMIN_PASSWORD in Vercel." }, { status: 503 });
  }
  let body = {};
  try { body = await req.json(); } catch {}
  if (!(await passwordOk(body.password))) {
    await new Promise((r) => setTimeout(r, 900)); // slow down guessing
    return NextResponse.json({ error: "Wrong password." }, { status: 401 });
  }
  const res = NextResponse.json({ ok: true });
  res.cookies.set({
    name: COOKIE_NAME, value: await createSession(), httpOnly: true, sameSite: "strict",
    secure: process.env.NODE_ENV === "production", path: "/", maxAge: SESSION_MAX_AGE,
  });
  return res;
}
