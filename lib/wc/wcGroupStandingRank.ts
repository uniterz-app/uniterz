import {
  computeGroupStandings,
  type WcStandingGame,
  type WcStandingRow,
} from "@/lib/wc/computeGroupStandings";
import { getWcGroupForTeam, type WcGroupCode } from "@/lib/wc/groups";
import type { Language } from "@/lib/i18n/language";

export type WcGroupStandingEntry = {
  wins: number;
  draws: number;
  losses: number;
  rank: number;
};

export type WcGroupStandingsForMatch = {
  homeRank: number | null;
  awayRank: number | null;
  homeStanding: WcGroupStandingEntry | null;
  awayStanding: WcGroupStandingEntry | null;
};

function toEntry(row: WcStandingRow, rank: number): WcGroupStandingEntry {
  return {
    wins: row.wins,
    draws: row.draws,
    losses: row.losses,
    rank,
  };
}

function pickStandingEntry(
  teamId: string,
  groupTeamIds: readonly string[],
  rows: WcStandingRow[]
): WcGroupStandingEntry | null {
  if (!teamId || !groupTeamIds.includes(teamId)) return null;
  const index = rows.findIndex((r) => r.teamId === teamId);
  if (index < 0) return null;
  const row = rows[index]!;
  if (row.played <= 0) return null;
  return toEntry(row, index + 1);
}

/** グループ内順位・勝敗分（試合未消化のチームは null） */
export function resolveWcGroupStandingsForMatch(
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined,
  games: readonly WcStandingGame[] | null | undefined
): WcGroupStandingsForMatch {
  const homeId = homeTeamId?.trim() ?? "";
  const awayId = awayTeamId?.trim() ?? "";
  const group =
    (homeId ? getWcGroupForTeam(homeId) : null) ??
    (awayId ? getWcGroupForTeam(awayId) : null);
  if (!group || !games) {
    return {
      homeRank: null,
      awayRank: null,
      homeStanding: null,
      awayStanding: null,
    };
  }

  const rows = computeGroupStandings(group.teamIds, games);
  const homeStanding = pickStandingEntry(homeId, group.teamIds, rows);
  const awayStanding = pickStandingEntry(awayId, group.teamIds, rows);

  return {
    homeRank: homeStanding?.rank ?? null,
    awayRank: awayStanding?.rank ?? null,
    homeStanding,
    awayStanding,
  };
}

/** @deprecated resolveWcGroupStandingsForMatch を使用 */
export type WcGroupStandingRanks = Pick<
  WcGroupStandingsForMatch,
  "homeRank" | "awayRank"
>;

export function resolveWcGroupStandingRanks(
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined,
  games: readonly WcStandingGame[] | null | undefined
): WcGroupStandingRanks {
  const r = resolveWcGroupStandingsForMatch(homeTeamId, awayTeamId, games);
  return { homeRank: r.homeRank, awayRank: r.awayRank };
}

export function formatWcGroupStandingRankLabel(
  rank: number,
  _language?: Language
): string {
  return formatEnglishOrdinal(rank);
}

function formatEnglishOrdinal(n: number): string {
  const mod100 = n % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
}

/** 国旗下 — 勝敗分 + グループ順位（例: (1-0-2) 4th） */
export function formatWcGroupStageRecordLabel(
  entry: WcGroupStandingEntry,
  language: Language
): string {
  const core = `(${entry.wins}-${entry.draws}-${entry.losses})`;
  return `${core} ${formatWcGroupStandingRankLabel(entry.rank, language)}`;
}

/** スコア下 — グループステージ表記（例: グループステージ · グループ K） */
export function formatWcGroupStageLine(
  groupCode: WcGroupCode,
  language: Language
): string {
  if (language === "en") {
    return `Group Stage · Group ${groupCode}`;
  }
  return `グループステージ · グループ ${groupCode}`;
}

export function resolveWcGroupStageLine(
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined,
  language: Language
): string | null {
  const group =
    (homeTeamId?.trim() ? getWcGroupForTeam(homeTeamId.trim()) : null) ??
    (awayTeamId?.trim() ? getWcGroupForTeam(awayTeamId.trim()) : null);
  if (!group) return null;
  return formatWcGroupStageLine(group.code, language);
}
