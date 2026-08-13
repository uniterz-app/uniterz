"use client";

/**
 * ランキング / グループ / プロフィール / リザルト画面に載せるチュートリアルコーチ。
 * sessionStorage のフェーズを読んで案内する。
 */

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import {
  readTutorialLivePhase,
  writeTutorialLivePhase,
  type TutorialLivePhase,
} from "@/lib/tutorial/tutorialLivePhase";
import {
  clearTutorialLivePick,
  readTutorialLivePick,
  type TutorialLivePickPayload,
} from "@/lib/tutorial/tutorialLivePick";
import { tutorialGradeFromPick } from "@/lib/tutorial/tutorialNbaUi";
import { markAppTutorialSeen } from "@/lib/tutorial/tutorialSeen";
import { setAppTutorialBlockingEvents } from "@/lib/tutorial/tutorialBlockingEvents";
import { formatTutorialLiveProgress } from "@/lib/tutorial/tutorialLiveProgress";
import TutorialLiveCoach from "@/app/component/tutorial/TutorialLiveCoach";
import {
  readTutorialHorizonSubstep,
  writeTutorialHorizonSubstep,
} from "@/lib/tutorial/tutorialHorizonSubstep";
import {
  buildHorizonFeatureSteps,
  horizonFeatureProgressLabel,
  horizonStepHost,
  TUTORIAL_HORIZON_STATS_STEP,
} from "@/lib/tutorial/tutorialHorizonSteps";

type PageKind = "results" | "rankings" | "groups" | "profile" | "games";

type Props = {
  page: PageKind;
};

export default function TutorialLiveHost({ page }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const [phase, setPhase] = useState<TutorialLivePhase | null>(null);
  const [livePick, setLivePick] = useState<TutorialLivePickPayload | null>(null);
  /** リザルト詳細: 0=スコア, 1=指標 */
  const [resultDetailStep, setResultDetailStep] = useState(0);
  /** 新機能紹介: 0=概要, 1=スクワッド, 2=UNIT, 3=キャリア */
  const [horizonFeatureStep, setHorizonFeatureStep] = useState(0);

  useEffect(() => {
    const p = readTutorialLivePhase();
    setPhase(p);
    if (p === "resultDetail") setResultDetailStep(0);
    if (p === "horizon") {
      setHorizonFeatureStep(readTutorialHorizonSubstep());
    }
    if (page === "results") {
      setLivePick(readTutorialLivePick());
    }
  }, [pathname, page]);

  const setPhaseAndStore = useCallback((next: TutorialLivePhase | null) => {
    writeTutorialLivePhase(next);
    setPhase(next);
  }, []);

  const finish = useCallback(() => {
    void markAppTutorialSeen(user?.uid ?? null);
    writeTutorialLivePhase(null);
    clearTutorialLivePick();
    setPhase(null);
    setLivePick(null);
    setAppTutorialBlockingEvents(false);
  }, [user?.uid]);

  const prefix = pathname?.startsWith("/web") ? "/web" : "/mobile";

  const progressLabelFor = (p: TutorialLivePhase) =>
    formatTutorialLiveProgress(m.tutorial.practice.progressLabel, p);

  if (!phase) return null;

  if (page === "results" && (phase === "results" || phase === "gotoResults")) {
    if (phase === "gotoResults") {
      queueMicrotask(() => setPhaseAndStore("results"));
    }
    if (!livePick) return null;
    const grade = tutorialGradeFromPick(livePick.pick);
    const hit = grade.outcome === "hit";
    return (
      <TutorialLiveCoach
        open={phase === "results"}
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
          setPhaseAndStore("resultDetail");
          requestTutorialResultDetailOpen();
        }}
        onTargetPress={() => {
          setResultDetailStep(0);
          setPhaseAndStore("resultDetail");
          requestTutorialResultDetailOpen();
        }}
        onBack={() => {
          setPhaseAndStore("posted");
          router.push(`${prefix}/games`);
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
      <TutorialLiveCoach
        open
        title={step.title}
        body={step.body}
        nextLabel={m.tutorial.next}
        skipLabel={m.tutorial.skip}
        backLabel={m.tutorial.back}
        target={step.target}
        allowInteractBehind={isLast}
        progressLabel={progressLabelFor("resultDetail")}
        onNext={() => {
          if (!isLast) {
            setResultDetailStep((s) => s + 1);
            return;
          }
          requestTutorialResultDetailClose();
          /** goto 待機コーチを出さず、直接ランキングへ */
          setPhaseAndStore("rankings");
          router.push(`${prefix}/rankings`);
        }}
        onBack={() => {
          if (resultDetailStep > 0) {
            setResultDetailStep((s) => s - 1);
            return;
          }
          requestTutorialResultDetailClose();
          setPhaseAndStore("results");
        }}
        onSkip={finish}
      />
    );
  }

  if (page === "rankings" && (phase === "rankings" || phase === "gotoRankings")) {
    if (phase === "gotoRankings") {
      queueMicrotask(() => setPhaseAndStore("rankings"));
    }
    return (
      <TutorialLiveCoach
        open={phase === "rankings"}
        title={m.tutorial.practice.rankingsTitle}
        body={m.tutorial.practice.rankingsBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.tutorial.next}
        backLabel={m.tutorial.back}
        allowInteractBehind
        progressLabel={progressLabelFor("rankings")}
        onSkip={finish}
        onBack={() => {
          setPhaseAndStore("results");
          router.push(`${prefix}/result`);
        }}
        onNext={() => {
          setPhaseAndStore("groups");
          router.push(`${prefix}/leaderboards`);
        }}
      />
    );
  }

  if (page === "groups" && (phase === "groups" || phase === "gotoGroups")) {
    if (phase === "gotoGroups") {
      queueMicrotask(() => setPhaseAndStore("groups"));
    }
    return (
      <TutorialLiveCoach
        open={phase === "groups"}
        title={m.tutorial.practice.groupsTitle}
        body={m.tutorial.practice.groupsBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.tutorial.next}
        backLabel={m.tutorial.back}
        allowInteractBehind
        progressLabel={progressLabelFor("groups")}
        onSkip={finish}
        onBack={() => {
          setPhaseAndStore("rankings");
          router.push(`${prefix}/rankings`);
        }}
        onNext={() => {
          setPhaseAndStore("profile");
          const el = document.querySelector(
            '[data-tutorial-target="nav-mypage"]'
          ) as HTMLAnchorElement | null;
          const href = el?.getAttribute("href");
          router.push(href && href !== "#" ? href : `${prefix}/games`);
        }}
      />
    );
  }

  const profileTutorialHref = () => {
    const el = document.querySelector(
      '[data-tutorial-target="nav-mypage"]'
    ) as HTMLAnchorElement | null;
    const href = el?.getAttribute("href");
    return href && href !== "#" ? href : `${prefix}/games`;
  };

  const navigateHorizonTab = (step: number) => {
    const host = horizonStepHost(step);
    if (host === "groups") router.push(`${prefix}/leaderboards`);
    else if (host === "profile") router.push(profileTutorialHref());
    else router.push(`${prefix}/games`);
  };

  const advanceHorizonStep = (next: number) => {
    const prevHost = horizonStepHost(horizonFeatureStep);
    setHorizonFeatureStep(next);
    writeTutorialHorizonSubstep(next);
    if (horizonStepHost(next) !== prevHost) navigateHorizonTab(next);
  };

  if (page === "groups" && phase === "horizon") {
    if (horizonStepHost(horizonFeatureStep) !== "groups") return null;
    const p = m.tutorial.practice;
    const featureSteps = buildHorizonFeatureSteps(p);
    const step = featureSteps[Math.min(horizonFeatureStep, featureSteps.length - 1)]!;
    const isLast = horizonFeatureStep >= featureSteps.length - 1;
    const featureProgress = horizonFeatureProgressLabel(
      progressLabelFor("horizon"),
      p.horizonFeatureTag,
      horizonFeatureStep
    );
    return (
      <TutorialLiveCoach
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
          if (horizonFeatureStep > 0) advanceHorizonStep(horizonFeatureStep - 1);
          else {
            setPhaseAndStore("profile");
            router.push(profileTutorialHref());
          }
        }}
        onNext={() => {
          if (!isLast) advanceHorizonStep(horizonFeatureStep + 1);
          else {
            finish();
            router.push(`${prefix}/games`);
          }
        }}
      />
    );
  }

  if (page === "profile" && (phase === "profile" || phase === "gotoProfile")) {
    if (phase === "gotoProfile") {
      queueMicrotask(() => setPhaseAndStore("profile"));
    }
    return (
      <TutorialLiveCoach
        open={phase === "profile"}
        title={m.tutorial.practice.profileTitle}
        body={m.tutorial.practice.profileBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.tutorial.next}
        backLabel={m.tutorial.back}
        allowInteractBehind
        progressLabel={progressLabelFor("profile")}
        onSkip={finish}
        onBack={() => {
          setPhaseAndStore("groups");
          router.push(`${prefix}/leaderboards`);
        }}
        onNext={() => {
          setHorizonFeatureStep(0);
          writeTutorialHorizonSubstep(0);
          setPhaseAndStore("horizon");
          router.push(`${prefix}/leaderboards`);
        }}
      />
    );
  }

  if (page === "profile" && phase === "horizon") {
    if (horizonStepHost(horizonFeatureStep) !== "profile") return null;
    const p = m.tutorial.practice;
    const featureSteps = buildHorizonFeatureSteps(p);
    const step = featureSteps[Math.min(horizonFeatureStep, featureSteps.length - 1)]!;
    const isLast = horizonFeatureStep >= featureSteps.length - 1;
    const featureProgress = horizonFeatureProgressLabel(
      progressLabelFor("horizon"),
      p.horizonFeatureTag,
      horizonFeatureStep
    );
    return (
      <TutorialLiveCoach
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
          if (horizonFeatureStep > 0) advanceHorizonStep(horizonFeatureStep - 1);
          else setPhaseAndStore("profile");
        }}
        onNext={() => {
          if (!isLast) advanceHorizonStep(horizonFeatureStep + 1);
          else {
            finish();
            router.push(`${prefix}/games`);
          }
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
      <TutorialLiveCoach
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
        onBack={() => advanceHorizonStep(horizonFeatureStep - 1)}
        onTargetPress={
          isLast && step.target === "games-stats-edge"
            ? () => {
                finish();
                router.push(
                  pathname?.startsWith("/web")
                    ? "/dev/stats-preview"
                    : "/mobile/stats-preview"
                );
              }
            : undefined
        }
        onNext={() => {
          if (!isLast) advanceHorizonStep(horizonFeatureStep + 1);
          else finish();
        }}
      />
    );
  }

  return null;
}
