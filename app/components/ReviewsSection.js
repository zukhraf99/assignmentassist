import { adminClient } from "@/lib/server";
import { REVIEWS } from "@/lib/config";
import ReviewForm from "./ReviewForm";
import ReviewsScroller from "./ReviewsScroller";

async function getApproved() {
  try {
    const { data } = await adminClient()
      .from("reviews")
      .select("name, course, rating, quote")
      .eq("status", "approved")
      .order("created_at", { ascending: false })
      .limit(20);
    return data || [];
  } catch {
    return []; // if the database is unavailable, the page still loads
  }
}

export default async function ReviewsSection() {
  const approved = await getApproved();
  // Hand-added reviews from lib/config.js. Entries still marked placeholder are skipped.
  const manual = REVIEWS.filter((r) => !r.placeholder).map((r) => ({
    quote: r.quote, name: r.name, course: r.detail, rating: Number(r.rating) || 0,
  }));
  const all = [...approved, ...manual];

  const rated = all.filter((r) => r.rating > 0);
  const avg = rated.length ? rated.reduce((s, r) => s + r.rating, 0) / rated.length : 0;

  return (
    <section id="reviews">
      <div className="wrap">
        <h2>What students say</h2>
        <p className="sub">
          Hear from students about their experiences and success with our support.
        </p>

        {all.length > 0 ? (
          <ReviewsScroller reviews={all} />
        ) : (
          <p className="sub">No reviews yet. Be the first to share your experience.</p>
        )}

        <ReviewForm />
      </div>
    </section>
  );
}
