/**
 * `nbaTeamInsightExtras` → Pro Insight SCHEDULE / CONTEXT ファクト。
 * 今夜の状況に合うときだけシーズン W–L を付け、埋め草は出さない。
 */
import type { NbaTeamInsightExtraSplit } from "@/lib/nba/insights/teamInsightExtraTypes";
import type { NbaTeamInsightExtrasBundle } from "@/lib/nba/insights/teamInsightExtraTypes";
import {
  formatWl,
  h2hFromPerspective,
  h2hPairKey,
  wlTotal,
  wlWinPct,
  type WlRecord,
} from "@/lib/nba/insights/priorSeasonRecordTypes";
import { NBA_TEAM_US_GEO } from "@/lib/nba/nbaTeamUsGeo";
import { computeRestDays } from "@/lib/nba/insights/buildScheduleLines";
import {
  proInsightTeamAbbr,
} from "@/lib/nba/insights/proInsightFacts/teamAbbr";
import type { ProInsightFact } from "@/lib/nba/insights/proInsightFacts/types";
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";
import {
  selectScheduleFactsDifferentialFirst,
  type SchedulePriorGame,
} from "@/lib/nba/insights/proInsightFacts/buildScheduleFacts";

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_WL_GAMES = 5;
const MIN_H2H_GAMES = 4;
const MIN_CLUTCH_GAMES = 8;
const MIN_DIV_GAMES = 5;

const B2B_KINDS = new Set([
  "away_b2b",
  "travel_b2b",
  "ot_b2b",
  "ot_travel_b2b",
  "same_city_b2b_relief",
  "home_after_b2b",
  "soft_landing",
  "rest_disadvantage",
]);

function extremeWl(r: WlRecord, minGames: number): boolean {
  if (wlTotal(r) < minGames) return false;
  const pct = wlWinPct(r);
  return pct >= 0.65 || pct <= 0.35 || Math.abs(r.wins - r.losses) >= 3;
}

function seasonTag(
  phase: ProBriefPhase,
  usedPrior: boolean
): { metric: string; hint: string } {
  if (phase === "opening" || usedPrior) {
    return { metric: "prior", hint: " last season" };
  }
  return { metric: "season", hint: "" };
}

export function resolveInsightExtrasForPhase(input: {
  phase: ProBriefPhase;
  seasonExtras?: NbaTeamInsightExtrasBundle | null;
  priorExtras?: NbaTeamInsightExtrasBundle | null;
}): { bundle: NbaTeamInsightExtrasBundle | null; usedPrior: boolean } {
  if (input.phase === "opening") {
    return { bundle: input.priorExtras ?? null, usedPrior: true };
  }
  const season = input.seasonExtras;
  if (season && Object.keys(season.teams).length > 0) {
    return { bundle: season, usedPrior: false };
  }
  return { bundle: input.priorExtras ?? null, usedPrior: Boolean(input.priorExtras) };
}

function pickB2bWl(
  split: NbaTeamInsightExtraSplit,
  kind: string,
  isHome: boolean
): WlRecord | null {
  if (kind === "away_b2b" || (!isHome && B2B_KINDS.has(kind))) {
    if (wlTotal(split.b2bAway) >= MIN_WL_GAMES) return split.b2bAway;
  }
  if (kind === "home_after_b2b" || (isHome && kind === "soft_landing")) {
    if (wlTotal(split.b2bHome) >= MIN_WL_GAMES) return split.b2bHome;
  }
  if (wlTotal(split.b2b) >= MIN_WL_GAMES) return split.b2b;
  return null;
}

function restBucketWl(
  split: NbaTeamInsightExtraSplit,
  restDays: number
): { key: string; wl: WlRecord } | null {
  if (restDays === 0 && wlTotal(split.rest0) >= MIN_WL_GAMES) {
    return { key: "rest0Wl", wl: split.rest0 };
  }
  if (restDays === 1 && wlTotal(split.rest1) >= MIN_WL_GAMES) {
    return { key: "rest1Wl", wl: split.rest1 };
  }
  if (restDays >= 2 && wlTotal(split.rest2Plus) >= MIN_WL_GAMES) {
    return { key: "rest2PlusWl", wl: split.rest2Plus };
  }
  return null;
}

function denseTonight(
  tipAtMs: number,
  priorGames: SchedulePriorGame[],
  windowNights: 3 | 4,
  minGames: number
): boolean {
  const tips = [
    ...priorGames.map((g) => g.startAtMs),
    tipAtMs,
  ].filter((t) => Number.isFinite(t) && t > 0);
  const windowStart = tipAtMs - windowNights * DAY_MS;
  const inWindow = tips.filter((t) => t >= windowStart && t <= tipAtMs).length;
  return inWindow >= minGames;
}

/**
 * 既存 SCHEDULE ファクトにシーズン実績を付与（新候補は増やさない）。
 */
export function enrichScheduleFactsWithInsightExtras(input: {
  facts: ProInsightFact[];
  phase: ProBriefPhase;
  homeTeamId: string;
  awayTeamId: string;
  bundle: NbaTeamInsightExtrasBundle | null;
  usedPrior: boolean;
}): ProInsightFact[] {
  if (!input.bundle) return input.facts;
  const tag = seasonTag(input.phase, input.usedPrior);

  return input.facts.map((f) => {
    const teamId = f.teamIds[0];
    if (!teamId) return f;
    const split = input.bundle!.teams[teamId];
    if (!split) return f;
    const isHome = teamId === input.homeTeamId;
    const next = { ...f, metrics: [...f.metrics] };

    if (B2B_KINDS.has(f.kind)) {
      const wl = pickB2bWl(split, f.kind, isHome);
      if (wl) {
        next.metrics.push({
          key: "seasonB2bWl",
          value: formatWl(wl),
          teamId,
        });
        next.metrics.push({
          key: "seasonB2bSource",
          value: tag.metric,
          teamId,
        });
        next.hintEn = `${f.hintEn} Mark: ${formatWl(wl)} on B2Bs${tag.hint}.`;
        next.score = f.score + 1;
      }
      return next;
    }

    if (f.kind === "rest_advantage") {
      const restMetric = f.metrics.find((m) => m.key === "restDays");
      const restDays = restMetric ? Number(restMetric.value) : NaN;
      if (Number.isFinite(restDays)) {
        const bucket = restBucketWl(split, restDays);
        if (bucket) {
          next.metrics.push({
            key: bucket.key,
            value: formatWl(bucket.wl),
            teamId,
          });
          next.hintEn = `${f.hintEn} Mark: ${formatWl(bucket.wl)} with that rest${tag.hint}.`;
          next.score = f.score + 1;
        }
      }
      return next;
    }

    if (f.kind === "altitude") {
      if (wlTotal(split.atAltitude) >= MIN_WL_GAMES) {
        next.metrics.push({
          key: "atAltitudeWl",
          value: formatWl(split.atAltitude),
          teamId,
        });
        next.hintEn = `${f.hintEn} Mark: ${formatWl(split.atAltitude)} at altitude${tag.hint}.`;
        next.score = f.score + 1;
      }
      return next;
    }

    return f;
  });
}

/**
 * 今夜が過密なら SCHEDULE 候補を追加（差扱い・片側のみ残す想定）。
 */
export function buildInsightExtrasScheduleCandidates(input: {
  phase: ProBriefPhase;
  homeTeamId: string;
  awayTeamId: string;
  tipAtMs: number;
  homePriorGames: SchedulePriorGame[];
  awayPriorGames: SchedulePriorGame[];
  bundle: NbaTeamInsightExtrasBundle | null;
  usedPrior: boolean;
}): ProInsightFact[] {
  if (!input.bundle) return [];
  const tag = seasonTag(input.phase, input.usedPrior);
  const out: ProInsightFact[] = [];

  for (const side of [
    {
      teamId: input.homeTeamId,
      priors: input.homePriorGames,
      isHome: true,
    },
    {
      teamId: input.awayTeamId,
      priors: input.awayPriorGames,
      isHome: false,
    },
  ] as const) {
    const split = input.bundle.teams[side.teamId];
    if (!split) continue;
    const abbr = proInsightTeamAbbr(side.teamId);
    const rest = computeRestDays({
      tipAtMs: input.tipAtMs,
      priorGames: side.priors,
    });
    // B2B は既存 kind に任せる。過密だけ追加。
    if (rest === 0) continue;

    const dense3 = denseTonight(input.tipAtMs, side.priors, 3, 3);
    const dense4 = denseTonight(input.tipAtMs, side.priors, 4, 4);
    if (!dense3 && !dense4) continue;

    const wl =
      dense4 && wlTotal(split.dense4in5) >= MIN_WL_GAMES
        ? split.dense4in5
        : dense3 && wlTotal(split.dense3in4) >= MIN_WL_GAMES
          ? split.dense3in4
          : null;
    if (!wl) continue;

    const kind = dense4 ? "dense_4in5" : "dense_3in4";
    out.push({
      id: `sched:${kind}:${side.teamId}`,
      section: "SCHEDULE",
      kind,
      score: dense4 ? 15 : 14,
      teamIds: [side.teamId],
      label: dense4 ? "DENSE_4IN5" : "DENSE_3IN4",
      metrics: [
        {
          key: dense4 ? "dense4in5Wl" : "dense3in4Wl",
          value: formatWl(wl),
          teamId: side.teamId,
        },
        { key: "seasonSource", value: tag.metric, teamId: side.teamId },
      ],
      players: [],
      mode: "neutral",
      dedupeKeys: [`dense:${side.teamId}`],
      hintEn: `${abbr} in a dense stretch (${formatWl(wl)} in similar spots${tag.hint}).`,
    });
  }

  return out;
}

export function buildInsightExtrasContextCandidates(input: {
  phase: ProBriefPhase;
  homeTeamId: string;
  awayTeamId: string;
  bundle: NbaTeamInsightExtrasBundle | null;
  usedPrior: boolean;
}): ProInsightFact[] {
  if (!input.bundle) return [];
  const tag = seasonTag(input.phase, input.usedPrior);
  const out: ProInsightFact[] = [];
  const homeAbbr = proInsightTeamAbbr(input.homeTeamId);
  const awayAbbr = proInsightTeamAbbr(input.awayTeamId);

  // —— multi-year H2H（試合1本）——
  const pairKey = h2hPairKey(input.homeTeamId, input.awayTeamId);
  const pair = input.bundle.h2hMultiYear?.[pairKey];
  if (pair) {
    const fromHome = h2hFromPerspective(pair, input.homeTeamId);
    const games = fromHome ? wlTotal(fromHome.overall) : 0;
    if (fromHome && games >= MIN_H2H_GAMES) {
      const years = input.bundle.h2hSeasonKeys?.length ?? 0;
      const yearBit = years > 1 ? `${years}-year` : "multi-year";
      const atHome =
        wlTotal(fromHome.atHome) >= 2
          ? ` (${formatWl(fromHome.atHome)} at home)`
          : "";
      out.push({
        id: `ctx:h2hMulti:${pairKey}`,
        section: "CONTEXT",
        kind: "multi_year_h2h",
        score: 15,
        teamIds: [input.homeTeamId, input.awayTeamId],
        label: "H2H_MULTI",
        metrics: [
          {
            key: "h2hMultiWl",
            value: formatWl(fromHome.overall),
            teamId: input.homeTeamId,
          },
          {
            key: "h2hGames",
            value: String(games),
            teamId: input.homeTeamId,
          },
          ...(years
            ? [
                {
                  key: "h2hYears",
                  value: String(years),
                  teamId: input.homeTeamId,
                },
              ]
            : []),
        ],
        players: [],
        mode: "neutral",
        dedupeKeys: [`h2h_multi:${pairKey}`],
        hintEn: `${yearBit} H2H: ${homeAbbr} ${formatWl(fromHome.overall)} vs ${awayAbbr}${atHome}.`,
      });
    }
  }

  // —— division / clutch（片側・極端のみ）——
  const homeDiv = NBA_TEAM_US_GEO[input.homeTeamId]?.division;
  const awayDiv = NBA_TEAM_US_GEO[input.awayTeamId]?.division;
  const sameDiv = Boolean(homeDiv && awayDiv && homeDiv === awayDiv);

  for (const teamId of [input.homeTeamId, input.awayTeamId]) {
    const split = input.bundle.teams[teamId];
    if (!split) continue;
    const nick = proInsightTeamAbbr(teamId);
    const oppId =
      teamId === input.homeTeamId ? input.awayTeamId : input.homeTeamId;
    const oppNick = proInsightTeamAbbr(oppId);

    if (sameDiv && extremeWl(split.vsDivision, MIN_DIV_GAMES)) {
      out.push({
        id: `ctx:vsDiv:${teamId}`,
        section: "CONTEXT",
        kind: "vs_division",
        score: 14,
        teamIds: [teamId],
        label: "VS_DIVISION",
        metrics: [
          {
            key: "vsDivisionWl",
            value: formatWl(split.vsDivision),
            teamId,
          },
          { key: "seasonSource", value: tag.metric, teamId },
        ],
        players: [],
        mode: "neutral",
        dedupeKeys: [`vs_division:${teamId}`],
        hintEn: `${nick} vs division: ${formatWl(split.vsDivision)}${tag.hint} (tonight vs ${oppNick}).`,
      });
    }

    if (extremeWl(split.clutchClose5, MIN_CLUTCH_GAMES)) {
      const pct = wlWinPct(split.clutchClose5);
      out.push({
        id: `ctx:clutchClose:${teamId}`,
        section: "CONTEXT",
        kind: "clutch_close5",
        score: 12,
        teamIds: [teamId],
        label: "CLUTCH_CLOSE5",
        metrics: [
          {
            key: "clutchClose5Wl",
            value: formatWl(split.clutchClose5),
            teamId,
          },
          { key: "seasonSource", value: tag.metric, teamId },
        ],
        players: [],
        mode: "neutral",
        dedupeKeys: [`clutch_close5:${teamId}`],
        hintEn:
          pct >= 0.55
            ? `${nick} in games decided by 5 or fewer: ${formatWl(split.clutchClose5)}${tag.hint}.`
            : `${nick} struggles in one-possession games: ${formatWl(split.clutchClose5)}${tag.hint}.`,
      });
    }
  }

  return out;
}

/** pack 用ワンショット */
export function applyInsightExtrasToFactCandidates(input: {
  phase: ProBriefPhase;
  homeTeamId: string;
  awayTeamId: string;
  tipAtMs: number;
  homePriorGames: SchedulePriorGame[];
  awayPriorGames: SchedulePriorGame[];
  scheduleFacts: ProInsightFact[];
  seasonExtras?: NbaTeamInsightExtrasBundle | null;
  priorExtras?: NbaTeamInsightExtrasBundle | null;
}): {
  scheduleFacts: ProInsightFact[];
  extraFacts: ProInsightFact[];
} {
  const resolved = resolveInsightExtrasForPhase({
    phase: input.phase,
    seasonExtras: input.seasonExtras,
    priorExtras: input.priorExtras,
  });
  const scheduleEnriched = enrichScheduleFactsWithInsightExtras({
    facts: input.scheduleFacts,
    phase: input.phase,
    homeTeamId: input.homeTeamId,
    awayTeamId: input.awayTeamId,
    bundle: resolved.bundle,
    usedPrior: resolved.usedPrior,
  });
  const dense = buildInsightExtrasScheduleCandidates({
    phase: input.phase,
    homeTeamId: input.homeTeamId,
    awayTeamId: input.awayTeamId,
    tipAtMs: input.tipAtMs,
    homePriorGames: input.homePriorGames,
    awayPriorGames: input.awayPriorGames,
    bundle: resolved.bundle,
    usedPrior: resolved.usedPrior,
  });
  const scheduleFacts = selectScheduleFactsDifferentialFirst([
    ...scheduleEnriched,
    ...dense,
  ]);
  const extraFacts = buildInsightExtrasContextCandidates({
    phase: input.phase,
    homeTeamId: input.homeTeamId,
    awayTeamId: input.awayTeamId,
    bundle: resolved.bundle,
    usedPrior: resolved.usedPrior,
  });
  return { scheduleFacts, extraFacts };
}

