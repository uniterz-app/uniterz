import type {
  ScheduleDifficultyTier,
  TeamScheduleDifficulty,
} from "@/lib/nba/detailInsights/detailInsightTypes";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaTeamUpcomingGame } from "@/lib/predict/nbaTeamDetailPreviewMocks";

const MIN_UPCOMING = 2;
const OPP_MIN_GP = 3;
const DEFAULT_MAX_GAMES = 10;

export function overallTierFromAvg(avg: number): ScheduleDifficultyTier {
  if (avg >= 0.52) return "tough";
  if (avg <= 0.48) return "soft";
  return "balanced";
}

export function scheduleDifficultyTierLabel(
  tier: ScheduleDifficultyTier,
  isJa: boolean
): string {
  if (isJa) {
    if (tier === "tough") return "TOUGH";
    if (tier === "soft") return "SOFT";
    return "BALANCED";
  }
  if (tier === "tough") return "TOUGH";
  if (tier === "soft") return "SOFT";
  return "BALANCED";
}

export function scheduleDifficultyTierColor(tier: ScheduleDifficultyTier): string {
  if (tier === "tough") return "#FF6B6B";
  if (tier === "soft") return "#5FE1A8";
  return "rgba(255,255,255,0.45)";
}

function formatWinPct(winPct: number): string {
  return winPct.toFixed(3).replace(/^0/, "");
}

export function buildScheduleDifficulty(input: {
  upcomingGames: NbaTeamUpcomingGame[];
  seasonRows: NbaLeagueTeamStatRow[];
  maxGames?: number;
}): TeamScheduleDifficulty | null {
  const slice = input.upcomingGames.slice(0, input.maxGames ?? DEFAULT_MAX_GAMES);
  if (slice.length < MIN_UPCOMING) return null;

  const rowByTeam = new Map(
    input.seasonRows.map((row) => [row.teamId, row] as const)
  );

  const winPcts: number[] = [];

  for (const game of slice) {
    const row = rowByTeam.get(game.oppTeamId);
    const gp = (row?.wins ?? 0) + (row?.losses ?? 0);
    const oppWinPct =
      row && gp >= OPP_MIN_GP && Number.isFinite(row.winPct) ? row.winPct : null;
    if (oppWinPct != null) winPcts.push(oppWinPct);
  }

  if (winPcts.length < MIN_UPCOMING) return null;

  const avgOppWinPct =
    winPcts.reduce((sum, value) => sum + value, 0) / winPcts.length;
  const overallTier = overallTierFromAvg(avgOppWinPct);
  const pctText = formatWinPct(avgOppWinPct);

  return {
    gameCount: slice.length,
    avgOppWinPct,
    overallTier,
    summaryJa: `残り${slice.length}試合 · 相手平均勝率 ${pctText} · ${scheduleDifficultyTierLabel(overallTier, true)}`,
    summaryEn: `Next ${slice.length} · avg opp ${pctText} · ${scheduleDifficultyTierLabel(overallTier, false)}`,
  };
}
