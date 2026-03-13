"use client";

import { BarChart } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Percentiles = {
  winRate: number;
  accuracy: number;
  precision: number;
  pointsV3: number;
  upset: number;
  volume: number;
};

type Props = {
  percentiles: Percentiles;
  prevPercentiles?: Percentiles | null;
};

const ITEMS = [
  { key: "winRate", label: "勝率" },
  { key: "accuracy", label: "精度" },
  { key: "precision", label: "スコア精度" },
  { key: "pointsV3", label: "総合得点" },
  { key: "upset", label: "Upset力" },
  { key: "volume", label: "投稿量" },
] as const;

/* =========================
 * 表示用フォーマット
 * ========================= */
function formatPercentile(now: number) {
  if (now >= 90) {
    return {
      text: `上位 ${100 - now}%`,
      tier: "elite" as const,
    };
  }
  if (now >= 50) {
    return {
      text: `上位 ${100 - now}%`,
      tier: "top" as const,
    };
  }
  return {
    text: `下位 ${now}%`,
    tier: "low" as const,
  };
}

export default function PercentileList({
  percentiles,
  prevPercentiles,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.4 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className="rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)]"
    >
      <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white md:text-base">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-black">
          <BarChart className="h-3 w-3 text-orange-400 md:h-3.5 md:w-3.5" />
        </div>
        <span>指標別パーセンタイル</span>
      </div>

      <div className="space-y-3">
        {ITEMS.map(({ key, label }, index) => {
          const now = percentiles[key];
          const labelNow = formatPercentile(now);

          const prev = prevPercentiles?.[key];
          const diff = typeof prev === "number" ? now - prev : null;

          const diffSign =
            diff && diff > 0 ? "up" : diff && diff < 0 ? "down" : null;

          const colorClass =
            labelNow.tier === "elite"
              ? "text-amber-400"
              : labelNow.tier === "top"
              ? "text-orange-400"
              : "text-sky-400";

          return (
            <div key={key}>
              <div className="mb-1 flex items-center justify-between text-xs md:text-sm">
                <span className="text-white/80 md:text-[10px]">{label}</span>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-semibold ${colorClass} md:text-[15px]`}
                  >
                    {labelNow.text}
                  </span>

                  {diffSign && diff !== null && (
                    <span
                      className={`text-[11px] md:text-xs ${
                        diffSign === "up"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {diffSign === "up" ? "↑" : "↓"} {Math.abs(diff)}%
                    </span>
                  )}
                </div>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-500 transition-all ease-out"
                  style={{
                    width: visible ? `${now}%` : "0%",
                    transitionDuration: "1800ms",
                    transitionDelay: `${index * 260}ms`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      <p className="mt-2 text-[11px] leading-relaxed text-white/50 md:text-[13px]">
        ※ パーセンタイルは、あなたの指標が全ユーザーの中でどの位置にいるかを表しています。
      </p>
    </div>
  );
}