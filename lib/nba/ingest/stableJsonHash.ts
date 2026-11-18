import { createHash } from "node:crypto";

/** キー順に依存しない JSON 文字列（undefined は落とす）。変更検知のハッシュ用 */
export function stableJson(x: unknown): string {
  if (x === undefined) return "null";
  if (Array.isArray(x)) return `[${x.map(stableJson).join(",")}]`;
  if (x && typeof x === "object") {
    const o = x as Record<string, unknown>;
    return `{${Object.keys(o)
      .filter((k) => o[k] !== undefined)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${stableJson(o[k])}`)
      .join(",")}}`;
  }
  return JSON.stringify(x) ?? "null";
}

/** 同じ内容なら同じ文字列。書き込みを省く判定に使う */
export function stableJsonHash(x: unknown): string {
  return createHash("sha1").update(stableJson(x)).digest("hex");
}
