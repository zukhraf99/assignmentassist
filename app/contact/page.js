import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import ContactButtons from "../components/ContactButtons";
import { SITE } from "@/lib/config";

export const metadata = {
  title: "Contact Us",
  description: "Contact Assignment Assist on WhatsApp or email. We usually reply within 30 minutes.",
  alternates: { canonical: "/contact" },
};

export default function Contact() {
  return (
    <>
      <Header />
      <main className="page">
        <div className="wrap narrow">
          <h1>Contact us</h1>
          <p className="sub">Choose whichever is easiest for you. We usually reply within {SITE.replyTime}.</p>

          <div className="card">
            <h2 style={{ marginTop: 0 }}>Message us now</h2>
            <p>If your deadline is close, WhatsApp is the fastest way to reach us.</p>
            <ContactButtons />
          </div>

          <h2>Prefer to send the details?</h2>
          <p>Use the <Link href="/#request"><b>request form</b></Link> to tell us the subject, deadline and what you need. You can upload your brief or draft too.</p>

          <h2>Email</h2>
          <p><a href={`mailto:${SITE.email}`}>{SITE.email}</a></p>

          <h2>Privacy</h2>
          <p>We only use your details to reply to you. Read our <Link href="/privacy">privacy policy</Link> to see how we handle your information.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
