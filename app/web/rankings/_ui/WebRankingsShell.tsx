"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import RankingCard from "@/app/component/rankings/RankingCard";
import TopPodium from "@/app/component/rankings/TopPodium";
import CyberPageBackground from "@/app/component/rankings/CyberPageBackground";
import { restContainer, restItem } from "@/app/component/rankings/anim";
import { motion, AnimatePresence } from "framer-motion";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import RankingsTabsRow from "@/app/component/rankings/RankingsTabsRow";
import RankingsMetricRow from "@/app/component/rankings/RankingsMetricRow";
import MyRankCard from "@/app/component/rankings/MyRankCard";
import Header from "@/app/component/Header";
import { useMyRankingUser } from "@/lib/rankings/useMyRankingUser";
import { useWebRankings } from "../_lib/useWebRankings";

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

function RankingInfoNotice() {
  return (
    <div className="text-center">
      <p className="text-[12px] leading-relaxed text-white/60">
        ランキングは毎日16:00に更新 / スコアは累積です
      </p>
    </div>
  );
}

export default function WebRankingsShell() {
  const [myUid, setMyUid] = useState<string | null>(
    auth.currentUser?.uid ?? null
  );

  const { loading, metric, setMetric, visibleMetrics, rows, top3, restRows } =
    useWebRankings();

  const { user, loading: userLoading } = useMyRankingUser(myUid);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setMyUid(u?.uid ?? null);
    });
    return () => unsub();
  }, []);

  const myRow = useMemo(() => {
    if (!myUid) return null;
    return rows.find((r: any) => r.uid === myUid) ?? null;
  }, [rows, myUid]);

  const myRank = useMemo(() => {
    if (!myUid) return null;
    const index = rows.findIndex((r: any) => r.uid === myUid);
    return index >= 0 ? index + 1 : null;
  }, [rows, myUid]);

  const myValue = useMemo(() => {
    return getMyMetricValue(metric as MobileMetric, myRow);
  }, [metric, myRow]);

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
    <div className="relative min-h-screen overflow-hidden bg-app">
      <div className="pointer-events-none fixed inset-0 z-0">
        <CyberPageBackground />
      </div>

      <div className="relative z-10 min-h-screen">
        <div className="sticky top-0 z-40">
          <Header />
        </div>

        <div className="mx-auto max-w-[860px] space-y-3 px-3 pt-2">
          <RankingsTabsRow />

          <RankingInfoNotice />

          <MyRankCard
            rank={myRank}
            metric={metric as MobileMetric}
            value={myValue}
            displayName={user.displayName || "You"}
            photoURL={user.photoURL || null}
            handle={user.handle || null}
            totalPosts={myRow?.totalPosts}
            loading={loading || userLoading}
          />

          <RankingsMetricRow
            metrics={visibleMetrics}
            metric={metric}
            setMetric={setMetric}
          />
        </div>

        {loading && (
          <div className="mx-auto max-w-[860px] px-3 pt-4 text-sm text-white/40">
            loading...
          </div>
        )}

        {rows.length === 0 ? (
          <div className="mx-auto max-w-[860px] px-3 pt-6 text-sm text-white/50">
            ranking data not found
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={pageKey} className="relative">
              <div className="mx-auto max-w-[860px] px-2 pt-3">
                <TopPodium
                  rows={top3}
                  metric={metric}
                  onTopCountDone={handleTopCountDone}
                  intro={intro}
                />
                <div className="h-[16px]" />
              </div>

              <motion.div
                key={`rest-${pageKey}`}
                className="mx-auto max-w-[860px] px-2 pb-44 pt-2"
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
        )}
      </div>
    </div>
  );
}