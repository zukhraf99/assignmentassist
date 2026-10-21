"use client";
import { useCallback, useEffect, useState } from "react";

// Shows the captcha image + an input named "captchaAnswer".
// Calls onToken(token) whenever a new challenge loads. Change reloadKey to force a new one.
export default function Captcha({ onToken, reloadKey = 0 }) {
  const [image, setImage] = useState("");
  const [answer, setAnswer] = useState("");
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    setFailed(false); setAnswer(""); onToken("");
    try {
      const res = await fetch("/api/captcha", { cache: "no-store" });
      const data = await res.json();
      setImage(data.image); onToken(data.token);
    } catch { setFailed(true); }
  }, [onToken]);

  useEffect(() => { load(); }, [load, reloadKey]);

  return (
    <div className="captcha-box">
      <span className="cap-label">Type the 5 digits you see</span>
      <div className="cap-row">
        {image && <img src={image} width={200} height={64} alt="Captcha: a picture of 5 digits" />}
        <button type="button" className="btn ghost cap-btn" onClick={load} aria-label="Get a new picture">↻ New</button>
      </div>
      {failed && <p className="err">Could not load the captcha. Click "New" to try again.</p>}
      <input name="captchaAnswer" value={answer} onChange={(e) => setAnswer(e.target.value)}
        inputMode="numeric" autoComplete="off" maxLength={5} placeholder="12345" required />
    </div>
  );
}
