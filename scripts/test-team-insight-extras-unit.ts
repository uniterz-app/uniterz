/**
 * Unit smoke: npx tsx scripts/test-team-insight-extras-unit.ts
 */
import assert from "node:assert/strict";
import {
  buildTeamInsightExtraRecords,
  restDaysBetween,
} from "../lib/nba/insights/buildTeamInsightExtraRecords";

const DAY = 24 * 60 * 60 * 1000;

assert.equal(restDaysBetween(0, DAY), 0);
assert.equal(restDaysBetween(0, 2 * DAY), 1);
assert.equal(restDaysBetween(0, 3 * DAY), 2);
// 36h apart same calendar span of 1 day if both on consecutive UTC dates from epoch+0 and epoch+36h
assert.equal(restDaysBetween(0, Math.floor(1.5 * DAY)), 0);

const t0 = Date.UTC(2025, 10, 1, 0, 0, 0);
const built = buildTeamInsightExtraRecords({
  seasonKey: "test",
  games: [
    {
      homeTeamId: "nba-knicks",
      awayTeamId: "nba-heat",
      homeScore: 100,
      awayScore: 98,
      startAtMs: t0,
      seasonPhase: "regular",
    },
    {
      homeTeamId: "nba-heat",
      awayTeamId: "nba-knicks",
      homeScore: 110,
      awayScore: 105,
      startAtMs: t0 + DAY,
      seasonPhase: "regular",
    },
    {
      homeTeamId: "nba-knicks",
      awayTeamId: "nba-celtics",
      homeScore: 120,
      awayScore: 100,
      startAtMs: t0 + 2 * DAY,
      seasonPhase: "regular",
    },
  ],
  h2hBySeason: [],
});

const knicks = built.teams["nba-knicks"]!;
assert.ok(knicks);
assert.equal(knicks.gamesCounted, 3);
assert.equal(knicks.b2b.wins + knicks.b2b.losses, 2);
assert.equal(knicks.clutchClose5.wins + knicks.clutchClose5.losses, 2);
assert.equal(knicks.vsEast.wins + knicks.vsEast.losses, 3);
assert.equal(knicks.dense3in4.wins + knicks.dense3in4.losses, 1);

console.log("ok team-insight-extras unit");
