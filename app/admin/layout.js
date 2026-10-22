import Link from "next/link";
import { cookies } from "next/headers";
import { verifySession, COOKIE_NAME } from "@/lib/adminAuth";
import LogoutButton from "./LogoutButton";

export const metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }) {
  const authed = await verifySession(cookies().get(COOKIE_NAME)?.value);
  return (
    <div className="admin">
      <header className="adm-bar">
        <div className="wrap adm-in">
          <Link href="/admin" className="adm-logo">Assignment Assist · Admin</Link>
          {authed && (
            <nav>
              <Link href="/admin/guides">Guides</Link>
              <Link href="/admin/archive">Private archive</Link>
              <Link href="/admin/taxonomy">Universities &amp; subjects</Link>
              <Link href="/" target="_blank">View site</Link>
              <LogoutButton />
            </nav>
          )}
        </div>
      </header>
      <div className="wrap adm-main">{children}</div>
    </div>
  );
}
