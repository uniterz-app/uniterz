// lib/leagues.ts

/** Firestore に保存するリーグID（internal key）*/
export const LEAGUES = {
  BJ: "bj",
  J1: "j1",
  NBA: "nba",
  PL: "pl",
  WC: "wc",
} as const;

/** TypeScript 用リーグ型（"bj" | "j1" | "nba" | "pl" | "wc"） */
export type League = (typeof LEAGUES)[keyof typeof LEAGUES];

/** 表示名（Analytics/UI表記に利用） */
export const LEAGUE_DISPLAY: Record<League, string> = {
  bj: "B1",
  j1: "J1",
  nba: "NBA",
  pl: "Premier League",
  wc: "World Cup",
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

  // world cup / fifa
  if (v === "wc" || v === "worldcup" || v === "fifa" || v.includes("world cup") || v.includes("world_cup")) {
    return "wc";
  }

  // ★ フォールバック（League 型として安全）
  return "bj";
}

/** 投稿一覧のリーグ判定（gameId プレフィックスで欠落・誤変換を補正） */
export function resolvePostListLeague(post: {
  league?: unknown;
  gameId?: unknown;
}): League {
  const gameId = String(post.gameId ?? "");
  if (gameId.startsWith("wc-")) return LEAGUES.WC;
  if (gameId.startsWith("nba-")) return LEAGUES.NBA;
  return normalizeLeague(post.league);
}

