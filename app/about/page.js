import Link from "next/link";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SITE } from "@/lib/config";

export const metadata = {
  title: "About Us",
  description: "Assignment Assist is a team of tutors who help students understand their assignments, plan their work and improve their own writing.",
  alternates: { canonical: "/about" },
};

export default function About() {
  return (
    <>
      <Header />
      <main className="page">
        <div className="wrap narrow">
          <h1>About Assignment Assist</h1>
          <p className="sub">We help students get unstuck and finish their assignments with confidence.</p>

          <h2>Why we started</h2>
          <p>Assignments get stressful, especially when a deadline is close and the task isn't clear. We started Assignment Assist so students have somewhere quick and friendly to turn for help.</p>

          <h2>How we help</h2>
          <ul>
            <li>We explain the question so you know what your teacher expects.</li>
            <li>We help you plan your time and break the work into steps.</li>
            <li>We give feedback on your own drafts: structure, clarity, grammar and referencing.</li>
            <li>We show worked examples so you can learn the method and apply it yourself.</li>
          </ul>

          <h2>What we believe</h2>
          <p>The best help is the kind that makes the next assignment easier. You write your own work, in your own words, and we help you get there. Your information stays private and is never shared.</p>

          <div className="card">
            <b>Need help with an assignment?</b>
            <p>Send us a request or message us directly. We usually reply within {SITE.replyTime}.</p>
            <Link className="btn" href="/#request">Send a request</Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
