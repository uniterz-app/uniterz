import type {
  ScheduleDifficultyTier,
  TeamScheduleDifficulty,
} from "@/lib/nba/detailInsights/detailInsightTypes";
import type { NbaLeagueTeamStatRow } from "@/lib/predict/nbaLeagueTeamStatsMocks";
import type { NbaTeamUpcomingGame } from "@/lib/predict/nbaTeamDetailPreviewMocks";
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import type { UiStrings } from "@/lib/i18n/ui";
import { MATCHUP_DIFFICULTY_COEFFICIENTS } from "@/lib/nba/matchupDifficulty/fittedCoefficients";
import { tierFromDifficulty } from "@/lib/nba/matchupDifficulty/model";

const MIN_UPCOMING = 2;
const OPP_MIN_GP = 3;
const DEFAULT_MAX_GAMES = 10;

export function overallTierFromAvg(avg: number): ScheduleDifficultyTier {
  if (avg >= 0.52) return "tough";
  if (avg <= 0.48) return "soft";
  return "balanced";
}

/** ティア表記は全言語共通の英字バッジ */
export function scheduleDifficultyTierLabel(
  tier: ScheduleDifficultyTier,
  _isJa?: boolean
): string {
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

  const difficulties = slice
    .map((game) => game.difficulty?.value)
    .filter((value): value is number => Number.isFinite(value));
  if (difficulties.length >= MIN_UPCOMING) {
    return buildFromMatchupDifficulty(difficulties);
  }

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
  const n = slice.length;
  const tier = scheduleDifficultyTierLabel(overallTier);

  const summary: UiStrings = {
    ja: `残り${n}試合 · 相手平均勝率 ${pctText} · ${tier}`,
    en: `Next ${n} · avg opp ${pctText} · ${tier}`,
    ko: `남은 ${n}경기 · 상대 평균 승률 ${pctText} · ${tier}`,
    zh: `未来 ${n} 场 · 对手平均胜率 ${pctText} · ${tier}`,
    es: `Próximos ${n} · rival medio ${pctText} · ${tier}`,
    pt: `Próximos ${n} · adversário médio ${pctText} · ${tier}`,
    fr: `${n} prochains · adversaire moyen ${pctText} · ${tier}`,
  };

  return {
    gameCount: n,
    avgOppWinPct,
    overallTier,
    summaryJa: summary.ja,
    summaryEn: summary.en,
    summary,
  };
}

function buildFromMatchupDifficulty(difficulties: number[]): TeamScheduleDifficulty {
  const n = difficulties.length;
  const avgDifficulty = difficulties.reduce((sum, value) => sum + value, 0) / n;
  const overallTier = tierFromDifficulty(avgDifficulty, {
    tierSoftMax: MATCHUP_DIFFICULTY_COEFFICIENTS.scheduleTierSoftMax,
    tierToughMin: MATCHUP_DIFFICULTY_COEFFICIENTS.scheduleTierToughMin,
  });
  const avgText = String(Math.round(avgDifficulty));
  const summary: UiStrings = {
    ja: `次の${n}試合 · 平均 ${avgText}`,
    en: `Next ${n} · avg ${avgText}`,
    ko: `다음 ${n}경기 · 평균 ${avgText}`,
    zh: `未来 ${n} 场 · 平均 ${avgText}`,
    es: `Próximos ${n} · media ${avgText}`,
    pt: `Próximos ${n} · média ${avgText}`,
    fr: `${n} prochains · moy. ${avgText}`,
  };
  return {
    gameCount: n,
    avgOppWinPct: 0,
    avgDifficulty,
    overallTier,
    summaryJa: summary.ja,
    summaryEn: summary.en,
    summary,
  };
}

/** Matchup Difficulty の tier 色（行の数字とサマリーバッジで共通） */
export function matchupDifficultyColor(tier: ScheduleDifficultyTier): string {
  return tier === "balanced" ? "rgba(255,255,255,0.72)" : scheduleDifficultyTierColor(tier);
}

/** 表示用: 7言語版があればそれを、無ければ ja/en フォールバック */
export function scheduleDifficultySummaryText(
  difficulty: Pick<
    TeamScheduleDifficulty,
    "summary" | "summaryJa" | "summaryEn"
  >,
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  if (difficulty.summary) return L(lang, difficulty.summary);
  return lang === "ja" ? difficulty.summaryJa : difficulty.summaryEn;
}
