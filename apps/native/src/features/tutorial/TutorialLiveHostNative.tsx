/**
 * Web `TutorialLiveHost` 相当 — Rankings / Groups / Profile / Results 上のライブコーチ
 */
import { useCallback, useEffect, useState } from "react";
import { useNavigation } from "@react-navigation/native";
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
import { markAppTutorialSeenNative } from "./tutorialSeenNative";
import { useFirebaseUser } from "../../auth/FirebaseUserProvider";
import {
  requestTutorialResultDetailCloseNative,
  requestTutorialResultDetailOpenNative,
} from "./tutorialResultDetailEventsNative";

type HostSurface = "results" | "rankings" | "groups" | "profile";

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
  /** リザルト詳細の上→下ステップ（0=スコア, 1=指標, 2=続き） */
  const [resultDetailStep, setResultDetailStep] = useState(0);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const p = await readTutorialLivePhaseNative();
      if (cancelled) return;
      setPhase(p);
      if (p === "resultDetail") setResultDetailStep(0);
      if (page === "results") {
        const pick = await readTutorialLivePickNative();
        if (!cancelled) setLivePick(pick);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page]);

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
  }, [fUser?.uid]);

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
        nextLabel={undefined}
        skipLabel={m.tutorial.skip}
        backLabel={m.tutorial.back}
        target="result-card"
        waitHint={m.tutorial.practice.resultCardTapHint}
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
      {
        title: p.resultDetailMoreTitle,
        body: p.resultDetailMoreBody,
        target: "result-detail-more" as const,
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
        allowInteractBehind={isLast}
        onNext={() => {
          if (!isLast) {
            setResultDetailStep((s) => s + 1);
            return;
          }
          requestTutorialResultDetailCloseNative();
          void setPhaseAndStore("gotoRankings");
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

  if (page === "results" && phase === "gotoRankings") {
    return (
      <TutorialLiveCoachNative
        open
        title={m.tutorial.practice.gotoRankingsTitle}
        body={m.tutorial.practice.gotoRankingsBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.tutorial.next}
        backLabel={m.tutorial.back}
        target="nav-ranking"
        waitHint={m.tutorial.practice.tapNavHint}
        onSkip={finish}
        onBack={() => {
          setResultDetailStep(2);
          void setPhaseAndStore("resultDetail");
          requestTutorialResultDetailOpenNative();
        }}
        onNext={() => {
          void setPhaseAndStore("rankings");
          navigation.navigate("RankingsTab", { screen: "RankingsHome" });
        }}
        onTargetPress={() => {
          void setPhaseAndStore("rankings");
          navigation.navigate("RankingsTab", { screen: "RankingsHome" });
        }}
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
        /** 画面全体を見せる（全面ぼかしにしない） */
        allowInteractBehind
        onSkip={finish}
        onBack={() => {
          void setPhaseAndStore("results");
          navigation.navigate("ResultTab", { screen: "ResultHome" });
        }}
        onNext={() => void setPhaseAndStore("gotoGroups")}
      />
    );
  }

  if (page === "rankings" && phase === "gotoGroups") {
    return (
      <TutorialLiveCoachNative
        open
        title={m.tutorial.practice.gotoGroupsTitle}
        body={m.tutorial.practice.gotoGroupsBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.tutorial.next}
        backLabel={m.tutorial.back}
        target="nav-leaderboards"
        waitHint={m.tutorial.practice.tapNavHint}
        onSkip={finish}
        onBack={() => void setPhaseAndStore("rankings")}
        onNext={() => {
          void setPhaseAndStore("groups");
          navigation.navigate("LeaderboardsTab", {
            screen: "LeaderboardsHome",
          });
        }}
        onTargetPress={() => {
          void setPhaseAndStore("groups");
          navigation.navigate("LeaderboardsTab", {
            screen: "LeaderboardsHome",
          });
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
        allowInteractBehind
        onSkip={finish}
        onBack={() => {
          void setPhaseAndStore("rankings");
          navigation.navigate("RankingsTab", { screen: "RankingsHome" });
        }}
        onNext={() => void setPhaseAndStore("gotoProfile")}
      />
    );
  }

  if (page === "groups" && phase === "gotoProfile") {
    return (
      <TutorialLiveCoachNative
        open
        title={m.tutorial.practice.gotoProfileTitle}
        body={m.tutorial.practice.gotoProfileBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.tutorial.next}
        backLabel={m.tutorial.back}
        target="nav-mypage"
        waitHint={m.tutorial.practice.tapNavHint}
        onSkip={finish}
        onBack={() => void setPhaseAndStore("groups")}
        onNext={() => {
          void setPhaseAndStore("profile");
          navigation.navigate("ProfileTab", {
            screen: "ProfileHome",
            params: {},
          });
        }}
        onTargetPress={() => {
          void setPhaseAndStore("profile");
          navigation.navigate("ProfileTab", {
            screen: "ProfileHome",
            params: {},
          });
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
        nextLabel={m.tutorial.practice.finishCta}
        backLabel={m.tutorial.back}
        allowInteractBehind
        onSkip={finish}
        onBack={() => {
          void setPhaseAndStore("groups");
          navigation.navigate("LeaderboardsTab", {
            screen: "LeaderboardsHome",
          });
        }}
        onNext={() => {
          finish();
          navigation.navigate("GamesTab", { screen: "GamesHome" });
        }}
      />
    );
  }

  return null;
}
