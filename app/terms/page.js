import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SITE, LEGAL } from "@/lib/config";

export const metadata = {
  title: "Terms of Service",
  description: "The terms for using Assignment Assist's tutoring and study help services.",
  alternates: { canonical: "/terms" },
};

export default function Terms() {
  return (
    <>
      <Header />
      <main className="page">
        <div className="wrap narrow">
          <h1>Terms of service</h1>
          <p className="updated">Last updated: {LEGAL.updated}</p>

          <p>By using {SITE.name} you agree to these terms. If you don't agree, please don't use the service.</p>

          <h2>What we provide</h2>
          <p>{SITE.name} provides tutoring and study support: explaining assignment tasks, helping you plan, giving feedback on your own drafts, showing worked examples, and helping with referencing and formatting.</p>

          <h2>What we don't provide</h2>
          <p>We don't write assignments, essays or exam answers for you to submit as your own work. We may decline any request that asks us to.</p>

          <h2>Your responsibilities</h2>
          <ul>
            <li>You write and submit your own work.</li>
            <li>You follow your school, college or university's academic integrity rules, including what help is allowed.</li>
            <li>You give us accurate information about your request and deadline.</li>
            <li>You only send us material you have the right to share.</li>
          </ul>

          <h2>No guarantees</h2>
          <p>We do our best to help, but we can't guarantee any particular grade or outcome. Results depend on your own work and your institution's marking.</p>

          <h2>Payments and refunds</h2>
          <p>Any fee is agreed with you before we start. If something goes wrong with a paid session, contact us and we'll work with you to put it right.</p>

          <h2>Referral program</h2>
          <p>Rewards are described when you join. We may change or end the program at any time, and we may remove members who misuse it.</p>

          <h2>Acceptable use</h2>
          <p>Don't use the service for anything unlawful, harassing or deceptive, and don't try to disrupt or misuse the website.</p>

          <h2>Privacy</h2>
          <p>How we handle your information is explained in our <Link href="/privacy">privacy policy</Link>.</p>

          <h2>Limit of liability</h2>
          <p>To the extent the law allows, {SITE.name} isn't liable for indirect or consequential losses arising from use of the service. Nothing here limits rights you have that can't be limited by law.</p>

          <h2>Changes to these terms</h2>
          <p>We may update these terms. The date at the top shows the latest version. Continued use means you accept the changes.</p>

          {LEGAL.jurisdiction && (
            <>
              <h2>Governing law</h2>
              <p>These terms are governed by the laws of {LEGAL.jurisdiction}.</p>
            </>
          )}

          <h2>Contact</h2>
          <p>Questions? Email <a href={`mailto:${SITE.email}`}>{SITE.email}</a>.</p>
        </div>
      </main>
      <Footer />
    </>
  );
}
