import Link from "next/link";
import { SUBJECT_PAGES } from "@/lib/subjects";

// A grid of links to every subject page. Use on the homepage: <SubjectsGrid />
export default function SubjectsGrid({ exclude }) {
  return (
    <ul className="pagelinks">
      {SUBJECT_PAGES.filter((s) => s.slug !== exclude).map((s) => (
        <li key={s.slug}>
          <Link href={`/${s.slug}`}><b>{s.name}</b><span>{s.short}</span></Link>
        </li>
      ))}
    </ul>
  );
}
