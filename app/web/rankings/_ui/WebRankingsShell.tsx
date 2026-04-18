"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useSearchParams } from "next/navigation";
import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import RankingCard from "@/app/component/rankings/RankingCard";
import TopPodium from "@/app/component/rankings/TopPodium";
import { restContainer, restItem } from "@/app/component/rankings/anim";
import { motion, AnimatePresence } from "framer-motion";
import RankingsMetricRow from "@/app/component/rankings/RankingsMetricRow";
import MyRankCard from "@/app/component/rankings/MyRankCard";
import RankingPhaseTabs from "@/app/component/rankings/RankingPhaseTabs";
import Header from "@/app/component/Header";
import { useMyRankingUser } from "@/lib/rankings/useMyRankingUser";
import { useWebRankings } from "../_lib/useWebRankings";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { isRankingPhase, type RankingPhase } from "@/lib/rankings/rankingPhase";
import {
  RANKINGS_TAB_METRIC_PARAM,
  RANKINGS_TAB_PHASE_PARAM,
  WEB_RANKINGS_SCROLL_KEY,
  isMobileMetricParam,
} from "@/lib/navigation/rankingsProfileFrom";
import {
  TIMEZONE_ET,
  TIMEZONE_JST,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import { nameBebas } from "@/lib/fonts";
import type { Language } from "@/lib/i18n/language";

function getMyMetricValue(metric: MobileMetric, row: any): number {
  if (!row) return 0;

  if (metric === "totalScore") return row.totalPoints ?? 0;
  if (metric === "marginPrecision") return row.totalPrecision ?? 0;
  if (metric === "upsetScore") return row.totalUpset ?? 0;

  if (metric === "winRate") {
    const raw = row.winRate ?? 0;
    return raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
  }

  return row.activeWinStreak ?? 0;
}

function RankingInfoNotice({ language }: { language: Language }) {
  const formatRankingsUpdateTimeEn = () => {
    // Ranking update is scheduled at 16:00 in JST.
    // Convert that wall-clock time to America/New_York (DST-aware).
    const now = new Date();
    const todayKeyJst = toDateKeyInTimeZone(now, TIMEZONE_JST);
    const todayMidnightJst = parseDateKeyInTimeZone(
      todayKeyJst,
      TIMEZONE_JST
    );
    if (!todayMidnightJst) return "16:00";

    const MS_16H = 16 * 60 * 60 * 1000;
    const MS_1D = 24 * 60 * 60 * 1000;
    const jstUpdateTodayMs = todayMidnightJst.getTime() + MS_16H;
    const jstUpdateMs =
      now.getTime() >= jstUpdateTodayMs ? jstUpdateTodayMs + MS_1D : jstUpdateTodayMs;

    return new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE_ET,
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(new Date(jstUpdateMs));
  };

  return (
    <div className="text-center">
      <p className="text-[12px] leading-relaxed text-white/60">
        {language === "en"
          ? `Rankings are updated daily at ${formatRankingsUpdateTimeEn()} / Scores are cumulative.`
          : "ランキングは毎日16:00に更新 / スコアは累積"}
      </p>
    </div>
  );
}

export default function WebRankingsShell() {
  const searchParams = useSearchParams();
  const [phase, setPhase] = useState<RankingPhase>("playoffs");
  const {
    listReady,
    personalPending,
    metric,
    setMetric,
    visibleMetrics,
    rows,
    top3,
    restRows,
    myRank,
    myRankDeltaPlaces,
    myRow,
    myUid,
  } = useWebRankings(phase);

  const { user } = useMyRankingUser(myUid);
  const { language } = useUserLanguage(myUid);

  const restoreScrollAfterListRef = useRef(false);

  /** プロフィールの「ランキングに戻る」で付いた rankPhase / rankMetric を反映 */
  useLayoutEffect(() => {
    const ph = searchParams.get(RANKINGS_TAB_PHASE_PARAM);
    if (isRankingPhase(ph)) setPhase(ph);
    const m = searchParams.get(RANKINGS_TAB_METRIC_PARAM);
    if (isMobileMetricParam(m)) setMetric(m);
    restoreScrollAfterListRef.current =
      isMobileMetricParam(searchParams.get(RANKINGS_TAB_METRIC_PARAM)) ||
      isRankingPhase(searchParams.get(RANKINGS_TAB_PHASE_PARAM));
  }, [searchParams, setMetric]);

  useLayoutEffect(() => {
    if (!listReady || !restoreScrollAfterListRef.current) return;
    restoreScrollAfterListRef.current = false;
    const el = document.querySelector(
      "[data-web-rankings-scroll]"
    ) as HTMLElement | null;
    if (!el) return;
    try {
      const raw = sessionStorage.getItem(WEB_RANKINGS_SCROLL_KEY);
      if (raw == null) return;
      const y = Number(raw);
      if (!Number.isFinite(y) || y < 0) return;
      requestAnimationFrame(() => {
        el.scrollTop = y;
      });
    } catch {
      /* sessionStorage 不可時は無視 */
    }
  }, [listReady, searchParams, phase, metric]);

  useEffect(() => {
    const el = document.querySelector(
      "[data-web-rankings-scroll]"
    ) as HTMLElement | null;
    if (!el) return;
    let tid: ReturnType<typeof setTimeout>;
    const onScroll = () => {
      clearTimeout(tid);
      tid = setTimeout(() => {
        try {
          sessionStorage.setItem(WEB_RANKINGS_SCROLL_KEY, String(el.scrollTop));
        } catch {
          /* ignore */
        }
      }, 150);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      clearTimeout(tid);
    };
  }, []);

  const myValue = useMemo(() => {
    return getMyMetricValue(metric as MobileMetric, myRow);
  }, [metric, myRow]);

  const introRef = useRef(true);
  const intro = introRef.current;

  useEffect(() => {
    introRef.current = false;
  }, []);

  const [topDone, setTopDone] = useState(false);

  const pageKey = `${phase}-${metric}`;
  const pageKeyRef = useRef(pageKey);
  pageKeyRef.current = pageKey;

  useEffect(() => {
    setTopDone(false);
  }, [pageKey]);

  const handleTopCountDone = useCallback(() => {
    if (pageKeyRef.current !== pageKey) return;
    setTopDone(true);
  }, [pageKey]);

  return (
    <div className="relative z-10 min-h-full w-full overflow-x-hidden">
        <div className="sticky top-0 z-40">
          <Header />
        </div>

        <div className="mx-auto max-w-[860px] space-y-3 px-3 pt-2">
          <RankingInfoNotice language={language} />
          <div className="space-y-0.5">
            <RankingPhaseTabs
              phase={phase}
              onChange={setPhase}
              isMobile={false}
            />

            <MyRankCard
              rank={myRank}
              metric={metric as MobileMetric}
              value={myValue}
              displayName={user.displayName || "You"}
              photoURL={user.photoURL || null}
              totalPosts={myRow?.totalPosts}
              loading={!listReady}
              statsScramble={listReady && personalPending}
              language={language}
              isPro={user.plan === "pro"}
              rankDeltaPlaces={myRankDeltaPlaces}
            />
          </div>

          <RankingsMetricRow
            metrics={visibleMetrics}
            metric={metric}
            setMetric={setMetric}
            language={language}
          />
        </div>

        {!listReady && (
          <div className="mx-auto max-w-[860px] px-3 pt-4 text-sm text-white/40">
            {language === "en" ? "loading..." : "読み込み中..."}
          </div>
        )}

        {listReady && rows.length === 0 ? (
          <div
            role="status"
            className="mx-auto flex min-h-[min(65dvh,520px)] max-w-[860px] items-center justify-center px-4 text-center"
          >
            <p
              className={[
                nameBebas.className,
                "text-[clamp(1.75rem,6vw,3rem)] leading-none tracking-[0.22em]",
              ].join(" ")}
              style={cyberNoDataLabelStyle}
            >
              NO DATA
            </p>
          </div>
        ) : listReady ? (
            <AnimatePresence mode="wait">
              <motion.div key={pageKey} className="relative">
                <div className="mx-auto max-w-[860px] px-2 pt-3">
                  <TopPodium
                    rows={top3}
                    metric={metric}
                    rankPhase={phase}
                    onTopCountDone={handleTopCountDone}
                    intro={intro}
                    language={language}
                  />
                  <div className="h-[16px]" />
                </div>

                <motion.div
                  key={`rest-${pageKey}`}
                  className="mx-auto max-w-[860px] px-2 pb-bottom-nav pt-2"
                  variants={restContainer}
                  initial="hidden"
                  animate={topDone ? "show" : "hidden"}
                  style={{ pointerEvents: topDone ? "auto" : "none" }}
                >
                  {restRows.length > 0 && (
                    <div className="space-y-2 pt-0.5">
                      {restRows.map((r, i) => (
                        <motion.div
                          key={`${metric}-${r.uid}`}
                          variants={restItem}
                          custom={i}
                        >
                          <RankingCard
                            row={r}
                            rank={i + 4}
                            metric={metric}
                            rankPhase={phase}
                            language={language}
                          />
                        </motion.div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </AnimatePresence>
          ) : null}
    </div>
  );
}