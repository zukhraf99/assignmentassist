import { NextResponse } from "next/server";
import { createChallenge } from "@/lib/captcha";

export const dynamic = "force-dynamic";

export async function GET() {
  const c = createChallenge();
  return NextResponse.json(c, { headers: { "Cache-Control": "no-store" } });
}
