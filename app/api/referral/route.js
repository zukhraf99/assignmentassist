import { NextResponse } from "next/server";
import { adminClient, sendEmail, esc, clean, validEmail } from "@/lib/server";

export async function POST(req) {
  try {
    const b = await req.json();
    if (b.website) return NextResponse.json({ ok: true, code: "THANKS" });
    const name = clean(b.name, 80), email = clean(b.email, 120), whatsapp = clean(b.whatsapp, 30);
    if (!name || !validEmail(email)) return NextResponse.json({ error: "Please enter your name and a valid email." }, { status: 400 });

    const db = adminClient();
    const existing = await db.from("referrals").select("code").eq("email", email).maybeSingle();
    if (existing.data) return NextResponse.json({ ok: true, code: existing.data.code });

    const base = name.replace(/[^a-zA-Z]/g, "").slice(0, 4).toUpperCase() || "FRND";
    const code = `${base}${Math.floor(1000 + Math.random() * 9000)}`;
    const { error } = await db.from("referrals").insert({ name, email, whatsapp, code });
    if (error) throw error;

    await sendEmail({
      subject: `New referral member: ${name}`, replyTo: email,
      html: `<p><b>${esc(name)}</b> (${esc(email)}, ${esc(whatsapp) || "no WhatsApp"}) joined the referral program. Code: <b>${code}</b></p>`,
    });
    return NextResponse.json({ ok: true, code });
  } catch (e) {
    return NextResponse.json({ error: "Could not sign you up right now. Please try again." }, { status: 500 });
  }
}
