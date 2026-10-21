import { adminClient } from "@/lib/server";
import ModerateButtons from "./ModerateButtons";

export const metadata = { title: "Review moderation", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function Moderate({ searchParams }) {
  const { id, token } = searchParams || {};
  let r = null;
  if (id && token) {
    try {
      const { data } = await adminClient().from("reviews").select("*").eq("id", id).eq("mod_token", token).maybeSingle();
      r = data;
    } catch {}
  }
  return (
    <main className="page">
      <div className="wrap narrow">
        <h1>Review moderation</h1>
        {!r ? <p>This link is invalid or has expired.</p> : (
          <div className="card">
            <p><b>{r.name}</b>, {r.course} — {r.rating}/5</p>
            <blockquote>{r.quote}</blockquote>
            <p className="fine">Private: {r.email}{r.school ? `, ${r.school}` : ""}</p>
            <ModerateButtons id={r.id} token={token} current={r.status} />
          </div>
        )}
      </div>
    </main>
  );
}
