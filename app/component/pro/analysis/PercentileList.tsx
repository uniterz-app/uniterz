"use client";

import { useEffect, useRef, useState } from "react";

type Percentiles = {
  winRate: number;
  accuracy: number;
  precision: number;
  upset: number;
  volume: number;
};

type Props = {
  percentiles: Percentiles;              // 今月（0–100 下から）
  prevPercentiles?: Percentiles | null;  // 先月（任意）
};

const ITEMS = [
  { key: "winRate", label: "勝率" },
  { key: "accuracy", label: "精度" },
  { key: "precision", label: "スコア精度" },
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
      tier: "elite" as const, // 上位10%
    };
  }
  if (now >= 50) {
    return {
      text: `上位 ${100 - now}%`,
      tier: "top" as const,   // 上位
    };
  }
  return {
    text: `下位 ${now}%`,
    tier: "low" as const,     // 下位
  };
}

export default function PercentileList({
  percentiles,
  prevPercentiles,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  /* =========================
   * Intersection Observer
   * ========================= */
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
      <div className="mb-3 text-sm font-semibold text-white">
        指標別パーセンタイル
      </div>

      <div className="space-y-3">
        {ITEMS.map(({ key, label }, index) => {
          const now = percentiles[key]; // 0–100（下から）
          const labelNow = formatPercentile(now);

          const prev = prevPercentiles?.[key];
          const diff =
            typeof prev === "number" ? now - prev : null;

          const diffSign =
            diff && diff > 0 ? "up" : diff && diff < 0 ? "down" : null;

          const colorClass =
            labelNow.tier === "elite"
              ? "text-amber-400"   // 上位10%
              : labelNow.tier === "top"
              ? "text-orange-400"  // 上位
              : "text-sky-400";    // 下位

          return (
            <div key={key}>
              {/* ===== ラベル行 ===== */}
              <div className="mb-1 flex items-center justify-between text-xs">
                <span className="text-white/80">{label}</span>

                <div className="flex items-center gap-2">
                  {/* 今月 */}
                  <span className={`font-semibold ${colorClass}`}>
                    {labelNow.text}
                  </span>

                  {/* 前月比 */}
                  {diffSign && diff !== null && (
                    <span
                      className={`text-[11px] ${
                        diffSign === "up"
                          ? "text-green-400"
                          : "text-red-400"
                      }`}
                    >
                      {diffSign === "up" ? "↑" : "↓"}{" "}
                      {Math.abs(diff)}%
                    </span>
                  )}
                </div>
              </div>

              {/* ===== バー ===== */}
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

      <p className="mt-2 text-[11px] leading-relaxed text-white/50">
        ※ パーセンタイルは、あなたの指標が全ユーザーの中でどの位置にいるかを表しています。
      </p>
    </div>
  );
}
