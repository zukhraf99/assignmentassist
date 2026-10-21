"use client";
import { useState } from "react";

export default function ModerateButtons({ id, token, current }) {
  const [state, setState] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function act(action) {
    setBusy(true); setError("");
    try {
      const res = await fetch("/api/review/moderate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, token, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setState(action === "approve" ? "approved" : "rejected");
    } catch (e) { setError(e.message || "Failed."); }
    setBusy(false);
  }

  return (
    <div>
      <p><b>Status:</b> {state}</p>
      <button className="btn" disabled={busy || state === "approved"} onClick={() => act("approve")}>Approve</button>
      <button className="btn ghost sp" disabled={busy || state === "rejected"} onClick={() => act("reject")}>Reject</button>
      {error && <p className="err">{error}</p>}
    </div>
  );
}
