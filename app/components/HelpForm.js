"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { SUBJECTS } from "@/lib/config";

const MAX_MB = 20;

export default function HelpForm() {
  const [status, setStatus] = useState("idle"); // idle | sending | done | error
  const [error, setError] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    const form = e.currentTarget;
    const fd = new FormData(form);
    const file = fd.get("file");

    if (file && file.size > MAX_MB * 1024 * 1024) {
      setError(`That file is over ${MAX_MB} MB. Please upload a smaller file or email it to us.`);
      return;
    }
    setStatus("sending");
    try {
      let filePath = null, fileName = null;
      if (file && file.size > 0) {
        const r = await fetch("/api/upload-url", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: file.name }),
        });
        const up = await r.json();
        if (!r.ok) throw new Error(up.error || "Could not prepare the upload.");
        const supabase = createClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL,
          process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
        );
        const { error: upErr } = await supabase.storage
          .from("submissions")
          .uploadToSignedUrl(up.path, up.token, file);
        if (upErr) throw new Error("File upload failed. Please try again or email the file to us.");
        filePath = up.path; fileName = file.name;
      }
      const res = await fetch("/api/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"), email: fd.get("email"), whatsapp: fd.get("whatsapp"),
          subject: fd.get("subject"), deadline: fd.get("deadline"),
          details: fd.get("details"), filePath, fileName, website: fd.get("website"),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStatus("done");
      form.reset();
    } catch (err) {
      setError(err.message);
      setStatus("error");
    }
  }

  if (status === "done") {
    return (
      <div className="success" role="status">
        <h3>Request received</h3>
        <p>Thanks! We'll contact you shortly. If your deadline is very close, message us on WhatsApp too.</p>
      </div>
    );
  }

  return (
    <form className="helpform" onSubmit={onSubmit}>
      <div className="row">
        <label>Your name<input name="name" required maxLength={80} autoComplete="name" /></label>
        <label>Email<input name="email" type="email" required maxLength={120} autoComplete="email" /></label>
      </div>
      <div className="row">
        <label>WhatsApp number (optional)<input name="whatsapp" maxLength={30} inputMode="tel" placeholder="+92 ..." /></label>
        <label>Subject
          <select name="subject" required defaultValue="">
            <option value="" disabled>Choose a subject</option>
            {SUBJECTS.map((s) => <option key={s}>{s}</option>)}
          </select>
        </label>
      </div>
      <label>Deadline
        <input name="deadline" type="datetime-local" required />
      </label>
      <label>What do you need help with?
        <textarea name="details" required rows={5} maxLength={4000}
          placeholder="Tell us the topic, what you've done so far and where you're stuck." />
      </label>
      <label>Upload your assignment brief or draft (optional, max {MAX_MB} MB)
        <input name="file" type="file" accept=".pdf,.doc,.docx,.txt,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.zip" />
      </label>
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="hp" />
      <p className="fine">
        We coach you through your own work with explanations, planning, feedback and examples.
        We don't write assignments for you to submit.
      </p>
      {error && <p className="err" role="alert">{error}</p>}
      <button className="btn" type="submit" disabled={status === "sending"}>
        {status === "sending" ? "Sending..." : "Send my request"}
      </button>
    </form>
  );
}
