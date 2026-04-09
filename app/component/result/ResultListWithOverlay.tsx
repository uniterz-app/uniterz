"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Language } from "@/lib/i18n/language";
import ResultCard from "@/app/component/result/ResultCard";
import ResultDetail from "@/app/component/result/ResultDetail";
import MobileResultDetail from "@/app/component/result/mobile/MobileResultDetail";
import {
  ResultDayPipeGroup,
  type ResultDayPointsHeader,
} from "@/app/component/result/ResultDayPipeGroup";
import type { PredictionPostV2 } from "@/types/prediction-post-v2";
import type { ResultPlatform } from "@/lib/result/result-platform";
import {
  isFinalResultPost,
  RESULT_POSTS_MAX_CACHED,
  sumDayPointsV3,
  type PostWithMillis,
  type ResultDayGroup,
} from "@/lib/result/result-page-data";
import {
  parseGamePointsDistributionV1,
  type GamePointsDistributionV1,
} from "@/lib/results/gamePointsDistribution";

type WinLossFilter = "all" | "win" | "loss";

type MarketData = {
  homeRate: number;
  awayRate: number;
  drawRate?: number;
  total?: number;
};

type Props = {
  grouped: ResultDayGroup[];
  loading: boolean;
  hasMore: boolean;
  sentinelRef: React.RefObject<HTMLDivElement | null>;
  setInfiniteScrollEnabled?: (enabled: boolean) => void;
  language: Language;
  platform: ResultPlatform;
  postsCacheCapped?: boolean;
};

function predictionWinState(post: PostWithMillis): boolean | null {
  const iw = post.stats?.isWin;
  if (iw === true) return true;
  if (iw === false) return false;
  const wc = post.stats?.pointsV3Detail?.winnerCorrect;
  if (wc === true) return true;
  if (wc === false) return false;
  return null;
}

/** 日付行の得点表示（フィルタ後の確定分を合計。数値は強調表示用に分割） */
function dayPointsHeaderForList(
  finalShown: PostWithMillis[],
  pendingShown: PostWithMillis[],
  language: Language
): ResultDayPointsHeader {
  if (finalShown.length > 0) {
    const total = sumDayPointsV3(finalShown);
    const fmt =
      Number.isInteger(total) || Math.abs(total - Math.round(total)) < 1e-6
        ? String(Math.round(total))
        : total.toFixed(1);
    if (language === "en") {
      return {
        variant: "total",
        value: fmt,
        prefix: "",
        unit: "pts",
        aria: `Total points for matches on this day: ${fmt} points`,
      };
    }
    return {
      variant: "total",
      value: fmt,
      prefix: "合計",
      unit: "pt",
      aria: `この日の試合の合計得点 ${fmt} ポイント`,
    };
  }
  if (pendingShown.length > 0) {
    return language === "en"
      ? {
          variant: "pending",
          line: "Pending",
          aria: "Points not yet available until matches are finalized",
        }
      : {
          variant: "pending",
          line: "得点未確定",
          aria: "試合確定後に得点が表示されます",
        };
  }
  return null;
}

function postMatchesWinLossFilter(
  post: PostWithMillis,
  filter: WinLossFilter
): boolean {
  if (filter === "all") return true;
  if (!isFinalResultPost(post)) return false;
  const w = predictionWinState(post);
  if (filter === "win") return w === true;
  if (filter === "loss") return w === false;
  return true;
}

export default function ResultListWithOverlay({
  grouped,
  loading,
  hasMore,
  sentinelRef,
  setInfiniteScrollEnabled,
  language,
  platform,
  postsCacheCapped = false,
}: Props) {
  const [openPostId, setOpenPostId] = useState<string | null>(null);
  const [market, setMarket] = useState<MarketData | null>(null);
  const [pointsDistribution, setPointsDistribution] =
    useState<GamePointsDistributionV1 | null>(null);
  const [winLossFilter, setWinLossFilter] = useState<WinLossFilter>("all");
  const prefersReducedMotion = useReducedMotion();

  const isMobile = platform === "mobile";

  useEffect(() => {
    setInfiniteScrollEnabled?.(!postsCacheCapped);
  }, [postsCacheCapped, setInfiniteScrollEnabled]);

  const filteredGrouped = useMemo(() => {
    return grouped
      .map((day) => ({
        ...day,
        pending: day.pending.filter((p) => postMatchesWinLossFilter(p, winLossFilter)),
        final: day.final.filter((p) => postMatchesWinLossFilter(p, winLossFilter)),
      }))
      .filter((day) => day.pending.length + day.final.length > 0);
  }, [grouped, winLossFilter]);

  const selectedPost = useMemo(() => {
    if (!openPostId) return null;
    for (const day of filteredGrouped) {
      for (const p of day.pending) {
        if (p.id === openPostId) return p;
      }
      for (const p of day.final) {
        if (p.id === openPostId) return p;
      }
    }
    return null;
  }, [filteredGrouped, openPostId]);

  const close = useCallback(() => {
    setOpenPostId(null);
    setMarket(null);
    setPointsDistribution(null);
  }, []);

  const open = useCallback((post: PredictionPostV2 | PostWithMillis) => {
    setOpenPostId(post.id);
    setMarket(null);
    setPointsDistribution(null);
  }, []);

  useEffect(() => {
    if (!openPostId) return;
    const post = selectedPost;
    if (!post?.gameId) return;

    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "games", post.gameId));
        if (!snap.exists() || cancelled) return;
        const d = snap.data() as Record<string, unknown>;
        const marketRaw = d.market as Record<string, unknown> | undefined;
        const pdRaw = d.pointsDistributionV1 as Record<string, unknown> | undefined;
        if (!cancelled) {
          if (marketRaw) {
            setMarket({
              homeRate: Number(marketRaw.homeRate ?? 0),
              awayRate: Number(marketRaw.awayRate ?? 0),
              drawRate:
                marketRaw.drawRate == null ? undefined : Number(marketRaw.drawRate),
              total: marketRaw.total == null ? undefined : Number(marketRaw.total),
            });
          }
          setPointsDistribution(parseGamePointsDistributionV1(pdRaw));
        }
      } catch {
        if (!cancelled) {
          setMarket(null);
          setPointsDistribution(null);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [openPostId, selectedPost]);

  const filterLabels =
    language === "en"
      ? ({ all: "All", win: "Wins", loss: "Losses" } as const)
      : ({ all: "すべて", win: "勝ち", loss: "負け" } as const);

  const totalLoaded =
    grouped.reduce((a, d) => a + d.pending.length + d.final.length, 0);

  const easeOut = [0.22, 1, 0.36, 1] as const;
  const off = prefersReducedMotion
    ? { opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }
    : undefined;

  return (
    <>
      <motion.div
        className={[
          "relative z-20",
          isMobile ? "space-y-3" : "space-y-4",
        ].join(" ")}
        initial={off ?? { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: easeOut }}
      >
        <motion.div
          className={[
            "flex flex-wrap items-center justify-center gap-2",
            isMobile ? "pb-1" : "pb-2",
          ].join(" ")}
          role="group"
          aria-label={language === "en" ? "Filter results by outcome" : "結果を勝敗で絞り込み"}
          initial={off ? false : "hidden"}
          animate="visible"
          variants={
            prefersReducedMotion
              ? undefined
              : {
                  hidden: {},
                  visible: {
                    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
                  },
                }
          }
        >
          {(["all", "win", "loss"] as const).map((key) => {
            const active = winLossFilter === key;
            return (
              <motion.button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setWinLossFilter(key)}
                variants={
                  prefersReducedMotion
                    ? undefined
                    : {
                        hidden: { opacity: 0, y: 12, filter: "blur(6px)" },
                        visible: {
                          opacity: 1,
                          y: 0,
                          filter: "blur(0px)",
                          transition: { duration: 0.4, ease: easeOut },
                        },
                      }
                }
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                whileHover={prefersReducedMotion ? undefined : { scale: 1.03 }}
                className={[
                  "rounded-xl border px-3.5 py-2 text-xs font-semibold tracking-wide transition-colors",
                  isMobile ? "text-[11px]" : "text-sm px-4",
                  active
                    ? "border-cyan-200/35 bg-cyan-500/20 text-cyan-50 shadow-[0_0_14px_rgba(34,211,238,0.12)]"
                    : "border-white/12 bg-white/[0.04] text-white/70 hover:border-white/18 hover:text-white/90",
                ].join(" ")}
              >
                {filterLabels[key]}
              </motion.button>
            );
          })}
        </motion.div>

        <AnimatePresence mode="wait">
          {totalLoaded > 0 && filteredGrouped.length === 0 && winLossFilter !== "all" && (
            <motion.div
              key="empty-filter"
              role="status"
              initial={off ?? { opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={off ?? { opacity: 0, y: -8 }}
              transition={{ duration: 0.35, ease: easeOut }}
              className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-8 text-center text-sm text-white/55"
            >
              {language === "en"
                ? "No results for this filter."
                : "この条件に合うリザルトがありません。"}
            </motion.div>
          )}
        </AnimatePresence>

        {filteredGrouped.map((day, dayIndex) => {
          const pendingShown = day.pending;
          const finalShown = day.final;
          const dayPts = dayPointsHeaderForList(
            finalShown,
            pendingShown,
            language
          );

          return (
            <motion.div
              key={day.dateLabel}
              initial={
                off ?? {
                  opacity: 0,
                  y: 36,
                }
              }
              whileInView={
                prefersReducedMotion
                  ? undefined
                  : {
                      opacity: 1,
                      y: 0,
                      transition: {
                        duration: 0.55,
                        ease: easeOut,
                        delay: Math.min(dayIndex * 0.04, 0.2),
                      },
                    }
              }
              viewport={{ once: true, amount: 0.12, margin: "0px 0px -72px 0px" }}
              transition={prefersReducedMotion ? undefined : { duration: 0.5, ease: easeOut }}
            >
              <ResultDayPipeGroup
                dateLabel={day.dateLabel}
                isMobile={isMobile}
                reducedMotion={Boolean(prefersReducedMotion)}
                dayPoints={dayPts}
              >
                <div className={isMobile ? "space-y-3" : "space-y-4"}>
                  {pendingShown.length > 0 && (
                    <div
                      className={
                        isMobile
                          ? "space-y-3"
                          : "grid grid-cols-1 gap-4 sm:grid-cols-2"
                      }
                    >
                      {pendingShown.map((post, i) => (
                        <motion.div
                          key={post.id}
                          className="w-full"
                          initial={
                            off ?? {
                              opacity: 0,
                              y: 22,
                              scale: 0.97,
                            }
                          }
                          whileInView={
                            prefersReducedMotion
                              ? undefined
                              : {
                                  opacity: 1,
                                  y: 0,
                                  scale: 1,
                                  transition: {
                                    duration: 0.42,
                                    ease: easeOut,
                                    delay: i * 0.055,
                                  },
                                }
                          }
                          viewport={{ once: true, amount: 0.15, margin: "0px 0px -48px 0px" }}
                        >
                          <ResultCard
                            post={post}
                            onOpen={open}
                            language={language}
                            platform={platform}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                  {finalShown.length > 0 && (
                    <div
                      className={
                        isMobile
                          ? "space-y-3"
                          : "grid grid-cols-1 gap-4 sm:grid-cols-2"
                      }
                    >
                      {finalShown.map((post, i) => (
                        <motion.div
                          key={post.id}
                          className="w-full"
                          initial={
                            off ?? {
                              opacity: 0,
                              y: 22,
                              scale: 0.97,
                            }
                          }
                          whileInView={
                            prefersReducedMotion
                              ? undefined
                              : {
                                  opacity: 1,
                                  y: 0,
                                  scale: 1,
                                  transition: {
                                    duration: 0.42,
                                    ease: easeOut,
                                    delay:
                                      (pendingShown.length + i) * 0.055,
                                  },
                                }
                          }
                          viewport={{ once: true, amount: 0.15, margin: "0px 0px -48px 0px" }}
                        >
                          <ResultCard
                            post={post}
                            onOpen={open}
                            language={language}
                            platform={platform}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </ResultDayPipeGroup>
            </motion.div>
          );
        })}

        {!postsCacheCapped && hasMore && (
          <div ref={sentinelRef} className="h-10" />
        )}

        {loading && (
          <motion.div
            className="py-6 text-center text-white/60 text-sm"
            initial={prefersReducedMotion ? false : { opacity: 0.4 }}
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: [0.4, 1, 0.4] }
            }
            transition={
              prefersReducedMotion
                ? undefined
                : { duration: 1.2, repeat: Infinity, ease: "easeInOut" }
            }
          >
            {language === "en" ? "Loading…" : "読み込み中…"}
          </motion.div>
        )}
        {postsCacheCapped && (
          <motion.div
            initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: easeOut }}
            className="py-6 text-center text-white/60 text-xs sm:text-sm"
          >
            {language === "en"
              ? `Showing latest ${RESULT_POSTS_MAX_CACHED} results to keep the page responsive.`
              : `動作を軽く保つため、最新 ${RESULT_POSTS_MAX_CACHED} 件まで表示しています。`}
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {openPostId && selectedPost && (
          <motion.div
            key="result-overlay"
            className={[
              "fixed inset-0 overflow-hidden",
              isMobile ? "z-100000" : "z-99999",
            ].join(" ")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22, ease: easeOut }}
          >
            <div
              className="absolute inset-0 z-0 bg-black/35 backdrop-blur-md pointer-events-auto"
              onClick={close}
            />
            <div
              className="relative z-10 h-dvh overflow-y-auto overflow-x-hidden pointer-events-auto pb-bottom-nav"
              style={{
                WebkitOverflowScrolling: "touch",
                overscrollBehaviorY: "contain",
                overscrollBehaviorX: "none",
                touchAction: "pan-y",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                className={[
                  "mx-auto w-full overflow-x-hidden",
                  isMobile
                    ? "max-w-2xl px-3 pb-32 pt-[max(0.5rem,env(safe-area-inset-top))] sm:px-4 sm:pb-36 md:px-6"
                    : "max-w-5xl px-4 pb-24 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-6 md:px-8 lg:px-10",
                ].join(" ")}
                initial={
                  prefersReducedMotion
                    ? false
                    : { opacity: 0, y: 28, scale: 0.985 }
                }
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={
                  prefersReducedMotion
                    ? undefined
                    : { opacity: 0, y: 16, scale: 0.99 }
                }
                transition={{
                  duration: 0.38,
                  ease: easeOut,
                }}
              >
                <div
                  className={[
                    "mb-2 flex shrink-0 items-center justify-end",
                    isMobile ? "min-h-10" : "min-h-11",
                  ].join(" ")}
                >
                  <motion.button
                    type="button"
                    aria-label={language === "en" ? "Close" : "閉じる"}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/90 backdrop-blur-md transition hover:bg-black/55"
                    onClick={(e) => {
                      e.stopPropagation();
                      close();
                    }}
                    initial={prefersReducedMotion ? false : { opacity: 0, rotate: -90 }}
                    animate={{ opacity: 1, rotate: 0 }}
                    transition={{ delay: 0.06, duration: 0.35, ease: easeOut }}
                    whileTap={prefersReducedMotion ? undefined : { scale: 0.92 }}
                  >
                    <X size={18} strokeWidth={2.4} />
                  </motion.button>
                </div>

                {isMobile ? (
                  <MobileResultDetail
                    post={selectedPost}
                    market={market ?? undefined}
                    pointsDistribution={pointsDistribution}
                    language={language}
                    inOverlay
                  />
                ) : (
                  <ResultDetail
                    post={selectedPost}
                    market={market ?? undefined}
                    pointsDistribution={pointsDistribution}
                    language={language}
                    inOverlay
                  />
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
