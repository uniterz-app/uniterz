"use client";

import { useEffect, useMemo, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";

import RankingCard from "@/app/component/rankings/RankingCard";
import MyRankCard from "@/app/component/rankings/MyRankCard";
import RankingsMetricRow from "@/app/component/rankings/RankingsMetricRow";
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
import { useScrambleDecode } from "@/lib/hooks/useScrambleDecode";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import type { Language } from "@/lib/i18n/language";

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
      countryCode: row.countryCode ?? undefined,
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

function monthlyLeaderboardErrorMessage(
  error: string,
  language: Language
): string {
  const lower = error.toLowerCase();
  if (
    lower.includes("monthly leaderboard snapshot not found") ||
    lower.includes("monthly leaderboard not found")
  ) {
    return language === "en"
      ? "No leaderboard data for this month."
      : "この月のデータはありません";
  }
  return error;
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
  const { language } = useUserLanguage(myUid);

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

  const pageKey = `${month}-${metric}`;
  const titleDisplay = useScrambleDecode(title, true);

  return (
    <div className="relative min-h-dvh bg-app">
      <div className="relative z-10 min-h-dvh overflow-y-auto overscroll-y-contain pb-bottom-nav">
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
              {titleDisplay}
            </h1>
            <p className={["mt-1 text-[12px] text-white/60", jp.className].join(" ")}>
              {language === "en"
                ? "Monthly Leaderboard based on last month's results"
                : "先月の結果をもとにした月間リーダーボード"}
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
            language={language}
          />

          <RankingsMetricRow
            metrics={metricItems}
            metric={metric}
            setMetric={setMetric}
            language={language}
          />
        </div>

        {loading && (
          <div className="px-3 pt-2 text-[11px] text-white/40">
            {language === "en" ? "loading..." : "読み込み中..."}
          </div>
        )}

        {!loading && error && (
          <div className="flex min-h-[min(45vh,380px)] flex-col items-center justify-center px-4 pb-10 text-center">
            <p className="text-[15px] text-white/80">
              {monthlyLeaderboardErrorMessage(error, language)}
            </p>
          </div>
        )}

        {!loading && !error && (
          <AnimatePresence mode="wait">
            <motion.div key={pageKey} className="relative">
              <div className="relative z-10">
                <MonthlyTopPodium rows={top3} metric={metric} language={language} />
                <div className="h-[2px]" />
              </div>

              <div key={`rest-${pageKey}`} className="px-2 pt-4">
                {restRows.length > 0 && (
                  <div className="space-y-2 pt-0.5">
                    {restRows.map((row, i) => (
                      <motion.div
                        key={`${metric}-${row.uid}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                          duration: 0.34,
                          delay: 0.08 + Math.min((3 + i) * 0.07, 0.45),
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <RankingCard
                          row={row}
                          rank={i + 4}
                          metric={metric}
                          language={language}
                        />
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}