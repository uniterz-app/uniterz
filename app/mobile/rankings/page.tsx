"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  METRICS,
  type MobileMetric,
  type RankingRowWithCountry,
} from "@/app/component/rankings/_data/mockRows";
import { motion, AnimatePresence } from "framer-motion";
import RankingCard from "@/app/component/rankings/RankingCard";
import CyberPageBackground from "@/app/component/rankings/CyberPageBackground";
import { restContainer, restItem } from "@/app/component/rankings/anim";
import TopPodium from "@/app/component/rankings/TopPodium";
import RankingsMetricRow from "@/app/component/rankings/RankingsMetricRow";
import MyRankCard from "@/app/component/rankings/MyRankCard";
import RankingPhaseTabs from "@/app/component/rankings/RankingPhaseTabs";
import Header from "@/app/component/Header";
import {
  API_METRIC_BY_MOBILE,
  type RankingApiRow,
  toMobileRows,
} from "@/lib/rankings/rankingTransform";
import type { RankingRow } from "@/lib/rankings/useRanking";
import { useMyRankingUser } from "@/lib/rankings/useMyRankingUser";
import { useCumulativeRankingsBulk } from "@/lib/rankings/useCumulativeRankingsBulk";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import {
  type RankingPhase,
  isRankingPhase,
} from "@/lib/rankings/rankingPhase";
import {
  consumeStashedRankingsTab,
  isMobileMetricParam,
  RANKINGS_TAB_METRIC_PARAM,
  RANKINGS_TAB_PHASE_PARAM,
} from "@/lib/navigation/rankingsProfileFrom";
import {
  TIMEZONE_ET,
  TIMEZONE_JST,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import { nameBebas } from "@/lib/fonts";

function formatRankingsUpdateTimeEn() {
  // Ranking update is scheduled at 16:00 in JST.
  // Convert that wall-clock time to America/New_York (DST-aware).
  const now = new Date();
  const todayKeyJst = toDateKeyInTimeZone(now, TIMEZONE_JST);
  const todayMidnightJst = parseDateKeyInTimeZone(todayKeyJst, TIMEZONE_JST);
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
}

export default function MobileRankingsPage() {
  const [phase, setPhase] = useState<RankingPhase>("play_in");
  const [metric, setMetric] = useState<MobileMetric>("totalScore");

  const visibleMetrics: MobileMetric[] = [
    "totalScore",
    "winRate",
    "marginPrecision",
    "upsetScore",
    "streak",
  ];

  useEffect(() => {
    if (!visibleMetrics.includes(metric)) {
      setMetric(visibleMetrics[0]);
    }
  }, [metric, visibleMetrics]);

  const metricItems = useMemo(
    () => METRICS.filter((m) => visibleMetrics.includes(m.key)),
    [visibleMetrics]
  );

  const { listReady, personalPending, myUid, byMetric } =
    useCumulativeRankingsBulk(phase);

  const { user } = useMyRankingUser(myUid);
  const { language } = useUserLanguage(myUid);

  const apiKey = API_METRIC_BY_MOBILE[metric];
  const bundle = byMetric?.[apiKey];
  const rawRows = useMemo(
    () =>
      Array.isArray(bundle?.rows) ? (bundle.rows as RankingApiRow[]) : [],
    [bundle?.rows]
  );

  const myRank = bundle?.myRank ?? null;
  const myRawRow = (bundle?.myRow ?? null) as RankingRow | null;

  const rows: RankingRowWithCountry[] = useMemo(() => {
    if (rawRows.length === 0) return [];
    return toMobileRows(metric, rawRows);
  }, [metric, rawRows]);

  const top3 = rows.slice(0, 3);
  const restRows = rows.slice(3);

  const myValue = useMemo(() => {
    if (!myRawRow) return 0;

    if (metric === "totalScore") return myRawRow.totalPoints ?? 0;
    if (metric === "marginPrecision") return myRawRow.totalPrecision ?? 0;
    if (metric === "upsetScore") return myRawRow.totalUpset ?? 0;
    if (metric === "winRate") {
      const raw = myRawRow.winRate ?? 0;
      return raw <= 1 ? Math.round(raw * 100) : Math.round(raw);
    }
    return myRawRow.activeWinStreak ?? 0;
  }, [metric, myRawRow]);

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

  const rankingsRestoreOnce = useRef(false);
  useEffect(() => {
    if (rankingsRestoreOnce.current) return;
    rankingsRestoreOnce.current = true;
    if (typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const m = sp.get(RANKINGS_TAB_METRIC_PARAM);
    const ph = sp.get(RANKINGS_TAB_PHASE_PARAM);
    if (isMobileMetricParam(m) || isRankingPhase(ph)) {
      if (isMobileMetricParam(m)) setMetric(m);
      if (isRankingPhase(ph)) setPhase(ph);
      return;
    }
    const stashed = consumeStashedRankingsTab();
    if (stashed) {
      setMetric(stashed.metric);
      setPhase(stashed.phase);
    }
  }, [setMetric, setPhase]);

  return (
    <>
      <CyberPageBackground />
      <div className="relative z-10 flex h-dvh min-h-0 w-full flex-col overflow-hidden">
        <div className="shrink-0">
          <div className="sticky top-0 z-40">
            <Header />
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain pb-bottom-nav">
        <div className="space-y-3 px-3 pt-2">
          <div className="text-center">
            <p className="text-[12px] text-white/60">
              {language === "en"
                ? `Rankings are updated daily at ${formatRankingsUpdateTimeEn()} / Scores are cumulative.`
                : "ランキングは毎日16:00に更新 / スコアは累積"}
            </p>
          </div>
          <div className="space-y-0.5">
            <RankingPhaseTabs
              phase={phase}
              onChange={setPhase}
              isMobile
            />

            <MyRankCard
              rank={myRank}
              metric={metric}
              value={myValue}
              displayName={user.displayName || "You"}
              photoURL={user.photoURL || null}
              totalPosts={
                typeof myRawRow?.totalPosts === "number"
                  ? myRawRow.totalPosts
                  : undefined
              }
              loading={!listReady}
              statsScramble={listReady && personalPending}
              language={language}
              isPro={user.plan === "pro"}
              mobileWide
            />
          </div>

          <RankingsMetricRow
            metrics={metricItems}
            metric={metric}
            setMetric={setMetric}
            language={language}
            compactMobile
          />
        </div>

        {!listReady && (
          <div className="px-3 pt-2 text-[11px] text-white/40">
            loading...
          </div>
        )}

        {listReady && rows.length === 0 ? (
          <div
            role="status"
            className="flex min-h-[min(62dvh,520px)] items-center justify-center px-4 text-center"
          >
            <p
              className={[
                nameBebas.className,
                "text-[clamp(1.75rem,10vw,2.7rem)] leading-none tracking-[0.22em]",
              ].join(" ")}
              style={cyberNoDataLabelStyle}
            >
              NO DATA
            </p>
          </div>
        ) : (
        <AnimatePresence mode="wait">
            <motion.div key={pageKey} className="relative">
              <div className="relative z-10">
                <TopPodium
                  rows={top3}
                  metric={metric}
                  rankPhase={phase}
                  onTopCountDone={handleTopCountDone}
                  intro={intro}
                  language={language}
                />
                <div className="h-[2px]" />
              </div>

              <motion.div
                key={`rest-${pageKey}`}
                className="px-2 pt-4"
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
        )}
        </div>
      </div>
    </>
  );
}