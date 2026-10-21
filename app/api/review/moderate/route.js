import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/server";

export async function POST(req) {
  try {
    const { id, token, action } = await req.json();
    if (!id || !token || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Bad request." }, { status: 400 });
    }
    const db = adminClient();
    const { data, error } = await db.from("reviews")
      .update({ status: action === "approve" ? "approved" : "rejected" })
      .eq("id", id).eq("mod_token", token).select("id");
    if (error) throw error;
    if (!data?.length) return NextResponse.json({ error: "Invalid or expired link." }, { status: 404 });
    revalidatePath("/"); // makes an approved review appear straight away
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
