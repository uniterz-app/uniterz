"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";
import { resultStatsMetricNumClass } from "@/lib/fonts";

type TeamStat = {
  teamId: string;
  teamName: string;
  games: number;
  winRate: number; // 0–1
};

type Props = {
  strong: TeamStat[];
  weak: TeamStat[];
};

export default function TeamAffinityCard({ strong, weak }: Props) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 14 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative overflow-hidden rounded-2xl border border-cyan-300/20 bg-[#050814]/85 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55),0_0_22px_rgba(34,211,238,0.08)]"
    >
      <ShellGridOverlay roundedClassName="rounded-2xl" />
      <div className="relative z-1 mb-3 text-sm font-semibold text-white lg:text-base">
        チーム別パフォーマンス
      </div>

      {/* 横並び */}
      <div className="relative z-1 grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TeamList
          title="相性の良いチーム"
          color="emerald"
          data={strong}
        />
        <TeamList
          title="相性の悪いチーム"
          color="rose"
          data={weak}
        />
      </div>
    </motion.div>
  );
}

/* =========================
 * Team List
 * ========================= */

function TeamList({
  title,
  color,
  data,
}: {
  title: string;
  color: "emerald" | "rose";
  data: TeamStat[];
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const textColor =
    color === "emerald" ? "text-cyan-300" : "text-fuchsia-400";
  const barStyle =
    color === "emerald"
      ? {
          background:
            "linear-gradient(90deg, rgba(34,211,238,0.98) 0%, rgba(45,212,191,0.9) 55%, rgba(56,189,248,0.75) 100%)",
          boxShadow:
            "0 0 12px rgba(103,232,249,0.4), inset 0 0 6px rgba(255,255,255,0.12)",
        }
      : {
          background:
            "linear-gradient(90deg, rgba(217,70,239,0.95) 0%, rgba(236,72,153,0.9) 55%, rgba(251,113,133,0.85) 100%)",
          boxShadow:
            "0 0 12px rgba(232,121,249,0.42), inset 0 0 6px rgba(255,255,255,0.12)",
        };

  return (
    <div ref={ref}>
      <div className={`mb-2 text-xs font-semibold ${textColor}`}>
        {title}
      </div>

      {/* ★ データ不足 */}
      {data.length === 0 ? (
        <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-4 text-center">
          <div className="text-xs font-semibold text-white/60">
            データ不足
          </div>
          <div className="mt-1 text-[11px] text-white/40 leading-relaxed">
            各チーム最低5投稿が必要です
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {data.map((t, index) => {
            const rate = Math.round(t.winRate * 100);

            return (
              <motion.div
                key={t.teamId}
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={visible ? { opacity: 1, y: 0 } : undefined}
                transition={{
                  duration: 0.35,
                  delay: 0.08 + index * 0.08,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="rounded-lg border border-cyan-300/15 bg-white/4 px-3 py-2"
              >
                {/* 上段 */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs text-white/40 ${resultStatsMetricNumClass}`}>
                      {index + 1}
                    </span>
                    <span className={`text-sm font-semibold text-white lg:text-base ${resultStatsMetricNumClass}`}>
                      {t.teamName}
                    </span>
                  </div>

                  <div className={`text-right text-xs ${resultStatsMetricNumClass}`}>
                    <div className="text-white/60 lg:text-sm">
                      {t.games}試合
                    </div>
                    <div className={`font-semibold lg:text-base ${textColor}`}>
                      {rate}%
                    </div>
                  </div>
                </div>

                {/* バー */}
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full transition-all ease-out"
                    style={{
                      width: visible ? `${rate}%` : "0%",
                      transitionDuration: "1600ms",
                      transitionDelay: `${index * 240}ms`,
                      ...barStyle,
                    }}
                  />
                </div>

                {/* ひとこと */}
                <div className={`mt-1 text-[10px] text-white/40 lg:text-xs ${resultStatsMetricNumClass}`}>
                  {rate >= 70
                    ? "安定して勝てている"
                    : rate >= 55
                    ? "やや相性が良い"
                    : rate >= 45
                    ? "五分の相性"
                    : "相性が悪い"}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
