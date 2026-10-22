import { SITE } from "@/lib/config";

// WhatsApp + email buttons with a message that names the guide.
export default function GuideContact({ guide }) {
  const url = `${SITE.url}/guides/${guide.slug}`;
  const details = [guide.university?.name, guide.module_code].filter(Boolean).join(", ");
  const msg = `Hi Assignment Assist, I'd like help with my assignment. I was reading your guide: "${guide.title}"${details ? ` (${details})` : ""}. ${url}`;
  const wa = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(msg)}`;
  const mail = `mailto:${SITE.email}?subject=${encodeURIComponent(`Help with: ${guide.title}`)}&body=${encodeURIComponent(msg + "\n\nMy deadline is: ")}`;
  return (
    <div className="cb">
      <a className="btn wa" href={wa} target="_blank" rel="noopener noreferrer">Ask on WhatsApp</a>
      <a className="btn ghost" href={mail}>Email about this guide</a>
    </div>
  );
}
