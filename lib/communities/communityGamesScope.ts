/** グループ集計の試合対象（作成時に確定） */
export const COMMUNITY_GAMES_SCOPES = ["all", "pickup"] as const;

export type CommunityGamesScope = (typeof COMMUNITY_GAMES_SCOPES)[number];

export function parseCommunityGamesScope(raw: unknown): CommunityGamesScope {
  const s = String(raw ?? "").trim().toLowerCase();
  if (s === "pickup") return "pickup";
  return "all";
}

/** Firestore groups から読む（未設定は all = オープンランキング相当） */
export function readCommunityGamesScope(
  data: Record<string, unknown> | undefined
): CommunityGamesScope {
  return parseCommunityGamesScope(data?.rankingGamesScope);
}
