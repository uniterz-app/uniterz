"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import RankingCard from "@/app/component/rankings/RankingCard";
import TopPodium from "@/app/component/rankings/TopPodium";
import CyberPageBackground from "@/app/component/rankings/CyberPageBackground";
import { restContainer, restItem } from "@/app/component/rankings/anim";
import { motion, AnimatePresence } from "framer-motion";
import RankingsMetricRow from "@/app/component/rankings/RankingsMetricRow";
import MyRankCard from "@/app/component/rankings/MyRankCard";
import Header from "@/app/component/Header";
import { useMyRankingUser } from "@/lib/rankings/useMyRankingUser";
import { useWebRankings } from "../_lib/useWebRankings";
import { useRanking, type RankingRow } from "@/lib/rankings/useRanking";
import { useRankingCountryCodes } from "@/lib/rankings/useRankingCountryCodes";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import {
  TIMEZONE_ET,
  TIMEZONE_JST,
  parseDateKeyInTimeZone,
  toDateKeyInTimeZone,
} from "@/lib/time/zonedTime";

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

function RankingInfoNotice({ language }: { language: "ja" | "en" }) {
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
          : "ランキングは毎日16:00に更新 / スコアは累積です"}
      </p>
    </div>
  );
}

export default function WebRankingsShell() {
  const { loading, metric, setMetric, visibleMetrics, rows, top3, restRows } =
    useWebRankings();

  const uidsForCountry = useMemo(
    () => [...top3, ...restRows].map((r) => r.uid ?? "").filter(Boolean),
    [top3, restRows]
  );
  const { loading: countryLoading, countryCodeByUid } = useRankingCountryCodes(
    uidsForCountry
  );

  const top3WithCountry = useMemo(() => {
    if (countryLoading) return top3;
    return top3.map((r) => {
      if (!Object.prototype.hasOwnProperty.call(countryCodeByUid, r.uid)) return r;
      const code = countryCodeByUid[r.uid];
      if (typeof code === "string") {
        return { ...r, countryCode: code };
      }
      return r;
    });
  }, [top3, countryCodeByUid, countryLoading]);

  const restRowsWithCountry = useMemo(() => {
    if (countryLoading) return restRows;
    return restRows.map((r) => {
      if (!Object.prototype.hasOwnProperty.call(countryCodeByUid, r.uid)) return r;
      const code = countryCodeByUid[r.uid];
      if (typeof code === "string") {
        return { ...r, countryCode: code };
      }
      return r;
    });
  }, [restRows, countryCodeByUid, countryLoading]);

  const rankingMetric = toHookMetric(metric);
  const { loading: myRankingLoading, rows: rawRows, myRank, myUid } =
    useRanking(rankingMetric);
  const { user, loading: userLoading } = useMyRankingUser(myUid);
  const { language } = useUserLanguage(myUid);
  const myRow = useMemo(() => findMyRow(rawRows, myUid), [rawRows, myUid]);

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
          <RankingInfoNotice language={language} />

          <MyRankCard
            rank={myRank}
            metric={metric as MobileMetric}
            value={myValue}
            displayName={user.displayName || "You"}
            photoURL={user.photoURL || null}
            handle={user.handle || null}
            totalPosts={myRow?.totalPosts}
            loading={myRankingLoading || userLoading}
            language={language}
          />

          <RankingsMetricRow
            metrics={visibleMetrics}
            metric={metric}
            setMetric={setMetric}
            language={language}
          />
        </div>

        {loading && (
          <div className="mx-auto max-w-[860px] px-3 pt-4 text-sm text-white/40">
            {language === "en" ? "loading..." : "読み込み中..."}
          </div>
        )}

        {rows.length === 0 ? (
            <div className="mx-auto max-w-[860px] px-3 pt-6 text-sm text-white/50">
              {language === "en"
                ? "Ranking data not found"
                : "ランキングデータが見つかりません"}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div key={pageKey} className="relative">
                <div className="mx-auto max-w-[860px] px-2 pt-3">
                  <TopPodium
                    rows={top3WithCountry}
                    metric={metric}
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
                      {restRowsWithCountry.map((r, i) => (
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
          )}
      </div>
    </div>
  );
}