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
import TutorialLiveCoach from "@/app/component/tutorial/TutorialLiveCoach";
import {
  requestTutorialResultDetailClose,
  requestTutorialResultDetailOpen,
} from "@/lib/tutorial/tutorialResultDetailEvents";

type PageKind = "results" | "rankings" | "groups" | "profile";

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
  /** リザルト詳細の上→下ステップ（0=スコア, 1=指標, 2=続き） */
  const [resultDetailStep, setResultDetailStep] = useState(0);

  useEffect(() => {
    const p = readTutorialLivePhase();
    setPhase(p);
    if (p === "resultDetail") setResultDetailStep(0);
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
        skipLabel={m.tutorial.skip}
        backLabel={m.tutorial.back}
        target="result-card"
        waitHint={m.tutorial.practice.resultCardTapHint}
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
      {
        title: p.resultDetailMoreTitle,
        body: p.resultDetailMoreBody,
        target: "result-detail-more" as const,
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
        onNext={() => {
          if (!isLast) {
            setResultDetailStep((s) => s + 1);
            return;
          }
          requestTutorialResultDetailClose();
          setPhaseAndStore("gotoRankings");
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

  if (page === "results" && phase === "gotoRankings") {
    return (
      <TutorialLiveCoach
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
          setPhaseAndStore("resultDetail");
          requestTutorialResultDetailOpen();
        }}
        onNext={() => {
          setPhaseAndStore("rankings");
          router.push(`${prefix}/rankings`);
        }}
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
        /** 画面全体を見せる（全面ぼかしにしない） */
        allowInteractBehind
        onSkip={finish}
        onBack={() => {
          setPhaseAndStore("results");
          router.push(`${prefix}/result`);
        }}
        onNext={() => setPhaseAndStore("gotoGroups")}
      />
    );
  }

  if (page === "rankings" && phase === "gotoGroups") {
    return (
      <TutorialLiveCoach
        open
        title={m.tutorial.practice.gotoGroupsTitle}
        body={m.tutorial.practice.gotoGroupsBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.tutorial.next}
        backLabel={m.tutorial.back}
        target="nav-leaderboards"
        waitHint={m.tutorial.practice.tapNavHint}
        onSkip={finish}
        onBack={() => setPhaseAndStore("rankings")}
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
        onSkip={finish}
        onBack={() => {
          setPhaseAndStore("rankings");
          router.push(`${prefix}/rankings`);
        }}
        onNext={() => setPhaseAndStore("gotoProfile")}
      />
    );
  }

  if (page === "groups" && phase === "gotoProfile") {
    return (
      <TutorialLiveCoach
        open
        title={m.tutorial.practice.gotoProfileTitle}
        body={m.tutorial.practice.gotoProfileBody}
        skipLabel={m.tutorial.skip}
        nextLabel={m.tutorial.next}
        backLabel={m.tutorial.back}
        target="nav-mypage"
        waitHint={m.tutorial.practice.tapNavHint}
        onSkip={finish}
        onBack={() => setPhaseAndStore("groups")}
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
        nextLabel={m.tutorial.practice.finishCta}
        backLabel={m.tutorial.back}
        allowInteractBehind
        onSkip={finish}
        onBack={() => {
          setPhaseAndStore("groups");
          router.push(`${prefix}/leaderboards`);
        }}
        onNext={() => {
          finish();
          router.push(`${prefix}/games`);
        }}
      />
    );
  }

  return null;
}
