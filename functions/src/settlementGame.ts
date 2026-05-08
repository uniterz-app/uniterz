import type { MajoritySide } from "./marketCalculator";
import { SPORT_TYPE_BY_LEAGUE } from "./sportTypes";

/** finalizePost / streak / upset で共通の試合スライス */
export type SettlementGameInput = {
  homeScore: number;
  awayScore: number;
  league?: string | null;
  homeTeamId?: string | null;
  awayTeamId?: string | null;
  /** 規定＋延長終了時スコア（PK前）。未設定時は homeScore/awayScore を使用 */
  regulationEtScore?: { home: number; away: number } | null;
  /** ノックアウトで PK 等を含め最終的に進んだ側の teamId */
  advancingTeamId?: string | null;
  knockout?: boolean;
};

export type RankingSport = "basketball" | "football";

export function leagueToSport(league?: string | null): RankingSport {
  const key = String(league ?? "")
    .trim()
    .toLowerCase();
  return SPORT_TYPE_BY_LEAGUE[key] ?? "basketball";
}

export function getFootballLineScore(g: SettlementGameInput): {
  home: number;
  away: number;
} {
  const r = g.regulationEtScore;
  if (
    r &&
    Number.isFinite(r.home) &&
    Number.isFinite(r.away)
  ) {
    return { home: r.home, away: r.away };
  }
  return { home: g.homeScore, away: g.awayScore };
}

/** アップセット判定用の実結果（home / away / draw） */
export function resolveActualOutcomeForUpset(
  g: SettlementGameInput,
  sport: RankingSport
): MajoritySide {
  if (
    sport === "football" &&
    g.knockout &&
    g.advancingTeamId &&
    g.homeTeamId &&
    g.awayTeamId
  ) {
    return g.advancingTeamId === g.homeTeamId ? "home" : "away";
  }
  if (g.homeScore === g.awayScore) return "draw";
  return g.homeScore > g.awayScore ? "home" : "away";
}
