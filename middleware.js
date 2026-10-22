import { NextResponse } from "next/server";
import { verifySession, COOKIE_NAME } from "./lib/adminAuth";

// Everything under /admin and /api/admin needs a valid admin session, except the login endpoints.
export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const open = pathname === "/admin/login" || pathname === "/api/admin/login";
  let res;
  if (open) {
    res = NextResponse.next();
  } else if (await verifySession(req.cookies.get(COOKIE_NAME)?.value)) {
    res = NextResponse.next();
  } else if (pathname.startsWith("/api/")) {
    res = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  } else {
    const url = req.nextUrl.clone();
    url.pathname = "/admin/login";
    url.search = "";
    res = NextResponse.redirect(url);
  }
  res.headers.set("X-Robots-Tag", "noindex, nofollow");
  res.headers.set("Cache-Control", "no-store");
  return res;
}

export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
