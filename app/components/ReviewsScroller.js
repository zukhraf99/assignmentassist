"use client";
import { useEffect, useRef } from "react";

function Stars({ n }) {
  return (
    <div className="stars" role="img" aria-label={`${n} out of 5 stars`}>
      {"★".repeat(n)}<span className="off">{"★".repeat(5 - n)}</span>
    </div>
  );
}

export default function ReviewsScroller({ reviews }) {
  const ref = useRef(null);
  const paused = useRef(false);

  function go(dir) {
    const el = ref.current;
    if (!el) return;
    const card = el.querySelector(".review");
    const step = card ? card.offsetWidth + 20 : 300;
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
    if (dir > 0 && atEnd) el.scrollTo({ left: 0, behavior: "smooth" });
    else if (dir < 0 && el.scrollLeft <= 4) el.scrollTo({ left: el.scrollWidth, behavior: "smooth" });
    else el.scrollBy({ left: dir * step, behavior: "smooth" });
  }

  // Gentle auto-advance. Pauses on hover, focus and touch. Off for reduced-motion users.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = setInterval(() => {
      const el = ref.current;
      if (!el || paused.current || el.scrollWidth <= el.clientWidth + 4) return;
      go(1);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  const pause = () => { paused.current = true; };
  const resume = () => { paused.current = false; };

  return (
    <div className="rwrap">
      {reviews.length > 1 && (
        <div className="rnav">
          <button type="button" onClick={() => go(-1)} aria-label="Previous reviews">←</button>
          <button type="button" onClick={() => go(1)} aria-label="Next reviews">→</button>
        </div>
      )}
      <div
        className="rscroll" ref={ref} tabIndex={0} role="region" aria-label="Student reviews"
        onMouseEnter={pause} onMouseLeave={resume} onFocus={pause} onBlur={resume}
        onTouchStart={() => { pause(); setTimeout(resume, 8000); }}
      >
        {reviews.map((r, i) => (
          <figure className="review" key={i}>
            {r.rating > 0 && <Stars n={r.rating} />}
            <blockquote>{r.quote}</blockquote>
            <figcaption>{r.name}{r.course ? `, ${r.course}` : ""}</figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
