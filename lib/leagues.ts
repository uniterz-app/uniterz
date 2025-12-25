// lib/leagues.ts

/** Firestore に保存するリーグID（internal key）*/
export const LEAGUES = {
  BJ: "bj",
  J1: "j1",
  NBA: "nba",
  PL: "pl",
} as const;

/** TypeScript 用リーグ型（"bj" | "j1" | "nba" | "pl"） */
export type League = (typeof LEAGUES)[keyof typeof LEAGUES];

/** 表示名（Analytics/UI表記に利用） */
export const LEAGUE_DISPLAY: Record<League, string> = {
  bj: "B1",
  j1: "J1",
  nba: "NBA",
  pl: "Premier League",
};

/**
 * Firestore の揺れ値を吸収して League に正規化する
 * 重要：必ず League を返す（null を返さない）
 */
export function normalizeLeague(raw: any): League {
  const v = String(raw ?? "").trim().toLowerCase();

  // bj
  if (v === "bj" || v === "b1" || v.includes("b.league")) return "bj";

  // j1
  if (v === "j1" || v === "j") return "j1";

  // nba
  if (v === "nba") return "nba";

  // premier league
  if (
    v === "pl" ||
    v === "premier" ||
    v.includes("premier league") ||
    v.includes("epl")
  ) {
    return "pl";
  }

  // ★ フォールバック（League 型として安全）
  return "bj";
}

