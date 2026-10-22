import Link from "next/link";

export default function GuideCard({ g }) {
  const meta = [g.subject?.name, g.university?.name, g.module_code, g.topic].filter(Boolean).join(" · ");
  return (
    <li>
      <Link href={`/guides/${g.slug}`}>
        <b>{g.title}</b>
        {g.summary && <span>{g.summary}</span>}
        {meta && <small className="gmeta">{meta}</small>}
      </Link>
    </li>
  );
}
