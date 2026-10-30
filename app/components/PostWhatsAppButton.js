import { SITE } from "@/lib/config";

// Edit this text whenever you like.
const BUTTON_TEXT = "Chat on WhatsApp";

// One button at the end of a post. Opens WhatsApp with the post title and the post link as the message.
export default function PostWhatsAppButton({ guide }) {
  const url = `${SITE.url}/guides/${guide.slug}`;
  const msg = `${guide.title}\n${url}`;
  const wa = `https://wa.me/${SITE.whatsapp}?text=${encodeURIComponent(msg)}`;
  return (
    <div className="cb">
      <a className="btn wa" href={wa} target="_blank" rel="noopener noreferrer">{BUTTON_TEXT}</a>
    </div>
  );
}
