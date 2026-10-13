"use client";
import { useState } from "react";

export default function ReferralForm() {
  const [status, setStatus] = useState("idle");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError(""); setStatus("sending");
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/referral", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fd.get("name"), email: fd.get("email"), whatsapp: fd.get("whatsapp"), website: fd.get("website") }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setCode(data.code); setStatus("done");
    } catch (err) { setError(err.message); setStatus("error"); }
  }

  if (status === "done") {
    return (
      <div className="success" role="status">
        <h3>You're in</h3>
        <p>Your referral code is <b className="code">{code}</b>. Share it with friends. We'll message you the details of the reward.</p>
      </div>
    );
  }
  return (
    <form className="helpform" onSubmit={onSubmit}>
      <label>Your name<input name="name" required maxLength={80} /></label>
      <label>Email<input name="email" type="email" required maxLength={120} /></label>
      <label>WhatsApp number (optional)<input name="whatsapp" maxLength={30} inputMode="tel" /></label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Joining..." : "Join the referral program"}
      </button>
    </form>
  );
}
