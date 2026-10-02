/**
 * 確定試合 → Pro Insight 用負荷／帯スプリット。
 * レギュラーのみ。rest / B2B / 過密は tip 間隔から算出。
 */
import { NBA_EAST_TEAM_IDS, NBA_WEST_TEAM_IDS } from "@/lib/nba/nbaConferenceTeams";
import { NBA_TEAM_US_GEO } from "@/lib/nba/nbaTeamUsGeo";
import {
  addLoss,
  addWin,
  emptyWl,
  h2hPairKey,
  type NbaH2HSeasonPair,
  type WlRecord,
} from "@/lib/nba/insights/priorSeasonRecordTypes";
import type {
  NbaTeamInsightExtraSplit,
  NbaTeamInsightExtrasBundle,
} from "@/lib/nba/insights/teamInsightExtraTypes";

export type InsightExtraGameInput = {
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number;
  awayScore: number;
  startAtMs: number;
  seasonPhase?: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const ALTITUDE_VENUE_TEAM_ID = "nba-nuggets";

/** UTC 暦日インデックス（tip の年月日）。B2B = 連続暦日。 */
function calendarDayIndex(tipMs: number): number {
  const d = new Date(tipMs);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / DAY_MS;
}

/**
 * 前試合からの休養「夜」数。
 * 連続暦日（火→水）= 0 = B2B。1日空き（土→月）= 1。
 */
export function restDaysBetween(prevTipMs: number, tipMs: number): number {
  const a = calendarDayIndex(prevTipMs);
  const b = calendarDayIndex(tipMs);
  if (!Number.isFinite(a) || !Number.isFinite(b) || b <= a) return 0;
  return Math.max(0, b - a - 1);
}

function isRegular(g: InsightExtraGameInput): boolean {
  const phase = String(g.seasonPhase ?? "regular").toLowerCase();
  if (phase === "preseason" || phase === "pre") return false;
  if (phase === "play_in" || phase === "playin") return false;
  if (phase === "playoffs" || phase === "playoff") return false;
  return true;
}

function applyResult(r: WlRecord, won: boolean): void {
  if (won) addWin(r);
  else addLoss(r);
}

function ensureTeam(
  map: Record<string, NbaTeamInsightExtraSplit>,
  teamId: string
): NbaTeamInsightExtraSplit {
  if (!map[teamId]) {
    map[teamId] = {
      teamId,
      b2b: emptyWl(),
      b2bHome: emptyWl(),
      b2bAway: emptyWl(),
      rest0: emptyWl(),
      rest1: emptyWl(),
      rest2Plus: emptyWl(),
      dense3in4: emptyWl(),
      dense4in5: emptyWl(),
      vsEast: emptyWl(),
      vsWest: emptyWl(),
      vsDivision: emptyWl(),
      clutchClose5: emptyWl(),
      atAltitude: emptyWl(),
      gamesCounted: 0,
      gamesWithRest: 0,
    };
  }
  return map[teamId]!;
}

function divisionOf(teamId: string): string | null {
  return NBA_TEAM_US_GEO[teamId]?.division ?? null;
}

function confOf(teamId: string): "east" | "west" | null {
  if (NBA_EAST_TEAM_IDS.includes(teamId)) return "east";
  if (NBA_WEST_TEAM_IDS.includes(teamId)) return "west";
  return null;
}

type TeamGame = {
  tipMs: number;
  isHome: boolean;
  won: boolean;
  oppId: string;
  margin: number;
  venueTeamId: string;
};

function applyTeamGame(
  split: NbaTeamInsightExtraSplit,
  g: TeamGame,
  prevTips: number[]
): void {
  split.gamesCounted += 1;

  const oppConf = confOf(g.oppId);
  if (oppConf === "east") applyResult(split.vsEast, g.won);
  if (oppConf === "west") applyResult(split.vsWest, g.won);

  const myDiv = divisionOf(split.teamId);
  const oppDiv = divisionOf(g.oppId);
  if (myDiv && oppDiv && myDiv === oppDiv) {
    applyResult(split.vsDivision, g.won);
  }

  if (g.margin <= 5) applyResult(split.clutchClose5, g.won);

  if (g.venueTeamId === ALTITUDE_VENUE_TEAM_ID) {
    applyResult(split.atAltitude, g.won);
  }

  if (prevTips.length === 0) return;

  const rest = restDaysBetween(prevTips[prevTips.length - 1]!, g.tipMs);
  split.gamesWithRest += 1;
  if (rest === 0) {
    applyResult(split.rest0, g.won);
    applyResult(split.b2b, g.won);
    if (g.isHome) applyResult(split.b2bHome, g.won);
    else applyResult(split.b2bAway, g.won);
  } else if (rest === 1) {
    applyResult(split.rest1, g.won);
  } else {
    applyResult(split.rest2Plus, g.won);
  }

  // 当該 tip を含む直近窓の試合数
  const tipsIncl = [...prevTips, g.tipMs];
  const in4 = tipsIncl.filter((t) => t >= g.tipMs - 3 * DAY_MS).length;
  const in5 = tipsIncl.filter((t) => t >= g.tipMs - 4 * DAY_MS).length;
  if (in4 >= 3) applyResult(split.dense3in4, g.won);
  if (in5 >= 4) applyResult(split.dense4in5, g.won);
}

export function buildTeamInsightExtraRecords(input: {
  seasonKey: string;
  games: InsightExtraGameInput[];
  /** 既存シーズン H2H を合算（新しい季から） */
  h2hBySeason?: Array<{
    seasonKey: string;
    h2h: Record<string, NbaH2HSeasonPair>;
  }>;
  nowMs?: number;
}): NbaTeamInsightExtrasBundle {
  const regular = input.games
    .filter(
      (g) =>
        isRegular(g) &&
        Number.isFinite(g.homeScore) &&
        Number.isFinite(g.awayScore) &&
        Number.isFinite(g.startAtMs) &&
        g.startAtMs > 0 &&
        g.homeTeamId &&
        g.awayTeamId &&
        g.homeTeamId !== g.awayTeamId
    )
    .sort((a, b) => a.startAtMs - b.startAtMs);

  const teams: Record<string, NbaTeamInsightExtraSplit> = {};
  const tipsByTeam = new Map<string, number[]>();

  for (const g of regular) {
    const homeWon = g.homeScore > g.awayScore;
    const margin = Math.abs(g.homeScore - g.awayScore);
    const venueTeamId = g.homeTeamId;

    const homeTips = tipsByTeam.get(g.homeTeamId) ?? [];
    const awayTips = tipsByTeam.get(g.awayTeamId) ?? [];

    applyTeamGame(
      ensureTeam(teams, g.homeTeamId),
      {
        tipMs: g.startAtMs,
        isHome: true,
        won: homeWon,
        oppId: g.awayTeamId,
        margin,
        venueTeamId,
      },
      homeTips
    );
    applyTeamGame(
      ensureTeam(teams, g.awayTeamId),
      {
        tipMs: g.startAtMs,
        isHome: false,
        won: !homeWon,
        oppId: g.homeTeamId,
        margin,
        venueTeamId,
      },
      awayTips
    );

    tipsByTeam.set(g.homeTeamId, [...homeTips, g.startAtMs]);
    tipsByTeam.set(g.awayTeamId, [...awayTips, g.startAtMs]);
  }

  const h2hMultiYear: Record<string, NbaH2HSeasonPair> = {};
  const h2hSeasonKeys: string[] = [];
  for (const block of input.h2hBySeason ?? []) {
    h2hSeasonKeys.push(block.seasonKey);
    for (const [key, pair] of Object.entries(block.h2h)) {
      const existing = h2hMultiYear[key];
      if (!existing) {
        h2hMultiYear[key] = {
          teamAId: pair.teamAId,
          teamBId: pair.teamBId,
          aWins: pair.aWins,
          bWins: pair.bWins,
          atA: { ...pair.atA },
          atB: { ...pair.atB },
        };
        continue;
      }
      existing.aWins += pair.aWins;
      existing.bWins += pair.bWins;
      existing.atA.wins += pair.atA.wins;
      existing.atA.losses += pair.atA.losses;
      existing.atB.wins += pair.atB.wins;
      existing.atB.losses += pair.atB.losses;
    }
  }

  return {
    seasonKey: input.seasonKey,
    h2hSeasonKeys,
    teams,
    h2hMultiYear,
    gameCount: regular.length,
    builtAtMs: input.nowMs ?? Date.now(),
    source: "games+h2hLookback",
  };
}

/** テスト・監査用に公開 */
export function insightExtraH2hPairKey(a: string, b: string): string {
  return h2hPairKey(a, b);
}
