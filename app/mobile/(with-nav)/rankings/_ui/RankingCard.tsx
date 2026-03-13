"use client";

import Link from "next/link";
import type { RankingRowWithCountry, MobileMetric } from "../_data/mockRows";
import { alfa, jp } from "../fonts";
import { useEffect, useRef, useState } from "react";

const FLAG_SRC: Record<string, string> = {
  US: "/flags/us.png",
  CN: "/flags/cn.png",
  JP: "/flags/jp.png",
};

function getCountryCode(row: RankingRowWithCountry): string | undefined {
  if (!row.countryCode) return undefined;
  return FLAG_SRC[row.countryCode] ? row.countryCode : undefined;
}

function useCountUp(
  target: number,
  duration = 900,
  decimals = 0,
  enabled = true,
  onDone?: () => void
) {
  const [v, setV] = useState(enabled ? 0 : target);
  const doneRef = useRef(false);

  useEffect(() => {
    doneRef.current = false;

    if (!enabled) {
      setV(target);
      return;
    }

    let raf = 0;
    const from = 0;
    setV(from);
    const start = performance.now();

    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = from + (target - from) * eased;
      const p = Math.pow(10, decimals);

      setV(Math.round(next * p) / p);

      if (t < 1) {
        raf = requestAnimationFrame(tick);
      } else if (!doneRef.current) {
        doneRef.current = true;
        onDone?.();
      }
    };

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration, decimals, enabled, onDone]);

  return v;
}

function metricNum(r: RankingRowWithCountry, metric: MobileMetric) {
  if (metric === "totalScore") {
    return { n: r.totalScore ?? (r as any).score ?? (r as any).points ?? 0, d: 0 };
  }
  if (metric === "marginPrecision") {
    return {
      n: r.marginPrecisionScore ?? (r as any).score ?? (r as any).points ?? 0,
      d: 0,
    };
  }
  if (metric === "upsetScore") {
    return {
      n: r.upsetScore ?? (r as any).score ?? (r as any).points ?? 0,
      d: 0,
    };
  }
  if (metric === "winRate") {
    return { n: Math.round((r.winRate ?? 0) * 100), d: 0 };
  }
  return { n: r.streak ?? 0, d: 0 };
}

function getMetricSubText(r: RankingRowWithCountry, metric: MobileMetric) {
  if (metric === "totalScore") {
    return `avg ${(r.avgTotalScore ?? 0).toFixed(1)}`;
  }
  if (metric === "marginPrecision") {
    return `avg ${(r.avgMarginPrecision ?? 0).toFixed(1)}`;
  }
  if (metric === "upsetScore") {
    return `avg ${(r.avgUpsetScore ?? 0).toFixed(1)}`;
  }
  return `投稿 ${r.posts ?? 0}`;
}

function medal(rank: number) {
  if (rank === 1) {
    return {
      text: "#FFD65A",
      glow: "rgba(255,215,90,0.08)",
      tint: "rgba(255,215,90,0.06)",
    };
  }
  if (rank === 2) {
    return {
      text: "#E9EDF6",
      glow: "rgba(230,235,245,0.06)",
      tint: "rgba(230,235,245,0.05)",
    };
  }
  if (rank === 3) {
    return {
      text: "#D59A5A",
      glow: "rgba(205,127,50,0.06)",
      tint: "rgba(205,127,50,0.05)",
    };
  }
  return {
    text: "#FFFFFF",
    glow: "rgba(255,255,255,0.04)",
    tint: "rgba(255,255,255,0.035)",
  };
}

function cardTone(rank: number) {
  if (rank === 1) {
    return {
      border: "rgba(255,255,255,0.18)",
      outerGlow: "rgba(255,215,90,0.07)",
    };
  }
  if (rank === 2) {
    return {
      border: "rgba(255,255,255,0.18)",
      outerGlow: "rgba(230,235,245,0.06)",
    };
  }
  if (rank === 3) {
    return {
      border: "rgba(255,255,255,0.18)",
      outerGlow: "rgba(205,127,50,0.055)",
    };
  }
  return {
    border: "rgba(255,255,255,0.14)",
    outerGlow: "rgba(255,255,255,0.035)",
  };
}

function FadedFlagBg({
  rank,
  countryCode,
}: {
  rank: number;
  countryCode?: string;
}) {
  const m = medal(rank);
  const src = countryCode ? FLAG_SRC[countryCode] : undefined;

  if (!src) return null;

  return (
    <div className="pointer-events-none absolute inset-y-0 -right-[1%] w-[34%] overflow-hidden">
      <div
        className="absolute inset-y-[1%] right-[3%] w-[92%] overflow-hidden rounded-[16px]"
        style={{
          opacity: rank <= 3 ? 0.22 : 0.14,
          boxShadow: `0 0 24px ${m.glow}`,
          maskImage:
            "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.18) 18%, rgba(0,0,0,0.56) 48%, rgba(0,0,0,0.96) 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.18) 18%, rgba(0,0,0,0.56) 48%, rgba(0,0,0,0.96) 100%)",
        }}
      >
        <img
          src={src}
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
        />
      </div>
    </div>
  );
}

function AvatarCircle({
  row,
  rank,
  isTop3,
}: {
  row: RankingRowWithCountry;
  rank: number;
  isTop3: boolean;
}) {
  const m = medal(rank);
  const tone = cardTone(rank);
  const initial = (row.displayName ?? row.handle ?? "?").slice(0, 1).toUpperCase();

  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden rounded-full border bg-black",
        isTop3 ? "h-14 w-14" : "h-11 w-11",
      ].join(" ")}
      style={{
        borderColor: tone.border,
        boxShadow: [
          "0 10px 24px rgba(0,0,0,0.24)",
          `0 0 14px ${m.glow}`,
          "inset 0 1px 0 rgba(255,255,255,0.14)",
        ].join(", "),
      }}
    >
      {row.photoURL ? (
        <img src={row.photoURL} alt="" className="h-full w-full object-cover" />
      ) : (
        <div
          className={[
            "grid h-full w-full place-items-center font-black",
            alfa.className,
            isTop3 ? "text-[22px]" : "text-[18px]",
          ].join(" ")}
          style={{
            color: "rgba(255,255,255,0.94)",
            textShadow: "0 2px 10px rgba(0,0,0,0.35)",
          }}
        >
          {initial}
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ boxShadow: `inset 0 0 0 1px ${tone.border}` }}
      />
    </div>
  );
}

function ValueText({
  rank,
  metric,
  counted,
  isTop3,
}: {
  rank: number;
  metric: MobileMetric;
  counted: number;
  isTop3: boolean;
}) {
  const m = medal(rank);

  const baseTextClass =
    rank === 1 ? "text-[32px]" : isTop3 ? "text-[28px]" : "text-[24px]";

  const glowStyle = {
    color: m.text,
    textShadow:
      rank === 1
        ? "0 0 16px rgba(255,215,90,0.18)"
        : rank === 2
        ? "0 0 14px rgba(230,235,245,0.10)"
        : rank === 3
        ? "0 0 14px rgba(205,127,50,0.10)"
        : "0 0 10px rgba(255,255,255,0.06)",
  } as const;

  if (metric === "streak") {
    return (
      <div
        className={[
          "inline-flex items-baseline justify-center gap-0.5 font-black tabular-nums leading-none",
          alfa.className,
          baseTextClass,
        ].join(" ")}
        style={glowStyle}
      >
        <span>{Math.round(counted)}</span>
        <span className={rank === 1 ? "text-[17px]" : isTop3 ? "text-[15px]" : "text-[13px]"}>
          連勝
        </span>
      </div>
    );
  }

  if (metric === "winRate") {
    return (
      <div
        className={[
          "inline-flex items-baseline justify-center font-black tabular-nums leading-none",
          alfa.className,
        ].join(" ")}
        style={glowStyle}
      >
        <span className={baseTextClass}>{Math.round(counted)}</span>
        <span
          className={
            rank === 1
              ? "ml-0.5 text-[16px]"
              : isTop3
              ? "ml-0.5 text-[14px]"
              : "ml-0.5 text-[12px]"
          }
        >
          %
        </span>
      </div>
    );
  }

  return (
    <div
      className={[
        "inline-flex items-baseline justify-center gap-1 font-black tabular-nums leading-none",
        alfa.className,
        baseTextClass,
      ].join(" ")}
      style={glowStyle}
    >
      <span>{Math.round(counted)}</span>
      <span className={rank === 1 ? "text-[15px]" : isTop3 ? "text-[13px]" : "text-[11px]"}>
        pts
      </span>
    </div>
  );
}

export default function RankingCard({
  row: r,
  rank,
  metric,
  onCountDone,
}: {
  row: RankingRowWithCountry;
  rank: number;
  metric: MobileMetric;
  onCountDone?: () => void;
}) {
  const isTop3 = rank <= 3;
  const m = medal(rank);
  const tone = cardTone(rank);
  const countryCode = getCountryCode(r);

  const { n: target, d: decimals } = metricNum(r, metric);
  const counted = useCountUp(
    target,
    900,
    decimals,
    true,
    rank === 1 ? onCountDone : undefined
  );
  const subText = getMetricSubText(r, metric);

  return (
    <Link
      href={`/u/${r.uid}`}
      className={["block", isTop3 ? "mb-1.5" : "mb-3"].join(" ")}
    >
      <div
        className={[
          "relative overflow-hidden rounded-2xl border",
          isTop3 ? "min-h-[92px]" : "min-h-[78px]",
        ].join(" ")}
        style={{
          borderColor: tone.border,
          backgroundColor: "rgba(255,255,255,0.055)",
          boxShadow: [
            isTop3
              ? "0 12px 28px rgba(0,0,0,0.22)"
              : "0 8px 18px rgba(0,0,0,0.18)",
            "inset 0 1px 0 rgba(255,255,255,0.22)",
            "inset 0 -1px 0 rgba(255,255,255,0.05)",
            `inset 0 0 0 1px ${tone.border}`,
            `0 0 18px ${tone.outerGlow}`,
          ].join(", "),
        }}
      >
        <FadedFlagBg rank={rank} countryCode={countryCode} />

        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background: `
              linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 18%, rgba(255,255,255,0.03) 38%, rgba(255,255,255,0.02) 100%),
              radial-gradient(120% 90% at 0% 0%, rgba(255,255,255,0.14) 0%, transparent 42%),
              radial-gradient(90% 70% at 100% 100%, ${m.tint} 0%, transparent 48%)
            `,
          }}
        />

        <div
          className="pointer-events-none absolute left-3 right-3 top-0 h-[1px]"
          style={{
            background:
              "linear-gradient(90deg, rgba(255,255,255,0), rgba(255,255,255,0.75), rgba(255,255,255,0))",
            opacity: 0.55,
          }}
        />

        <div
          className="pointer-events-none absolute -left-[12%] top-0 h-[65%] w-[58%]"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.10) 22%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0) 62%)",
            transform: "skewX(-18deg)",
            opacity: 0.38,
          }}
        />

        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%]"
          style={{
            background:
              "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.10) 100%)",
          }}
        />

        <div
          className={[
            "relative z-10 grid items-center gap-2.5 px-2.5",
            isTop3
              ? "grid-cols-[32px_56px_minmax(0,1fr)_84px] py-4"
              : "grid-cols-[28px_44px_minmax(0,1fr)_82px] py-3.5",
          ].join(" ")}
        >
          <div className="flex items-center justify-center">
            <div
              className={[
                "translate-y-[1px] text-center font-black leading-none tabular-nums",
                alfa.className,
                rank === 1 ? "text-[34px]" : rank <= 3 ? "text-[29px]" : "text-[25px]",
              ].join(" ")}
              style={{
                color: m.text,
                textShadow:
                  rank === 1
                    ? "0 0 14px rgba(255,215,90,0.18)"
                    : rank === 2
                    ? "0 0 12px rgba(230,235,245,0.10)"
                    : rank === 3
                    ? "0 0 12px rgba(205,127,50,0.10)"
                    : "0 0 10px rgba(255,255,255,0.06)",
              }}
            >
              {rank}
            </div>
          </div>

          <div className="flex items-center">
            <AvatarCircle row={r} rank={rank} isTop3={isTop3} />
          </div>

          <div className="min-w-0">
            <div
              className={[
                "truncate font-black tracking-[0.01em]",
                jp.className,
                rank === 1 ? "text-[20px]" : isTop3 ? "text-[17px]" : "text-[15px]",
              ].join(" ")}
              style={{
                color: "rgba(255,255,255,0.92)",
                textShadow: "0 2px 12px rgba(0,0,0,0.35)",
              }}
            >
              {r.displayName ?? r.handle ?? "Unknown"}
            </div>
          </div>

          <div className="flex justify-center">
            <div className="flex min-w-[82px] flex-col items-center justify-center text-center">
              <ValueText rank={rank} metric={metric} counted={counted} isTop3={isTop3} />
              <div className="mt-1 text-[11px] leading-none text-white/40">{subText}</div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}