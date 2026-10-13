import { SITE } from "@/lib/config";

export default function ContactButtons({ compact = false }) {
  const wa = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent("Hi Assignment Assist, I need help with an assignment. My deadline is: ")}`;
  const mail = `mailto:${SITE.email}?subject=${encodeURIComponent("Assignment help")}`;
  return (
    <div className={compact ? "cb compact" : "cb"}>
      <a className="btn wa" href={wa} target="_blank" rel="noopener noreferrer">Chat on WhatsApp</a>
      <a className="btn ghost" href={mail}>Email us</a>
    </div>
  );
}
