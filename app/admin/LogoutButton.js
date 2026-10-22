"use client";
export default function LogoutButton() {
  async function out() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/admin/login";
  }
  return <button type="button" className="adm-link" onClick={out}>Log out</button>;
}
