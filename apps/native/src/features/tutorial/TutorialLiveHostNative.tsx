/**
 * Web `TutorialLiveHost` 相当 — Rankings / Groups / Profile / Results 上のライブコーチ
 */
import { useCallback, useEffect, useState } from "react";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import type { MainTabParamList } from "../../navigation/types";
import type { Language } from "../../../../../lib/i18n/language";
import { t as i18nT } from "../../../../../lib/i18n/t";
import TutorialLiveCoachNative from "./TutorialLiveCoachNative";
import {
  readTutorialLivePhaseNative,
  writeTutorialLivePhaseNative,
  type TutorialLivePhase,
} from "./tutorialLivePhaseNative";
import {
  clearTutorialLivePickNative,
  readTutorialLivePickNative,
} from "./tutorialLivePickNative";
import type { TutorialLivePickPayload } from "../../../../../lib/tutorial/tutorialLivePick";
import { tutorialGradeFromPick } from "../../../../../lib/tutorial/tutorialNbaUi";
import { formatTutorialLiveProgress } from "../../../../../lib/tutorial/tutorialLiveProgress";
import { markAppTutorialSeenNative } from "./tutorialSeenNative";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import {
  requestTutorialResultDetailCloseNative,
  requestTutorialResultDetailOpenNative,
} from "./tutorialResultDetailEventsNative";
import {
  getTutorialHorizonSubstepNative,
  setTutorialHorizonSubstepNative,
  subscribeTutorialHorizonSubstepNative,
  TUTORIAL_HORIZON_STATS_STEP,
} from "./tutorialHorizonSubstepNative";
import { navigateNativeTabForHorizonStep } from "./tutorialHorizonNavigateNative";
import {
  buildHorizonFeatureSteps,
  horizonFeatureProgressLabel,
  horizonStepHost,
} from "../../../../../lib/tutorial/tutorialHorizonSteps";
import { subscribeTutorialRestartNative, requestTutorialClearedNative } from "./tutorialRestartEventsNative";

type HostSurface = "results" | "rankings" | "groups" | "profile" | "games";

type Props = {
  page: HostSurface;
  language: Language;
};

export default function TutorialLiveHostNative({ page, language }: Props) {
  const { fUser } = useFirebaseUser();
  const navigation =
    useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const m = i18nT(language);
  const [phase, setPhase] = useState<TutorialLivePhase | null>(null);
  const [livePick, setLivePick] = useState<TutorialLivePickPayload | null>(
    null
  );
  /** リザルト詳細: 0=スコア, 1=指標 */
  const [resultDetailStep, setResultDetailStep] = useState(0);
  /** 新機能紹介: 各機能2ステップ（概要→使い方）計8 */
  const [horizonFeatureStep, setHorizonFeatureStep] = useState(0);

  const syncPhaseFromStore = useCallback(async () => {
    const p = await readTutorialLivePhaseNative();
    setPhase(p && p !== "done" ? p : null);
    if (p === "resultDetail") setResultDetailStep(0);
    if (p === "horizon") {
      setHorizonFeatureStep(getTutorialHorizonSubstepNative());
    }
    if (page === "results") {
      const pick = await readTutorialLivePickNative();
      setLivePick(pick);
    }
  }, [page]);

  /** タブはマウント維持のため、フォーカスのたびにフェーズを取り直す */
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const p = await readTutorialLivePhaseNative();
        if (cancelled) return;
        setPhase(p && p !== "done" ? p : null);
        if (p === "resultDetail") setResultDetailStep(0);
        if (p === "horizon") {
          setHorizonFeatureStep(getTutorialHorizonSubstepNative());
        }
        if (page === "results") {
          const pick = await readTutorialLivePickNative();
          if (!cancelled) setLivePick(pick);
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [page])
  );

  useEffect(() => {
    void syncPhaseFromStore();
  }, [syncPhaseFromStore]);

  /** DEV 再開: 他タブのコーチを即消し（古い Modal / オーバーレイ残留防止） */
  useEffect(() => {
    return subscribeTutorialRestartNative(() => {
      setPhase(null);
      setLivePick(null);
      setResultDetailStep(0);
      setHorizonFeatureStep(0);
      setTutorialHorizonSubstepNative(0);
    });
  }, []);

  /** Games 側 STATS ステップの戻る、などサブステップ同期 */
  useEffect(() => {
    return subscribeTutorialHorizonSubstepNative(() => {
      setHorizonFeatureStep(getTutorialHorizonSubstepNative());
    });
  }, []);

  const setPhaseAndStore = useCallback(
    async (next: TutorialLivePhase | null) => {
      await writeTutorialLivePhaseNative(next);
      setPhase(next && next !== "done" ? next : null);
    },
    []
  );

  const finish = useCallback(() => {
    void markAppTutorialSeenNative(fUser?.uid ?? null);
    void writeTutorialLivePhaseNative(null);
    void clearTutorialLivePickNative();
    setPhase(null);
    setLivePick(null);
    requestTutorialClearedNative();
  }, [fUser?.uid]);

  const progressLabelFor = (p: TutorialLivePhase) =>
    formatTutorialLiveProgress(m.tutorial.practice.progressLabel, p);

  const advanceHorizonStep = useCallback(
    (next: number, prevHost: ReturnType<typeof horizonStepHost>) => {
      setHorizonFeatureStep(next);
      setTutorialHorizonSubstepNative(next);
      if (horizonStepHost(next) !== prevHost) {
        navigateNativeTabForHorizonStep(navigation, next);
      }
    },
    [navigation]
  );

  useEffect(() => {
    if (!phase) return;
    if (page === "results" && phase === "gotoResults") {
      void setPhaseAndStore("results");
    } else if (page === "rankings" && phase === "gotoRankings") {
      void setPhaseAndStore("rankings");
    } else if (page === "groups" && phase === "gotoGroups") {
      void setPhaseAndStore("groups");
    } else if (page === "profile" && phase === "gotoProfile") {
      void setPhaseAndStore("profile");
    }
  }, [page, phase, setPhaseAndStore]);

  if (!phase) return null;

  if (page === "results" && phase === "results" && livePick) {
    const grade = tutorialGradeFromPick(livePick.pick);
    const hit = grade.outcome === "hit";
    return (
      <TutorialLiveCoachNative
        open
        title={
          hit
            ? m.tutorial.practice.resultHitTitle
            : m.tutorial.practice.resultMissTitle
        }
        body={
          hit
            ? m.tutorial.practice.resultHitBody
                .replace("{pts}", String(grade.points))
                .replace(
                  "{bonus}",
                  grade.scoreExact ? m.tutorial.practice.resultScoreBonus : ""
                )
            : m.tutorial.practice.resultMissBody
        }
        nextLabel={m.tutorial.next}
        skipLabel={m.tutorial.skip}
        backLabel={m.tutorial.back}
        target="result-card"
        waitHint={m.tutorial.practice.resultCardTapHint}
        progressLabel={progressLabelFor("results")}
        onNext={() => {
          setResultDetailStep(0);
          void setPhaseAndStore("resultDetail");
          requestTutorialResultDetailOpenNative();
        }}
        onTargetPress={() => {
          setResultDetailStep(0);
          void setPhaseAndStore("resultDetail");
          requestTutorialResultDetailOpenNative();
        }}
        onBack={() => {
          void setPhaseAndStore("posted");
          navigation.navigate("GamesTab", { screen: "GamesHome" });
        }}
        onSkip={finish}
      />
    );
  }

  if (page === "results" && phase === "resultDetail") {
    const p = m.tutorial.practice;
    const detailSteps = [
      {
        title: p.resultDetailScoreTitle,
        body: p.resultDetailScoreBody,
        target: "result-detail-score" as const,
      },
      {
        title: p.resultDetailStatsTitle,
        body: p.resultDetailStatsBody,
        target: "result-detail-stats" as const,
      },
    ];
    const step = detailSteps[Math.min(resultDetailStep, detailSteps.length - 1)]!;
    const isLast = resultDetailStep >= detailSteps.length - 1;

    return (
      <TutorialLiveCoachNative
        open
        title={step.title}
        body={step.body}
        nextLabel={m.tutorial.next}
        skipLabel={m.tutorial.skip}
        backLabel={m.tutorial.back}
        target={step.target}
        progressLabel={progressLabelFor("resultDetail")}
        onNext={() => {
          if (!isLast) {
            setResultDetailStep((s) => s + 1);
            return;
          }
          requestTutorialResultDetailCloseNative();
          void setPhaseAndStore("rankings");
          navigation.navigate("RankingsTab", { screen: "RankingsHome" });
        }}
        onBack={() => {
          if (resultDetailStep > 0) {
            setResultDetailStep((s) => s - 1);
            return;
          }
          requestTutorialResultDetailCloseNative();
          void setPhaseAndStore("results");
        }}
        onSkip={finish}
      />
    );
  }

  if (page === "rankings" && (phase === "rankings" || phase === "gotoRankings")) {
    return (
      <TutorialLiveCoachNative
        open={phase === "rankings" || phase === "gotoRankings"}
        title={m.tutorial.practice.rankingsTitle}
        body={m.tutorial.practice.rankingsBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.tutorial.next}
        backLabel={m.tutorial.back}
        allowInteractBehind
        progressLabel={progressLabelFor("rankings")}
        onSkip={finish}
        onBack={() => {
          void (async () => {
            await setPhaseAndStore("results");
            navigation.navigate("ResultTab", { screen: "ResultHome" });
          })();
        }}
        onNext={() => {
          void (async () => {
            await setPhaseAndStore("groups");
            navigation.navigate("LeaderboardsTab", {
              screen: "LeaderboardsHome",
            });
          })();
        }}
      />
    );
  }

  if (page === "groups" && (phase === "groups" || phase === "gotoGroups")) {
    return (
      <TutorialLiveCoachNative
        open={phase === "groups" || phase === "gotoGroups"}
        title={m.tutorial.practice.groupsTitle}
        body={m.tutorial.practice.groupsBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.tutorial.next}
        backLabel={m.tutorial.back}
        allowInteractBehind
        progressLabel={progressLabelFor("groups")}
        onSkip={finish}
        onBack={() => {
          void (async () => {
            await setPhaseAndStore("rankings");
            navigation.navigate("RankingsTab", { screen: "RankingsHome" });
          })();
        }}
        onNext={() => {
          void (async () => {
            await setPhaseAndStore("profile");
            navigation.navigate("ProfileTab", {
              screen: "ProfileHome",
              params: {},
            });
          })();
        }}
      />
    );
  }

  if (page === "groups" && phase === "horizon") {
    if (horizonStepHost(horizonFeatureStep) !== "groups") return null;
    const p = m.tutorial.practice;
    const featureSteps = buildHorizonFeatureSteps(p);
    const stepIndex = Math.min(horizonFeatureStep, featureSteps.length - 1);
    const step = featureSteps[stepIndex]!;
    const isLast = horizonFeatureStep >= featureSteps.length - 1;
    const featureProgress = horizonFeatureProgressLabel(
      progressLabelFor("horizon"),
      p.horizonFeatureTag,
      horizonFeatureStep
    );

    return (
      <TutorialLiveCoachNative
        open
        title={step.title}
        body={step.body}
        skipLabel={m.tutorial.skip}
        nextLabel={isLast ? p.finishCta : m.tutorial.next}
        backLabel={m.tutorial.back}
        visual={step.visual}
        progressLabel={featureProgress}
        onSkip={finish}
        onBack={() => {
          if (horizonFeatureStep > 0) {
            advanceHorizonStep(
              horizonFeatureStep - 1,
              horizonStepHost(horizonFeatureStep)
            );
            return;
          }
          void setPhaseAndStore("profile");
          navigation.navigate("ProfileTab", { screen: "ProfileHome", params: {} });
        }}
        onNext={() => {
          if (!isLast) {
            advanceHorizonStep(
              horizonFeatureStep + 1,
              horizonStepHost(horizonFeatureStep)
            );
            return;
          }
          finish();
          navigation.navigate("GamesTab", { screen: "GamesHome" });
        }}
      />
    );
  }

  if (
    page === "profile" &&
    (phase === "profile" || phase === "gotoProfile")
  ) {
    return (
      <TutorialLiveCoachNative
        open={phase === "profile" || phase === "gotoProfile"}
        title={m.tutorial.practice.profileTitle}
        body={m.tutorial.practice.profileBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.tutorial.next}
        backLabel={m.tutorial.back}
        allowInteractBehind
        progressLabel={progressLabelFor("profile")}
        onSkip={finish}
        onBack={() => {
          void (async () => {
            await setPhaseAndStore("groups");
            navigation.navigate("LeaderboardsTab", {
              screen: "LeaderboardsHome",
            });
          })();
        }}
        onNext={() => {
          setHorizonFeatureStep(0);
          setTutorialHorizonSubstepNative(0);
          void setPhaseAndStore("horizon");
          navigation.navigate("LeaderboardsTab", { screen: "LeaderboardsHome" });
        }}
      />
    );
  }

  if (page === "profile" && phase === "horizon") {
    if (horizonStepHost(horizonFeatureStep) !== "profile") return null;
    const p = m.tutorial.practice;
    const featureSteps = buildHorizonFeatureSteps(p);
    const stepIndex = Math.min(horizonFeatureStep, featureSteps.length - 1);
    const step = featureSteps[stepIndex]!;
    const isLast = horizonFeatureStep >= featureSteps.length - 1;
    const featureProgress = horizonFeatureProgressLabel(
      progressLabelFor("horizon"),
      p.horizonFeatureTag,
      horizonFeatureStep
    );

    return (
      <TutorialLiveCoachNative
        open
        title={step.title}
        body={step.body}
        skipLabel={m.tutorial.skip}
        nextLabel={isLast ? p.finishCta : m.tutorial.next}
        backLabel={m.tutorial.back}
        target={step.target}
        visual={step.target ? null : step.visual}
        progressLabel={featureProgress}
        onSkip={finish}
        onBack={() => {
          if (horizonFeatureStep > 0) {
            advanceHorizonStep(
              horizonFeatureStep - 1,
              horizonStepHost(horizonFeatureStep)
            );
            return;
          }
          void setPhaseAndStore("profile");
        }}
        onNext={() => {
          if (!isLast) {
            advanceHorizonStep(
              horizonFeatureStep + 1,
              horizonStepHost(horizonFeatureStep)
            );
            return;
          }
          finish();
          navigation.navigate("GamesTab", { screen: "GamesHome" });
        }}
      />
    );
  }

  if (page === "games" && phase === "horizon") {
    if (horizonStepHost(horizonFeatureStep) !== "games") return null;
    const p = m.tutorial.practice;
    const featureSteps = buildHorizonFeatureSteps(p);
    const stepIndex = Math.min(horizonFeatureStep, featureSteps.length - 1);
    const step = featureSteps[stepIndex]!;
    const isLast = stepIndex === TUTORIAL_HORIZON_STATS_STEP;
    const featureProgress = horizonFeatureProgressLabel(
      progressLabelFor("horizon"),
      p.horizonFeatureTag,
      horizonFeatureStep
    );

    return (
      <TutorialLiveCoachNative
        open
        title={step.title}
        body={step.body}
        skipLabel={m.tutorial.skip}
        nextLabel={isLast ? p.finishCta : m.tutorial.next}
        backLabel={m.tutorial.back}
        target={step.target}
        visual={step.target ? null : step.visual}
        allowInteractBehind={!!step.target}
        progressLabel={featureProgress}
        onSkip={finish}
        onBack={() => {
          advanceHorizonStep(
            horizonFeatureStep - 1,
            horizonStepHost(horizonFeatureStep)
          );
        }}
        onTargetPress={
          isLast && step.target === "games-stats-edge"
            ? () => {
                finish();
                navigation.navigate("GamesTab", {
                  screen: "LeagueStats",
                  params: { tab: "team" },
                });
              }
            : undefined
        }
        onNext={() => {
          if (!isLast) {
            advanceHorizonStep(
              horizonFeatureStep + 1,
              horizonStepHost(horizonFeatureStep)
            );
            return;
          }
          finish();
        }}
      />
    );
  }

  return null;
}
