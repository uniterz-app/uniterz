import { normalizeLeague } from "@/lib/leagues";

/** リザルト UI で WC 専用扱いにするか（スコア精度非表示など） */
export function isWcResultLeague(raw: unknown): boolean {
  return normalizeLeague(raw) === "wc";
}

/** リザルトにスコア精度行を出すか */
export function resultShowsScorePrecision(league: unknown): boolean {
  return !isWcResultLeague(league);
}
