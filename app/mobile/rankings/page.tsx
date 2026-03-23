"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  METRICS,
  MOCK_ROWS,
  type MobileMetric,
  type RankingRowWithCountry,
} from "@/app/component/rankings/_data/mockRows";
import { motion, AnimatePresence } from "framer-motion";
import RankingCard from "@/app/component/rankings/RankingCard";
import CyberPageBackground from "@/app/component/rankings/CyberPageBackground";
import { restContainer, restItem } from "@/app/component/rankings/anim";
import TopPodium from "@/app/component/rankings/TopPodium";
import RankingsMetricRow from "@/app/component/rankings/RankingsMetricRow";
import RankingsTabsRow from "@/app/component/rankings/RankingsTabsRow";
import MyRankCard from "@/app/component/rankings/MyRankCard";
import Header from "@/app/component/Header";
import { toMobileRows } from "@/lib/rankings/rankingTransform";
import {
  useRanking,
  type RankingRow,
} from "@/lib/rankings/useRanking";
import { useMyRankingUser } from "@/lib/rankings/useMyRankingUser";

function toHookMetric(metric: MobileMetric) {
  if (metric === "winRate") return "winRate";
  if (metric === "totalScore") return "totalPoints";
  if (metric === "marginPrecision") return "totalPrecision";
  if (metric === "upsetScore") return "totalUpset";
  return "activeWinStreak";
}

function findMyRow(
  rows: RankingRow[],
  myUid: string | null
): RankingRow | null {
  if (!myUid) return null;
  return rows.find((r) => r.uid === myUid) ?? null;
}

export default function MobileRankingsPage() {
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

  const rankingMetric = toHookMetric(metric);
  const {
    loading,
    rows: rawRows,
    myRank,
    myUid,
  } = useRanking(rankingMetric);

  const { user, loading: userLoading } = useMyRankingUser(myUid);

  const rows: RankingRowWithCountry[] = useMemo(() => {
    if (rawRows.length > 0) {
      return toMobileRows(metric, rawRows);
    }
    return MOCK_ROWS[metric];
  }, [metric, rawRows]);

  const top3 = rows.slice(0, 3);
  const restRows = rows.slice(3);

  const myRawRow = useMemo(() => findMyRow(rawRows, myUid), [rawRows, myUid]);

  const myValue = useMemo(() => {
    if (!myRawRow) return 0;

    if (metric === "totalScore") return myRawRow.totalPoints ?? 0;
    if (metric === "marginPrecision") return myRawRow.totalPrecision ?? 0;
    if (metric === "upsetScore") return myRawRow.totalUpset ?? 0;
    if (metric === "winRate") return Math.round((myRawRow.winRate ?? 0) * 100);
    return myRawRow.activeWinStreak ?? 0;
  }, [metric, myRawRow]);

  const introRef = useRef(true);
  const intro = introRef.current;

  useEffect(() => {
    introRef.current = false;
  }, []);

  const [topDone, setTopDone] = useState(false);

  const pageKey = metric;
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
    <div className="relative h-dvh overflow-hidden bg-app">
      <div className="pointer-events-none absolute inset-0">
        <CyberPageBackground />
      </div>

      <div className="relative z-10 h-full overflow-y-auto overscroll-y-contain">
        <div className="sticky top-0 z-40">
          <Header />
        </div>

        <div className="space-y-3 px-3 pt-2">
          <RankingsTabsRow />

          <div className="text-center">
            <p className="text-[12px] text-white/60">
              ランキングは毎日16:00に更新 / スコアは累積です
            </p>
          </div>

          <MyRankCard
            rank={myRank}
            metric={metric}
            value={myValue}
            displayName={user.displayName || "You"}
            photoURL={user.photoURL || null}
            handle={user.handle || null}
            totalPosts={myRawRow?.totalPosts}
            loading={loading || userLoading}
          />

          <RankingsMetricRow
            metrics={metricItems}
            metric={metric}
            setMetric={setMetric}
          />
        </div>

        {loading && (
          <div className="px-3 pt-2 text-[11px] text-white/40">
            loading...
          </div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={pageKey} className="relative">
            <div className="relative z-10">
              <TopPodium
                rows={top3}
                metric={metric}
                onTopCountDone={handleTopCountDone}
                intro={intro}
              />
              <div className="h-[2px]" />
            </div>

            <motion.div
              key={`rest-${pageKey}`}
              className="px-2 pb-28 pt-4"
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
                      <RankingCard row={r} rank={i + 4} metric={metric} />
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}