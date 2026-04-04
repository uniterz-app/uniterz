"use client";

import type { RankingRow } from "@/lib/rankings/types";
import { alfa, jp } from "@/lib/fonts";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useMemo } from "react";
import type { MobileMetric, RankingRowWithCountry } from "@/app/component/rankings/_data/mockRows";
import { metricNum } from "@/lib/rankings/metric";
import { useRankCountUp } from "@/lib/hooks/useCountUpRanking";
import type { Language } from "@/lib/i18n/language";
import { postsLabel, streakShortLabel } from "@/lib/i18n/rankings";

/* =========================
 * Flag map
 * ========================= */
const FLAG_SRC: Record<string, string> = {
  US: "/flags/us.png",
  CN: "/flags/cn.png",
  JP: "/flags/jp.png",
};

function getCountryCode(row: RankingRowWithCountry): string | undefined {
  if (!row.countryCode) return undefined;
  return FLAG_SRC[row.countryCode] ? row.countryCode : undefined;
}

/* =========================
 * Medal
 * ========================= */
const medal = (rank: 1 | 2 | 3) => {
  if (rank === 1) {
    return {
      ring: "rgba(255,215,90,0.26)",
      glow: "rgba(255,215,90,0.09)",
      grad:
        "linear-gradient(180deg,#fff8cf 0%,#f8d16e 22%,#fff4ba 46%,#ca8c24 78%,#fff8cf 100%)",
      solid: "#FFD65A",
      tint: "rgba(255,215,90,0.08)",
    };
  }
  if (rank === 2) {
    return {
      ring: "rgba(235,238,245,0.22)",
      glow: "rgba(230,235,245,0.08)",
      grad:
        "linear-gradient(180deg,#ffffff 0%,#dde3ec 24%,#f8fbff 56%,#a0acbe 90%,#ffffff 100%)",
      solid: "#E9EDF6",
      tint: "rgba(230,235,245,0.07)",
    };
  }
  return {
    ring: "rgba(205,127,50,0.22)",
    glow: "rgba(205,127,50,0.08)",
    grad:
      "linear-gradient(180deg,#ffe3c8 0%,#d89b57 24%,#ffd7b2 46%,#925524 80%,#ffe3c8 100%)",
    solid: "#D59A5A",
    tint: "rgba(205,127,50,0.07)",
  };
};

function rankInk(rank: 1 | 2 | 3) {
  const m = medal(rank);

  const shadow =
    rank === 1
      ? "0 0 14px rgba(255,215,90,0.16)"
      : rank === 2
      ? "0 0 12px rgba(230,235,245,0.10)"
      : "0 0 12px rgba(205,127,50,0.10)";

  const solidStyle = { color: m.solid, textShadow: shadow } as const;

  const gradStyle = {
    backgroundImage: m.grad,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    textShadow: `0 0 12px ${m.glow}`,
    display: "inline-block",
  } as const;

  return { solidStyle, gradStyle };
}

/** Top3 スコア列：順位ごとに色＋グロー（メインランキング TopPodium と同じ） */
function podiumScoreStyle(rank: 1 | 2 | 3) {
  if (rank === 1) {
    return {
      color: "#FFD65A",
      textShadow:
        "0 0 10px rgba(255,215,90,0.65), 0 0 22px rgba(255,193,7,0.45), 0 0 40px rgba(234,179,8,0.25)",
    } as const;
  }
  if (rank === 2) {
    return {
      color: "#E9EDF6",
      textShadow:
        "0 0 10px rgba(230,238,250,0.55), 0 0 22px rgba(203,213,225,0.38), 0 0 38px rgba(148,163,184,0.22)",
    } as const;
  }
  return {
    color: "#D59A5A",
    textShadow:
      "0 0 10px rgba(222,150,90,0.6), 0 0 22px rgba(180,95,50,0.38), 0 0 38px rgba(146,85,40,0.22)",
  } as const;
}

/* =========================
 * Size presets
 * ========================= */
function rankDigitGlow(rank: 1 | 2 | 3): string {
  if (rank === 1) return "drop-shadow(0 0 14px rgba(255,215,90,0.55))";
  if (rank === 2) return "drop-shadow(0 0 12px rgba(230,238,250,0.45))";
  return "drop-shadow(0 0 12px rgba(220,150,90,0.48))";
}

/** TopPodium と同様、1〜3 位でカード枠の高さを揃える */
const monthlyPodiumLayoutStable = {
  cardMinH: "min-h-[92px]",
  rowPy: "py-1.5",
  rowMinH: "min-h-[50px]",
  gap: "gap-2",
  px: "px-3",
} as const;

function rankPreset(rank: 1 | 2 | 3) {
  const avatar = { avatar: "h-[40px] w-[40px]", avatarText: "text-[16px]" };
  if (rank === 1) {
    return {
      ...monthlyPodiumLayoutStable,
      rankW: "w-[28px]",
      rankText: "text-[28px]",
      ...avatar,
      nameText: "text-[24px]",
      scoreW: "min-w-[58px]",
      scoreMain: "text-[28px]",
      scoreSub: "text-[12px]",
    };
  }
  if (rank === 2) {
    return {
      ...monthlyPodiumLayoutStable,
      rankW: "w-[26px]",
      rankText: "text-[26px]",
      ...avatar,
      nameText: "text-[21px]",
      scoreW: "min-w-[54px]",
      scoreMain: "text-[25px]",
      scoreSub: "text-[11px]",
    };
  }
  return {
    ...monthlyPodiumLayoutStable,
    rankW: "w-[24px]",
    rankText: "text-[24px]",
    ...avatar,
    nameText: "text-[19px]",
    scoreW: "min-w-[50px]",
    scoreMain: "text-[22px]",
    scoreSub: "text-[11px]",
  };
}

function AvatarCircle({ row, rank }: { row: RankingRow; rank: 1 | 2 | 3 }) {
  const m = medal(rank);
  const ink = rankInk(rank);
  const s = rankPreset(rank);
  const initial = (row.displayName ?? row.handle ?? "?").slice(0, 1).toUpperCase();

  return (
    <div
      className="relative shrink-0"
      style={{
        filter:
          rank === 1
            ? "drop-shadow(0 0 14px rgba(255,215,90,0.20))"
            : rank === 2
            ? "drop-shadow(0 0 12px rgba(230,235,245,0.14))"
            : "drop-shadow(0 0 12px rgba(205,127,50,0.14))",
      }}
    >
      <div
        className={[
          "relative overflow-hidden rounded-full border bg-black",
          s.avatar,
        ].join(" ")}
        style={{
          borderColor: m.ring,
          boxShadow: ["0 10px 24px rgba(0,0,0,0.24)", `0 0 14px ${m.glow}`].join(", "),
        }}
      >
        {row.photoURL ? (
          <img src={row.photoURL} alt="" className="h-full w-full object-cover" />
        ) : (
          <div
            className={[
              "grid h-full w-full place-items-center font-black",
              alfa.className,
              s.avatarText,
            ].join(" ")}
          >
            <span style={rank === 2 ? ink.solidStyle : ink.gradStyle}>{initial}</span>
          </div>
        )}
      </div>

      <div
        className="pointer-events-none absolute inset-0 rounded-full"
        style={{ boxShadow: `inset 0 0 0 1px ${m.ring}` }}
      />
    </div>
  );
}

/* =========================
 * Flag background
 * ========================= */
function FadedFlagBg({
  rank,
  countryCode,
}: {
  rank: 1 | 2 | 3;
  countryCode?: string;
}) {
  const m = medal(rank);
  const src = countryCode ? FLAG_SRC[countryCode] : undefined;

  if (!src) return null;

  return (
    <div className="pointer-events-none absolute inset-y-0 -right-[11%] w-[42%] overflow-hidden">
      <div
        className="absolute inset-y-[2%] right-[10%] w-[92%] overflow-hidden rounded-[18px]"
        style={{
          opacity: 0.43,
          boxShadow: `0 0 24px ${m.glow}`,
          maskImage:
            "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.22) 18%, rgba(0,0,0,0.62) 48%, rgba(0,0,0,0.95) 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.22) 18%, rgba(0,0,0,0.62) 48%, rgba(0,0,0,0.95) 100%)",
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

/* =========================
 * ScoreText
 * ========================= */
function ScoreText({
  rank,
  metric,
  n,
  row,
  language,
}: {
  rank: 1 | 2 | 3;
  metric: MobileMetric;
  n: number;
  row: RankingRowWithCountry;
  language: Language;
}) {
  const s = rankPreset(rank);
  const scoreStyle = podiumScoreStyle(rank);

  if (
    metric === "totalScore" ||
    metric === "marginPrecision" ||
    metric === "upsetScore"
  ) {
    const showMeta = metric === "totalScore" || metric === "marginPrecision";
    const avg =
      metric === "totalScore"
        ? row.avgTotalScore
        : metric === "marginPrecision"
        ? row.avgMarginPrecision
        : null;

    return (
      <div className="flex flex-col items-end leading-none">
        <div
          className={[
            "inline-flex items-baseline justify-end gap-1 font-black tabular-nums leading-none",
            alfa.className,
          ].join(" ")}
        >
          <span className={s.scoreMain} style={scoreStyle}>
            {n.toFixed(1)}
          </span>
          <span
            className={s.scoreSub}
            style={{
              ...scoreStyle,
              transform: "translateY(-1px)",
            }}
          >
            pts
          </span>
        </div>

        {showMeta && (
          <span className="mt-1 inline-flex items-center gap-1 text-[11px] leading-none text-white/40">
            <span>avg {avg?.toFixed(1) ?? "0.0"}</span>
            <span>
              {postsLabel(language)}:{row.posts ?? 0}
            </span>
          </span>
        )}
      </div>
    );
  }

  if (metric === "streak") {
    return (
      <div className="flex flex-col items-end leading-none">
        <div
          className={[
            "inline-flex items-baseline justify-end gap-1 font-black tabular-nums leading-none",
            jp.className,
          ].join(" ")}
        >
          <span className={s.scoreMain} style={scoreStyle}>
            {Math.round(n)}
          </span>
          <span
            className={s.scoreSub}
            style={{
              ...scoreStyle,
              letterSpacing: "0.03em",
              transform: "translateY(-1px)",
            }}
          >
            {streakShortLabel(language)}
          </span>
        </div>

        <span className="mt-1 text-[11px] leading-none text-white/40">
          {postsLabel(language)} {row.posts ?? 0}
        </span>
      </div>
    );
  }

  if (metric === "winRate") {
    return (
      <div className="flex flex-col items-end leading-none">
        <div
          className={[
            "inline-flex items-baseline justify-end font-black tabular-nums leading-none",
            alfa.className,
          ].join(" ")}
        >
          <span className={s.scoreMain} style={scoreStyle}>
            {Math.round(n)}
          </span>

          <span
            className={[s.scoreSub, "ml-0.5"].join(" ")}
            style={{
              ...scoreStyle,
              transform: "translateY(-1px)",
            }}
          >
            %
          </span>
        </div>

        <span className="mt-1 text-[11px] leading-none text-white/40">
          {postsLabel(language)} {row.posts ?? 0}
        </span>
      </div>
    );
  }

  return null;
}

/* =========================
 * MonthlyTopPodium
 * ========================= */
export default function MonthlyTopPodium({
  rows,
  metric,
  language = "ja",
}: {
  rows: RankingRowWithCountry[];
  metric: MobileMetric;
  language?: Language;
}) {
  const reduceMotion = useReducedMotion();
  /** 1位→2位→3位の順に入場（step = rank - 1） */
  const cardFx = useMemo<Variants>(
    () => ({
      hidden: {
        opacity: 0,
        y: reduceMotion ? 0 : 14,
        scale: reduceMotion ? 1 : 0.99,
      },
      show: (step: number) => ({
        opacity: 1,
        y: 0,
        scale: 1,
        transition: reduceMotion
          ? { duration: 0 }
          : {
              duration: 0.45,
              delay: step * 0.18,
              ease: [0.22, 1, 0.36, 1],
            },
      }),
    }),
    [reduceMotion]
  );

  const pathname = usePathname() ?? "";
  const base =
    pathname.startsWith("/mobile") || pathname.startsWith("/m/")
      ? "/mobile"
      : "/web";

  const r1 = rows[0];
  const r2 = rows[1];
  const r3 = rows[2];

  const a1 = r1 ? metricNum(r1, metric) : { n: 0, d: 0 };
  const a2 = r2 ? metricNum(r2, metric) : null;
  const a3 = r3 ? metricNum(r3, metric) : null;

  const v1n = useRankCountUp(a1.n, 100, a1.d, !!r1);
  const v2n = useRankCountUp(a2?.n ?? 0, 900, a2?.d ?? 0, !!r2);
  const v3n = useRankCountUp(a3?.n ?? 0, 900, a3?.d ?? 0, !!r3);

  if (!r1) return null;

  const topRows = [
    r1 ? { rank: 1 as const, row: r1, value: v1n } : null,
    r2 ? { rank: 2 as const, row: r2, value: v2n } : null,
    r3 ? { rank: 3 as const, row: r3, value: v3n } : null,
  ].filter(Boolean) as Array<{
    rank: 1 | 2 | 3;
    row: RankingRowWithCountry;
    value: number;
  }>;

  return (
    <div className="px-3 pt-5 pb-1">
      <div className="flex flex-col gap-3">
        {topRows.map(({ rank, row, value }) => {
          const ink = rankInk(rank);
          const m = medal(rank);
          const s = rankPreset(rank);
          const countryCode = getCountryCode(row);

          return (
            <Link
              key={row.uid}
              href={`${base}/u/${row.handle || row.uid}`}
              className="block"
            >
              <motion.div
                className={[
                  "relative overflow-hidden rounded-[10px] border",
                  s.cardMinH,
                ].join(" ")}
                style={{
                  borderColor: m.ring,
                  backgroundColor: "rgba(255,255,255,0.055)",
                  boxShadow: [
                    rank === 1
                      ? "0 12px 30px rgba(0,0,0,0.24)"
                      : rank === 2
                      ? "0 10px 24px rgba(0,0,0,0.22)"
                      : "0 8px 20px rgba(0,0,0,0.20)",
                    "inset 0 1px 0 rgba(255,255,255,0.22)",
                    "inset 0 -1px 0 rgba(255,255,255,0.05)",
                    `inset 0 0 0 1px ${m.ring}`,
                    `0 0 18px ${m.glow}`,
                  ].join(", "),
                }}
                variants={cardFx}
                initial={reduceMotion ? "show" : "hidden"}
                animate="show"
                custom={rank - 1}
              >
                <FadedFlagBg rank={rank} countryCode={countryCode} />

                <div
                  className="pointer-events-none absolute inset-0"
                  style={{
                    background: `
                      linear-gradient(180deg, rgba(255,255,255,0.16) 0%, rgba(255,255,255,0.07) 18%, rgba(255,255,255,0.03) 38%, rgba(255,255,255,0.02) 100%),
                      radial-gradient(120% 90% at 0% 0%, rgba(255,255,255,0.12) 0%, transparent 42%),
                      radial-gradient(90% 70% at 100% 100%, ${m.tint} 0%, transparent 48%)
                    `,
                  }}
                />

                <div
                  className="pointer-events-none absolute left-3 right-3 top-0 h-px"
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
                    opacity: 0.34,
                  }}
                />

                <div
                  className="pointer-events-none absolute inset-x-0 bottom-0 h-[38%]"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.10) 100%)",
                  }}
                />

                <div className={["relative z-10", s.px, s.rowPy].join(" ")}>
                  <div
                    className={["flex items-center", s.gap, s.rowMinH].join(" ")}
                  >
                    <div
                      className={[
                        "flex shrink-0 items-center justify-center text-center font-black leading-none",
                        alfa.className,
                        s.rankW,
                        s.rankText,
                      ].join(" ")}
                      style={{
                        ...(rank === 2 ? ink.solidStyle : ink.gradStyle),
                        filter: rankDigitGlow(rank),
                      }}
                    >
                      {rank}
                    </div>

                    <div className="ml-2.5 flex shrink-0 items-center justify-center">
                      <AvatarCircle row={row} rank={rank} />
                    </div>

                    <div className="flex min-w-0 flex-1 items-center justify-center">
                      <div
                        className={[
                          "truncate text-center font-black leading-none tracking-[0.005em]",
                          jp.className,
                          s.nameText,
                        ].join(" ")}
                        style={{
                          color: "rgba(255,255,255,0.94)",
                        }}
                      >
                        <span
                          style={{
                            textShadow: [
                              "0 1px 1px rgba(0,0,0,0.32)",
                              "0 2px 4px rgba(0,0,0,0.18)",
                            ].join(", "),
                          }}
                        >
                          {row.displayName ?? row.handle ?? "Unknown"}
                        </span>
                      </div>
                    </div>

                    <div
                      className={[
                        "flex shrink-0 flex-col items-end justify-center",
                        s.scoreW,
                      ].join(" ")}
                    >
                      <ScoreText
                        rank={rank}
                        metric={metric}
                        n={Number(value)}
                        row={row}
                        language={language}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}