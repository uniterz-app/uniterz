/**
 * Team detail enhancements smoke — H2H, roster MPG, BDL clutch/playtype mapping.
 * Run: node --import tsx scripts/smoke-team-detail-enhancements.ts
 */
import { buildTeamGameLogFromGames } from "../lib/nba/teamGameLog/buildTeamGameLogFromGames";
import { mapBdlTeamAdvancedFields } from "../lib/nba/bdl/mapBdlTeamAdvancedFields";
import type { BdlTeamSeasonAverageRow } from "../lib/nba/bdl/fetchBdlTeamSeasonAverages";
import {
  buildPlayerMinutesMap,
  mergeMinutesOntoRosterPlayers,
} from "../lib/nba/teamRosters/mergeRosterPlayerMinutes";
import type { BdlPlayerSeasonAverageRow } from "../lib/nba/bdl/fetchBdlPlayerSeasonAverages";
import type { NbaRosterPlayer } from "../lib/predict/nbaRoster";

function assert(cond: unknown, msg: string): void {
  if (!cond) throw new Error(msg);
}

// --- H2H ---
const h2hLog = buildTeamGameLogFromGames({
  teamId: "nba-lakers",
  season: "2025-26",
  games: [
    {
      id: "g1",
      homeTeamId: "nba-lakers",
      awayTeamId: "nba-celtics",
      final: true,
      startAt: "2025-10-22T02:00:00.000Z",
      score: { home: 110, away: 102 },
    },
    {
      id: "g2",
      homeTeamId: "nba-celtics",
      awayTeamId: "nba-lakers",
      final: true,
      startAt: "2025-11-01T02:00:00.000Z",
      score: { home: 115, away: 108 },
    },
    {
      id: "g3",
      homeTeamId: "nba-lakers",
      awayTeamId: "nba-warriors",
      final: true,
      startAt: "2025-11-05T02:00:00.000Z",
      score: { home: 120, away: 118 },
    },
  ],
});

assert(h2hLog.headToHead.length === 2, "headToHead should have 2 opponents");
const boston = h2hLog.headToHead.find((h) => h.oppTeamId === "nba-celtics");
assert(boston?.wins === 1 && boston?.losses === 1, "LAL vs BOS should be 1-1");
assert(
  h2hLog.headToHead[0]!.wins + h2hLog.headToHead[0]!.losses >=
    h2hLog.headToHead[1]!.wins + h2hLog.headToHead[1]!.losses,
  "headToHead sorted by games desc"
);

// --- roster MPG merge ---
const avgRows: BdlPlayerSeasonAverageRow[] = [
  {
    player: { id: 101, first_name: "Test", last_name: "Star" },
    stats: { min: 820, gp: 41 },
  },
  {
    player: { id: 202, first_name: "Bench", last_name: "Guy" },
    stats: { min: 120, gp: 20 },
  },
];
const minutesMap = buildPlayerMinutesMap(avgRows);
const roster: NbaRosterPlayer[] = [
  {
    id: 101,
    firstName: "Test",
    lastName: "Star",
    position: "G",
    starter: true,
    gp: 0,
    mpg: 0,
    ppg: 0,
  },
  {
    id: 202,
    firstName: "Bench",
    lastName: "Guy",
    position: "F",
    starter: false,
    gp: 0,
    mpg: 0,
    ppg: 0,
  },
];
const merged = mergeMinutesOntoRosterPlayers(roster, minutesMap);
assert(merged[0]!.mpg === 20, "star mpg should be 20.0");
assert(merged[0]!.gp === 41, "star gp should be 41");
assert(merged[1]!.mpg === 6, "bench mpg should be 6.0");

// --- clutch / playtype mapping ---
const fakeClutchAdv: BdlTeamSeasonAverageRow = {
  team: { id: 14, abbreviation: "LAL" },
  stats: {
    off_rating: 118.2,
    def_rating: 109.4,
    net_rating: 8.8,
    e_fg_pct: 0.542,
  },
};
const fakeIso: BdlTeamSeasonAverageRow = {
  team: { id: 14, abbreviation: "LAL" },
  stats: { ppp: 0.98, freq: 12.5, pts: 4.2, gp: 50 },
};
const advanced = mapBdlTeamAdvancedFields({
  clutchAdvanced: fakeClutchAdv,
  playtypeByType: { isolation: fakeIso },
  pace: 100.5,
});
assert(advanced.clutchNet === 8.8, "clutchNet mapped");
assert(advanced.clutchOrtg === 118.2, "clutchOrtg mapped");
assert(advanced.clutchDrtg === 109.4, "clutchDrtg mapped");
assert(advanced.isoPpp === 0.98, "isoPpp mapped");
assert(advanced.isoFreq === 0.125, "isoFreq normalized from pct");
assert(advanced.isoPts === 4.2, "isoPts mapped");

console.log("smoke-team-detail-enhancements: ok");
