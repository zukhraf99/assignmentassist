import { NextResponse } from "next/server";
import { guard } from "@/lib/adminGuard";
import { adminClient } from "@/lib/server";
import { isUuid, cleanStr, toKeywords } from "@/lib/archive";
import { slugify } from "@/lib/slug";
import { revalidateGuides } from "@/lib/revalidate";

const KINDS = { university: ["universities", "aliases"], subject: ["subjects", "keywords"] };

async function uniqueSlug(db, table, base) {
  let slug = slugify(base) || "item", n = 1;
  for (;;) {
    const { data } = await db.from(table).select("id").eq("slug", slug).limit(1);
    if (!data?.length) return slug;
    slug = `${slugify(base) || "item"}-${++n}`;
  }
}

export async function POST(req) {
  const denied = await guard(req); if (denied) return denied;
  try {
    const b = await req.json();
    const kind = KINDS[b.kind];
    if (!kind) return NextResponse.json({ error: "Unknown type." }, { status: 400 });
    const [table, extraCol] = kind;
    const db = adminClient();

    if (b.action === "create") {
      const name = cleanStr(b.name, 120);
      if (!name) return NextResponse.json({ error: "Enter a name." }, { status: 400 });
      const { error } = await db.from(table).insert({ name, slug: await uniqueSlug(db, table, name), [extraCol]: toKeywords(b.extra) });
      if (error) return NextResponse.json({ error: error.code === "23505" ? "That name already exists." : "Could not add it." }, { status: error.code === "23505" ? 409 : 500 });
    } else if (b.action === "update") {
      if (!isUuid(b.id)) return NextResponse.json({ error: "Bad id." }, { status: 400 });
      const patch = {};
      if (b.name !== undefined) { const n = cleanStr(b.name, 120); if (!n) return NextResponse.json({ error: "Name cannot be empty." }, { status: 400 }); patch.name = n; }
      if (b.extra !== undefined) patch[extraCol] = toKeywords(b.extra);
      const { error } = await db.from(table).update(patch).eq("id", b.id);
      if (error) return NextResponse.json({ error: error.code === "23505" ? "That name already exists." : "Could not save." }, { status: error.code === "23505" ? 409 : 500 });
    } else if (b.action === "delete") {
      if (!isUuid(b.id)) return NextResponse.json({ error: "Bad id." }, { status: 400 });
      const { error } = await db.from(table).delete().eq("id", b.id);
      if (error) throw error;
    } else if (b.action === "merge") {
      if (!isUuid(b.fromId) || !isUuid(b.toId) || b.fromId === b.toId) return NextResponse.json({ error: "Pick two different items." }, { status: 400 });
      const col = b.kind === "university" ? "university_id" : "subject_id";
      await db.from("guides").update({ [col]: b.toId }).eq(col, b.fromId);
      await db.from("archive_documents").update({ [col]: b.toId }).eq(col, b.fromId);
      const { error } = await db.from(table).delete().eq("id", b.fromId);
      if (error) throw error;
    } else {
      return NextResponse.json({ error: "Unknown action." }, { status: 400 });
    }
    revalidateGuides();
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
