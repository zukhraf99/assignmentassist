import Header from "../components/Header";
import Footer from "../components/Footer";
import { SITE, LEGAL } from "@/lib/config";

export const metadata = {
  title: "Privacy Policy",
  description: "How Assignment Assist collects, uses and protects your information.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  return (
    <>
      <Header />
      <main className="page">
        <div className="wrap narrow">
          <h1>Privacy policy</h1>
          <p className="updated">Last updated: {LEGAL.updated}</p>

          <p>Your privacy matters to us. This page explains what information {SITE.name} collects, why, and the choices you have.</p>

          <h2>What we collect</h2>
          <ul>
            <li><b>Help request form:</b> an optional name or nickname, your email and/or WhatsApp number (at least one, so we can reply), your subject, deadline, a description of what you need, and any file you choose to upload.</li>
            <li><b>Referral program:</b> your name, email, an optional WhatsApp number and your referral code.</li>
            <li><b>Messages:</b> if you contact us by WhatsApp or email, we receive whatever you send.</li>
          </ul>
          <p>You can use a nickname. We don't ask for your school, student ID or other identifying details.</p>

          <h2>How we use it</h2>
          <p>We use your information only to reply to you, help with your request, run the referral program and keep the service working. We don't sell your information, and we don't share it with anyone for advertising.</p>

          <h2>Where it is stored</h2>
          <p>Requests and uploaded files are stored with our service providers: Supabase (database and private file storage), Resend (email notifications to our team) and Vercel (website hosting). Uploaded files are stored privately and are not public. WhatsApp messages are handled by WhatsApp under its own policy.</p>

          <h2>How long we keep it</h2>
          <p>We keep your information only as long as we need it to help you. You can ask us to delete your requests and files at any time.</p>

          <h2>Your choices</h2>
          <ul>
            <li>Ask what information we hold about you.</li>
            <li>Ask us to correct or delete it.</li>
            <li>Stop using the referral program at any time.</li>
          </ul>
          <p>To do any of these, email <a href={`mailto:${SITE.email}`}>{SITE.email}</a> from the address you used, or message us on WhatsApp.</p>

          <h2>Cookies and tracking</h2>
          <p>This website does not use advertising trackers. If we add analytics later, we will update this page.</p>

          <h2>Security</h2>
          <p>We use trusted providers and restrict access to your information to our team. No online service is perfectly secure, so please don't send passwords or financial details.</p>

          <h2>Changes</h2>
          <p>We may update this policy. The date at the top shows when it last changed.</p>

          <h2>Contact</h2>
          <p>Questions? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
