"use client";
import { useState } from "react";
import Captcha from "./Captcha";

export default function ReviewForm() {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | sending | done
  const [error, setError] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const fd = new FormData(e.currentTarget);
    if (!captchaToken || !String(fd.get("captchaAnswer")).trim()) { setError("Please type the digits from the picture."); return; }
    setStatus("sending");
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"), course: fd.get("course"), rating: Number(fd.get("rating")),
          quote: fd.get("quote"), email: fd.get("email"), school: fd.get("school"),
          consent: fd.get("consent") === "on", website: fd.get("website"),
          captchaToken, captchaAnswer: fd.get("captchaAnswer"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("done");
    } catch (err) {
      setError(err.message);
      setStatus("idle");
      setReloadKey((k) => k + 1); // every challenge works once, so get a fresh one
    }
  }

  if (status === "done") {
    return (
      <div className="success rev-cta" role="status">
        <h3>Thank you!</h3>
        <p>Your review has been sent to us. It will appear on the site once we've approved it.</p>
      </div>
    );
  }

  if (!open) {
    return (
      <div className="rev-cta">
        <button type="button" className="btn ghost" onClick={() => setOpen(true)}>Write your review</button>
      </div>
    );
  }

  return (
    <form className="helpform rev-cta" onSubmit={onSubmit}>
      <h3 className="rev-title">Write your review</h3>
      <div className="row">
        <label>Name (shown on the site)<input name="name" required maxLength={60} placeholder="First name or nickname" /></label>
        <label>Course (shown on the site)<input name="course" required maxLength={80} placeholder="e.g. BBA, Computer Science" /></label>
      </div>
      <label>Rating
        <select name="rating" defaultValue="5" required>
          <option value="5">5 – Excellent</option>
          <option value="4">4 – Very good</option>
          <option value="3">3 – Good</option>
          <option value="2">2 – Fair</option>
          <option value="1">1 – Poor</option>
        </select>
      </label>
      <label>Your review
        <textarea name="quote" required rows={4} minLength={20} maxLength={600} placeholder="How did we help you?" />
      </label>
      <div className="row">
        <label>Email (private, never shown)<input name="email" type="email" required maxLength={120} /></label>
        <label>School or university (private, optional)<input name="school" maxLength={100} /></label>
      </div>
      <label className="check">
        <input type="checkbox" name="consent" required />
        <span>I agree that my review, name and course may be shown on this website.</span>
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
      <Captcha onToken={setCaptchaToken} reloadKey={reloadKey} />
      {error && <p className="err" role="alert">{error}</p>}
      <div>
        <button className="btn" type="submit" disabled={status === "sending"}>
          {status === "sending" ? "Sending..." : "Submit review"}
        </button>
        <button type="button" className="btn ghost sp" onClick={() => setOpen(false)}>Cancel</button>
      </div>
    </form>
  );
}
