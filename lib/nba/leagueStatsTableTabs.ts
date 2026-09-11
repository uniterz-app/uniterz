/**
 * リーグ Team / Player 表の二段タブ。
 * SEASON | PLAYOFFS
 *  └ Team: PER GAME | TOTAL
 *  └ Player: PER GAME | TOTAL | LAST 10（PLAYOFFS は PER GAME | TOTAL のみ）
 *
 * Team Last 10 は BDL に season と同粒度が無いためタブ廃止。
 * （マッチアップ FORM / Pro Insight は box 由来の狭いセットのみ）
 *
 * データ:
 * - SEASON + PER GAME → season
 * - SEASON + TOTAL → season を出場数で積算（レート系はそのまま）
 * - Player SEASON + LAST 10 → last10（game logs）
 * - PLAYOFFS → 未接続のため UI では非表示（`NBA_LEAGUE_STATS_PHASES`）
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
  NBA_PLAYER_STAT_LEADER_METRICS,
  type NbaPlayerLeaderMetricId,
  type NbaPlayerStatLeaderRow,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";

export type NbaLeagueStatsPhase = "season" | "playoffs";
export type NbaLeagueStatsMode = "per_game" | "total" | "last10";

/** playoffs スナップショットが来るまで season のみ */
export const NBA_LEAGUE_STATS_PHASES =
  ["season"] as const satisfies readonly NbaLeagueStatsPhase[];

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

/** Player Leaders — Last 10 あり（game logs） */
export function modesForPlayerPhase(
  phase: NbaLeagueStatsPhase
): readonly NbaLeagueStatsMode[] {
  return phase === "season"
    ? (["per_game", "total", "last10"] as const)
    : (["per_game", "total"] as const);
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
  if (isPlayerAdvancedLeaderMetric(metric)) {
    const kind = playerAdvancedMetricDef(
      metric as NbaPlayerAdvancedLeaderMetric
    ).kind;
    return kind === "perGame" || kind === "minutes";
  }
  const def = NBA_PLAYER_STAT_LEADER_METRICS.find((m) => m.id === metric);
  return def?.kind === "perGame" || def?.kind === "minutes";
}

/** Team 表用: phase/mode → 表示行（last10 モードは per_game に落とす） */
export function resolveLeagueTeamStatRows(input: {
  phase: NbaLeagueStatsPhase;
  mode: NbaLeagueStatsMode;
  season: readonly NbaLeagueTeamStatRow[];
  last10: readonly NbaLeagueTeamStatRow[];
}): NbaLeagueTeamStatRow[] {
  const mode = coerceTeamModeForPhase(input.phase, input.mode);
  if (input.phase === "playoffs") return [];
  if (mode === "per_game") return [...input.season];
  return input.season.map((row) => {
    const gp = teamGamesPlayed(row);
    if (gp <= 0) return { ...row };
    const next: NbaLeagueTeamStatRow = { ...row };
    for (const key of TEAM_COUNTING_METRICS) {
      const v = metricValue(row, key);
      (next as unknown as Record<string, number>)[key] =
        Math.round(v * gp * 10) / 10;
    }
    return next;
  });
}

/** Player 表用: phase/mode → 表示行 */
export function resolvePlayerStatLeaderRows(input: {
  phase: NbaLeagueStatsPhase;
  mode: NbaLeagueStatsMode;
  metric: NbaPlayerLeaderMetricId;
  season: readonly NbaPlayerStatLeaderRow[];
  last10: readonly NbaPlayerStatLeaderRow[];
}): NbaPlayerStatLeaderRow[] {
  const mode = coercePlayerModeForPhase(input.phase, input.mode);
  if (input.phase === "playoffs") return [];
  const source = mode === "last10" ? input.last10 : input.season;
  if (mode !== "total" || !playerMetricScalesWithGames(input.metric)) {
    return [...source];
  }
  return source.map((row) => {
    const gp = row.gamesPlayed;
    if (gp <= 0) return { ...row };
    return {
      ...row,
      value: Math.round(row.value * gp * 10) / 10,
    };
  });
}
