"use client";

/**
 * NBA モック練習ツアー — 本番 UI（MatchCard / PredictionFormV2 / ResultCard /
 * MyRankCard / RankingCard / ProfileKinetikHero）を埋め込み。
 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
import { GiCrossedSwords } from "react-icons/gi";
import { FaTrophy, FaUsers, FaListUl } from "react-icons/fa";
import { FiUser } from "react-icons/fi";
import { nameOxanium, nameRajdhani, jp } from "@/lib/fonts";
import { t } from "@/lib/i18n/t";
import type { Language } from "@/lib/i18n/language";
import type {
  TutorialPredictPick,
  TutorialPracticePhase,
  TutorialGrade,
} from "@/lib/tutorial/tutorialNbaMock";
import {
  buildTutorialMatchCardProps,
  buildTutorialProfile,
  buildTutorialRankingRows,
  buildTutorialResultPost,
  tutorialGradeFromPick,
} from "@/lib/tutorial/tutorialNbaUi";
import {
  TUTORIAL_BG_FADE_S,
  TUTORIAL_CYAN,
  TUTORIAL_EXIT_S,
  TUTORIAL_SLIDE_DURATION_S,
} from "@/lib/tutorial/tutorialMotion";
import MatchCard from "@/app/component/games/MatchCard";
import PredictionFormV2 from "@/app/component/predict/PredictionFormV2";
import ResultCard from "@/app/component/result/ResultCard";
import MyRankCard from "@/app/component/rankings/MyRankCard";
import RankingCard from "@/app/component/rankings/RankingCard";
import ProfileKinetikHero from "@/app/component/profile/ui/ProfileKinetikHero";
import CommunityGroupDetailCard from "@/app/component/communities/CommunityGroupDetailCard";

const CYBER_CHAMFER_CLIP =
  "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  open: boolean;
  language?: Language;
  onFinish: () => void;
  resetKey?: number;
};

type TabKey = "games" | "result" | "rankings" | "groups" | "profile";

function PracticeTabBar({
  active,
  labels,
}: {
  active: TabKey;
  labels: Record<TabKey, string>;
}) {
  const items: {
    id: TabKey;
    icon: React.ComponentType<{ size?: number; color?: string }>;
  }[] = [
    { id: "games", icon: GiCrossedSwords },
    { id: "result", icon: FaListUl },
    { id: "rankings", icon: FaTrophy },
    { id: "groups", icon: FaUsers },
    { id: "profile", icon: FiUser },
  ];
  return (
    <div className="flex border-t border-white/10 bg-[#070b12]/95 px-1 py-1.5">
      {items.map(({ id, icon: Icon }) => {
        const on = id === active;
        return (
          <div
            key={id}
            className="flex flex-1 flex-col items-center gap-0.5 py-1"
          >
            <Icon size={16} color={on ? TUTORIAL_CYAN : "rgba(255,255,255,0.35)"} />
            <span
              className={cn(
                nameOxanium.className,
                "text-[8px] font-bold uppercase tracking-wide"
              )}
              style={{ color: on ? TUTORIAL_CYAN : "rgba(255,255,255,0.35)" }}
            >
              {labels[id]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function TutorialPracticeTour({
  open,
  language = "ja",
  onFinish,
  resetKey = 0,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [phase, setPhase] = useState<TutorialPracticePhase>("welcome");
  const [grade, setGrade] = useState<TutorialGrade | null>(null);
  const [pick, setPick] = useState<TutorialPredictPick | null>(null);
  const reduceMotion = useReducedMotion() === true;
  const m = t(language);
  const en = language === "en";

  const matchCard = useMemo(
    () => buildTutorialMatchCardProps({ language: en ? "en" : "ja" }),
    [en]
  );
  const profile = useMemo(() => buildTutorialProfile(), []);
  const rankingRows = useMemo(
    () => buildTutorialRankingRows(grade),
    [grade]
  );
  const resultPost = useMemo(() => {
    if (!pick || !grade) return null;
    return buildTutorialResultPost(pick, grade);
  }, [pick, grade]);

  const tabLabels: Record<TabKey, string> = {
    games: m.tutorial.practice.tabGames,
    result: m.tutorial.practice.tabResult,
    rankings: m.tutorial.practice.tabRankings,
    groups: m.tutorial.practice.tabGroups,
    profile: m.tutorial.practice.tabProfile,
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    setPhase("welcome");
    setGrade(null);
    setPick(null);
  }, [open, resetKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFinish();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onFinish]);

  useEffect(() => {
    if (phase !== "resolving" || !pick) return;
    const id = window.setTimeout(() => {
      setGrade(tutorialGradeFromPick(pick));
      setPhase("result");
    }, reduceMotion ? 200 : 1200);
    return () => window.clearTimeout(id);
  }, [phase, pick, reduceMotion]);

  if (!mounted) return null;

  const activeTab: TabKey =
    phase === "result" || phase === "resolving"
      ? "result"
      : phase === "rankings"
        ? "rankings"
        : phase === "groups"
          ? "groups"
          : phase === "profile" || phase === "done"
            ? "profile"
            : "games";

  const phaseTitle = (() => {
    const p = m.tutorial.practice;
    switch (phase) {
      case "welcome":
        return p.welcomeTitle;
      case "tapCard":
        return p.tapTitle;
      case "predictGuide":
        return p.guideTitle;
      case "predictInput":
        return p.inputTitle;
      case "resolving":
        return p.resolvingTitle;
      case "result":
        return grade?.outcome === "hit" ? p.resultHitTitle : p.resultMissTitle;
      case "rankings":
        return p.rankingsTitle;
      case "groups":
        return p.groupsTitle;
      case "profile":
        return p.profileTitle;
      case "done":
        return p.doneTitle;
      default:
        return "";
    }
  })();

  const phaseBody = (() => {
    const p = m.tutorial.practice;
    switch (phase) {
      case "welcome":
        return p.welcomeBody;
      case "tapCard":
        return p.tapBody;
      case "predictGuide":
        return p.guideBody;
      case "predictInput":
        return p.inputBody;
      case "resolving":
        return p.resolvingBody;
      case "result":
        return grade?.outcome === "hit"
          ? p.resultHitBody
              .replace("{pts}", String(grade.points))
              .replace("{bonus}", grade.scoreExact ? p.resultScoreBonus : "")
          : p.resultMissBody;
      case "rankings":
        return p.rankingsBody;
      case "groups":
        return p.groupsBody;
      case "profile":
        return p.profileBody;
      case "done":
        return p.doneBody;
      default:
        return "";
    }
  })();

  function goNextFromExplain() {
    if (phase === "welcome") setPhase("tapCard");
    else if (phase === "predictGuide") setPhase("predictInput");
    else if (phase === "result") setPhase("rankings");
    else if (phase === "rankings") setPhase("groups");
    else if (phase === "groups") setPhase("profile");
    else if (phase === "profile") setPhase("done");
    else if (phase === "done") onFinish();
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="tutorial-practice-real"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-practice-title"
          className="fixed inset-0 z-[70] flex flex-col bg-[#04070c]"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: TUTORIAL_EXIT_S } }}
          transition={{ duration: TUTORIAL_BG_FADE_S, ease: EASE }}
        >
          <div className="relative z-10 flex items-center justify-between px-4 pb-1 pt-[max(12px,env(safe-area-inset-top))]">
            <span
              className={cn(
                nameOxanium.className,
                "text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70"
              )}
            >
              Practice · Real UI
            </span>
            <button
              type="button"
              onClick={onFinish}
              className={cn(
                nameOxanium.className,
                "rounded px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/55 hover:bg-white/5"
              )}
            >
              {m.tutorial.skip}
            </button>
          </div>

          <div className="relative z-10 flex min-h-0 flex-1 flex-col px-3 pb-3">
            {/* 実アプリ風シェル */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/10 bg-[#050810]">
              <div className="min-h-0 flex-1 overflow-y-auto px-2 py-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={phase}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? undefined : { opacity: 0 }}
                    transition={{
                      duration: TUTORIAL_SLIDE_DURATION_S,
                      ease: EASE,
                    }}
                  >
                    {(phase === "welcome" ||
                      phase === "tapCard" ||
                      phase === "predictGuide" ||
                      phase === "predictInput") && (
                      <div className="space-y-2">
                        <div
                          className={cn(
                            phase === "tapCard" &&
                              "rounded-xl ring-2 ring-cyan-300/80 ring-offset-2 ring-offset-[#050810] shadow-[0_0_24px_rgba(0,245,255,0.35)]"
                          )}
                        >
                          <MatchCard
                            {...matchCard}
                            language={language}
                            dense
                            disableCardMotion
                            onOpenPredict={
                              phase === "tapCard"
                                ? () => setPhase("predictGuide")
                                : undefined
                            }
                            hideActions={phase !== "tapCard"}
                          />
                        </div>

                        {(phase === "predictGuide" ||
                          phase === "predictInput") && (
                          <div className="rounded-xl border border-cyan-400/20 bg-black/30 p-1">
                            {phase === "predictGuide" ? (
                              <p
                                className={cn(
                                  nameRajdhani.className,
                                  "px-2 py-3 text-center text-[13px] text-white/60"
                                )}
                              >
                                {m.tutorial.practice.guideBody}
                              </p>
                            ) : (
                              <PredictionFormV2
                                dense
                                embedded
                                tutorialMode
                                game={matchCard}
                                user={{ name: "You" }}
                                onTutorialSubmit={(payload) => {
                                  if (
                                    payload.winner !== "home" &&
                                    payload.winner !== "away"
                                  ) {
                                    return;
                                  }
                                  const next: TutorialPredictPick = {
                                    winner: payload.winner,
                                    scoreHome: payload.scoreHome,
                                    scoreAway: payload.scoreAway,
                                    goalScorer: payload.goalScorer ?? null,
                                  };
                                  setPick(next);
                                  setPhase("resolving");
                                }}
                              />
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {(phase === "resolving" || phase === "result") && (
                      <div>
                        {phase === "resolving" ? (
                          <div className="flex flex-col items-center justify-center py-16">
                            <p
                              className={cn(
                                nameOxanium.className,
                                "animate-pulse text-[12px] font-bold uppercase tracking-[0.22em]"
                              )}
                              style={{ color: TUTORIAL_CYAN }}
                            >
                              {m.tutorial.practice.resolvingSpin}
                            </p>
                          </div>
                        ) : resultPost ? (
                          <ResultCard
                            post={resultPost}
                            language={language}
                            platform="mobile"
                            scheduleDense
                            embedded
                            ratingBarsImmediate
                          />
                        ) : null}
                      </div>
                    )}

                    {phase === "rankings" && (
                      <div className="space-y-2">
                        <MyRankCard
                          rank={2}
                          metric="totalScore"
                          value={
                            grade?.outcome === "hit" ? 2322 : 2310
                          }
                          displayName="you"
                          totalPosts={1}
                          language={language}
                          layout="mobile"
                          disableMotion
                          displayTier="free"
                          totalEntries={128}
                          streak={grade?.outcome === "hit" ? 1 : 0}
                          countryCode="JP"
                          miniMetrics={[
                            {
                              key: "totalScore",
                              label: "totalPTS",
                              value:
                                grade?.outcome === "hit" ? "2,322" : "2,310",
                              pct: 78,
                              dayDelta: "+12",
                            },
                          ]}
                        />
                        {rankingRows.map((row, i) => (
                          <RankingCard
                            key={row.uid}
                            row={row}
                            rank={i + 1}
                            metric="totalScore"
                            language={language}
                            size="compact"
                            animateValue={false}
                            rankingLeague="nba"
                          />
                        ))}
                      </div>
                    )}

                    {phase === "groups" && (
                      <CommunityGroupDetailCard
                        language={language}
                        onBack={() => {}}
                        variant="page"
                      >
                        <div className="px-4 pb-4 pt-2">
                          <p
                            className={cn(
                              nameOxanium.className,
                              "mb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/70"
                            )}
                          >
                            GROUP
                          </p>
                          <h3
                            className={cn(
                              jp.className,
                              "mb-1 text-[18px] font-bold text-white"
                            )}
                          >
                            {m.tutorial.practice.groupsMockName}
                          </h3>
                          <p
                            className={cn(
                              nameRajdhani.className,
                              "mb-3 text-[13px] text-white/55"
                            )}
                          >
                            {m.tutorial.practice.groupsMockMeta}
                          </p>
                          {rankingRows.slice(0, 3).map((row, i) => (
                            <RankingCard
                              key={row.uid}
                              row={row}
                              rank={i + 1}
                              metric="totalScore"
                              language={language}
                              size="compact"
                              animateValue={false}
                              shellTone="subtle"
                              rankingLeague="nba"
                            />
                          ))}
                        </div>
                      </CommunityGroupDetailCard>
                    )}

                    {(phase === "profile" || phase === "done") && (
                      <div className="overflow-hidden rounded-xl">
                        <ProfileKinetikHero
                          layout="mobile"
                          language={language}
                          profile={profile}
                          profileStatsContext={{ rankingLeague: "nba" }}
                          winStreak={grade?.outcome === "hit" ? 1 : 0}
                          statsLoading={false}
                          isMe
                        />
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              <PracticeTabBar active={activeTab} labels={tabLabels} />
            </div>

            {/* ガイド文言 */}
            <div className="mt-3 shrink-0 px-1">
              <h2
                id="tutorial-practice-title"
                className={cn(
                  jp.className,
                  "mb-1 text-[18px] font-bold text-white"
                )}
              >
                {phaseTitle}
              </h2>
              {phase !== "predictGuide" ? (
                <p
                  className={cn(
                    nameRajdhani.className,
                    "text-[13px] leading-relaxed text-white/65"
                  )}
                >
                  {phaseBody}
                </p>
              ) : null}
            </div>

            {/* CTA */}
            <div className="mt-3 flex shrink-0 gap-2 px-1">
              {phase === "tapCard" ? (
                <p
                  className={cn(
                    nameRajdhani.className,
                    "w-full text-center text-[12px] text-cyan-200/75"
                  )}
                >
                  {m.tutorial.practice.tapHint}
                </p>
              ) : null}

              {phase === "predictInput" || phase === "resolving" ? null : (
                phase === "tapCard" ? null : (
                  <button
                    type="button"
                    onClick={goNextFromExplain}
                    className={cn(
                      nameOxanium.className,
                      "flex-1 py-3 text-[13px] font-black uppercase tracking-[0.12em]"
                    )}
                    style={{
                      background: TUTORIAL_CYAN,
                      color: "#050508",
                      clipPath: CYBER_CHAMFER_CLIP,
                      WebkitClipPath: CYBER_CHAMFER_CLIP,
                      boxShadow: `0 0 14px ${TUTORIAL_CYAN}55`,
                    }}
                  >
                    {phase === "predictGuide"
                      ? m.tutorial.practice.startPredict
                      : phase === "done"
                        ? m.tutorial.practice.finishCta
                        : m.tutorial.next}
                  </button>
                )
              )}
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
