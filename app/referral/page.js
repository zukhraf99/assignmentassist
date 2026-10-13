import Link from "next/link";
import ReferralForm from "../components/ReferralForm";

export const metadata = {
  title: "Referral Program",
  description: "Join the Assignment Assist referral program: bring friends who need study help and earn rewards.",
  alternates: { canonical: "/referral" },
};

export default function Referral() {
  return (
    <main>
      <header>
        <div className="wrap hdr">
          <Link className="logo" href="/">Assignment<span>Assist</span></Link>
        </div>
      </header>
      <section>
        <div className="wrap narrow">
          <h1 className="h1s">Refer a friend, earn rewards.</h1>
          <p className="sub">Sign up to get your personal referral code. Share it with classmates who need study help. We'll message you the reward details.</p>
          <ReferralForm />
        </div>
      </section>
    </main>
  );
}
