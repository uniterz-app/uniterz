/**
 * Pro Insight fact pack 選定のスモーク検証（LLM なし）。
 * npx tsx scripts/verify-pro-insight-facts.ts
 */
import assert from "node:assert/strict";
import { assembleProInsightFactPack } from "../lib/nba/insights/proInsightFacts/index";
import type { NbaLeagueTeamStatRow } from "../lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaTeamAceOutRecordsBundle } from "../lib/nba/insights/aceOutRecordTypes";

const TIP = Date.UTC(2026, 2, 13, 2, 30);
const HOUR = 60 * 60 * 1000;

function row(
  teamId: string,
  patch: Partial<NbaLeagueTeamStatRow> & Record<string, number>
): NbaLeagueTeamStatRow {
  return {
    teamId,
    teamName: teamId,
    wins: 40,
    losses: 20,
    winPct: 0.667,
    conference: "west",
    netrtg: 3,
    ortg: 114,
    drtg: 111,
    fg3a: 35,
    fg3Pct: 0.36,
    tovPct: 13,
    ptsPaint: 48,
    orebPct: 28,
    ftaRate: 0.25,
    ptsFb: 14,
    rimFgPct: 0.65,
    corner3Pct: 0.38,
    oppFg3Pct: 0.36,
    oppTov: 14,
    oppOrebPct: 28,
    oppEfgPct: 0.54,
    ...patch,
  } as NbaLeagueTeamStatRow;
}

const seasonRows: NbaLeagueTeamStatRow[] = [
  row("nba-lakers", {
    ptsPaint: 55,
    oppEfgPct: 0.52,
    fg3a: 30,
    orebPct: 32,
    ptsFb: 12,
    netrtg: 2.5,
    ortg: 113,
    drtg: 110.5,
    isoFreq: 8,
    isoPpp: 0.9,
    pnrBhFreq: 20,
    pnrBhPpp: 0.95,
  }),
  row("nba-celtics", {
    ptsPaint: 44,
    oppEfgPct: 0.58,
    fg3a: 42,
    oppFg3Pct: 0.34,
    orebPct: 24,
    ptsFb: 18,
    netrtg: 7,
    ortg: 118,
    drtg: 111,
    isoFreq: 6,
    isoPpp: 0.88,
    pnrBhFreq: 12,
    pnrBhPpp: 0.92,
  }),
  // filler teams so ranks spread
  ...Array.from({ length: 28 }, (_, i) =>
    row(`nba-t${i}`, {
      ptsPaint: 40 + (i % 10),
      oppEfgPct: 0.53 + (i % 8) * 0.005,
      fg3a: 33 + (i % 7),
      orebPct: 25 + (i % 6),
      ptsFb: 13 + (i % 5),
      netrtg: (i % 15) - 5,
      ortg: 110 + (i % 10),
      drtg: 112 + (i % 8) * 0.3,
      isoFreq: 5 + (i % 4),
      isoPpp: 0.85,
      pnrBhFreq: 10 + (i % 5),
      pnrBhPpp: 0.9,
    })
  ),
];

const last10Rows: NbaLeagueTeamStatRow[] = [
  row("nba-lakers", { netrtg: 6.2 }),
  row("nba-celtics", { netrtg: 1.0 }),
  ...seasonRows.slice(2).map((r) => row(r.teamId, { netrtg: r.netrtg })),
];

const aceOut: NbaTeamAceOutRecordsBundle = {
  seasonKey: "2025-26",
  gameCount: 100,
  builtAtMs: TIP,
  source: "test",
  teams: {
    "nba-celtics": {
      teamId: "nba-celtics",
      acePlayerId: "70",
      acePlayerName: "J.Tatum",
      acePpg: 27,
      aceGp: 60,
      whenOut: { wins: 11, losses: 6 },
      whenOutHome: { wins: 6, losses: 3 },
      whenOutAway: { wins: 5, losses: 3 },
      teamOverall: { wins: 45, losses: 20 },
      gamesOut: 17,
      whenOutPtsFor: 109.9,
      whenOutPtsAgainst: 110.1,
      teamPtsFor: 115.2,
      teamPtsAgainst: 108.3,
      players: [
        {
          playerId: "70",
          playerName: "J.Tatum",
          ppg: 27,
          gp: 60,
          source: "auto",
          whenOut: { wins: 11, losses: 6 },
          whenOutHome: { wins: 6, losses: 3 },
          whenOutAway: { wins: 5, losses: 3 },
          gamesOut: 17,
          whenOutPtsFor: 109.9,
          whenOutPtsAgainst: 110.1,
        },
      ],
    },
  },
};

const pack = assembleProInsightFactPack({
  phase: "full",
  homeTeamId: "nba-lakers",
  awayTeamId: "nba-celtics",
  tipAtMs: TIP,
  tonightVenueTeamId: "nba-lakers",
  seasonRows,
  last10Rows,
  homeInjuries: [],
  awayInjuries: [
    {
      playerId: "70",
      name: "J.Tatum",
      status: "out",
      description: "",
    },
  ],
  homeRecentOppWinPcts: [0.35, 0.4, 0.38, 0.42, 0.55],
  homePriorGames: [
    {
      startAtMs: TIP - 24 * HOUR,
      venueTeamId: "nba-lakers",
      isHome: true,
      homeScore: 112,
      awayScore: 108,
    },
    {
      startAtMs: TIP - 48 * HOUR,
      venueTeamId: "nba-lakers",
      isHome: true,
      homeScore: 105,
      awayScore: 101,
    },
    {
      startAtMs: TIP - 72 * HOUR,
      venueTeamId: "nba-lakers",
      isHome: true,
      homeScore: 110,
      awayScore: 107,
    },
  ],
  awayPriorGames: [
    {
      startAtMs: TIP - 72 * HOUR,
      venueTeamId: "nba-celtics",
      isHome: true,
      homeScore: 120,
      awayScore: 100,
    },
    {
      startAtMs: TIP - 30 * HOUR,
      venueTeamId: "nba-heat",
      isHome: false,
      overtime: true,
      homeScore: 108,
      awayScore: 111,
    },
  ],
  highMinutePlayers: [
    { teamId: "nba-lakers", playerName: "A.Reaves", minutes: 38 },
    { teamId: "nba-lakers", playerName: "L.James", minutes: 37 },
  ],
  aceOutRecords: aceOut,
  playerLeaders: {
    asOfLabel: "test",
    season: {
      usg: [
        {
          playerId: "70",
          playerName: "J.Tatum",
          teamId: "nba-celtics",
          conference: "east",
          gamesPlayed: 60,
          value: 0.312,
        },
        {
          playerId: "71",
          playerName: "J.Brown",
          teamId: "nba-celtics",
          conference: "east",
          gamesPlayed: 58,
          value: 0.281,
        },
      ],
      ast: [
        {
          playerId: "70",
          playerName: "J.Tatum",
          teamId: "nba-celtics",
          conference: "east",
          gamesPlayed: 60,
          value: 5.8,
        },
        {
          playerId: "434",
          playerName: "D.White",
          teamId: "nba-celtics",
          conference: "east",
          gamesPlayed: 60,
          value: 5.1,
        },
      ],
      ast_pct: [
        {
          playerId: "70",
          playerName: "J.Tatum",
          teamId: "nba-celtics",
          conference: "east",
          gamesPlayed: 60,
          value: 0.284,
        },
      ],
    } as never,
    last10: {} as never,
  },
});

assert.ok(
  pack.sections.MATCHUP.some((f) => f.mode === "weakening"),
  "expected at least one MATCHUP weakening when ace is OUT"
);
assert.equal(pack.sections.MATCHUP.length, 2);
assert.equal(pack.sections.SCHEDULE.length, 2);
assert.equal(pack.sections.CONTEXT.length, 2);
assert.ok(pack.sections["INJURY IMPACT"].length >= 1);
assert.ok(pack.sections["INJURY IMPACT"].length <= 2);
assert.ok(pack.fingerprint.length === 24);

const injury = pack.sections["INJURY IMPACT"][0]!;
assert.ok(injury.players.some((p) => p.playerName.includes("Tatum")));
assert.ok(injury.metrics.some((m) => m.key === "aceOutOffDelta"));
assert.ok(
  injury.metrics.some((m) => m.key === "shapeRoles"),
  "expected USG/AST shapeRoles on injury impact"
);
assert.ok(injury.metrics.some((m) => m.key === "usgTeamRank"));
assert.equal(injury.kind, "ace_out_shape_impact");

const schedKinds = pack.sections.SCHEDULE.map((f) => f.kind);
assert.ok(
  schedKinds.includes("rest_gap") ||
    schedKinds.includes("travel_tonight") ||
    schedKinds.includes("b2b"),
  `unexpected schedule kinds: ${schedKinds.join(",")}`
);

console.log(
  JSON.stringify(
    {
      fingerprint: pack.fingerprint,
      MATCHUP: pack.sections.MATCHUP.map((f) => ({
        kind: f.kind,
        mode: f.mode,
        score: f.score,
        metrics: f.metrics,
      })),
      SCHEDULE: pack.sections.SCHEDULE.map((f) => ({
        kind: f.kind,
        score: f.score,
        metrics: f.metrics,
      })),
      CONTEXT: pack.sections.CONTEXT.map((f) => ({
        kind: f.kind,
        score: f.score,
        metrics: f.metrics,
      })),
      "INJURY IMPACT": pack.sections["INJURY IMPACT"].map((f) => ({
        kind: f.kind,
        score: f.score,
        metrics: f.metrics,
        players: f.players,
      })),
      candidateCount: pack.candidates.length,
    },
    null,
    2
  )
);

console.log("verify-pro-insight-facts: ok");
