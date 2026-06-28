import { coerceWcTeamId } from "@/lib/wc/wcCountry";
import type { WcBracketState, WcBracketPredictMatchId } from "@/lib/wc/wc-knockout-bracket";
import {
  WC_BRACKET_PREDICT_MATCH_IDS,
  getWcBracketChampionPick,
  getWcKnockoutRound,
} from "@/lib/wc/wc-knockout-bracket";
import { getWcMatchContestants } from "@/lib/wc/wc-bracket-display";
import { WC_2026_KNOCKOUT_ADVANCEMENT } from "@/lib/wc/wc-knockout-advancement-2026";
import type { WcKnockoutAdvancement } from "@/lib/wc/wc-knockout-bracket-utils";
import type { WcOfficialWinners } from "@/lib/wc/wc-bracket-results-types";
import {
  WC_BRACKET_INPUT_PHASES,
  type WcBracketInputPhase,
} from "@/lib/wc/wc-bracket-input-phases";

export type WcMarketCountMap = Record<string, number>;

export type WcTeamProgressMap = {
  R16: WcMarketCountMap;
  QF: WcMarketCountMap;
  SF: WcMarketCountMap;
  FINAL: WcMarketCountMap;
  CHAMPION: WcMarketCountMap;
};

export type WcMatchupMarketEntry = {
  matchId: WcBracketPredictMatchId;
  phase: WcBracketInputPhase;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeLabel: string;
  awayLabel: string;
  total: number;
  winnerPickCounts: WcMarketCountMap;
};

export type WcBracketMarketData = {
  season: string;
  totalEntries: number;
  championPickCounts: WcMarketCountMap;
  matchupMarkets: WcMatchupMarketEntry[];
  teamProgressMarkets: WcTeamProgressMap;
};

function canonicalTeamKey(key: string | null | undefined): string | null {
  if (!key?.trim()) return null;
  return coerceWcTeamId(key) ?? key.trim();
}

function inc(map: WcMarketCountMap, key?: string | null, amount = 1) {
  const canonical = canonicalTeamKey(key);
  if (!canonical) return;
  map[canonical] = (map[canonical] ?? 0) + amount;
}

/** 正規化キーがバラついても同一チームの票を合算 */
export function pickCountForTeam(
  counts: WcMarketCountMap,
  teamId: string | null | undefined
): number {
  const canon = canonicalTeamKey(teamId);
  if (!canon) return 0;
  let total = 0;
  for (const [key, count] of Object.entries(counts)) {
    if (canonicalTeamKey(key) === canon) total += count;
  }
  return total;
}

function buildConsensusBracket(brackets: WcBracketState[]): WcBracketState {
  const winnerCounts = new Map<WcBracketPredictMatchId, WcMarketCountMap>();

  for (const bracket of brackets) {
    for (const matchId of WC_BRACKET_PREDICT_MATCH_IDS) {
      const winner = bracket[matchId]?.winner?.trim();
      if (!winner) continue;
      let counts = winnerCounts.get(matchId);
      if (!counts) {
        counts = {};
        winnerCounts.set(matchId, counts);
      }
      inc(counts, winner);
    }
  }

  const consensus: WcBracketState = {};
  for (const [matchId, counts] of winnerCounts) {
    let bestKey: string | null = null;
    let bestCount = -1;
    for (const [key, count] of Object.entries(counts)) {
      if (count > bestCount) {
        bestCount = count;
        bestKey = key;
      }
    }
    if (bestKey) {
      consensus[matchId] = { winner: bestKey };
    }
  }
  return consensus;
}

function resolveDisplayContestants(
  matchId: WcBracketPredictMatchId,
  consensusBracket: WcBracketState,
  advancement: WcKnockoutAdvancement,
  pairings: Iterable<MatchupVariant>,
  officialWinners: WcOfficialWinners = {}
) {
  const [home, away] = getWcMatchContestants(
    matchId,
    consensusBracket,
    advancement,
    { officialWinners, preferOfficialFeeders: true }
  );
  let homeTeamId = canonicalTeamKey(home.teamId);
  let awayTeamId = canonicalTeamKey(away.teamId);
  let homeLabel = home.label;
  let awayLabel = away.label;

  if (!homeTeamId || !awayTeamId) {
    for (const pair of pairings) {
      const h = canonicalTeamKey(pair.homeTeamId);
      const a = canonicalTeamKey(pair.awayTeamId);
      if (h && a) {
        homeTeamId = h;
        awayTeamId = a;
        homeLabel = pair.homeLabel;
        awayLabel = pair.awayLabel;
        break;
      }
    }
  }

  return { homeTeamId, awayTeamId, homeLabel, awayLabel };
}

const ROUND_TO_PROGRESS: Partial<
  Record<NonNullable<ReturnType<typeof getWcKnockoutRound>>, keyof WcTeamProgressMap>
> = {
  R32: "R16",
  R16: "QF",
  QF: "SF",
  SF: "FINAL",
  FINAL: "CHAMPION",
};

type MatchupVariant = {
  matchId: WcBracketPredictMatchId;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeLabel: string;
  awayLabel: string;
  total: number;
  winnerPickCounts: WcMarketCountMap;
};

function makeVariantKey(
  matchId: string,
  homeTeamId: string | null,
  awayTeamId: string | null
) {
  const a = homeTeamId ?? "?";
  const b = awayTeamId ?? "?";
  const [t1, t2] = [a, b].sort();
  return `${matchId}|${t1}|${t2}`;
}

function contestantIds(
  homeTeamId: string | null,
  awayTeamId: string | null
) {
  return {
    homeTeamId: homeTeamId ? coerceWcTeamId(homeTeamId) ?? homeTeamId : null,
    awayTeamId: awayTeamId ? coerceWcTeamId(awayTeamId) ?? awayTeamId : null,
  };
}

function buildMatchupMarkets(
  brackets: WcBracketState[],
  advancement: WcKnockoutAdvancement,
  officialWinners: WcOfficialWinners = {}
): WcMatchupMarketEntry[] {
  const participantOptions = {
    officialWinners,
    preferOfficialFeeders: true as const,
  };
  type MatchAcc = {
    total: number;
    winnerPickCounts: WcMarketCountMap;
    pairings: Map<string, MatchupVariant>;
  };

  const accByMatch = new Map<WcBracketPredictMatchId, MatchAcc>();

  for (const bracket of brackets) {
    for (const matchId of WC_BRACKET_PREDICT_MATCH_IDS) {
      const winner = bracket[matchId]?.winner?.trim();
      if (!winner) continue;

      const [home, away] = getWcMatchContestants(
        matchId,
        bracket,
        advancement,
        participantOptions
      );
      const ids = contestantIds(home.teamId, away.teamId);
      const pairKey = makeVariantKey(matchId, ids.homeTeamId, ids.awayTeamId);

      let acc = accByMatch.get(matchId);
      if (!acc) {
        acc = { total: 0, winnerPickCounts: {}, pairings: new Map() };
        accByMatch.set(matchId, acc);
      }
      acc.total += 1;
      inc(acc.winnerPickCounts, winner);

      let pair = acc.pairings.get(pairKey);
      if (!pair) {
        pair = {
          matchId,
          homeTeamId: ids.homeTeamId,
          awayTeamId: ids.awayTeamId,
          homeLabel: home.label,
          awayLabel: away.label,
          total: 0,
          winnerPickCounts: {},
        };
        acc.pairings.set(pairKey, pair);
      }
      pair.total += 1;
      inc(pair.winnerPickCounts, winner);
    }
  }

  const consensusBracket = buildConsensusBracket(brackets);
  const entries: WcMatchupMarketEntry[] = [];
  for (const phase of WC_BRACKET_INPUT_PHASES) {
    for (const matchId of phase.matchIds) {
      const acc = accByMatch.get(matchId);
      if (!acc || acc.total === 0) continue;

      const { homeTeamId, awayTeamId, homeLabel, awayLabel } =
        resolveDisplayContestants(
          matchId,
          consensusBracket,
          advancement,
          acc.pairings.values(),
          officialWinners
        );

      entries.push({
        matchId,
        phase: phase.id,
        homeTeamId,
        awayTeamId,
        homeLabel,
        awayLabel,
        total: acc.total,
        winnerPickCounts: acc.winnerPickCounts,
      });
    }
  }
  return entries;
}

export function aggregateWcBracketMarketFromBrackets(
  brackets: WcBracketState[],
  season: string,
  advancement: WcKnockoutAdvancement = WC_2026_KNOCKOUT_ADVANCEMENT,
  officialWinners: WcOfficialWinners = {}
): WcBracketMarketData {
  const championPickCounts: WcMarketCountMap = {};
  const teamProgressMarkets: WcTeamProgressMap = {
    R16: {},
    QF: {},
    SF: {},
    FINAL: {},
    CHAMPION: {},
  };

  for (const bracket of brackets) {
    inc(championPickCounts, getWcBracketChampionPick(bracket));

    for (const matchId of WC_BRACKET_PREDICT_MATCH_IDS) {
      const winner = bracket[matchId]?.winner?.trim();
      if (!winner) continue;
      const round = getWcKnockoutRound(matchId);
      const bucket = round ? ROUND_TO_PROGRESS[round] : undefined;
      if (bucket) inc(teamProgressMarkets[bucket], winner);
    }
  }

  return {
    season,
    totalEntries: brackets.length,
    championPickCounts,
    matchupMarkets: buildMatchupMarkets(brackets, advancement, officialWinners),
    teamProgressMarkets,
  };
}
