import Link from "next/link";
import { SITE } from "@/lib/config";

export default function Footer() {
  return (
    <footer>
      <div className="wrap ftr">
        <span>© {new Date().getFullYear()} {SITE.name}</span>
        <nav aria-label="Footer" className="fnav">
          <Link href="/about">About</Link>
          <Link href="/contact">Contact</Link>
          <Link href="/referral">Referral program</Link>
          <Link href="/privacy">Privacy policy</Link>
          <Link href="/terms">Terms of service</Link>
        </nav>
      </div>
    </footer>
  );
}
