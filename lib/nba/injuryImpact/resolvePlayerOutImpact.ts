/**
 * 欠場選手の影響値をどのシーズン・どの行から取るか。
 * 今季ローテ（10 試合以上）→ 前季の同チーム → 今季の目安（3 試合以上）→ 前季の他チーム（目安のみ。個人差はチーム文脈込みなので使わない）。
 *
 * 厳しさの「相手の強さ」は (k × 前季 + 今季の試合) で作るので、その選手がいた試合の割合だけ数字に含まれている。
 * 含まれていない分（すでに彼抜きの成績として織り込まれた分）は引かない:
 *   presence = (k × 前季の出場割合 + 今季の出場試合) / (k + 今季の消化試合)
 * 前季の出場割合は同チームの行だけ（オフ加入なら 0）。
 */
import type { ProBriefPhase } from "@/lib/predict/predictProBrief";
import { MATCHUP_DIFFICULTY_COEFFICIENTS } from "@/lib/nba/matchupDifficulty/fittedCoefficients";
import { OUT_IMPACT_ROTATION_MIN_GAMES } from "@/lib/nba/injuryImpact/fitPlayerOutImpact";
import {
  playerOutImpactKey,
  type NbaPlayerOutImpactBundle,
} from "@/lib/nba/injuryImpact/playerOutImpactTypes";

/** 前季のチーム試合数が snapshot に無いとき */
const REGULAR_SEASON_GAMES = 82;

export type ResolvedPlayerOutImpact = {
  /** 今夜効く分（fullImpact × presence） */
  impact: number;
  /** 影響値そのもの */
  fullImpact: number;
  /** 0〜1。厳しさの数字にその選手がまだ含まれている割合 */
  presence: number;
  gamesOut: number;
  seasonKey: string;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function presenceOf(input: {
  teamId: string;
  key: string;
  current: NbaPlayerOutImpactBundle | null;
  prior: NbaPlayerOutImpactBundle | null | undefined;
}): number {
  const k = MATCHUP_DIFFICULTY_COEFFICIENTS.shrinkGames;
  const priorRow = input.prior?.players[input.key];
  const priorTeamGames = input.prior?.teamGames?.[input.teamId] || REGULAR_SEASON_GAMES;
  const priorShare = priorRow ? Math.min(1, priorRow.games / priorTeamGames) : 0;
  const n = input.current?.teamGames?.[input.teamId] ?? 0;
  const played = Math.min(n, input.current?.players[input.key]?.games ?? 0);
  return (k * priorShare + played) / (k + n);
}

export function resolvePlayerOutImpact(input: {
  phase: ProBriefPhase;
  teamId: string;
  playerId: string;
  current: NbaPlayerOutImpactBundle | null | undefined;
  prior: NbaPlayerOutImpactBundle | null | undefined;
}): ResolvedPlayerOutImpact | null {
  const { teamId, playerId } = input;
  if (!playerId) return null;
  const key = playerOutImpactKey(teamId, playerId);
  const current = input.phase === "opening" ? null : (input.current ?? null);
  const prior = input.prior;

  const pick = (): { full: number; gamesOut: number; seasonKey: string } | null => {
    const cur = current?.players[key];
    if (cur && cur.games >= OUT_IMPACT_ROTATION_MIN_GAMES) {
      return { full: cur.impact, gamesOut: cur.gamesOut, seasonKey: current!.seasonKey };
    }
    const priorSame = prior?.players[key];
    if (priorSame) {
      return { full: priorSame.impact, gamesOut: priorSame.gamesOut, seasonKey: prior!.seasonKey };
    }
    if (cur) {
      return { full: cur.statPrior, gamesOut: cur.gamesOut, seasonKey: current!.seasonKey };
    }
    const priorOther = prior
      ? Object.values(prior.players)
          .filter((p) => p.playerId === playerId)
          .sort((a, b) => b.games - a.games)[0]
      : undefined;
    if (priorOther) {
      return { full: priorOther.statPrior, gamesOut: 0, seasonKey: prior!.seasonKey };
    }
    return null;
  };

  const picked = pick();
  if (!picked) return null;
  const presence = presenceOf({ teamId, key, current, prior });
  return {
    impact: round1(picked.full * presence),
    fullImpact: picked.full,
    presence,
    gamesOut: picked.gamesOut,
    seasonKey: picked.seasonKey,
  };
}
