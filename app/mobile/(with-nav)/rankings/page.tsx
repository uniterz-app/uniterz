"use client";

import type { Period, LeagueTab } from "@/lib/rankings/types";
import { METRICS, MOCK_ROWS, type MobileMetric } from "./_data/mockRows";
import RankingCard from "./_ui/RankingCard";
import CyberPageBackground from "./_ui/CyberPageBackground";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { restContainer, restItem } from "./_ui/anim";
import TopPodium from "./_ui/TopPodium";
import { motion, AnimatePresence } from "framer-motion";
import { jp } from "./fonts";

export default function MobileRankingsPage() {
  const [league, setLeague] = useState<LeagueTab>("nba");
  const [period, setPeriod] = useState<Period>("week");

  const initialMetric = useMemo<MobileMetric>(() => {
    return period === "month" ? "totalScore" : "winRate";
  }, []);

  const [metric, setMetric] = useState<MobileMetric>(initialMetric);

  const availableMetrics = useMemo<MobileMetric[]>(() => {
    if (period === "month") {
      return ["totalScore", "marginPrecision", "upsetScore", "streak"];
    }
    return ["totalScore", "winRate", "marginPrecision"];
  }, [period]);

  useEffect(() => {
    if (!availableMetrics.includes(metric)) {
      setMetric(availableMetrics[0]);
    }
  }, [availableMetrics, metric]);

  const visibleMetrics = useMemo(
    () => METRICS.filter((m) => availableMetrics.includes(m.key)),
    [availableMetrics]
  );

  const rows = MOCK_ROWS[metric] ?? [];
  const top3 = rows.slice(0, 3);
  const restRows = rows.slice(3);

  const introRef = useRef(true);
  const intro = introRef.current;

  useEffect(() => {
    introRef.current = false;
  }, []);

  const [topDone, setTopDone] = useState(false);

  const pageKey = `${league}-${period}-${metric}`;
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
    <div className="relative h-dvh overflow-hidden bg-[#081116]">
      <div className="pointer-events-none absolute inset-0">
        <CyberPageBackground />
      </div>

      <div className="relative z-10 h-full overflow-y-auto overscroll-y-contain">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-transparent pt-2 backdrop-blur-md">
          <div className="relative flex h-11 items-center justify-center px-3">
            <img src="/logo/logo.png" alt="Uniterz Logo" className="h-auto w-10" />
          </div>
        </header>

        <div className="space-y-3 px-3 pt-1">
          <TabsRow
            league={league}
            setLeague={setLeague}
            period={period}
            setPeriod={setPeriod}
          />

          <MetricRow
            metrics={visibleMetrics}
            metric={metric}
            setMetric={setMetric}
          />
        </div>

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

/* Metric */
function MetricRow({
  metrics,
  metric,
  setMetric,
}: {
  metrics: { key: MobileMetric; label: string }[];
  metric: MobileMetric;
  setMetric: (v: MobileMetric) => void;
}) {
  const currentIndex = metrics.findIndex((m) => m.key === metric);

  return (
    <div className="flex items-center justify-center gap-2">
      <button
        onClick={() => {
          const next = metrics[(currentIndex + 1) % metrics.length];
          setMetric(next.key);
        }}
        className={[
          "rounded-2xl border border-white/12 bg-white/5 px-4 py-2",
          "text-xl font-black tracking-[0.04em] text-white",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-md",
          jp.className,
        ].join(" ")}
        style={{ textShadow: "0 0 18px rgba(0,255,255,0.10)" }}
      >
        {metrics.find((m) => m.key === metric)?.label}
      </button>
    </div>
  );
}

/* Tabs */
function TabsRow(props: {
  league: LeagueTab;
  setLeague: (v: LeagueTab) => void;
  period: Period;
  setPeriod: (v: Period) => void;
}) {
  const { league, setLeague, period, setPeriod } = props;

  const PERIODS: Period[] = ["day", "week", "month"];
  const PERIOD_LABEL: Record<Period, string> = {
    day: "Day",
    week: "Week",
    month: "Month",
  };

  const LeagueTabBtn = ({
    label,
    active,
    onClick,
  }: {
    label: string;
    active: boolean;
    onClick: () => void;
  }) => (
    <button
      onClick={onClick}
      className={[
        "rounded-xl border px-4 py-2 text-sm backdrop-blur-md transition-colors",
        active
          ? "border-cyan-200/25 bg-white/10 font-extrabold text-white shadow-[0_0_18px_rgba(0,255,255,0.10)]"
          : "border-white/10 bg-white/5 text-white/70",
        jp.className,
      ].join(" ")}
    >
      {label}
    </button>
  );

  return (
    <div className="flex items-center justify-between">
      <div className="flex gap-2">
        <LeagueTabBtn
          label="NBA"
          active={league === "nba"}
          onClick={() => setLeague("nba")}
        />
        <LeagueTabBtn
          label="B1"
          active={league === "b1"}
          onClick={() => setLeague("b1")}
        />
      </div>

      <button
        onClick={() => {
          const idx = PERIODS.indexOf(period);
          setPeriod(PERIODS[(idx + 1) % PERIODS.length]);
        }}
        className={[
          "rounded-xl px-5 py-2",
          "border border-white/15 bg-white/8",
          "text-base font-black text-white",
          "shadow-[inset_0_1px_0_rgba(255,255,255,0.10)]",
          "backdrop-blur-md transition active:scale-95",
          jp.className,
        ].join(" ")}
      >
        {PERIOD_LABEL[period]}
      </button>
    </div>
  );
}