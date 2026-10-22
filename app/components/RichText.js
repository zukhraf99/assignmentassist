import { Fragment } from "react";

// Turns the guide editor's simple format into HTML safely (never injects raw HTML).
//   ## Heading    ### Sub-heading    - bullet    1. numbered    **bold**    [text](https://link)
function inline(text, keyBase) {
  const parts = String(text).split(/(\*\*[^*]+\*\*|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g);
  return parts.map((p, i) => {
    let m;
    if ((m = p.match(/^\*\*([^*]+)\*\*$/))) return <strong key={keyBase + i}>{m[1]}</strong>;
    if ((m = p.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/)))
      return <a key={keyBase + i} href={m[2]} target="_blank" rel="noopener noreferrer nofollow">{m[1]}</a>;
    return <Fragment key={keyBase + i}>{p}</Fragment>;
  });
}

export function parseBlocks(body) {
  const blocks = [];
  let cur = null;
  const push = () => { if (cur) { blocks.push(cur); cur = null; } };
  for (const raw of String(body || "").replace(/\r\n?/g, "\n").split("\n")) {
    const line = raw.trim();
    if (!line) { push(); continue; }
    let m;
    if ((m = line.match(/^###\s+(.+)$/))) { push(); blocks.push({ t: "h3", text: m[1] }); }
    else if ((m = line.match(/^##\s+(.+)$/))) { push(); blocks.push({ t: "h2", text: m[1] }); }
    else if ((m = line.match(/^[-*]\s+(.+)$/))) { if (cur?.t !== "ul") { push(); cur = { t: "ul", items: [] }; } cur.items.push(m[1]); }
    else if ((m = line.match(/^\d+[.)]\s+(.+)$/))) { if (cur?.t !== "ol") { push(); cur = { t: "ol", items: [] }; } cur.items.push(m[1]); }
    else { if (cur?.t !== "p") { push(); cur = { t: "p", text: "" }; } cur.text += (cur.text ? " " : "") + line; }
  }
  push();
  return blocks;
}

export default function RichText({ body }) {
  return (
    <div className="rich">
      {parseBlocks(body).map((b, i) => {
        if (b.t === "h2") return <h2 key={i}>{inline(b.text, `h${i}`)}</h2>;
        if (b.t === "h3") return <h3 key={i}>{inline(b.text, `h${i}`)}</h3>;
        if (b.t === "ul") return <ul key={i}>{b.items.map((t, j) => <li key={j}>{inline(t, `l${i}${j}`)}</li>)}</ul>;
        if (b.t === "ol") return <ol key={i}>{b.items.map((t, j) => <li key={j}>{inline(t, `l${i}${j}`)}</li>)}</ol>;
        return <p key={i}>{inline(b.text, `p${i}`)}</p>;
      })}
    </div>
  );
}
