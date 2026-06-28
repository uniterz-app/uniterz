import {
  computeGroupStandings,
  type WcStandingGame,
  type WcStandingRow,
} from "@/lib/wc/computeGroupStandings";
import { getWcGroupForTeam, type WcGroupCode } from "@/lib/wc/groups";
import type { Language } from "@/lib/i18n/language";
import { normalizeWcTeamId } from "@/lib/wc/resolveWcTeamId";
import { isWcKnockoutGame } from "@/lib/wc/isWcKnockoutGame";
import { resolveFrozenWc2026GroupStageStanding, resolveOfficialWc2026GroupStageRank } from "@/lib/wc/wc2026GroupStageFrozenRecords";
import type { TeamRecordLine } from "@/lib/teamRecordDisplay";

export type WcStandingGameMeta = WcStandingGame & {
  roundLabel?: string | null;
  knockout?: boolean | null;
  wcStage?: string | null;
};

/** グループリーグ試合のみ（ノックアウトの結果は除外） */
export function filterWcGroupStageGames<T extends WcStandingGameMeta>(
  games: readonly T[]
): T[] {
  return games.filter(
    (g) =>
      !isWcKnockoutGame({
        league: "wc",
        knockout: g.knockout ?? null,
        roundLabel: g.roundLabel ?? null,
        wcStage: g.wcStage ?? null,
      })
  );
}

function resolveWcGroupStandingForTeamInGroup(
  teamId: string,
  games: readonly WcStandingGame[] | null | undefined
): WcGroupStandingEntry | null {
  const group = getWcGroupForTeam(teamId);
  if (!group) return null;
  const rows = computeGroupStandings(group.teamIds, games ?? []);
  const entry = pickStandingEntry(teamId, group.teamIds, rows);
  if (!entry) return null;
  const officialRank = resolveOfficialWc2026GroupStageRank(teamId);
  return officialRank == null ? entry : { ...entry, rank: officialRank };
}

export function toWcGroupStandingEntryFromTeamRecord(
  record: TeamRecordLine | null | undefined,
  teamId?: string | null
): WcGroupStandingEntry | null {
  if (!record) return null;
  const officialRank = resolveOfficialWc2026GroupStageRank(teamId);
  const rank = officialRank ?? record.rank;
  if (rank == null || !Number.isFinite(rank) || rank <= 0) return null;
  return {
    wins: Number(record.wins ?? 0),
    draws: Number(record.draws ?? 0),
    losses: Number(record.losses ?? 0),
    rank: Math.trunc(rank),
  };
}

/** ノックアウト試合カード — teams 戦績 or 確定スナップショットを即表示 */
export function resolveWcGroupStageStandingForKnockoutDisplay(
  teamId: string | null | undefined,
  record?: TeamRecordLine | null
): WcGroupStandingEntry | null {
  return (
    toWcGroupStandingEntryFromTeamRecord(record, teamId) ??
    resolveFrozenWc2026GroupStageStanding(teamId) ??
    null
  );
}

export function resolveWcGroupStageStandingForTeam(
  teamId: string | null | undefined,
  games: readonly WcStandingGameMeta[] | null | undefined
): WcGroupStandingEntry | null {
  const id = normalizeWcTeamId(teamId) ?? teamId?.trim() ?? "";
  if (!id) return null;
  const frozen = resolveFrozenWc2026GroupStageStanding(id);
  const filtered = filterWcGroupStageGames(games ?? []);
  if (filtered.length === 0) return frozen;
  const fromGames = resolveWcGroupStandingForTeamInGroup(id, filtered);
  return fromGames ?? frozen;
}

/** グループステージの勝敗・順位のみ（ノックアウト試合は集計に含めない） */
export function resolveWcGroupStageStandingsForMatch(
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined,
  games: readonly WcStandingGameMeta[] | null | undefined
): WcGroupStandingsForMatch {
  const filtered = filterWcGroupStageGames(games ?? []);
  return resolveWcGroupStandingsForMatch(homeTeamId, awayTeamId, filtered);
}

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

function canonicalGroupTeamId(
  teamId: string,
  groupTeamIds: readonly string[]
): string | null {
  const normalized = normalizeWcTeamId(teamId);
  if (!normalized) return null;
  return (
    groupTeamIds.find((id) => normalizeWcTeamId(id) === normalized) ?? null
  );
}

function pickStandingEntry(
  teamId: string,
  groupTeamIds: readonly string[],
  rows: WcStandingRow[]
): WcGroupStandingEntry | null {
  const canonicalId = canonicalGroupTeamId(teamId, groupTeamIds);
  if (!canonicalId) return null;
  const index = rows.findIndex((r) => r.teamId === canonicalId);
  if (index < 0) return null;
  const row = rows[index]!;
  if (row.played <= 0) {
    return { wins: 0, draws: 0, losses: 0, rank: index + 1 };
  }
  return toEntry(row, index + 1);
}

/** グループ内順位・勝敗分（ホーム・アウェイは各グループを個別に解決） */
export function resolveWcGroupStandingsForMatch(
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined,
  games: readonly WcStandingGame[] | null | undefined
): WcGroupStandingsForMatch {
  const homeId = normalizeWcTeamId(homeTeamId) ?? homeTeamId?.trim() ?? "";
  const awayId = normalizeWcTeamId(awayTeamId) ?? awayTeamId?.trim() ?? "";
  const gameList = games ?? [];

  const homeStanding = homeId
    ? resolveWcGroupStandingForTeamInGroup(homeId, gameList) ??
      resolveFrozenWc2026GroupStageStanding(homeId)
    : null;
  const awayStanding = awayId
    ? resolveWcGroupStandingForTeamInGroup(awayId, gameList) ??
      resolveFrozenWc2026GroupStageStanding(awayId)
    : null;

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

/** スコア上 — グループ名（例: GROUP K） */
export function formatWcGroupCodeLabel(groupCode: WcGroupCode): string {
  return `GROUP ${groupCode}`;
}

export function resolveWcGroupCodeLabel(
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined
): string | null {
  const homeId = normalizeWcTeamId(homeTeamId) ?? homeTeamId?.trim() ?? "";
  const awayId = normalizeWcTeamId(awayTeamId) ?? awayTeamId?.trim() ?? "";
  const group =
    (homeId ? getWcGroupForTeam(homeId) : null) ??
    (awayId ? getWcGroupForTeam(awayId) : null);
  if (!group) return null;
  return formatWcGroupCodeLabel(group.code);
}

/** @deprecated resolveWcGroupCodeLabel を使用 */
export function formatWcGroupStageLine(
  groupCode: WcGroupCode,
  language: Language
): string {
  if (language === "en") {
    return `Group ${groupCode}`;
  }
  return `グループ ${groupCode}`;
}

export function resolveWcGroupStageLine(
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined,
  language: Language
): string | null {
  const homeId = normalizeWcTeamId(homeTeamId) ?? homeTeamId?.trim() ?? "";
  const awayId = normalizeWcTeamId(awayTeamId) ?? awayTeamId?.trim() ?? "";
  const group =
    (homeId ? getWcGroupForTeam(homeId) : null) ??
    (awayId ? getWcGroupForTeam(awayId) : null);
  if (!group) return null;
  return formatWcGroupStageLine(group.code, language);
}
