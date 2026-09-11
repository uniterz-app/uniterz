/**
 * Pro Insight 構造化ファクト選定（LLM 入力の正）。
 */
export type {
  ProInsightFact,
  ProInsightFactMetric,
  ProInsightFactPlayer,
  ProInsightFactPack,
  ProInsightFactSection,
} from "@/lib/nba/insights/proInsightFacts/types";
export { PRO_INSIGHT_FACT_CAPS } from "@/lib/nba/insights/proInsightFacts/types";
export {
  assembleProInsightFactPack,
  rankAndPackFacts,
  type AssembleProInsightFactsInput,
} from "@/lib/nba/insights/proInsightFacts/packProInsightFacts";
export { fingerprintProInsightFacts, fingerprintInjuryStatus } from "@/lib/nba/insights/proInsightFacts/fingerprint";
export { buildMatchupFactCandidates, MATCHUP_INJURY_MIN_MPG } from "@/lib/nba/insights/proInsightFacts/buildMatchupFacts";
export {
  CLASH_STYLE_OWNER_METRICS,
  findStyleOwnerInjury,
  isStyleOwnerForClash,
} from "@/lib/nba/insights/proInsightFacts/clashStyleOwner";
export {
  isTrueClash,
  isNearClash,
  isEdgeClashCandidate,
  classifyClashTier,
  clashScore,
  nearClashScore,
  edgeGap,
} from "@/lib/nba/insights/proInsightFacts/clashScore";
export {
  buildScheduleFactCandidates,
  selectScheduleFactsDifferentialFirst,
  type SchedulePriorGame,
  type ScheduleNextGame,
  type HighMinutePlayer,
} from "@/lib/nba/insights/proInsightFacts/buildScheduleFacts";
export { highMinutePlayersFromRecentGames } from "@/lib/nba/insights/proInsightFacts/highMinutePlayersFromLiveStats";
export {
  buildContextFactCandidates,
  type TeamStreakFactInput,
} from "@/lib/nba/insights/proInsightFacts/buildContextFacts";
export {
  deriveTeamFormFromPriors,
  attachStreakOppQuality,
  type DerivedTeamForm,
} from "@/lib/nba/insights/proInsightFacts/deriveContextFormFromPriors";
export { buildInjuryImpactFactCandidates } from "@/lib/nba/insights/proInsightFacts/buildInjuryImpactFacts";
export {
  resolveInjuryShapeImpact,
  INJURY_SHAPE_TEAM_RANK_MAX,
  INJURY_SHAPE_METRICS_MAX,
  type InjuryShapeRole,
  type InjuryShapeImpact,
} from "@/lib/nba/insights/proInsightFacts/injuryShapeRoles";
