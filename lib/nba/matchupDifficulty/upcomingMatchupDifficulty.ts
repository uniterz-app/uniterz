/**
 * チーム試合ログの upcoming 行に載せる Matchup Difficulty。
 * Firestore `games`（今季）+ 前季の 1 試合あたり得失点差から計算する（BDL は呼ばない）。
 */
import {
  resolveGameScore,
  resolveGameStartAt,
  resolveGameStatus,
} from "../../../packages/shared/src/gameRow";
import {
  restCategoryFromDays,
  restDaysBetweenGameDates,
  type RestCategory,
} from "@/lib/nba/matchupDifficulty/features";
import { MATCHUP_DIFFICULTY_COEFFICIENTS } from "@/lib/nba/matchupDifficulty/fittedCoefficients";
import {
  blendTeamRating,
  computeMatchupDifficulty,
  type MatchupDifficultyCoefficients,
  type MatchupDifficultyTier,
} from "@/lib/nba/matchupDifficulty/model";

export type NbaUpcomingMatchupDifficulty = {
  /** 0〜100（整数） */
  value: number;
  /** 相手の強さだけの Difficulty */
  base: number;
  /** Home/Away まで足した Difficulty */
  afterVenue: number;
  tier: MatchupDifficultyTier;
  /** 相手の今季消化試合が少ない */
  lowSample: boolean;
  ownRest: RestCategory;
  oppRest: RestCategory;
};

type RawGame = Record<string, unknown> & { id?: string };

type TeamTimeline = {
  /** 今季の非プレ試合（final + scheduled）の開始 ms と米東部日付、昇順 */
  games: Array<{ startMs: number; usDate: string }>;
  finalMargins: number[];
};

const US_DATE_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/New_York",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** 休養日数は米国の試合日付で数える（係数の実測と同じ基準） */
function usGameDate(ms: number): string {
  return US_DATE_FORMAT.format(new Date(ms));
}

function teamIdOf(raw: RawGame, side: "home" | "away"): string {
  const nested = raw[side] as { teamId?: unknown } | undefined;
  return String(raw[`${side}TeamId`] ?? nested?.teamId ?? "").trim();
}

export type UpcomingMatchupDifficultyContext = {
  difficultyFor: (input: {
    teamId: string;
    oppTeamId: string;
    home: boolean;
    startMs: number;
  }) => NbaUpcomingMatchupDifficulty | null;
};

export function createUpcomingMatchupDifficultyContext(input: {
  games: RawGame[];
  /** teamId → 前季 1 試合あたり得失点差 */
  priorMarginByTeam: Record<string, number>;
  coefficients?: MatchupDifficultyCoefficients;
}): UpcomingMatchupDifficultyContext {
  const coeffs = input.coefficients ?? MATCHUP_DIFFICULTY_COEFFICIENTS;
  const timelines = new Map<string, TeamTimeline>();
  const timelineOf = (teamId: string) => {
    let t = timelines.get(teamId);
    if (!t) {
      t = { games: [], finalMargins: [] };
      timelines.set(teamId, t);
    }
    return t;
  };

  const rows = input.games
    .map((raw) => ({ raw, start: resolveGameStartAt(raw) }))
    .filter((r): r is { raw: RawGame; start: Date } => r.start != null)
    .sort((a, b) => a.start.getTime() - b.start.getTime());

  for (const { raw, start } of rows) {
    if (String(raw.seasonPhase ?? "").toLowerCase() === "preseason") continue;
    const homeId = teamIdOf(raw, "home");
    const awayId = teamIdOf(raw, "away");
    if (!homeId || !awayId) continue;
    const startMs = start.getTime();
    const usDate = usGameDate(startMs);
    timelineOf(homeId).games.push({ startMs, usDate });
    timelineOf(awayId).games.push({ startMs, usDate });

    if (resolveGameStatus(raw) !== "final" || raw.countsForRanking === false) continue;
    const score = resolveGameScore(raw);
    if (!score) continue;
    const margin = score.home - score.away;
    timelineOf(homeId).finalMargins.push(margin);
    timelineOf(awayId).finalMargins.push(-margin);
  }

  const ratingCache = new Map<string, { rating: number; gamesPlayed: number }>();
  const ratingOf = (teamId: string) => {
    const cached = ratingCache.get(teamId);
    if (cached) return cached;
    const margins = timelines.get(teamId)?.finalMargins ?? [];
    const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
    const result = {
      gamesPlayed: margins.length,
      rating: blendTeamRating(
        {
          gamesPlayed: margins.length,
          seasonMargin: avg(margins),
          last10Margin: avg(margins.slice(-10)),
          priorSeasonMargin: input.priorMarginByTeam[teamId] ?? 0,
        },
        coeffs
      ),
    };
    ratingCache.set(teamId, result);
    return result;
  };

  const restBefore = (teamId: string, startMs: number): RestCategory => {
    const games = timelines.get(teamId)?.games ?? [];
    let prev: string | null = null;
    for (const g of games) {
      if (g.startMs >= startMs) break;
      prev = g.usDate;
    }
    return restCategoryFromDays(restDaysBetweenGameDates(prev, usGameDate(startMs)));
  };

  return {
    difficultyFor: ({ teamId, oppTeamId, home, startMs }) => {
      if (!teamId || !oppTeamId) return null;
      const opp = ratingOf(oppTeamId);
      const ownRest = restBefore(teamId, startMs);
      const oppRest = restBefore(oppTeamId, startMs);
      const result = computeMatchupDifficulty(
        {
          oppRating: opp.rating,
          isHome: home,
          ownRest,
          oppRest,
          oppGamesPlayed: opp.gamesPlayed,
        },
        coeffs
      );
      return {
        value: Math.round(result.difficulty),
        base: Math.round(result.base),
        afterVenue: Math.round(result.steps[1]?.difficulty ?? result.difficulty),
        tier: result.tier,
        lowSample: result.lowSample,
        ownRest,
        oppRest,
      };
    },
  };
}
