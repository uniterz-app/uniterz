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
import Header from "@/app/component/Header";
import { toMobileRows } from "@/lib/rankings/rankingTransform";
import {
  useRanking,
  type RankingRow,
} from "@/lib/rankings/useRanking";
import { useMyRankingUser } from "@/lib/rankings/useMyRankingUser";
import { useRankingCountryCodes } from "@/lib/rankings/useRankingCountryCodes";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import {
  TIMEZONE_ET,
  TIMEZONE_JST,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";

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
  const { language } = useUserLanguage(myUid);

  const rows: RankingRowWithCountry[] = useMemo(() => {
    if (rawRows.length > 0) {
      return toMobileRows(metric, rawRows);
    }
    return [];
  }, [metric, rawRows]);

  const uidsForCountry = useMemo(() => rawRows.map((r) => r.uid ?? "").filter(Boolean), [rawRows]);
  const { loading: countryLoading, countryCodeByUid } = useRankingCountryCodes(uidsForCountry);

  const rowsWithCountry: RankingRowWithCountry[] = useMemo(() => {
    if (countryLoading) return rows;
    return rows.map((r) => {
      // 取得できた場合は上書き。未設定(null)なら undefined にしてフラグ非表示にする。
      if (Object.prototype.hasOwnProperty.call(countryCodeByUid, r.uid)) {
        const code = countryCodeByUid[r.uid];
        if (typeof code === "string") {
          return { ...r, countryCode: code };
        }
        return r;
      }
      return r;
    });
  }, [rows, countryCodeByUid, countryLoading]);

  const top3 = rowsWithCountry.slice(0, 3);
  const restRows = rowsWithCountry.slice(3);

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

      <div className="relative z-10 h-full overflow-y-auto overscroll-y-contain pb-bottom-nav">
        <div className="sticky top-0 z-40">
          <Header />
        </div>

        <div className="space-y-3 px-3 pt-2">
          <div className="text-center">
            <p className="text-[12px] text-white/60">
              {language === "en"
                ? `Rankings are updated daily at ${formatRankingsUpdateTimeEn()} / Scores are cumulative.`
                : "ランキングは毎日16:00に更新 / スコアは累積です"}
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
                          language={language}
                        />
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