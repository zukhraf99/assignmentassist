import Link from "next/link";
import { SITE, REVIEWS, FAQS } from "@/lib/config";
import ContactButtons from "./components/ContactButtons";
import HelpForm from "./components/HelpForm";
import Header from "./components/Header";
import Footer from "./components/Footer";
import ReviewsSection from "./components/ReviewsSection";

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
export const revalidate = 3600;
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
              <h1>Stuck on an assignment? Let <span className="mark">me do it</span> for you!</h1>
              <p className="lede">Assignment Assist helps students achieve better grades and tackle any task, from assignments and reports to documentation and projects even when deadlines are tight.</p>
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
            <p className="sub">Practical academic support that helps you understand the work and submit with confidence."</p>
            <ul className="help">
              <li><b>Assignments, Reports & Papers</b><span>Get help structuring, developing, and polishing your academic work.</span></li>
              <li><b>Urgent & On-Time Delivery</b><span>Deadline-focused support to help you stay on track, even when time is short.</span></li>
              <li><b>Projects & Documentation</b><span>Support with project planning, technical documentation, and clear presentation.</span></li>
              <li><b>Guidance That Teaches</b><span>Understand the process with clear explanations, examples, and step-by-step help.</span></li>
              <li><b>Human-Written, Original Work</b><span>No AI-generated or generic AI-slop content. Work is written thoughtfully and tailored to your requirements.</span></li>
              <li><b>Review, Editing & Formatting</b><span>Improve clarity, grammar, structure, citations, and formatting to match your guidelines.</span></li>
            </ul>
          </div>
        </section>

        <section id="how" className="panel">
          <div className="wrap">
            <h2>How it works</h2>
            <p className="sub">Three steps, and you stay in charge of your own work.</p>
            <ol className="steps">
              <li><b>Send your request</b><span>Tell us about your assignment, report, project, or documentation. Share your requirements, guidelines, and deadline.</span></li>
              <li><b>Get Help & Guidance</b><span>We review your requirements, explain the task, help you plan your work, and provide clear guidance tailored to your needs.</span></li>
              <li><b>Review, Learn & Submit</b><span>Get feedback, improve your work, and understand the key concepts so you can confidently finalize and submit.</span></li>
            </ol>
          </div>
        </section>

        <ReviewsSection />

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
