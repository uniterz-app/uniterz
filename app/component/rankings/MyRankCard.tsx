"use client";

import { alfa, jp } from "@/lib/fonts";
import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";

type Props = {
  rank: number | null;
  metric: MobileMetric;
  value: number;
  displayName: string;
  photoURL?: string | null;
  handle?: string | null;
  totalPosts?: number;
  loading?: boolean;
};

function formatValue(metric: MobileMetric, value: number) {
  if (metric === "winRate") return `${Math.round(value)}%`;
  if (metric === "streak") {
    return `${Math.round(value)}`;
  }
  return `${Math.round(value)} pts`;
}

function getRankStyle(rank: number | null, loading: boolean) {
  if (loading || !rank) {
    return {
      color: "rgba(255,255,255,0.9)",
      textShadow: "none",
    };
  }

  if (rank <= 10) {
    return {
      color: "#FFD65A",
      textShadow: "0 0 12px rgba(255,215,90,0.25)",
    };
  }

  if (rank <= 20) {
    return {
      color: "#F4E47A",
      textShadow: "0 0 10px rgba(244,228,122,0.18)",
    };
  }

  return {
    color: "rgba(255,255,255,0.95)",
    textShadow: "none",
  };
}

export default function MyRankCard({
  rank,
  metric,
  value,
  displayName,
  photoURL,
  handle,
  totalPosts,
  loading = false,
}: Props) {
  const initial = displayName?.slice(0, 1).toUpperCase() ?? "?";
  const rankStyle = getRankStyle(rank, loading);

  return (
    <div className="px-3 pt-3">
      <div
        className="relative flex items-center justify-between rounded-[18px] border px-4 py-3"
        style={{
          background:
            "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
          borderColor: "rgba(255,255,255,0.12)",
          boxShadow:
            "0 10px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
        }}
      >
        {/* LEFT */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-[44px] w-[44px] shrink-0 overflow-hidden rounded-full border border-white/20 bg-black">
            {photoURL ? (
              <img
                src={photoURL}
                alt=""
                className="h-full w-full object-cover"
              />
            ) : (
              <div
                className={[
                  "grid h-full w-full place-items-center font-black text-[18px]",
                  alfa.className,
                ].join(" ")}
              >
                {initial}
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div
              className={[
                "truncate font-black text-[16px] leading-none text-white",
                jp.className,
              ].join(" ")}
            >
              {displayName}
            </div>

            {handle && (
              <div className="truncate text-[12px] text-white/50">
                @{handle}
              </div>
            )}
          </div>
        </div>

        {/* CENTER */}
        <div className="flex flex-col items-center justify-center">
          <div className="text-[9px] tracking-wider text-white/40">
            YOUR RANK
          </div>

          <div
            className={["font-black leading-none", alfa.className].join(" ")}
            style={{
              fontSize: 24,
              color: rankStyle.color,
              textShadow: rankStyle.textShadow,
            }}
          >
            {loading ? "--" : rank ? `#${rank}` : "-"}
          </div>
        </div>

        {/* RIGHT */}
        <div className="flex flex-col items-end">
          {metric === "streak" ? (
            <div
              className={[
                "inline-flex items-baseline justify-end gap-1 font-black leading-none",
                jp.className,
              ].join(" ")}
              style={{
                color: "rgba(255,255,255,0.9)",
                textShadow: "0 0 10px rgba(255,255,255,0.08)",
              }}
            >
              <span className={alfa.className} style={{ fontSize: 20 }}>
                {loading ? "--" : Math.round(value)}
              </span>
              <span
                style={{
                  fontSize: 14,
                  letterSpacing: "0.03em",
                  transform: "translateY(-1px)",
                }}
              >
                連勝
              </span>
            </div>
          ) : (
            <div
              className={[
                "font-black tabular-nums leading-none",
                alfa.className,
              ].join(" ")}
              style={{
                fontSize: 20,
                color: "rgba(255,255,255,0.9)",
              }}
            >
              {loading ? "--" : formatValue(metric, value)}
            </div>
          )}

          {metric === "winRate" && totalPosts !== undefined && (
            <div className="text-[11px] text-white/40">
              投稿 {totalPosts}
            </div>
          )}
        </div>

        {/* subtle glow */}
        <div
          className="pointer-events-none absolute inset-0 rounded-[18px]"
          style={{
            boxShadow: "0 0 40px rgba(0,255,255,0.06)",
          }}
        />
      </div>
    </div>
  );
}