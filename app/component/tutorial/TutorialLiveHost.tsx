"use client";

/**
 * 各タブ初訪問時の短いヒント（連鎖ツアーなし）。
 */

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { t } from "@/lib/i18n/t";
import type { Language } from "@/lib/i18n/language";
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
import {
  fetchAppTutorialSeen,
  markAppTutorialSeen,
  readAppTutorialSeenLocal,
} from "@/lib/tutorial/tutorialSeen";
import { setAppTutorialBlockingEvents } from "@/lib/tutorial/tutorialBlockingEvents";
import TutorialLiveCoach from "@/app/component/tutorial/TutorialLiveCoach";
import PredictionScoringRulesModal from "@/app/component/predict/PredictionScoringRulesModal";
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
import {
  markTutorialPageTipSeen,
  readTutorialPageTipSeen,
  type TutorialPageTipId,
} from "@/lib/tutorial/tutorialPageTips";

type PageKind = "rankings" | "groups" | "profile" | "games" | "results";

type Props = {
  page: PageKind;
};

const PAGE_TO_TIP: Record<
  PageKind,
  "rankings" | "groups" | "profile" | "results" | null
> = {
  games: null, // Games は GamesPage 側（welcome + pickup）
  results: "results",
  rankings: "rankings",
  groups: "groups",
  profile: "profile",
};

const PAGE_TO_PHASE: Record<
  "rankings" | "groups" | "profile" | "results",
  TutorialLivePhase
> = {
  rankings: "rankings",
  groups: "groups",
  profile: "profile",
  results: "results",
};

export default function TutorialLiveHost({ page }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const m = t(language);
  const skipConfirm = tutorialSkipConfirmProps(m.tutorial);
  const [phase, setPhase] = useState<TutorialLivePhase | null>(null);
  const [horizonFeatureStep, setHorizonFeatureStep] = useState(0);
  const [scoringRulesOpen, setScoringRulesOpen] = useState(false);
  /** ランキングヒント: 0=概要 / 1=Pick Up・PRO LEAGUE */
  const [rankingsTipStep, setRankingsTipStep] = useState(0);
  /** プロフィール: 0=概要 / 1..=UNIT・キャリア（horizon 相当） */
  const [profileTipStep, setProfileTipStep] = useState(0);

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

  /** このタブ初訪問なら、そのページのヒントだけ起動（連鎖しない） */
  useEffect(() => {
    const uid = user?.uid;
    if (!uid) return;
    const tip = PAGE_TO_TIP[page];
    if (!tip) return;
    if (readAppTutorialSeenLocal(uid)) return;
    if (readTutorialPageTipSeen(uid, tip)) return;

    let cancelled = false;
    void (async () => {
      const seen = await fetchAppTutorialSeen(uid);
      if (cancelled || seen) return;
      if (readTutorialPageTipSeen(uid, tip)) return;
      const existing = readTutorialLivePhase();
      if (
        existing === "welcome" ||
        existing === "gamesPickup" ||
        existing === "horizon" ||
        existing === "games" ||
        existing === "gamesStats"
      ) {
        return;
      }
      if (existing === PAGE_TO_PHASE[tip]) {
        setPhase(existing);
        return;
      }
      writeTutorialLivePhase(PAGE_TO_PHASE[tip]);
      setPhase(PAGE_TO_PHASE[tip]);
      if (tip === "rankings") setRankingsTipStep(0);
      if (tip === "profile") setProfileTipStep(0);
    })();
    return () => {
      cancelled = true;
    };
  }, [page, user?.uid, pathname]);

  const setPhaseAndStore = useCallback((next: TutorialLivePhase | null) => {
    writeTutorialLivePhase(next);
    setPhase(next);
  }, []);

  const finishAll = useCallback(() => {
    void markAppTutorialSeen(user?.uid ?? null);
    writeTutorialLivePhase(null);
    writeTutorialLiveTrack(null);
    writeTutorialWelcomeAudience(null);
    clearTutorialLivePick();
    setPhase(null);
    setAppTutorialBlockingEvents(false);
  }, [user?.uid]);

  const dismissPageTip = useCallback(
    (tip: TutorialPageTipId) => {
      markTutorialPageTipSeen(user?.uid, tip);
      writeTutorialLivePhase(null);
      setPhase(null);
    },
    [user?.uid]
  );

  const prefix = pathname?.startsWith("/web") ? "/web" : "/mobile";

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

  if (!phase) return null;

  const scoringModal = (
    <PredictionScoringRulesModal
      open={scoringRulesOpen}
      language={(language as Language) || "ja"}
      sport="basketball"
      league="nba"
      displaySize="mobile"
      onClose={() => setScoringRulesOpen(false)}
    />
  );

  if (page === "rankings" && phase === "rankings") {
    const p = m.tutorial.practice;
    const step0 = rankingsTipStep === 0;
    return (
      <>
        <TutorialLiveCoach
          open
          title={step0 ? p.rankingsTitle : p.rankingsBoardsTitle}
          body={step0 ? p.rankingsBody : p.rankingsBoardsBody}
          skipLabel={m.tutorial.skip}
          nextLabel={step0 ? m.tutorial.next : m.common.ok}
          backLabel={step0 ? undefined : m.tutorial.back}
          altNextLabel={step0 ? p.rankingsScoreHelpCta : undefined}
          target={step0 ? null : "rankings-division"}
          allowInteractBehind={step0}
          {...skipConfirm}
          onSkip={() => dismissPageTip("rankings")}
          onAltNext={
            step0 ? () => setScoringRulesOpen(true) : undefined
          }
          onBack={step0 ? undefined : () => setRankingsTipStep(0)}
          onNext={() => {
            if (step0) setRankingsTipStep(1);
            else dismissPageTip("rankings");
          }}
        />
        {scoringModal}
      </>
    );
  }

  if (page === "results" && phase === "results") {
    return (
      <TutorialLiveCoach
        open
        title={m.tutorial.practice.resultsTitle}
        body={m.tutorial.practice.resultsBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.common.ok}
        allowInteractBehind
        {...skipConfirm}
        onSkip={() => dismissPageTip("results")}
        onNext={() => dismissPageTip("results")}
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
        nextLabel={m.common.ok}
        target="groups-create"
        allowInteractBehind
        {...skipConfirm}
        onSkip={() => dismissPageTip("groups")}
        onNext={() => dismissPageTip("groups")}
      />
    );
  }

  if (page === "profile" && phase === "profile") {
    const p = m.tutorial.practice;
    const featureSteps = buildHorizonFeatureSteps(p);
    if (profileTipStep === 0) {
      return (
        <TutorialLiveCoach
          open
          title={p.profileTitle}
          body={p.profileBody}
          skipLabel={m.tutorial.skip}
          nextLabel={m.tutorial.next}
          allowInteractBehind
          {...skipConfirm}
          onSkip={() => dismissPageTip("profile")}
          onNext={() => setProfileTipStep(1)}
        />
      );
    }
    const fi = Math.min(profileTipStep - 1, featureSteps.length - 1);
    const step = featureSteps[fi]!;
    const isLast = fi >= featureSteps.length - 1;
    return (
      <TutorialLiveCoach
        open
        title={step.title}
        body={step.body}
        skipLabel={m.tutorial.skip}
        nextLabel={isLast ? m.common.ok : m.tutorial.next}
        backLabel={m.tutorial.back}
        target={step.target}
        visual={step.visual}
        accentTone="feature"
        allowInteractBehind={!step.target}
        {...skipConfirm}
        onSkip={() => dismissPageTip("profile")}
        onBack={() => setProfileTipStep(profileTipStep - 1)}
        onNext={() => {
          if (!isLast) setProfileTipStep(profileTipStep + 1);
          else dismissPageTip("profile");
        }}
      />
    );
  }

  if (page === "groups" && phase === "horizon") {
    if (horizonStepHost(horizonFeatureStep) !== "groups") return null;
    const p = m.tutorial.practice;
    const featureSteps = buildHorizonFeatureSteps(p);
    const step = featureSteps[Math.min(horizonFeatureStep, featureSteps.length - 1)]!;
    const isLast = horizonFeatureStep >= featureSteps.length - 1;
    const featureProgress = horizonFeatureProgressLabel(
      readTutorialLiveTrack() === "features" ? null : null,
      p.horizonFeatureTag,
      horizonFeatureStep
    );
    return (
      <TutorialLiveCoach
        open
        title={step.title}
        body={step.body}
        skipLabel={m.tutorial.skip}
        nextLabel={isLast ? m.common.ok : m.tutorial.next}
        backLabel={m.tutorial.back}
        visual={step.visual}
        progressLabel={featureProgress}
        accentTone="feature"
        {...skipConfirm}
        onSkip={finishAll}
        onBack={() => {
          if (horizonFeatureStep > 0) advanceHorizonStep(horizonFeatureStep - 1);
          else {
            setPhaseAndStore("welcome");
            router.push(`${prefix}/games`);
          }
        }}
        onNext={() => {
          if (!isLast) advanceHorizonStep(horizonFeatureStep + 1);
          else {
            finishAll();
            router.push(`${prefix}/games`);
          }
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
      null,
      p.horizonFeatureTag,
      horizonFeatureStep
    );
    return (
      <TutorialLiveCoach
        open
        title={step.title}
        body={step.body}
        skipLabel={m.tutorial.skip}
        nextLabel={isLast ? m.common.ok : m.tutorial.next}
        backLabel={m.tutorial.back}
        target={step.target}
        visual={step.visual}
        progressLabel={featureProgress}
        accentTone="feature"
        {...skipConfirm}
        onSkip={finishAll}
        onBack={() => {
          if (horizonFeatureStep > 0) advanceHorizonStep(horizonFeatureStep - 1);
          else {
            setPhaseAndStore("welcome");
            router.push(`${prefix}/games`);
          }
        }}
        onNext={() => {
          if (!isLast) advanceHorizonStep(horizonFeatureStep + 1);
          else {
            finishAll();
            router.push(`${prefix}/games`);
          }
        }}
      />
    );
  }

  return null;
}
