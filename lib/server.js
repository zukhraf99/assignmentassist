import { createClient } from "@supabase/supabase-js";

export function adminClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });
}

export async function sendEmail({ subject, html, replyTo }) {
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFY_EMAIL) return false;
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "Assignment Assist <onboarding@resend.dev>", // change after verifying your domain in Resend
      to: [process.env.NOTIFY_EMAIL],
      reply_to: replyTo,
      subject,
      html,
    }),
  });
  return res.ok;
}

export const esc = (s = "") =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

export const clean = (v, max) => String(v ?? "").trim().slice(0, max);
export const validEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
