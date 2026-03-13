"use client";

import { useEffect, useRef, useState } from "react";
import type { LeagueTab, Period } from "@/lib/rankings/types";
import type { MobileMetric } from "@/app/mobile/(with-nav)/rankings/_data/mockRows";
import RankingCard from "@/app/mobile/(with-nav)/rankings/_ui/RankingCard";
import TopPodium from "@/app/mobile/(with-nav)/rankings/_ui/TopPodium";
import CyberPageBackground from "@/app/mobile/(with-nav)/rankings/_ui/CyberPageBackground";
import { restContainer, restItem } from "@/app/mobile/(with-nav)/rankings/_ui/anim";
import { motion, AnimatePresence } from "framer-motion";
import WebTabsRow from "./WebTabsRow";
import WebMetricRow from "./WebMetricRow";
import { useWebRankings } from "../_lib/useWebRankings";

export default function WebRankingsShell() {
  const [league, setLeague] = useState<LeagueTab>("nba");
  const [period, setPeriod] = useState<Period>("month");

  const { loading, metric, setMetric, visibleMetrics, rows, top3, restRows } =
    useWebRankings(league, period, true);

  const introRef = useRef(true);
  const intro = introRef.current;

  useEffect(() => {
    introRef.current = false;
  }, []);

  const pageKey = `${league}-${period}-${metric}`;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#081116]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <CyberPageBackground />
      </div>

      <div className="relative z-10 min-h-screen overflow-y-auto">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-transparent pt-2 backdrop-blur-md">
          <div className="relative mx-auto flex h-11 max-w-[860px] items-center justify-center px-3">
            <img src="/logo/logo.png" alt="Uniterz Logo" className="h-auto w-10" />
          </div>
        </header>

        <div className="mx-auto max-w-[860px] space-y-3 px-3 pt-2">
          <WebTabsRow
            league={league}
            setLeague={setLeague}
            period={period}
            setPeriod={setPeriod}
          />

          <WebMetricRow
            metrics={visibleMetrics}
            metric={metric}
            setMetric={setMetric}
          />
        </div>

        {loading ? (
          <div className="mx-auto max-w-[860px] px-3 pt-6 text-sm text-white/50">
            loading...
          </div>
        ) : rows.length === 0 ? (
          <div className="mx-auto max-w-[860px] px-3 pt-6 text-sm text-white/50">
            ranking data not found
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={pageKey} className="relative">
              <div className="mx-auto max-w-[860px] px-2 pt-3">
                <div className="relative z-10 origin-top scale-[1.22]">
                  <TopPodium
                    rows={top3}
                    metric={metric as MobileMetric}
                    intro={intro}
                  />
                </div>

                <div className="h-[80px]" />
              </div>

              <motion.div
                key={`rest-${pageKey}`}
                className="mx-auto max-w-[860px] px-2 pb-44 pt-2"
                variants={restContainer}
                initial="hidden"
                animate="show"
                style={{ pointerEvents: "auto" }}
              >
                {restRows.length > 0 && (
                  <div className="origin-top scale-[1.16] space-y-2 pt-0.5">
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