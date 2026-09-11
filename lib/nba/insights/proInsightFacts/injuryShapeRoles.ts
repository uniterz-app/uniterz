/**
 * 欠場選手がチームの指標リーダーか（形が変わる根拠）。
 * leaders.season の **全ボード** を走査（USG/AST に限らない）。
 * 队友のスタッツ・バンプ予測はしない。
 */
import type {
  NbaPlayerLeaderMetricId,
  NbaPlayerStatLeaderRow,
  NbaPlayerStatLeadersBundle,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import {
  NBA_BDL_PLAYER_LEADER_STAT_TYPES,
  NBA_PLAYER_STAT_LEADER_METRICS,
} from "@/lib/predict/nbaPlayerStatLeadersMocks";
import {
  formatPlayerAdvancedLeaderValue,
  playerAdvancedMetricDef,
  type NbaPlayerAdvancedLeaderMetric,
} from "@/lib/predict/nbaPlayerStatLeadersAdvanced";
import type { ProInsightFactMetric } from "@/lib/nba/insights/proInsightFacts/types";

/** チーム内何位までを「リーダー」とみなすか */
export const INJURY_SHAPE_TEAM_RANK_MAX = 2;

/** LLM に渡す指標の上限（多いとノイズ） */
export const INJURY_SHAPE_METRICS_MAX = 8;

/** 指標 id（usg / pts / ast / …） */
export type InjuryShapeRole = string;

export type InjuryShapeImpact = {
  roles: InjuryShapeRole[];
  metrics: ProInsightFactMetric[];
  scoreBoost: number;
  hintBits: string[];
};

type Hit = {
  metricId: string;
  rank: number;
  value: number;
  leagueRank: number | null;
  weight: number;
  label: string;
  formatted: string;
};

/** 形への影響が大きい指標ほど重い */
const METRIC_WEIGHT: Record<string, number> = {
  usg: 10,
  pts: 9,
  ast: 9,
  ast_pct: 8,
  pie: 8,
  ortg: 7,
  ts_pct: 6,
  efg_pct: 6,
  reb: 6,
  reb_pct: 6,
  oreb: 5,
  dreb: 5,
  stl: 5,
  blk: 5,
  fg3m: 5,
  fg3_pct: 5,
  pts_paint: 5,
  pts_3: 5,
  pct_pts_paint: 4,
  pct_pts_3: 4,
  min: 4,
  tov: 3,
  tov_pct: 3,
  drtg: 6,
};

function metricWeight(id: string): number {
  if (METRIC_WEIGHT[id] != null) return METRIC_WEIGHT[id]!;
  if (id.startsWith("pnr_") || id.startsWith("iso_") || id.startsWith("post_")) {
    return 5;
  }
  if (id.startsWith("clutch_")) return 4;
  return 3;
}

function isAdvancedMetric(id: string): id is NbaPlayerAdvancedLeaderMetric {
  try {
    playerAdvancedMetricDef(id as NbaPlayerAdvancedLeaderMetric);
    return true;
  } catch {
    return false;
  }
}

function higherIsBetterFor(id: string): boolean {
  if (isAdvancedMetric(id)) {
    return playerAdvancedMetricDef(id).higherIsBetter;
  }
  const bdl = NBA_PLAYER_STAT_LEADER_METRICS.find((m) => m.id === id);
  if (bdl) return bdl.higherIsBetter;
  return true;
}

function shortLabel(id: string): string {
  if (isAdvancedMetric(id)) return playerAdvancedMetricDef(id).short;
  const bdl = NBA_PLAYER_STAT_LEADER_METRICS.find((m) => m.id === id);
  return bdl?.short ?? id.toUpperCase();
}

function formatMetricValue(id: string, value: number): string {
  if (isAdvancedMetric(id)) {
    return formatPlayerAdvancedLeaderValue(id, value);
  }
  const bdl = NBA_PLAYER_STAT_LEADER_METRICS.find((m) => m.id === id);
  if (bdl?.kind === "pct") {
    const pct = value <= 1.5 ? value * 100 : value;
    return `${(Math.round(pct * 10) / 10).toFixed(1)}%`;
  }
  if (bdl?.kind === "minutes") {
    return String(Math.round(value * 10) / 10);
  }
  return String(Math.round(value * 10) / 10);
}

function teamRankOnBoard(
  board: NbaPlayerStatLeaderRow[] | undefined,
  teamId: string,
  playerId: string,
  higherIsBetter: boolean
): { rank: number; value: number; leagueRank: number | null } | null {
  if (!board?.length || !playerId) return null;
  const onTeam = board
    .filter((r) => r.teamId === teamId)
    .slice()
    .sort((a, b) =>
      higherIsBetter ? b.value - a.value : a.value - b.value
    );
  const idx = onTeam.findIndex((r) => r.playerId === playerId);
  if (idx < 0) return null;
  const leagueSorted = board.slice().sort((a, b) =>
    higherIsBetter ? b.value - a.value : a.value - b.value
  );
  const leagueIdx = leagueSorted.findIndex((r) => r.playerId === playerId);
  return {
    rank: idx + 1,
    value: onTeam[idx]!.value,
    leagueRank: leagueIdx >= 0 ? leagueIdx + 1 : null,
  };
}

function allSeasonMetricIds(
  season: NbaPlayerStatLeadersBundle["season"]
): string[] {
  const ids = new Set<string>();
  for (const id of NBA_BDL_PLAYER_LEADER_STAT_TYPES) ids.add(id);
  for (const key of Object.keys(season)) {
    if (Array.isArray(season[key as NbaPlayerLeaderMetricId])) ids.add(key);
  }
  return [...ids];
}

/**
 * OUT 選手がチーム内 Top2 の指標リーダーである一覧。
 * opening / leaders 無しは null。
 */
export function resolveInjuryShapeImpact(input: {
  teamId: string;
  playerId: string;
  leaders: NbaPlayerStatLeadersBundle | null | undefined;
}): InjuryShapeImpact | null {
  if (!input.leaders || !input.playerId) return null;
  const season = input.leaders.season;
  const hits: Hit[] = [];

  for (const metricId of allSeasonMetricIds(season)) {
    const board = season[metricId as NbaPlayerLeaderMetricId];
    if (!board?.length) continue;
    const hib = higherIsBetterFor(metricId);
    const hit = teamRankOnBoard(
      board,
      input.teamId,
      input.playerId,
      hib
    );
    if (!hit || hit.rank > INJURY_SHAPE_TEAM_RANK_MAX) continue;
    const weight = metricWeight(metricId);
    hits.push({
      metricId,
      rank: hit.rank,
      value: hit.value,
      leagueRank: hit.leagueRank,
      weight,
      label: shortLabel(metricId),
      formatted: formatMetricValue(metricId, hit.value),
    });
  }

  if (hits.length === 0) return null;

  hits.sort(
    (a, b) =>
      b.weight - a.weight ||
      a.rank - b.rank ||
      a.metricId.localeCompare(b.metricId)
  );
  const top = hits.slice(0, INJURY_SHAPE_METRICS_MAX);

  // 文面は PTS / REB / AST を優先（USG だけだと分かりにくい）
  const NARRATIVE_FIRST = ["pts", "reb", "ast", "usg", "oreb", "dreb", "blk", "stl"];
  const narrativeHits = [...hits].sort((a, b) => {
    const ia = NARRATIVE_FIRST.indexOf(a.metricId);
    const ib = NARRATIVE_FIRST.indexOf(b.metricId);
    const pa = ia === -1 ? 99 : ia;
    const pb = ib === -1 ? 99 : ib;
    return pa - pb || a.rank - b.rank || b.weight - a.weight;
  });

  const roles = top.map((h) => h.metricId);
  const metrics: ProInsightFactMetric[] = [
    {
      key: "shapeRoles",
      value: roles.join(","),
      teamId: input.teamId,
    },
    {
      key: "shapeLeaderCount",
      value: String(hits.length),
      teamId: input.teamId,
    },
  ];

  let scoreBoost = 0;
  const hintBits: string[] = [];

  for (const h of top) {
    metrics.push({
      key: `${h.metricId}TeamRank`,
      value: `#${h.rank}`,
      rank: h.rank,
      teamId: input.teamId,
    });
    metrics.push({
      key: h.metricId,
      value: h.formatted,
      teamId: input.teamId,
    });
    if (h.leagueRank != null && h.leagueRank <= 50) {
      metrics.push({
        key: `${h.metricId}LeagueRank`,
        value: `#${h.leagueRank}`,
        rank: h.leagueRank,
        teamId: input.teamId,
      });
    }
    scoreBoost += h.rank === 1 ? h.weight : Math.max(2, h.weight - 3);
  }

  for (const h of narrativeHits.slice(0, 4)) {
    hintBits.push(
      `team ${h.label} leader #${h.rank} (${h.formatted}) — that pillar drops if out`
    );
  }

  // 多指標リーダーほど形が崩れる
  scoreBoost += Math.min(hits.length, 6);

  return {
    roles,
    metrics,
    scoreBoost,
    hintBits,
  };
}
