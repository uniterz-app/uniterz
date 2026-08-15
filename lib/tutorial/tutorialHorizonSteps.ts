/**
 * 新機能チュートリアル（horizon）— ステップ定義と表示タブ
 */
import type { TutorialVisualId } from "@/lib/tutorial/tutorialCopy";

/**
 * グループバトル（スクワッド）案内。
 * 機能公開まで false。戻すときは true にするだけ。
 */
export const HORIZON_INCLUDE_SQUAD_BATTLE = false;

const HORIZON_SQUAD_STEP_COUNT = 2;
const HORIZON_PROFILE_FEATURE_STEP_COUNT = 4;

export const HORIZON_FEATURE_STEP_COUNT = HORIZON_INCLUDE_SQUAD_BATTLE
  ? HORIZON_SQUAD_STEP_COUNT + HORIZON_PROFILE_FEATURE_STEP_COUNT
  : HORIZON_PROFILE_FEATURE_STEP_COUNT;

export type HorizonStepHost = "groups" | "profile";

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
  target?: "games-stats-edge" | "profile-unit-coin" | "profile-career-tab";
};

/** スクワッド案内があるときだけ 0–1 がグループ。公開まで全部プロフィール */
export function horizonStepHost(step: number): HorizonStepHost {
  if (HORIZON_INCLUDE_SQUAD_BATTLE && step <= 1) return "groups";
  return "profile";
}

export function buildHorizonFeatureSteps(
  p: HorizonPracticeCopy
): HorizonFeatureStep[] {
  const squad: HorizonFeatureStep[] = HORIZON_INCLUDE_SQUAD_BATTLE
    ? [
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
      ]
    : [];
  return [
    ...squad,
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
      target: "profile-career-tab",
    },
    {
      title: p.horizonCareerHowTitle,
      body: p.horizonCareerHowBody,
      visual: "horizon-career",
      target: "profile-career-tab",
    },
  ];
}

/** サブ進捗（`新機能 1/4`）は出さず、主要進捗のみ */
export function horizonFeatureProgressLabel(
  baseProgress: string | null,
  _tag: string,
  _stepIndex: number
): string | null {
  return baseProgress;
}

/** 新機能だけ: 試合 STATS のあと horizon（UNIT / キャリア） */
export function featuresTrackTotalSteps(): number {
  return HORIZON_FEATURE_STEP_COUNT + 1;
}

/** サブ進捗分数は出さない（タグのみ） */
export function featuresTrackProgressLabel(
  tag: string,
  _stepIndex: number
): string {
  return tag;
}
