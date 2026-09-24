/**
 * リーグ Team / Player 表の二段タブ。
 * SEASON | PLAYOFFS
 *  └ Team / Player: PER GAME | TOTAL
 *
 * Last 10 は BDL に season と同粒度（ADVANCED）が無いためタブ廃止。
 * Player 詳細は game logs 由来の LAST 10 をシーズン平均と比較表示。
 * （マッチアップ FORM / Pro Insight は box 由来の狭いセットのみ）
 *
 * データ:
 * - SEASON + PER GAME → season
 * - SEASON + TOTAL → season を出場数で積算（整数。レート系はそのまま）
 * - PLAYOFFS + PER GAME / TOTAL → playoffs
 */

import {
  metricValue,
  teamGamesPlayed,
  type NbaLeagueTeamStatMetric,
  type NbaLeagueTeamStatRow,
} from "@/lib/predict/nbaLeagueTeamStatsMocks";
import {
  playerAdvancedMetricDef,
  type NbaPlayerAdvancedLeaderMetric,
} from "@/lib/predict/nbaPlayerStatLeadersAdvanced";
import {
  isPlayerAdvancedLeaderMetric,
  isPlayerCountLeaderMetric,
  NBA_PLAYER_STAT_LEADER_METRICS,
  type NbaPlayerLeaderMetricId,
  type NbaPlayerStatLeaderRow,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";

export type NbaLeagueStatsPhase = "season" | "playoffs";
export type NbaLeagueStatsMode = "per_game" | "total" | "last10";

export const NBA_LEAGUE_STATS_PHASES =
  ["season", "playoffs"] as const satisfies readonly NbaLeagueStatsPhase[];

export function phaseTabLabel(phase: NbaLeagueStatsPhase): string {
  return phase === "season" ? "SEASON" : "PLAYOFFS";
}

export function modeTabLabel(mode: NbaLeagueStatsMode): string {
  switch (mode) {
    case "per_game":
      return "PER GAME";
    case "total":
      return "TOTAL";
    case "last10":
      return "LAST 10";
  }
}

/** Team リーグ表 — Last 10 なし */
export function modesForTeamPhase(
  _phase: NbaLeagueStatsPhase
): readonly NbaLeagueStatsMode[] {
  return ["per_game", "total"] as const;
}

/** Player Leaders — Last 10 なし（詳細ページの box LAST 10 へ） */
export function modesForPlayerPhase(
  _phase: NbaLeagueStatsPhase
): readonly NbaLeagueStatsMode[] {
  return ["per_game", "total"] as const;
}

/** @deprecated Player 用。Team は `modesForTeamPhase` */
export function modesForPhase(
  phase: NbaLeagueStatsPhase
): readonly NbaLeagueStatsMode[] {
  return modesForPlayerPhase(phase);
}

export function coerceTeamModeForPhase(
  phase: NbaLeagueStatsPhase,
  mode: NbaLeagueStatsMode
): NbaLeagueStatsMode {
  const allowed = modesForTeamPhase(phase);
  return allowed.includes(mode) ? mode : "per_game";
}

export function coercePlayerModeForPhase(
  phase: NbaLeagueStatsPhase,
  mode: NbaLeagueStatsMode
): NbaLeagueStatsMode {
  const allowed = modesForPlayerPhase(phase);
  return allowed.includes(mode) ? mode : "per_game";
}

/** @deprecated Player 用。Team は `coerceTeamModeForPhase` */
export function coerceModeForPhase(
  phase: NbaLeagueStatsPhase,
  mode: NbaLeagueStatsMode
): NbaLeagueStatsMode {
  return coercePlayerModeForPhase(phase, mode);
}

const TEAM_COUNTING_METRICS = new Set<NbaLeagueTeamStatMetric>([
  "ppg",
  "papg",
  "fg3a",
]);

function playerMetricScalesWithGames(metric: NbaPlayerLeaderMetricId): boolean {
  if (isPlayerCountLeaderMetric(metric)) return false;
  if (isPlayerAdvancedLeaderMetric(metric)) {
    const kind = playerAdvancedMetricDef(
      metric as NbaPlayerAdvancedLeaderMetric
    ).kind;
    return kind === "perGame" || kind === "minutes";
  }
  const def = NBA_PLAYER_STAT_LEADER_METRICS.find((m) => m.id === metric);
  return def?.kind === "perGame" || def?.kind === "minutes";
}

function scaleTeamRowsForTotal(
  rows: readonly NbaLeagueTeamStatRow[]
): NbaLeagueTeamStatRow[] {
  return rows.map((row) => {
    const gp = teamGamesPlayed(row);
    if (gp <= 0) return { ...row };
    const next: NbaLeagueTeamStatRow = { ...row };
    for (const key of TEAM_COUNTING_METRICS) {
      const v = metricValue(row, key);
      (next as unknown as Record<string, number>)[key] = Math.round(v * gp);
    }
    return next;
  });
}

/** Team 表用: phase/mode → 表示行（Last 10 タブは廃止） */
export function resolveLeagueTeamStatRows(input: {
  phase: NbaLeagueStatsPhase;
  mode: NbaLeagueStatsMode;
  season: readonly NbaLeagueTeamStatRow[];
  playoffs?: readonly NbaLeagueTeamStatRow[];
}): NbaLeagueTeamStatRow[] {
  const mode = coerceTeamModeForPhase(input.phase, input.mode);
  const source =
    input.phase === "playoffs" ? (input.playoffs ?? []) : input.season;
  if (mode === "per_game") return [...source];
  return scaleTeamRowsForTotal(source);
}

/** Player 表用: phase/mode → 表示行（Last 10 タブは廃止） */
export function resolvePlayerStatLeaderRows(input: {
  phase: NbaLeagueStatsPhase;
  mode: NbaLeagueStatsMode;
  metric: NbaPlayerLeaderMetricId;
  season: readonly NbaPlayerStatLeaderRow[];
  playoffs?: readonly NbaPlayerStatLeaderRow[];
}): NbaPlayerStatLeaderRow[] {
  const mode = coercePlayerModeForPhase(input.phase, input.mode);
  const source =
    input.phase === "playoffs" ? (input.playoffs ?? []) : input.season;
  if (mode !== "total" || !playerMetricScalesWithGames(input.metric)) {
    return [...source];
  }
  return source.map((row) => {
    const gp = row.gamesPlayed;
    if (gp <= 0) return { ...row };
    // per-game × GP の近似。得点・リバ等は整数、MIN も整数で出す
    return {
      ...row,
      value: Math.round(row.value * gp),
    };
  });
}
