/** 回答中の URL をタップできるリンクに分ける（外部検索の出典用） */

export type NbaAskTextPart =
  | { kind: "text"; text: string }
  | { kind: "link"; url: string };

const URL_RE = /https?:\/\/[^\s<>"']+/g;

export function splitNbaAskLinks(content: string): NbaAskTextPart[] {
  const parts: NbaAskTextPart[] = [];
  let cursor = 0;
  for (const match of content.matchAll(URL_RE)) {
    const start = match.index ?? 0;
    const raw = match[0] ?? "";
    const url = raw.replace(/[),.]+$/, "");
    if (!url) continue;
    if (start > cursor) parts.push({ kind: "text", text: content.slice(cursor, start) });
    parts.push({ kind: "link", url });
    if (url.length < raw.length) {
      parts.push({ kind: "text", text: raw.slice(url.length) });
    }
    cursor = start + raw.length;
  }
  if (cursor < content.length) parts.push({ kind: "text", text: content.slice(cursor) });
  return parts.length > 0 ? parts : [{ kind: "text", text: content }];
}
