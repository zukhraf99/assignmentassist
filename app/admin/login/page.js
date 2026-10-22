"use client";
import { useState } from "react";

export default function Login() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  async function submit(e) {
    e.preventDefault(); setError(""); setBusy(true);
    const res = await fetch("/api/admin/login", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: new FormData(e.currentTarget).get("password") }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) { window.location.href = "/admin"; return; }
    setError(data.error || "Could not log in."); setBusy(false);
  }
  return (
    <form className="helpform adm-login" onSubmit={submit}>
      <h1 className="h1s">Admin login</h1>
      <label>Password<input type="password" name="password" required autoFocus autoComplete="current-password" /></label>
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn" disabled={busy}>{busy ? "Checking..." : "Log in"}</button>
    </form>
  );
}
