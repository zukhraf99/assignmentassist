import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySession, COOKIE_NAME } from "./adminAuth";

// Second line of defence inside every admin API route (the middleware is the first).
export async function guard(req) {
  const ok = await verifySession(req.cookies.get(COOKIE_NAME)?.value);
  return ok ? null : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Same check for admin pages.
export async function requireAdminPage() {
  const ok = await verifySession(cookies().get(COOKIE_NAME)?.value);
  if (!ok) redirect("/admin/login");
}
