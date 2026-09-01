import type {
  PlayerConsistencyInsight,
  PlayerDetailInsights,
  PlayerDetailSummary,
  PlayerRoleChangeSignal,
  PlayerUsageStripCell,
} from "@/lib/nba/detailInsights/detailInsightTypes";
import { enrichInsightChip } from "@/lib/nba/detailInsights/detailChipCopy";
import {
  buildPlayerRoleChips,
  type PlayerRoleInput,
} from "@/lib/nba/detailInsights/playerRoleCandidates";
import {
  formatPlayerAdvancedLeaderValue,
} from "@/lib/predict/nbaPlayerStatLeadersAdvanced";
import type {
  NbaPlayerDetailPreview,
  NbaPlayerGameLog,
} from "@/lib/predict/nbaPlayerDetailPreviewMocks";
import type { NbaPlayerLeaderMetricId } from "@/lib/predict/nbaPlayerStatLeadersMocks";
import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";
import { isPlayerAdvancedLeaderMetric } from "@/lib/predict/nbaPlayerStatLeadersMocks";

export type BuildPlayerDetailInsightsInput = {
  detail: NbaPlayerDetailPreview;
  rosterPlayer?: NbaRosterPlayer | null;
};

function avgLogs(
  logs: NbaPlayerGameLog[],
  pick: (g: NbaPlayerGameLog) => number
): number {
  if (!logs.length) return 0;
  return logs.reduce((a, g) => a + pick(g), 0) / logs.length;
}

function roleLabelJa(id: string): string {
  const map: Record<string, string> = {
    first_option: "1st option",
    second_option: "2nd option",
    third_option: "3rd option",
    primary_handler: "primary handler",
    spot_up: "spot-up shooter",
    three_d: "3&D wing",
    closer: "closer",
    playmaker: "playmaker",
  };
  return map[id] ?? id.replace(/_/g, " ");
}

function buildPlayerSummary(
  input: BuildPlayerDetailInsightsInput,
  topRoleId: string | null
): PlayerDetailSummary | null {
  const { detail } = input;
  const gp = detail.season.gamesPlayed;
  if (gp <= 0 && !detail.gameLogs.length) return null;

  const ja: string[] = [];
  const en: string[] = [];

  if (gp > 0) {
    ja.push(
      `今季${gp}試合 · 平均${detail.season.pts.toFixed(1)}/${detail.season.reb.toFixed(1)}/${detail.season.ast.toFixed(1)}。`
    );
    en.push(
      `${gp} GP · ${detail.season.pts.toFixed(1)}/${detail.season.reb.toFixed(1)}/${detail.season.ast.toFixed(1)} avg.`
    );
  }

  const logs = detail.gameLogs;
  if (logs.length >= 5) {
    const recent = logs.slice(0, 5);
    const recentMin = avgLogs(recent, (g) => g.min);
    const seasonMin = detail.season.min;
    if (seasonMin > 0) {
      const ratio = recentMin / seasonMin;
      if (ratio >= 1.15) {
        ja.push("直近5試合で出場時間が増加。");
        en.push("Minutes up over the last 5 games.");
      } else if (ratio <= 0.85) {
        ja.push("直近5試合で出場時間が減少。");
        en.push("Minutes down over the last 5 games.");
      }
    }
  }

  if (topRoleId) {
    ja.push(`チームの${roleLabelJa(topRoleId)}タイプ。`);
    en.push(`${roleLabelJa(topRoleId)} role profile.`);
  }

  if (!ja.length) return null;
  return { linesJa: ja.join(""), linesEn: en.join("") };
}

const USAGE_STRIP_KEYS: Array<{
  key: NbaPlayerLeaderMetricId;
  label: string;
}> = [
  { key: "usg", label: "USG%" },
  { key: "drives", label: "DRIVES" },
  { key: "paint_touches", label: "PAINT" },
  { key: "fga", label: "FGA" },
  { key: "fg3a", label: "3PA" },
  { key: "fta", label: "FTA" },
];

function buildUsageStrip(
  detail: NbaPlayerDetailPreview
): PlayerUsageStripCell[] {
  return USAGE_STRIP_KEYS.map(({ key, label }) => {
    const cell = detail.leaderMetrics[key];
    if (!cell) {
      return { key, label, display: "—", rank: null };
    }
    const display = isPlayerAdvancedLeaderMetric(key)
      ? formatPlayerAdvancedLeaderValue(key, cell.value)
      : String(Math.round(cell.value * 10) / 10);
    return {
      key,
      label,
      display,
      rank: cell.rank >= 1 ? cell.rank : null,
    };
  });
}

function buildRoleChanges(detail: NbaPlayerDetailPreview): {
  signals: PlayerRoleChangeSignal[];
  detailJa: string | null;
  detailEn: string | null;
} {
  const logs = detail.gameLogs;
  if (logs.length < 8) {
    return { signals: [], detailJa: null, detailEn: null };
  }

  const recent = logs.slice(0, 5);
  const prior = logs.slice(5, 10);
  const recentMin = avgLogs(recent, (g) => g.min);
  const priorMin = avgLogs(prior, (g) => g.min);
  const recentFga = avgLogs(recent, (g) => g.fga);
  const priorFga = avgLogs(prior, (g) => g.fga);
  const recentPts = avgLogs(recent, (g) => g.pts);
  const priorPts = avgLogs(prior, (g) => g.pts);
  const seasonMin = detail.season.min;

  const signals: PlayerRoleChangeSignal[] = [];
  const pushSignal = (id: string, label: string) => {
    const enriched = enrichInsightChip({ id, label, category: "change", score: 0 });
    signals.push({
      id,
      label,
      hintJa: enriched.hintJa,
      hintEn: enriched.hintEn,
    });
  };
  if (priorMin > 0 && recentMin >= priorMin * 1.15) {
    pushSignal("min_up", "MIN ↑");
  }
  if (priorMin > 0 && recentMin <= priorMin * 0.85) {
    pushSignal("min_down", "MIN ↓");
  }
  if (priorFga > 0 && recentFga >= priorFga * 1.2) {
    pushSignal("fga_up", "FGA ↑");
  }
  if (priorPts > 0 && recentPts >= priorPts * 1.2) {
    pushSignal("pts_up", "PTS ↑");
  }

  const last3Min = avgLogs(logs.slice(0, 3), (g) => g.min);
  if (seasonMin >= 20 && last3Min >= seasonMin * 1.25) {
    pushSignal("starter_push", "STARTER PUSH");
  }
  if (seasonMin > 0 && last3Min <= seasonMin * 0.75) {
    pushSignal("bench_slide", "BENCH SLIDE");
  }

  const detailJa =
    signals.length > 0
      ? `直近5試合: ${recentMin.toFixed(1)}分 · ${recentPts.toFixed(1)}点 · ${recentFga.toFixed(1)}本（前5試合比）`
      : null;
  const detailEn =
    signals.length > 0
      ? `Last 5: ${recentMin.toFixed(1)} MIN · ${recentPts.toFixed(1)} PTS · ${recentFga.toFixed(1)} FGA vs prior 5`
      : null;

  return { signals: signals.slice(0, 3), detailJa, detailEn };
}

function stdev(values: number[]): number {
  if (values.length <= 1) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const varSum = values.reduce((a, v) => a + (v - mean) ** 2, 0);
  return Math.sqrt(varSum / values.length);
}

function buildConsistency(detail: NbaPlayerDetailPreview): PlayerConsistencyInsight | null {
  const logs = detail.gameLogs;
  if (logs.length < 5) return null;

  const gp = logs.length;
  const count20 = logs.filter((g) => g.pts >= 20).length;
  const count10reb = logs.filter((g) => g.reb >= 10).length;
  const count5ast = logs.filter((g) => g.ast >= 5).length;

  const last10 = logs.slice(0, Math.min(10, logs.length));
  const ptsVals = last10.map((g) => g.pts);
  const sd = stdev(ptsVals);
  let volatility: PlayerConsistencyInsight["volatility"] = "mixed";
  if (sd < 4) volatility = "stable";
  else if (sd >= 7) volatility = "volatile";

  return {
    milestones: [
      {
        label: "20+ PTS",
        count: count20,
        games: gp,
        pct: Math.round((count20 / gp) * 100),
      },
      {
        label: "10+ REB",
        count: count10reb,
        games: gp,
        pct: Math.round((count10reb / gp) * 100),
      },
      {
        label: "5+ AST",
        count: count5ast,
        games: gp,
        pct: Math.round((count5ast / gp) * 100),
      },
    ],
    last10PtsMin: Math.min(...ptsVals),
    last10PtsMax: Math.max(...ptsVals),
    last10Stdev: Math.round(sd * 10) / 10,
    volatility,
  };
}

export function buildPlayerDetailInsights(
  input: BuildPlayerDetailInsightsInput
): PlayerDetailInsights {
  const roleInput: PlayerRoleInput = {
    leaderMetrics: input.detail.leaderMetrics,
    position: input.rosterPlayer?.position ?? "",
    rosterPlayer: input.rosterPlayer,
    seasonMin: input.detail.season.min,
  };

  const roles = buildPlayerRoleChips(roleInput);
  const topRoleId = roles[0]?.id ?? null;
  const roleChanges = buildRoleChanges(input.detail);

  return {
    summary: buildPlayerSummary(input, topRoleId),
    roles,
    usageStrip: buildUsageStrip(input.detail),
    roleChanges: roleChanges.signals,
    roleChangeDetailJa: roleChanges.detailJa,
    roleChangeDetailEn: roleChanges.detailEn,
    consistency: buildConsistency(input.detail),
  };
}

export function volatilityLabel(
  v: PlayerConsistencyInsight["volatility"]
): string {
  switch (v) {
    case "stable":
      return "STABLE";
    case "volatile":
      return "VOLATILE";
    default:
      return "MIXED";
  }
}