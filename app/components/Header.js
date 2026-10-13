import Link from "next/link";

export default function Header() {
  return (
    <header>
      <div className="wrap hdr">
        <Link className="logo" href="/">Assignment<span>Assist</span></Link>
        <nav aria-label="Main">
          <Link href="/#help">What we help with</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link className="keep" href="/#request">Get help</Link>
        </nav>
      </div>
    </header>
  );
}
