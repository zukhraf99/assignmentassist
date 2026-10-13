import Link from "next/link";
import { SITE, REVIEWS, FAQS } from "@/lib/config";
import ContactButtons from "./components/ContactButtons";
import HelpForm from "./components/HelpForm";
import Header from "./components/Header";
import Footer from "./components/Footer";

const jsonLd = [
  {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: SITE.name,
    url: SITE.url,
    description: "Assignment tutoring and draft feedback for students.",
    areaServed: "Worldwide",
    serviceType: "Academic tutoring and coaching",
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  },
];

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="strip">
        <div className="wrap strip-in">
          <p><span className="dot" aria-hidden="true" /> We're here to help. Message us and we'll reply within {SITE.replyTime}.</p>
          <ContactButtons compact />
        </div>
      </div>

      <Header />

      <main id="top">
        <div className="hero">
          <div className="wrap herogrid">
            <div>
              <h1>Stuck on an assignment? Let's <span className="mark">work it out</span> together.</h1>
              <p className="lede">Assignment Assist helps students understand the task, plan the work and improve their own drafts, even when the deadline is close.</p>
              <a className="btn" href="#request">Send a request</a>
              <Link className="btn ghost sp" href="/referral">Join our referral program</Link>
            </div>
            <div className="sheet" aria-label="Example of a marked-up assignment">
              <p className="q">Q3. Solve 2x + 6 = 14</p>
              <p className="step">2x = 14 − 6</p>
              <span className="note" style={{ top: 94 }}>✓</span>
              <p className="step">2x = 8</p>
              <p className="step">x = 4</p>
              <span className="note" style={{ top: 158 }}>✓</span>
              <div className="tip">Check it: 2(4) + 6 = 14. It works.</div>
            </div>
          </div>
        </div>

        <section id="request" className="panel">
          <div className="wrap narrow">
            <h2>Need help fast? Send us the details.</h2>
            <p className="sub">Tell us what you're working on and when it's due. We'll get back to you quickly. Your details stay private and are never shared. A nickname is fine.</p>
            <HelpForm />
            <p className="alt">Prefer to talk? <ContactButtons compact /></p>
          </div>
        </section>

        <section id="help">
          <div className="wrap">
            <h2>What we help with</h2>
            <p className="sub">Whatever the subject, we help you get from "I don't get it" to "I've got this."</p>
            <ul className="help">
              <li><b>Understanding the question</b><span>Break down what your teacher is really asking for.</span></li>
              <li><b>Planning your work</b><span>Turn a big assignment into small steps with a deadline for each.</span></li>
              <li><b>Outlines and structure</b><span>Organise your ideas before you start writing.</span></li>
              <li><b>Draft feedback</b><span>Get notes on clarity, grammar and flow, then improve it yourself.</span></li>
              <li><b>Worked examples</b><span>See a problem solved step by step, then try the next one on your own.</span></li>
              <li><b>References and formatting</b><span>Cite sources properly and format to your school's style.</span></li>
            </ul>
          </div>
        </section>

        <section id="how" className="panel">
          <div className="wrap">
            <h2>How it works</h2>
            <p className="sub">Three steps, and you stay in charge of your own work.</p>
            <ol className="steps">
              <li><b>Send your request</b><span>Tell us the subject, what you're stuck on and your deadline.</span></li>
              <li><b>Get guidance</b><span>We explain the task, plan it with you and answer your questions.</span></li>
              <li><b>Write and submit</b><span>Do the work in your own words, get feedback, then hand it in.</span></li>
            </ol>
          </div>
        </section>

        <section id="reviews">
          <div className="wrap">
            <h2>What students say</h2>
            <p className="sub">Real feedback from students we've helped.</p>
            <div className="reviews">
              {REVIEWS.map((r, i) =>
                r.placeholder ? (
                  <figure className="review ph" key={i}>
                    <blockquote>Your student review goes here.</blockquote>
                    <figcaption>Student name, course</figcaption>
                  </figure>
                ) : (
                  <figure className="review" key={i}>
                    <blockquote>{r.quote}</blockquote>
                    <figcaption>{r.name}{r.detail ? `, ${r.detail}` : ""}</figcaption>
                  </figure>
                )
              )}
            </div>
          </div>
        </section>

        <section className="panel">
          <div className="wrap">
            <div className="promise">
              <h2>Learn it, don't just copy it.</h2>
              <p>We help you understand your work so the next assignment is easier. Everything you submit should be your own.</p>
            </div>
          </div>
        </section>

        <section id="faq">
          <div className="wrap narrow">
            <h2>Common questions</h2>
            <div className="faq">
              {FAQS.map((f) => (
                <details key={f.q}><summary>{f.q}</summary><p>{f.a}</p></details>
              ))}
            </div>
          </div>
        </section>

        <section className="panel center">
          <div className="wrap">
            <h2>Bring a friend, both of you benefit.</h2>
            <p className="sub mid">Join our referral program and earn when your friends get help.</p>
            <Link className="btn" href="/referral">Join our referral program</Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
