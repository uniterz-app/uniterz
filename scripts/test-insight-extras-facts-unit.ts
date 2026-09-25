/**
 * Pro Insight extras → fact 配線の単体。
 * npx tsx scripts/test-insight-extras-facts-unit.ts
 */
import assert from "node:assert/strict";
import {
  emptyWl,
  h2hPairKey,
} from "../lib/nba/insights/priorSeasonRecordTypes";
import type { NbaTeamInsightExtrasBundle } from "../lib/nba/insights/teamInsightExtraTypes";
import {
  applyInsightExtrasToFactCandidates,
  enrichScheduleFactsWithInsightExtras,
  buildInsightExtrasContextCandidates,
  resolveInsightExtrasForPhase,
} from "../lib/nba/insights/proInsightFacts/applyInsightExtrasFacts";
import type { ProInsightFact } from "../lib/nba/insights/proInsightFacts/types";

const HOME = "nba-knicks";
const AWAY = "nba-nets";
const H2H_KEY = h2hPairKey(HOME, AWAY);

function split(teamId: string) {
  return {
    teamId,
    b2b: { wins: 12, losses: 8 },
    b2bHome: { wins: 8, losses: 3 },
    b2bAway: { wins: 4, losses: 5 },
    rest0: { wins: 12, losses: 8 },
    rest1: { wins: 10, losses: 6 },
    rest2Plus: { wins: 20, losses: 10 },
    dense3in4: { wins: 9, losses: 6 },
    dense4in5: emptyWl(),
    vsEast: emptyWl(),
    vsWest: emptyWl(),
    vsDivision: { wins: 10, losses: 2 },
    clutchClose5: { wins: 18, losses: 6 },
    atAltitude: { wins: 2, losses: 8 },
    gamesCounted: 82,
    gamesWithRest: 80,
  };
}

const bundle: NbaTeamInsightExtrasBundle = {
  seasonKey: "2025-26",
  h2hSeasonKeys: ["2025-26", "2024-25", "2023-24"],
  teams: {
    [HOME]: split(HOME),
    [AWAY]: {
      ...split(AWAY),
      b2bAway: { wins: 3, losses: 12 },
      vsDivision: { wins: 3, losses: 9 },
      clutchClose5: { wins: 4, losses: 14 },
      atAltitude: { wins: 1, losses: 7 },
    },
  },
  h2hMultiYear: {
    [H2H_KEY]: {
      teamAId: HOME < AWAY ? HOME : AWAY,
      teamBId: HOME < AWAY ? AWAY : HOME,
      aWins: HOME < AWAY ? 7 : 5,
      bWins: HOME < AWAY ? 5 : 7,
      atA: { wins: 4, losses: 2 },
      atB: { wins: 3, losses: 3 },
    },
  },
  gameCount: 1230,
  builtAtMs: Date.now(),
  source: "test",
};

const awayB2b: ProInsightFact = {
  id: `sched:awayB2b:${AWAY}`,
  section: "SCHEDULE",
  kind: "away_b2b",
  score: 23,
  teamIds: [AWAY],
  label: "AWAY_B2B",
  metrics: [{ key: "restDays", value: "0", teamId: AWAY }],
  players: [],
  mode: "neutral",
  dedupeKeys: [`away_b2b:${AWAY}`],
  hintEn: "NETS playing the second night of a back-to-back on the road.",
};

{
  const resolved = resolveInsightExtrasForPhase({
    phase: "opening",
    seasonExtras: null,
    priorExtras: bundle,
  });
  assert.equal(resolved.usedPrior, true);
  assert.ok(resolved.bundle);
}

{
  const enriched = enrichScheduleFactsWithInsightExtras({
    facts: [awayB2b],
    phase: "full",
    homeTeamId: HOME,
    awayTeamId: AWAY,
    bundle,
    usedPrior: false,
  });
  assert.equal(enriched.length, 1);
  assert.ok(enriched[0]!.metrics.some((m) => m.key === "seasonB2bWl"));
  assert.match(enriched[0]!.hintEn, /3-12/);
  assert.match(enriched[0]!.hintEn, /Mark:/);
}

{
  const ctx = buildInsightExtrasContextCandidates({
    phase: "opening",
    homeTeamId: HOME,
    awayTeamId: AWAY,
    bundle,
    usedPrior: true,
  });
  assert.ok(ctx.some((f) => f.kind === "multi_year_h2h"));
  assert.ok(ctx.some((f) => f.kind === "vs_division"));
  assert.ok(ctx.some((f) => f.kind === "clutch_close5"));
  const h2h = ctx.find((f) => f.kind === "multi_year_h2h")!;
  assert.match(h2h.hintEn, /3-year H2H/);
  assert.match(h2h.hintEn, /last season|7-5|5-7|KNICKS|NETS/);
}

{
  const tip = Date.UTC(2026, 2, 10, 0, 0);
  const day = 24 * 60 * 60 * 1000;
  const { scheduleFacts, extraFacts } = applyInsightExtrasToFactCandidates({
    phase: "full",
    homeTeamId: HOME,
    awayTeamId: AWAY,
    tipAtMs: tip,
    homePriorGames: [],
    awayPriorGames: [
      {
        startAtMs: tip - 2 * day,
        venueTeamId: AWAY,
        isHome: true,
      },
      {
        startAtMs: tip - 1 * day,
        venueTeamId: "nba-celtics",
        isHome: false,
      },
    ],
    scheduleFacts: [awayB2b],
    seasonExtras: bundle,
    priorExtras: null,
  });
  assert.ok(scheduleFacts.some((f) => f.kind === "away_b2b"));
  assert.ok(extraFacts.some((f) => f.kind === "multi_year_h2h"));
}

console.log("ok: insight extras → Pro Insight facts");
