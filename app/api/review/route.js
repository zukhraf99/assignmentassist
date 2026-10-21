import { NextResponse } from "next/server";
import { adminClient, sendEmail, esc, clean, validEmail } from "@/lib/server";
import { SITE } from "@/lib/config";
import { verifyCaptcha } from "@/lib/captcha";

export async function POST(req) {
  try {
    const b = await req.json();
    if (b.website) return NextResponse.json({ ok: true }); // honeypot

    if (!(await verifyCaptcha(b.captchaToken, b.captchaAnswer))) {
      return NextResponse.json({ error: "The digits were wrong or expired. Please try the new picture." }, { status: 400 });
    }

    const row = {
      name: clean(b.name, 60), course: clean(b.course, 80), quote: clean(b.quote, 600),
      email: clean(b.email, 120), school: clean(b.school, 100) || null,
      rating: Math.round(Number(b.rating)),
    };
    if (!row.name || !row.course || row.quote.length < 20 || !validEmail(row.email) ||
        !(row.rating >= 1 && row.rating <= 5) || b.consent !== true) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }

    const mod_token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const { data, error } = await adminClient()
      .from("reviews").insert({ ...row, status: "pending", mod_token }).select("id").single();
    if (error) throw error;

    const link = `${SITE.url}/moderate?id=${data.id}&token=${mod_token}`;
    await sendEmail({
      subject: `New review to approve: ${row.name} (${row.rating}/5)`,
      replyTo: row.email,
      html: `<h2>New review waiting for approval</h2>
        <p><b>${esc(row.name)}</b>, ${esc(row.course)} — ${row.rating}/5</p>
        <blockquote>${esc(row.quote).replace(/\n/g, "<br>")}</blockquote>
        <p>Private: ${esc(row.email)}${row.school ? `, ${esc(row.school)}` : ""}</p>
        <p><a href="${link}" style="background:#1c3fb7;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none">Review &amp; approve</a></p>`,
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Could not send your review. Please try again later." }, { status: 500 });
  }
}
