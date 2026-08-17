"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { X } from "lucide-react";
import LiveGameStatsPanel from "@/app/component/games/live/LiveGameStatsPanel";
import { LiveMatchMark } from "@/app/component/games/LiveMatchMark";
import MatchScoreLine from "@/app/component/games/MatchScoreLine";
import {
  liveGameStatsPreviewReport,
  type LiveGamePhase,
  type LiveGameStatsReport,
} from "@/lib/games/liveGameStatsPreviewMocks";
import { nameOxanium } from "@/lib/fonts";
import { getTeamPrimaryColor } from "@/lib/team-colors";
import { PREDICT_OVERLAY_BACKDROP } from "@/lib/ui/matchOverlayGlass";

function MatchTapCard({
  report,
  onOpen,
}: {
  report: LiveGameStatsReport;
  onOpen: () => void;
}) {
  const homeColor =
    getTeamPrimaryColor("nba", report.home.teamId) ?? "#e8edf5";
  const awayColor =
    getTeamPrimaryColor("nba", report.away.teamId) ?? "#e8edf5";
  const isLive = report.phase === "live";

  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-2xl border border-white/12 bg-[linear-gradient(165deg,rgba(255,255,255,0.06)_0%,rgba(255,255,255,0.02)_100%)] px-4 py-3.5 text-left transition hover:border-cyan-400/35 hover:bg-white/[0.05]"
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        {isLive ? (
          <LiveMatchMark density="matchDense" language="ja" />
        ) : (
          <span
            className={[
              nameOxanium.className,
              "rounded-[2px] border border-white/25 bg-white/[0.06] px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-[0.14em] text-white/70",
            ].join(" ")}
          >
            FINAL
          </span>
        )}
        <span
          className={[
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.12em] text-white/40",
          ].join(" ")}
        >
          {report.periodLabel}
          {report.clock ? ` · ${report.clock}` : ""}
        </span>
      </div>

      <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        <p
          className={[
            nameOxanium.className,
            "truncate text-right text-sm font-extrabold uppercase tracking-[0.06em]",
          ].join(" ")}
          style={{ color: homeColor }}
        >
          {report.home.abbr}
        </p>
        <MatchScoreLine
          home={report.home.score}
          away={report.away.score}
          className="text-2xl text-white"
        />
        <p
          className={[
            nameOxanium.className,
            "truncate text-left text-sm font-extrabold uppercase tracking-[0.06em]",
          ].join(" ")}
          style={{ color: awayColor }}
        >
          {report.away.abbr}
        </p>
      </div>

      <p className="mt-2 text-center text-[11px] text-white/40">
        タップでスタッツを開く
      </p>
    </button>
  );
}

export default function LiveGameStatsPreviewPage() {
  const reduceMotion = useReducedMotion();
  const liveReport = useMemo(() => liveGameStatsPreviewReport("live"), []);
  const finalReport = useMemo(() => liveGameStatsPreviewReport("final"), []);
  const [openPhase, setOpenPhase] = useState<LiveGamePhase | null>(null);

  const openReport =
    openPhase === "live"
      ? liveReport
      : openPhase === "final"
        ? finalReport
        : null;

  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-[#07090f] px-4 py-6 text-white">
      <h1
        className={[
          nameOxanium.className,
          "text-lg font-extrabold uppercase tracking-[0.08em]",
        ].join(" ")}
      >
        Live Game Stats
      </h1>
      <p className="mt-1 text-xs leading-relaxed text-white/50">
        試合カードを押す → 試合中ならその時点のチームスタッツ + ボックススコア。
        終了後も同じ UI で最終データを表示。データは API 差し替え前提の mock。
      </p>

      <div className="mt-5 space-y-3">
        <MatchTapCard
          report={liveReport}
          onOpen={() => setOpenPhase("live")}
        />
        <MatchTapCard
          report={finalReport}
          onOpen={() => setOpenPhase("final")}
        />
      </div>

      <AnimatePresence>
        {openReport ? (
          <motion.div
            className="fixed inset-0 z-[80] flex items-end justify-center sm:items-center"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduceMotion ? undefined : { opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <button
              type="button"
              aria-label="Close"
              className={["absolute inset-0", PREDICT_OVERLAY_BACKDROP].join(
                " "
              )}
              onClick={() => setOpenPhase(null)}
            />
            <motion.div
              role="dialog"
              aria-modal="true"
              className="relative z-[1] flex max-h-[88dvh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-white/12 bg-[#07090f] shadow-[0_-12px_40px_rgba(0,0,0,0.55)] sm:rounded-2xl"
              initial={reduceMotion ? false : { y: 28, opacity: 0.85 }}
              animate={{ y: 0, opacity: 1 }}
              exit={reduceMotion ? undefined : { y: 20, opacity: 0 }}
              transition={{ duration: 0.24, ease: [0.16, 0.84, 0.22, 1] }}
            >
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="h-1 w-10 rounded-full bg-white/20" />
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-2">
                <LiveGameStatsPanel report={openReport} language="ja" />
              </div>
              <div className="shrink-0 border-t border-white/10 px-4 pb-6 pt-3 sm:pb-4">
                <button
                  type="button"
                  onClick={() => setOpenPhase(null)}
                  aria-label="Close"
                  className="mx-auto grid h-10 w-10 place-items-center rounded-lg border border-white/15 text-white/70 hover:bg-white/8 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
