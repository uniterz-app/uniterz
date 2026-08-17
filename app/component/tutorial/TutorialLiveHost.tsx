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
  TUTORIAL_LIVE_PHASE_EVENT,
  type TutorialLivePhase,
} from "@/lib/tutorial/tutorialLivePhase";
import { clearTutorialLivePick } from "@/lib/tutorial/tutorialLivePick";
import { writeTutorialWelcomeAudience } from "@/lib/tutorial/tutorialWelcomeAudience";
import {
  readTutorialLiveTrack,
  writeTutorialLiveTrack,
} from "@/lib/tutorial/tutorialLiveTrack";
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
} from "@/lib/tutorial/tutorialHorizonSteps";
import { tutorialSkipConfirmProps } from "@/lib/tutorial/tutorialSkipConfirmProps";

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
  const skipConfirm = tutorialSkipConfirmProps(m.tutorial);
  const [phase, setPhase] = useState<TutorialLivePhase | null>(null);
  /** 新機能紹介: 各機能2ステップ（概要→使い方） */
  const [horizonFeatureStep, setHorizonFeatureStep] = useState(0);

  useEffect(() => {
    const sync = () => {
      const p = readTutorialLivePhase();
      setPhase(p);
      if (p === "horizon") {
        setHorizonFeatureStep(readTutorialHorizonSubstep());
      }
    };
    sync();
    window.addEventListener(TUTORIAL_LIVE_PHASE_EVENT, sync);
    return () => {
      window.removeEventListener(TUTORIAL_LIVE_PHASE_EVENT, sync);
    };
  }, [pathname, page]);

  const setPhaseAndStore = useCallback((next: TutorialLivePhase | null) => {
    writeTutorialLivePhase(next);
    setPhase(next);
  }, []);

  const finish = useCallback(() => {
    void markAppTutorialSeen(user?.uid ?? null);
    writeTutorialLivePhase(null);
    writeTutorialLiveTrack(null);
    writeTutorialWelcomeAudience(null);
    clearTutorialLivePick();
    setPhase(null);
    setAppTutorialBlockingEvents(false);
  }, [user?.uid]);

  const prefix = pathname?.startsWith("/web") ? "/web" : "/mobile";

  const progressLabelFor = (p: TutorialLivePhase) =>
    formatTutorialLiveProgress(m.tutorial.practice.progressLabel, p);

  if (!phase) return null;

  if (page === "results" && phase === "results") {
    return (
      <TutorialLiveCoach
        open
        title={m.tutorial.practice.resultsTitle}
        body={m.tutorial.practice.resultsBody}
        nextLabel={m.tutorial.next}
        skipLabel={m.tutorial.skip}
        backLabel={m.tutorial.back}
        target="result-card"
        progressLabel={progressLabelFor("results")}
        onNext={() => {
          setPhaseAndStore("rankings");
          router.push(`${prefix}/rankings`);
        }}
        onBack={() => {
          setPhaseAndStore("games");
          router.push(`${prefix}/games`);
        }}
        {...skipConfirm}
        onSkip={finish}
      />
    );
  }

  if (page === "rankings" && phase === "rankings") {
    return (
      <TutorialLiveCoach
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

  if (page === "groups" && phase === "groups") {
    return (
      <TutorialLiveCoach
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
    else router.push(profileTutorialHref());
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
      readTutorialLiveTrack() === "features"
        ? null
        : progressLabelFor("horizon"),
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
        accentTone="feature"
        {...skipConfirm}
        onSkip={finish}
        onBack={() => {
          if (horizonFeatureStep > 0) advanceHorizonStep(horizonFeatureStep - 1);
          else if (readTutorialLiveTrack() === "features") {
            setPhaseAndStore("welcome");
            router.push(`${prefix}/games`);
          } else {
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

  if (page === "profile" && phase === "profile") {
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
        {...skipConfirm}
        onSkip={finish}
        onBack={() => {
          setPhaseAndStore("groups");
          router.push(`${prefix}/leaderboards`);
        }}
        onNext={() => {
          writeTutorialLiveTrack("full");
          setHorizonFeatureStep(0);
          writeTutorialHorizonSubstep(0);
          setPhaseAndStore("horizon");
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
    const featureProgress =
      readTutorialLiveTrack() === "features"
        ? null
        : horizonFeatureProgressLabel(
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
        visual={step.visual}
        progressLabel={featureProgress}
        accentTone="feature"
        {...skipConfirm}
        onSkip={finish}
        onBack={() => {
          if (horizonFeatureStep > 0) advanceHorizonStep(horizonFeatureStep - 1);
          else if (readTutorialLiveTrack() === "features") {
            setPhaseAndStore("gamesStats");
            router.push(`${prefix}/games`);
          } else {
            setPhaseAndStore("profile");
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

  return null;
}
