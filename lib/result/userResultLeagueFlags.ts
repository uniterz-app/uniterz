import { LEAGUES, type League } from "@/lib/leagues";
import type { ResultListLeagueTab } from "@/lib/result/result-page-data";

export type UserResultLeagueFlags = {
  hasNbaPost: boolean;
  hasWcPost: boolean;
};

export function parseUserResultLeagueFlags(
  raw: unknown
): UserResultLeagueFlags {
  const o = raw as Record<string, unknown> | null | undefined;
  return {
    hasNbaPost: o?.hasNbaPost === true,
    hasWcPost: o?.hasWcPost === true,
  };
}

/** NBA 固定 — リーグ切替タブは出さない */
export function shouldShowResultLeagueTabs(
  _flags: UserResultLeagueFlags
): boolean {
  return false;
}

/** 一覧は常に NBA */
export function defaultResultListLeagueTab(
  _flags: UserResultLeagueFlags
): ResultListLeagueTab {
  return LEAGUES.NBA;
}

/** 新規予想保存時に users/{uid} へ書くフィールド（NBA / WC のみ） */
export function resultLeagueFlagPatchForPost(
  league: League
): Partial<Record<"hasNbaPost" | "hasWcPost", true>> | null {
  if (league === LEAGUES.NBA) return { hasNbaPost: true };
  if (league === LEAGUES.WC) return { hasWcPost: true };
  return null;
}
