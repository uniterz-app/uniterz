"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

import RankingCard from "@/app/component/rankings/RankingCard";
import MyRankCard from "@/app/component/rankings/MyRankCard";
import RankingsMetricRow from "@/app/component/rankings/RankingsMetricRow";
import { restContainer, restItem } from "@/app/component/rankings/anim";
import {
  METRICS,
  type MobileMetric,
  type RankingRowWithCountry,
} from "@/app/component/rankings/_data/mockRows";
import { auth } from "@/lib/firebase";
import { useMyRankingUser } from "@/lib/rankings/useMyRankingUser";
import MonthlyTopPodium from "@/app/component/leaderboards/MonthlyTopPodium";
import MonthlySelector from "@/app/component/leaderboards/MonthlySelector";
import useMonthlyLeaderboard, {
  type MonthlyLeaderboardMetric,
  type MonthlyLeaderboardRow,
} from "@/lib/leaderboards/useMonthlyLeaderboard";
import { nameBebas, jp } from "@/lib/fonts";

type Props = {
  league?: string;
  month: string;
  title?: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  disableNextMonth?: boolean;
};

function toMobileMetric(metric: MonthlyLeaderboardMetric): MobileMetric {
  if (metric === "totalPoints") return "totalScore";
  if (metric === "winRate") return "winRate";
  if (metric === "totalPrecision") return "marginPrecision";
  return "upsetScore";
}

function toMonthlyMetric(metric: MobileMetric): MonthlyLeaderboardMetric {
  if (metric === "totalScore") return "totalPoints";
  if (metric === "winRate") return "winRate";
  if (metric === "marginPrecision") return "totalPrecision";
  return "totalUpset";
}

function toDisplayRows(
  rows: MonthlyLeaderboardRow[],
  metric: MonthlyLeaderboardMetric
): RankingRowWithCountry[] {
  const mobileMetric = toMobileMetric(metric);

  return rows.map((row) => {
    const value =
      mobileMetric === "totalScore"
        ? row.totalPoints ?? 0
        : mobileMetric === "marginPrecision"
        ? row.totalPrecision ?? 0
        : mobileMetric === "upsetScore"
        ? row.totalUpset ?? 0
        : row.winRate ?? 0;

    return {
      uid: row.uid,
      displayName: row.displayName,
      handle: row.handle ?? null,
      photoURL: row.photoURL ?? null,
      posts: row.posts ?? 0,
      wins: row.wins ?? 0,

      totalPoints: row.totalPoints ?? 0,
      totalPrecision: row.totalPrecision ?? 0,
      totalUpset: row.totalUpset ?? 0,
      winRate: row.winRate ?? 0,

      avgTotalScore:
        row.posts && row.posts > 0 ? (row.totalPoints ?? 0) / row.posts : 0,
      avgMarginPrecision:
        row.posts && row.posts > 0 ? (row.totalPrecision ?? 0) / row.posts : 0,
      avgUpsetScore:
        row.posts && row.posts > 0 ? (row.totalUpset ?? 0) / row.posts : 0,

      streak: 0,
      activeWinStreak: 0,
      totalPosts: row.posts ?? 0,

      value,
      countryCode: undefined,
    } as RankingRowWithCountry;
  });
}

function findMyRow(
  rows: MonthlyLeaderboardRow[],
  myUid: string | null
): MonthlyLeaderboardRow | null {
  if (!myUid) return null;
  return rows.find((row) => row.uid === myUid) ?? null;
}

export default function MonthlyLeaderboardSection({
  league = "nba",
  month,
  title = "Leaderboard",
  onPrevMonth,
  onNextMonth,
  disableNextMonth = false,
}: Props) {
  const [metric, setMetric] = useState<MobileMetric>("totalScore");
  const [myUid, setMyUid] = useState<string | null>(null);

  const visibleMetrics: MobileMetric[] = [
    "totalScore",
    "winRate",
    "marginPrecision",
    "upsetScore",
  ];

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      setMyUid(user?.uid ?? null);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!visibleMetrics.includes(metric)) {
      setMetric("totalScore");
    }
  }, [metric]);

  const metricItems = useMemo(
    () => METRICS.filter((m) => visibleMetrics.includes(m.key)),
    [visibleMetrics]
  );

  const monthlyMetric = toMonthlyMetric(metric);

  const {
    loading,
    error,
    rows: rawRows,
  } = useMonthlyLeaderboard({
    league,
    month,
    metric: monthlyMetric,
  });

  const rows = useMemo(
    () => toDisplayRows(rawRows, monthlyMetric),
    [rawRows, monthlyMetric]
  );

  const top3 = useMemo(() => rows.slice(0, 3), [rows]);
  const restRows = useMemo(() => rows.slice(3), [rows]);

  const myRawRow = useMemo(() => findMyRow(rawRows, myUid), [rawRows, myUid]);
  const { user, loading: userLoading } = useMyRankingUser(myUid);

  const myRank = myRawRow?.rank ?? null;

  const myValue = useMemo(() => {
    if (!myRawRow) return 0;
    if (metric === "totalScore") return myRawRow.totalPoints ?? 0;
    if (metric === "marginPrecision") return myRawRow.totalPrecision ?? 0;
    if (metric === "upsetScore") return myRawRow.totalUpset ?? 0;
    return Math.round(myRawRow.winRate ?? 0);
  }, [metric, myRawRow]);

  const introRef = useRef(true);
  const intro = introRef.current;

  useEffect(() => {
    introRef.current = false;
  }, []);

  const [topDone, setTopDone] = useState(false);
  const pageKey = `${month}-${metric}`;
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
    <div className="relative min-h-dvh bg-app">
      <div className="relative z-10 min-h-dvh overflow-y-auto overscroll-y-contain">
        <div className="space-y-2 px-3 pt-2">
          <div className="text-center">
<h1
  className={[
    "text-[36px] leading-none tracking-[0.04em]",
    nameBebas.className,
  ].join(" ")}
  style={{
    color: "#FFD65A",
    textShadow:
      "0 0 8px rgba(255,214,90,0.22), 0 0 18px rgba(255,214,90,0.18), 0 0 34px rgba(255,214,90,0.10), 0 2px 12px rgba(0,0,0,0.28)",
  }}
>
  {title}
</h1>
            <p className={["mt-1 text-[12px] text-white/60", jp.className].join(" ")}>
              先月の結果をもとにした月間リーダーボード
            </p>
          </div>

          <MonthlySelector
            month={month}
            onPrev={onPrevMonth}
            onNext={onNextMonth}
            disableNext={disableNextMonth}
          />

          <MyRankCard
            rank={myRank}
            metric={metric}
            value={myValue}
            displayName={user.displayName || "You"}
            photoURL={user.photoURL || null}
            handle={user.handle || null}
            totalPosts={myRawRow?.posts}
            loading={loading || userLoading}
          />

          <RankingsMetricRow
            metrics={metricItems}
            metric={metric}
            setMetric={setMetric}
          />
        </div>

        {loading && (
          <div className="px-3 pt-2 text-[11px] text-white/40">loading...</div>
        )}

        {!loading && error && (
          <div className="px-3 pt-2 text-[11px] text-red-300/80">{error}</div>
        )}

        <AnimatePresence mode="wait">
          <motion.div key={pageKey} className="relative">
            <div className="relative z-10">
              <MonthlyTopPodium
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
                  {restRows.map((row, i) => (
                    <motion.div
                      key={`${metric}-${row.uid}`}
                      variants={restItem}
                      custom={i}
                    >
                      <RankingCard row={row} rank={i + 4} metric={metric} />
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