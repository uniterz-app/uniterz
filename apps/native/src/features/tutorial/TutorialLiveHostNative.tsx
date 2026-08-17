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
  subscribeTutorialLivePhaseNative,
  type TutorialLivePhase,
} from "./tutorialLivePhaseNative";
import { clearTutorialLivePickNative } from "./tutorialLivePickNative";
import { formatTutorialLiveProgress } from "../../../../../lib/tutorial/tutorialLiveProgress";
import { markAppTutorialSeenNative } from "./tutorialSeenNative";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import {
  getTutorialHorizonSubstepNative,
  setTutorialHorizonSubstepNative,
  subscribeTutorialHorizonSubstepNative,
} from "./tutorialHorizonSubstepNative";
import { navigateNativeTabForHorizonStep } from "./tutorialHorizonNavigateNative";
import {
  getTutorialLiveTrackNative,
  hydrateTutorialLiveTrackNative,
  setTutorialLiveTrackNative,
} from "./tutorialLiveTrackNative";
import {
  buildHorizonFeatureSteps,
  horizonFeatureProgressLabel,
  horizonStepHost,
} from "../../../../../lib/tutorial/tutorialHorizonSteps";
import { tutorialSkipConfirmProps } from "../../../../../lib/tutorial/tutorialSkipConfirmProps";
import { subscribeTutorialRestartNative, requestTutorialClearedNative } from "./tutorialRestartEventsNative";
import { setTutorialWelcomeAudienceNative } from "./tutorialWelcomeAudienceNative";
import { prefetchRankingsLogoGlb } from "../rankings/rankingsLogoGlbCache";

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
  const skipConfirm = tutorialSkipConfirmProps(m.tutorial);
  const [phase, setPhase] = useState<TutorialLivePhase | null>(null);
  /** 新機能紹介: 各機能2ステップ（概要→使い方） */
  const [horizonFeatureStep, setHorizonFeatureStep] = useState(0);

  useEffect(() => {
    prefetchRankingsLogoGlb();
  }, []);

  const syncPhaseFromStore = useCallback(async () => {
    const p = await readTutorialLivePhaseNative();
    await hydrateTutorialLiveTrackNative();
    setPhase(p && p !== "done" ? p : null);
    if (p === "horizon") {
      setHorizonFeatureStep(getTutorialHorizonSubstepNative());
    }
  }, []);

  /** タブはマウント維持のため、フォーカスのたびにフェーズを取り直す */
  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      void (async () => {
        const p = await readTutorialLivePhaseNative();
        await hydrateTutorialLiveTrackNative();
        if (cancelled) return;
        setPhase(p && p !== "done" ? p : null);
        if (p === "horizon") {
          setHorizonFeatureStep(getTutorialHorizonSubstepNative());
        }
      })();
      return () => {
        cancelled = true;
      };
    }, [])
  );

  useEffect(() => {
    void syncPhaseFromStore();
  }, [syncPhaseFromStore]);

  /** DEV 再開: 他タブのコーチを即消し（古い Modal / オーバーレイ残留防止） */
  useEffect(() => {
    return subscribeTutorialRestartNative(() => {
      setPhase(null);
      setHorizonFeatureStep(0);
      setTutorialHorizonSubstepNative(0);
      setTutorialLiveTrackNative(null);
    });
  }, []);

  /** 同じ画面に居たままフェーズが変わったとき（welcome 追い抜き→horizon） */
  useEffect(() => {
    return subscribeTutorialLivePhaseNative((p) => {
      setPhase(p && p !== "done" ? p : null);
      if (p === "horizon") {
        setHorizonFeatureStep(getTutorialHorizonSubstepNative());
      }
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
    setTutorialLiveTrackNative(null);
    setTutorialWelcomeAudienceNative(null);
    void clearTutorialLivePickNative();
    setPhase(null);
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

  if (!phase) return null;

  if (page === "results" && phase === "results") {
    return (
      <TutorialLiveCoachNative
        open
        title={m.tutorial.practice.resultsTitle}
        body={m.tutorial.practice.resultsBody}
        nextLabel={m.tutorial.next}
        skipLabel={m.tutorial.skip}
        backLabel={m.tutorial.back}
        target="result-card"
        progressLabel={progressLabelFor("results")}
        onNext={() => {
          void (async () => {
            await setPhaseAndStore("rankings");
            navigation.navigate("RankingsTab", { screen: "RankingsHome" });
          })();
        }}
        onBack={() => {
          void (async () => {
            await setPhaseAndStore("games");
            navigation.navigate("GamesTab", { screen: "GamesHome" });
          })();
        }}
        {...skipConfirm}
        onSkip={finish}
      />
    );
  }

  if (page === "rankings" && phase === "rankings") {
    return (
      <TutorialLiveCoachNative
        open
        title={m.tutorial.practice.rankingsTitle}
        body={m.tutorial.practice.rankingsBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.tutorial.next}
        backLabel={m.tutorial.back}
        allowInteractBehind
        progressLabel={progressLabelFor("rankings")}
        {...skipConfirm}
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

  if (page === "groups" && phase === "groups") {
    return (
      <TutorialLiveCoachNative
        open
        title={m.tutorial.practice.groupsTitle}
        body={m.tutorial.practice.groupsBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.tutorial.next}
        backLabel={m.tutorial.back}
        target="groups-create"
        allowInteractBehind
        progressLabel={progressLabelFor("groups")}
        {...skipConfirm}
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
      getTutorialLiveTrackNative() === "features"
        ? null
        : progressLabelFor("horizon"),
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
        accentTone="feature"
        {...skipConfirm}
        onSkip={finish}
        onBack={() => {
          if (horizonFeatureStep > 0) {
            advanceHorizonStep(
              horizonFeatureStep - 1,
              horizonStepHost(horizonFeatureStep)
            );
            return;
          }
          if (getTutorialLiveTrackNative() === "features") {
            void setPhaseAndStore("welcome");
            navigation.navigate("GamesTab", { screen: "GamesHome" });
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

  if (page === "profile" && phase === "profile") {
    return (
      <TutorialLiveCoachNative
        open
        title={m.tutorial.practice.profileTitle}
        body={m.tutorial.practice.profileBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.tutorial.next}
        backLabel={m.tutorial.back}
        allowInteractBehind
        progressLabel={progressLabelFor("profile")}
        {...skipConfirm}
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
          setTutorialLiveTrackNative("full");
          setHorizonFeatureStep(0);
          setTutorialHorizonSubstepNative(0);
          void setPhaseAndStore("horizon");
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
      getTutorialLiveTrackNative() === "features"
        ? null
        : progressLabelFor("horizon"),
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
        visual={step.visual}
        progressLabel={featureProgress}
        accentTone="feature"
        {...skipConfirm}
        onSkip={finish}
        onBack={() => {
          if (horizonFeatureStep > 0) {
            advanceHorizonStep(
              horizonFeatureStep - 1,
              horizonStepHost(horizonFeatureStep)
            );
            return;
          }
          if (getTutorialLiveTrackNative() === "features") {
            void setPhaseAndStore("gamesStats");
            navigation.navigate("GamesTab", { screen: "GamesHome" });
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

  return null;
}
