/**
 * 新機能チュートリアル（horizon）— ステップ定義と表示タブ
 */
import type { TutorialVisualId } from "@/lib/tutorial/tutorialCopy";

export const HORIZON_FEATURE_STEP_COUNT = 8;
/** 最終ステップ: 試合タブ STATS 実物誘導 */
export const TUTORIAL_HORIZON_STATS_STEP = 7;

export type HorizonStepHost = "groups" | "profile" | "games";

export type HorizonPracticeCopy = {
  horizonFeatureTag: string;
  horizonSquadWhatTitle: string;
  horizonSquadWhatBody: string;
  horizonSquadHowTitle: string;
  horizonSquadHowBody: string;
  horizonUnitWhatTitle: string;
  horizonUnitWhatBody: string;
  horizonUnitHowTitle: string;
  horizonUnitHowBody: string;
  horizonCareerWhatTitle: string;
  horizonCareerWhatBody: string;
  horizonCareerHowTitle: string;
  horizonCareerHowBody: string;
  horizonStatsWhatTitle: string;
  horizonStatsWhatBody: string;
  horizonStatsHowTitle: string;
  horizonStatsHowBody: string;
  finishCta: string;
};

export type HorizonFeatureStep = {
  title: string;
  body: string;
  visual: TutorialVisualId | null;
  /** 実 UI を指すステップ */
  target?: "games-stats-edge" | "profile-unit-coin";
};

/** 0–1: グループ / 2–5: プロフィール / 6–7: 試合 */
export function horizonStepHost(step: number): HorizonStepHost {
  if (step <= 1) return "groups";
  if (step <= 5) return "profile";
  return "games";
}

export function buildHorizonFeatureSteps(
  p: HorizonPracticeCopy
): HorizonFeatureStep[] {
  return [
    {
      title: p.horizonSquadWhatTitle,
      body: p.horizonSquadWhatBody,
      visual: "groups",
    },
    {
      title: p.horizonSquadHowTitle,
      body: p.horizonSquadHowBody,
      visual: "groups",
    },
    {
      title: p.horizonUnitWhatTitle,
      body: p.horizonUnitWhatBody,
      visual: null,
      target: "profile-unit-coin",
    },
    {
      title: p.horizonUnitHowTitle,
      body: p.horizonUnitHowBody,
      visual: null,
      target: "profile-unit-coin",
    },
    {
      title: p.horizonCareerWhatTitle,
      body: p.horizonCareerWhatBody,
      visual: "horizon-career",
    },
    {
      title: p.horizonCareerHowTitle,
      body: p.horizonCareerHowBody,
      visual: "horizon-career",
    },
    {
      title: p.horizonStatsWhatTitle,
      body: p.horizonStatsWhatBody,
      visual: "horizon-stats",
    },
    {
      title: p.horizonStatsHowTitle,
      body: p.horizonStatsHowBody,
      visual: null,
      target: "games-stats-edge",
    },
  ];
}

export function horizonFeatureProgressLabel(
  baseProgress: string | null,
  tag: string,
  stepIndex: number
): string | null {
  if (!baseProgress) return null;
  return `${baseProgress} · ${tag} ${stepIndex + 1}/${HORIZON_FEATURE_STEP_COUNT}`;
}
