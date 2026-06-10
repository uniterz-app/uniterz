import { LEAGUES, type League } from "@/lib/leagues";
import type { CommunityLeague } from "./types";

/** グループ作成時に指定できる競争対象チームの上限 */
export const MAX_RANKING_TEAM_IDS = 5;

export function parseRankingTeamIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return [
    ...new Set(
      raw
        .map((x) => String(x ?? "").trim())
        .filter(Boolean)
    ),
  ].slice(0, MAX_RANKING_TEAM_IDS);
}

export function teamLeagueFromTeamId(teamId: string): League | null {
  const prefix = teamId.split("-")[0]?.toLowerCase();
  const values = Object.values(LEAGUES) as League[];
  return values.includes(prefix as League) ? (prefix as League) : null;
}

export function validateRankingTeamIds(
  ids: string[],
  rankingLeague: CommunityLeague
): { ok: true; ids: string[] } | { ok: false; error: string } {
  if (ids.length > MAX_RANKING_TEAM_IDS) {
    return { ok: false, error: "too_many_teams" };
  }
  for (const id of ids) {
    const teamLeague = teamLeagueFromTeamId(id);
    if (!teamLeague) return { ok: false, error: "invalid_team_id" };
    if (rankingLeague !== "all" && teamLeague !== rankingLeague) {
      return { ok: false, error: "team_league_mismatch" };
    }
  }
  return { ok: true, ids };
}

/** Firestore groups ドキュメントから rankingTeamIds を読む（後方互換: 未設定は []） */
export function readRankingTeamIds(data: Record<string, unknown> | undefined): string[] {
  return parseRankingTeamIds(data?.rankingTeamIds);
}
