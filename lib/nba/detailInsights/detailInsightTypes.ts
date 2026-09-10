/** Phase A — Team / Player 詳細インサイト出力 */

import type { UiStrings } from "@/lib/i18n/ui";

export type DetailInsightChip = {
  id: string;
  label: string;
  category: string;
  score: number;
  hint: UiStrings;
};

export type ScoredChipCandidate = {
  id: string;
  label: string;
  category: string;
  score: number;
  exclusiveGroup?: string;
  tieBreak: number;
  reserveSlot?: boolean;
};

export type TeamDetailSummary = {
  linesJa: string;
  linesEn: string;
};

export type DetailTrendDelta = {
  id: string;
  label: string;
  seasonDisplay: string;
  last10Display: string;
  delta: number;
  /** true = 値が上がると良い（DRTG は false） */
  higherIsBetter: boolean;
};

export type TeamDetailInsights = {
  summary: TeamDetailSummary | null;
  identity: DetailInsightChip[];
  trends: DetailTrendDelta[];
  scheduleDifficulty: TeamScheduleDifficulty | null;
};

export type ScheduleDifficultyTier = "soft" | "balanced" | "tough";

export type TeamScheduleDifficulty = {
  gameCount: number;
  avgOppWinPct: number;
  overallTier: ScheduleDifficultyTier;
  summaryJa: string;
  summaryEn: string;
  /** 7言語版。旧データには無いので任意 */
  summary?: UiStrings;
};

export type PlayerDetailSummary = {
  linesJa: string;
  linesEn: string;
};

export type PlayerRoleChangeSignal = {
  id: string;
  label: string;
  hint: UiStrings;
};

export type PlayerConsistencyInsight = {
  milestones: Array<{
    label: string;
    count: number;
    games: number;
    pct: number;
  }>;
  last10PtsMin: number;
  last10PtsMax: number;
  last10Stdev: number;
  volatility: "stable" | "mixed" | "volatile";
};

export type PlayerUsageStripCell = {
  key: string;
  label: string;
  display: string;
  rank: number | null;
};

export type PlayerDetailInsights = {
  summary: PlayerDetailSummary | null;
  roles: DetailInsightChip[];
  usageStrip: PlayerUsageStripCell[];
  roleChanges: PlayerRoleChangeSignal[];
  roleChangeDetailJa: string | null;
  roleChangeDetailEn: string | null;
  consistency: PlayerConsistencyInsight | null;
};

export type DetailChipExplainPayload = {
  label: string;
  hint: UiStrings;
};
