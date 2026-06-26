import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import {
  WC_BRACKET_PREDICT_MATCH_IDS,
  getWcBracketChampionPick,
  getWcKnockoutRound,
} from "@/lib/wc/wc-knockout-bracket";

export type WcMarketCountMap = Record<string, number>;

export type WcTeamProgressMap = {
  R16: WcMarketCountMap;
  QF: WcMarketCountMap;
  SF: WcMarketCountMap;
  FINAL: WcMarketCountMap;
  CHAMPION: WcMarketCountMap;
};

export type WcBracketMarketData = {
  season: string;
  totalEntries: number;
  championPickCounts: WcMarketCountMap;
  teamProgressMarkets: WcTeamProgressMap;
};

function inc(map: WcMarketCountMap, key?: string | null, amount = 1) {
  if (!key?.trim()) return;
  const k = key.trim();
  map[k] = (map[k] ?? 0) + amount;
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

export function aggregateWcBracketMarketFromBrackets(
  brackets: WcBracketState[],
  season: string
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
    teamProgressMarkets,
  };
}
