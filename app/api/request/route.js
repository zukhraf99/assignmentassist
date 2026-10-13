import { NextResponse } from "next/server";
import { adminClient, sendEmail, esc, clean, validEmail } from "@/lib/server";

export async function POST(req) {
  try {
    const b = await req.json();
    if (b.website) return NextResponse.json({ ok: true }); // honeypot: bots fill this in

    const row = {
      name: clean(b.name, 80) || "Anonymous", email: clean(b.email, 120), whatsapp: clean(b.whatsapp, 30),
      subject: clean(b.subject, 80), deadline: clean(b.deadline, 40),
      details: clean(b.details, 4000), file_path: clean(b.filePath, 300) || null,
      file_name: clean(b.fileName, 120) || null,
    };
    if ((!row.email && !row.whatsapp) || (row.email && !validEmail(row.email)) || !row.subject || !row.details || !row.deadline) {
      return NextResponse.json({ error: "Please fill in all required fields." }, { status: 400 });
    }

    const db = adminClient();
    const { error } = await db.from("help_requests").insert({
      ...row, email: row.email || null, deadline: new Date(row.deadline).toISOString(),
    });
    if (error) throw error;

    let link = "";
    if (row.file_path) {
      const { data } = await db.storage.from("submissions").createSignedUrl(row.file_path, 60 * 60 * 24 * 7);
      if (data?.signedUrl) link = `<p><a href="${data.signedUrl}">Download file: ${esc(row.file_name)}</a> (link valid 7 days)</p>`;
    }

    await sendEmail({
      subject: `New help request: ${row.subject} (due ${row.deadline})`,
      replyTo: row.email || undefined,
      html: `<h2>New request</h2>
        <p><b>Name:</b> ${esc(row.name)}<br><b>Email:</b> ${esc(row.email) || "-"}<br>
        <b>WhatsApp:</b> ${esc(row.whatsapp) || "-"}<br><b>Subject:</b> ${esc(row.subject)}<br>
        <b>Deadline:</b> ${esc(row.deadline)}</p>
        <p><b>Details:</b><br>${esc(row.details).replace(/\n/g, "<br>")}</p>${link}`,
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Could not send your request. Please try WhatsApp or email instead." }, { status: 500 });
  }
}
