/**
 * トレードバレット ランキング DEV モック。
 */
import { MOCK_SUBMITTED_TRADE_BALLOT } from "@/lib/predict/nbaTradeBallotPreviewMocks";
import type { NbaTradeBallotPrediction } from "@/lib/predict/nbaTradeBallotPredict";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  tradeBallotHasJerseyPrize,
  tradeBallotTotalUnitsForEntrant,
} from "@/lib/units/tradeBallotUnitRewards";

export type NbaTradeBallotRankEntry = {
  rank: number;
  uid: string;
  handle: string;
  total: number;
  playerHits: number;
  teamHits: number;
  /** 順位 Unit + 参加賞 */
  units: number;
  jersey: boolean;
  prediction: NbaTradeBallotPrediction;
};

function varyBallot(
  seed: number,
  toTeamIds: string[]
): NbaTradeBallotPrediction {
  const base = MOCK_SUBMITTED_TRADE_BALLOT.picks;
  return {
    season: CURRENT_NBA_SEASON_KEY,
    picks: base.map((p, i) => ({
      playerId: p.playerId,
      toTeamId: toTeamIds[(i + seed) % toTeamIds.length] ?? p.toTeamId,
    })),
  };
}

const DEST = [
  "nba-lakers",
  "nba-knicks",
  "nba-heat",
  "nba-warriors",
  "nba-mavericks",
  "nba-suns",
  "nba-bucks",
];

const HANDLES = [
  "ace_reader",
  "tdl_hunter",
  "cap_space",
  "rumor_king",
  "salary_match",
  "bench_scout",
  "east_watcher",
  "west_wire",
  "pick_swap",
  "apron_alert",
  "dead_cap",
  "buyout_bait",
];

/** 上位〜中位の見た目用。点は仮。 */
export function buildTradeBallotRankingPreviewMock(): NbaTradeBallotRankEntry[] {
  const totals = [420, 390, 360, 340, 310, 290, 270, 250, 230, 210, 190, 170];
  return HANDLES.map((handle, i) => {
    const rank = i + 1;
    const total = totals[i] ?? Math.max(80, 400 - i * 25);
    const playerHits = Math.max(1, 5 - Math.floor(i / 3));
    const teamHits = Math.max(0, playerHits - (i % 3 === 0 ? 0 : 1));
    return {
      rank,
      uid: `mock-uid-${rank}`,
      handle,
      total,
      playerHits,
      teamHits,
      units: tradeBallotTotalUnitsForEntrant({
        rank,
        submittedComplete: true,
      }),
      jersey: tradeBallotHasJerseyPrize(rank),
      prediction: varyBallot(i, DEST),
    };
  });
}
