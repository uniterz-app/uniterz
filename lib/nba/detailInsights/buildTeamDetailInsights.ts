import type {
  DetailTrendDelta,
  TeamDetailInsights,
  TeamDetailSummary,
} from "@/lib/nba/detailInsights/detailInsightTypes";
import { teamFieldValue } from "@/lib/nba/detailInsights/leagueRankUtils";
import {
  rankBucket,
  rankBucketLabelEn,
  rankBucketLabelJa,
} from "@/lib/nba/detailInsights/rankBuckets";
import {
  buildTeamIdentityChips,
  type TeamIdentityInput,
} from "@/lib/nba/detailInsights/teamIdentityCandidates";
import { buildScheduleDifficulty } from "@/lib/nba/detailInsights/buildScheduleDifficulty";
import { ACE_OUT_MIN_GAMES } from "@/lib/nba/insights/aceOutInsight";
import {
  findAceOutPlayerForInjury,
} from "@/lib/nba/insights/aceOutInsight";
import type { NbaTeamAceOutRecord } from "@/lib/nba/insights/aceOutRecordTypes";
import {
  formatWl,
  wlWinPct,
} from "@/lib/nba/insights/priorSeasonRecordTypes";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import { formatMetricValue } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type {
  NbaTeamDetailPreview,
  NbaTeamMetricWithRank,
} from "@/lib/predict/nbaTeamDetailPreviewMocks";
export type BuildTeamDetailInsightsInput = {
  detail: NbaTeamDetailPreview;
  seasonRow?: NbaLeagueTeamStatRow;
  last10Row?: NbaLeagueTeamStatRow;
  seasonRows: NbaLeagueTeamStatRow[];
  aceOut?: NbaTeamAceOutRecord | null;
};

function shortInjuryName(name: string): string {
  const raw = name.trim();
  const m = raw.match(/^([A-Za-z])\.(.+)$/);
  if (m) return `${m[1]}.${m[2]}`.replace(/\s+/g, " ");
  const parts = raw.split(/\s+/);
  if (parts.length >= 2) return `${parts[0]!.charAt(0)}.${parts.slice(1).join(" ")}`;
  return raw;
}

function offenseDefenseSentenceJa(
  ortgRank: number | undefined,
  drtgRank: number | undefined
): string | null {
  if (ortgRank == null || drtgRank == null) return null;
  const o = rankBucket(ortgRank);
  const d = rankBucket(drtgRank);
  if (!o || !d) return null;

  if (o === "elite" && d === "bottom") {
    return "攻撃はリーグ上位だが、守備は下位。";
  }
  if (o === "bottom" && d === "elite") {
    return "守備はリーグ上位だが、攻撃は下位。";
  }
  if (o === "elite" && d === "elite") {
    return "攻守ともリーグ上位。";
  }
  if (Math.abs(ortgRank - drtgRank) <= 3) {
    return "攻守ともリーグ平均付近。";
  }
  return `攻撃は${rankBucketLabelJa(o)}、守備は${rankBucketLabelJa(d)}。`;
}

function offenseDefenseSentenceEn(
  ortgRank: number | undefined,
  drtgRank: number | undefined
): string | null {
  if (ortgRank == null || drtgRank == null) return null;
  const o = rankBucket(ortgRank);
  const d = rankBucket(drtgRank);
  if (!o || !d) return null;

  if (o === "elite" && d === "bottom") {
    return "Offense is top tier but defense ranks bottom tier.";
  }
  if (o === "bottom" && d === "elite") {
    return "Defense is top tier but offense ranks bottom tier.";
  }
  if (o === "elite" && d === "elite") {
    return "Both offense and defense rank top tier.";
  }
  if (Math.abs(ortgRank - drtgRank) <= 3) {
    return "Balanced near league average on both ends.";
  }
  return `Offense is ${rankBucketLabelEn(o)}; defense is ${rankBucketLabelEn(d)}.`;
}

function buildTeamSummary(input: BuildTeamDetailInsightsInput): TeamDetailSummary | null {
  const { detail, aceOut } = input;
  const ortg = detail.metrics.season.find((m) => m.id === "ortg");
  const drtg = detail.metrics.season.find((m) => m.id === "drtg");
  const l10 = detail.last10Record;
  const hasL10 = l10.wins + l10.losses > 0;
  const hasMetrics = (ortg?.value ?? 0) !== 0 || detail.season.wins + detail.season.losses > 0;
  if (!hasMetrics && !hasL10) return null;

  const ja: string[] = [];
  const en: string[] = [];

  if (hasL10) {
    ja.push(`直近10試合は${l10.wins}勝${l10.losses}敗。`);
    en.push(`Last 10: ${l10.wins}-${l10.losses}.`);
  }

  const odJa = offenseDefenseSentenceJa(ortg?.leagueRank, drtg?.leagueRank);
  const odEn = offenseDefenseSentenceEn(ortg?.leagueRank, drtg?.leagueRank);
  if (odJa) ja.push(odJa);
  if (odEn) en.push(odEn);

  const outGtd = detail.injuries.filter(
    (i) => i.status === "out" || i.status === "gtd"
  );
  let injuryLine = false;

  if (aceOut && outGtd.length) {
    const bundle = {
      seasonKey: "",
      teams: { [detail.teamId]: aceOut },
      gameCount: 0,
      builtAtMs: 0,
      source: "",
    };
    for (const inj of outGtd) {
      const hit = findAceOutPlayerForInjury(bundle, detail.teamId, inj);
      if (hit && hit.gamesOut >= ACE_OUT_MIN_GAMES) {
        ja.push(
          `${shortInjuryName(inj.name)}欠場時は${formatWl(hit.whenOut)}（得点${Math.round(hit.whenOutPtsFor)}–失点${Math.round(hit.whenOutPtsAgainst)}）。`
        );
        en.push(
          `Without ${shortInjuryName(inj.name)}: ${formatWl(hit.whenOut)} (${Math.round(hit.whenOutPtsFor)}–${Math.round(hit.whenOutPtsAgainst)} pts).`
        );
        injuryLine = true;
        break;
      }
    }
  }

  if (!injuryLine && outGtd.length >= 2) {
    ja.push(`主力${outGtd.length}名が欠場・疑わしい状態。`);
    en.push(`${outGtd.length} key players OUT or GTD.`);
    injuryLine = true;
  }

  if (!injuryLine && aceOut) {
    const overall = wlWinPct(aceOut.teamOverall);
    let worst: (typeof aceOut.players)[number] | null = null;
    let worstDelta = 0;
    for (const p of aceOut.players) {
      if (p.gamesOut < ACE_OUT_MIN_GAMES) continue;
      const delta = overall - wlWinPct(p.whenOut);
      if (delta >= 0.12 && delta > worstDelta) {
        worst = p;
        worstDelta = delta;
      }
    }
    if (worst) {
      ja.push(`${shortInjuryName(worst.playerName)}不在時の勝率が大きく落ちる。`);
      en.push(`Win rate drops sharply without ${shortInjuryName(worst.playerName)}.`);
    }
  }

  if (!ja.length) return null;
  return { linesJa: ja.join(""), linesEn: en.join("") };
}

function metricById(
  metrics: NbaTeamMetricWithRank[],
  id: NbaTeamMetricWithRank["id"]
): NbaTeamMetricWithRank | undefined {
  return metrics.find((m) => m.id === id);
}

function buildTeamTrends(detail: NbaTeamDetailPreview): DetailTrendDelta[] {
  const pairs: Array<{
    id: string;
    label: string;
    higherIsBetter: boolean;
    threshold: number;
  }> = [
    { id: "ortg", label: "ORTG", higherIsBetter: true, threshold: 1.0 },
    { id: "drtg", label: "DRTG", higherIsBetter: false, threshold: 1.0 },
    { id: "pace", label: "PACE", higherIsBetter: true, threshold: 0.8 },
    { id: "fg3Pct", label: "3P%", higherIsBetter: true, threshold: 0.015 },
    { id: "netrtg", label: "NET", higherIsBetter: true, threshold: 1.0 },
  ];

  const out: DetailTrendDelta[] = [];
  for (const p of pairs) {
    const season = metricById(detail.metrics.season, p.id as NbaTeamMetricWithRank["id"]);
    const last10 = metricById(detail.metrics.last10, p.id as NbaTeamMetricWithRank["id"]);
    if (!season || !last10) continue;
    if (!season.value && !last10.value) continue;
    const delta = last10.value - season.value;
    if (Math.abs(delta) < p.threshold) continue;
    out.push({
      id: p.id,
      label: p.label,
      seasonDisplay: season.display,
      last10Display: last10.display,
      delta,
      higherIsBetter: p.higherIsBetter,
    });
  }
  return out;
}

export function buildTeamDetailInsights(
  input: BuildTeamDetailInsightsInput
): TeamDetailInsights {
  const identityInput: TeamIdentityInput = {
    teamId: input.detail.teamId,
    seasonRows: input.seasonRows,
    seasonRow: input.seasonRow,
    last10Row: input.last10Row,
    injuries: input.detail.injuries,
    aceOut: input.aceOut,
  };

  return {
    summary: buildTeamSummary(input),
    identity: buildTeamIdentityChips(identityInput),
    trends: buildTeamTrends(input.detail),
    scheduleDifficulty: buildScheduleDifficulty({
      upcomingGames: input.detail.upcomingGames,
      seasonRows: input.seasonRows,
    }),
  };
}

export function formatTeamTrendDelta(delta: DetailTrendDelta): string {
  const sign = delta.delta > 0 ? "+" : "";
  if (delta.id === "fg3Pct") {
    return `${sign}${(delta.delta * 100).toFixed(1)}%`;
  }
  return `${sign}${delta.delta.toFixed(1)}`;
}

export function isTrendImproved(delta: DetailTrendDelta): boolean {
  const raw = delta.delta > 0;
  return delta.higherIsBetter ? raw : !raw;
}

export { teamFieldValue, formatMetricValue };
