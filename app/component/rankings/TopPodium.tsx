"use client";

import type { RankingRow } from "@/lib/rankings/types";
import { jp, summaryMetricNumClass } from "@/lib/fonts";
import { RankingsAvatarCircle } from "@/app/component/rankings/RankingsAvatarCircle";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useMemo } from "react";
import type { MobileMetric, RankingRowWithCountry } from "./_data/mockRows";
import { metricNum } from "@/lib/rankings/metric";
import { useRankCountUp } from "@/lib/hooks/useCountUpRanking";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { postsLabel, streakShortLabel } from "@/lib/i18n/rankings";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import { RankDeltaBadge } from "@/app/component/rankings/RankDeltaBadge";
import { Crown } from "lucide-react";
import { profileHrefWithRankingsReturn } from "@/lib/navigation/rankingsProfileFrom";
import type { RankingPhase } from "@/lib/rankings/rankingPhase";
import type { PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import { FLAG_SRC, getCountryCode } from "@/lib/rankings/country";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { WcRankingStage } from "@/lib/rankings/wcRankingStage";

const rankHudNumClass = summaryMetricNumClass;

/** Top3 スコア列：順位ごとに色＋グロー */
function podiumScoreStyle(rank: 1 | 2 | 3) {
  if (rank === 1) {
    return {
      backgroundImage:
        "linear-gradient(180deg, #FFFDE8 0%, #FFE38A 22%, #FFBE3B 52%, #A65A00 100%)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      display: "inline-block",
    } as const;
  }
  if (rank === 2) {
    return {
      backgroundImage:
        "linear-gradient(180deg, #FFFFFF 0%, #F1F5F9 24%, #C7D2E0 54%, #6B778A 100%)",
      WebkitBackgroundClip: "text",
      backgroundClip: "text",
      color: "transparent",
      display: "inline-block",
    } as const;
  }
  return {
    backgroundImage:
      "linear-gradient(180deg, #FFF0DD 0%, #F3B97E 22%, #D07A2E 52%, #6F3410 100%)",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    display: "inline-block",
  } as const;
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

function PodiumCornerFrame({ rank }: { rank: 1 | 2 | 3 }) {
  const tone =
    rank === 1
      ? { c: "rgba(255,214,90,0.8)", g: "rgba(255,214,90,0.28)" }
      : rank === 2
        ? { c: "rgba(233,237,246,0.8)", g: "rgba(226,232,240,0.24)" }
        : { c: "rgba(213,154,90,0.8)", g: "rgba(213,154,90,0.24)" };
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      {rank === 1 ? (
        <>
          <div
            className="absolute left-[0.5px] top-[0.5px] bottom-[0.5px]"
            style={{ width: "0.6px", background: tone.c, boxShadow: `0 0 10px ${tone.g}` }}
          />
          <div
            className="absolute right-[0.5px] top-[0.5px] bottom-[0.5px]"
            style={{ width: "0.6px", background: tone.c, boxShadow: `0 0 10px ${tone.g}` }}
          />
          <div
            className="absolute bottom-[0.5px] left-[0.5px] right-[0.5px]"
            style={{ height: "0.6px", background: tone.c, boxShadow: `0 0 12px ${tone.g}` }}
          />
          <div
            className="absolute top-[0.5px] left-[0.5px]"
            style={{ width: "42px", height: "0.6px", background: tone.c, boxShadow: `0 0 10px ${tone.g}` }}
          />
          <div
            className="absolute top-[0.5px]"
            style={{ left: "100px", right: "0.5px", height: "0.6px", background: tone.c, boxShadow: `0 0 10px ${tone.g}` }}
          />
        </>
      ) : (
        <div
          className="absolute inset-0 border"
          style={{
            inset: "0.5px",
            borderColor: tone.c,
            borderWidth: 0.6,
            boxShadow: `0 0 12px ${tone.g}`,
          }}
        />
      )}
      <div className="absolute left-0 top-0 h-5 w-5 border-l-[2.5px] border-t-[2.5px]" style={{ borderColor: tone.c }} />
      <div className="absolute right-0 top-0 h-5 w-5 border-r-[2.5px] border-t-[2.5px]" style={{ borderColor: tone.c }} />
      <div className="absolute bottom-0 left-0 h-5 w-5 border-b-[2.5px] border-l-[2.5px]" style={{ borderColor: tone.c }} />
      <div className="absolute bottom-0 right-0 h-5 w-5 border-b-[2.5px] border-r-[2.5px]" style={{ borderColor: tone.c }} />
    </div>
  );
}

function rankInk(rank: 1 | 2 | 3) {
  const m = medal(rank);

  const solidStyle = { color: m.solid } as const;

  const gradStyle = {
    backgroundImage: m.grad,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    display: "inline-block",
  } as const;

  return { solidStyle, gradStyle };
}

/* =========================
 * Size presets
 * ========================= */
/** 1〜3 位で枠・行・アバター・スコア列幅を揃え、数字まわりだけ順位差を出す */
const podiumLayoutUnified = {
  cardMinH: "min-h-[66px] lg:min-h-[74px]",
  rowMinH: "min-h-[40px]",
  rowPy: "py-1",
  gap: "gap-2",
  px: "px-3",
  rankW: "w-[28px]",
  avatar: "h-[38px] w-[38px] lg:h-[44px] lg:w-[44px]",
  avatarText: "text-[15px] lg:text-[18px]",
  nameText: "text-[16px] lg:text-[19px]",
  scoreW: "w-[82px] shrink-0 text-right tabular-nums lg:w-[90px]",
} as const;

function rankPreset(rank: 1 | 2 | 3) {
  if (rank === 1) {
    return {
      ...podiumLayoutUnified,
      rankText: "text-[26px] lg:text-[33px]",
      scoreMain: "text-[25px] lg:text-[32px]",
      scoreSub: "text-[10px] lg:text-[13px]",
    };
  }
  if (rank === 2) {
    return {
      ...podiumLayoutUnified,
      rankText: "text-[22px] lg:text-[29px]",
      scoreMain: "text-[21px] lg:text-[28px]",
      scoreSub: "text-[9px] lg:text-[12px]",
    };
  }
  return {
    ...podiumLayoutUnified,
    rankText: "text-[20px] lg:text-[26px]",
    scoreMain: "text-[18px] lg:text-[25px]",
    scoreSub: "text-[9px] lg:text-[11px]",
  };
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

  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 w-[38%] overflow-hidden">
      <div
        className="absolute inset-y-[4%] right-0 w-full overflow-hidden rounded-none"
        style={{
          opacity: 0.64,
          boxShadow: `0 0 24px ${m.glow}`,
          backgroundImage: src
            ? undefined
            : "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.12) 42%, rgba(255,255,255,0.06) 100%)",
          maskImage:
            "linear-gradient(90deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.44) 20%, rgba(0,0,0,0.78) 50%, rgba(0,0,0,0.98) 100%)",
          WebkitMaskImage:
            "linear-gradient(90deg, rgba(0,0,0,0.16) 0%, rgba(0,0,0,0.44) 20%, rgba(0,0,0,0.78) 50%, rgba(0,0,0,0.98) 100%)",
        }}
      >
        {src ? (
          <img
            src={src}
            alt=""
            className="h-full w-full object-contain object-right"
            draggable={false}
          />
        ) : null}
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
            "inline-flex items-baseline justify-end gap-1 leading-none",
            rankHudNumClass,
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
            {t(language).rankings.pts}
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
            "inline-flex items-baseline justify-end gap-1 leading-none",
            jp.className,
          ].join(" ")}
        >
          <span
            className={[rankHudNumClass, s.scoreMain].join(" ")}
            style={scoreStyle}
          >
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
            "inline-flex items-baseline justify-end leading-none",
            rankHudNumClass,
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
 * TopPodium
 * ========================= */
export default function TopPodium({
  rows,
  metric,
  rankPhase,
  playoffRound,
  rankingLeague,
  wcStage,
  onTopCountDone,
  language = "ja",
}: {
  rows: RankingRowWithCountry[];
  metric: MobileMetric;
  /** ランキングからプロフィールへの戻り用 */
  rankPhase?: RankingPhase;
  /** プレーオフラウンドタブの戻り用 */
  playoffRound?: PlayoffRoundKey;
  /** NBA / WORLD CUP のリーグソース（戻りとプロフィール表示切替用） */
  rankingLeague?: RankingLeagueSource;
  /** WORLD CUP ステージ（overall / qualifying / main） */
  wcStage?: WcRankingStage;
  onTopCountDone?: () => void;
  /** 互換のため残置（未使用。表示のたび 1→2→3 順でアニメーション） */
  intro?: boolean;
  language?: Language;
}) {
  const reduceMotion = useReducedMotion();
  /** 順位 1,2,3 に対応した遅延（上から順番に入る） */
  const cardVariants = useMemo<Variants>(
    () => ({
      hidden: {
        opacity: 0,
        y: reduceMotion ? 0 : 12,
        filter: reduceMotion ? "blur(0px)" : "blur(10px)",
      },
      show: (step: number) => ({
        opacity: 1,
        y: 0,
        filter: "blur(0px)",
        transition: reduceMotion
          ? { duration: 0 }
          : {
              delay: 0.12 + step * 0.11,
              duration: 0.62,
              ease: [0.16, 0.82, 0.32, 1],
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
  const phaseForReturn = rankPhase ?? "playoffs";

  const r1 = rows[0];
  const r2 = rows[1];
  const r3 = rows[2];

  const a1 = r1 ? metricNum(r1, metric) : { n: 0, d: 0 };
  const a2 = r2 ? metricNum(r2, metric) : null;
  const a3 = r3 ? metricNum(r3, metric) : null;

  /** 1位カウント完了で4位以下を出す。表示は短いカードアニメと重ねる */
  const v1n = useRankCountUp(a1.n, 780, a1.d, !!r1, onTopCountDone);
  const v2n = useRankCountUp(a2?.n ?? 0, 520, a2?.d ?? 0, !!r2);
  const v3n = useRankCountUp(a3?.n ?? 0, 520, a3?.d ?? 0, !!r3);

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

          const profileHref = profileHrefWithRankingsReturn(
            pathname,
            base,
            row.handle || row.uid,
            { metric, phase: phaseForReturn, playoffRound, rankingLeague, wcStage }
          );
          return (
            <Link
              key={row.uid}
              href={profileHref}
              className="relative block"
            >
              {rank === 1 ? (
                <motion.div
                  className="pointer-events-none absolute left-[57px] top-[-9px] z-40 lg:left-[59px] lg:top-[-12px]"
                  initial={reduceMotion ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 4, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={reduceMotion ? { duration: 0 } : { delay: 0.42, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  <Crown
                    className="h-[18px] w-[24px] text-[#F4C542] lg:h-[21px] lg:w-[29px]"
                    fill="currentColor"
                    stroke="currentColor"
                    strokeWidth={1.7}
                    aria-hidden
                  />
                </motion.div>
              ) : null}
              <motion.div
                className={[
                  "relative overflow-hidden rounded-none border",
                  s.cardMinH,
                ].join(" ")}
                style={{
                  borderColor: m.ring,
                  background:
                    "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.045) 42%, rgba(8,13,24,0.86) 100%)",
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
                variants={cardVariants}
                initial={reduceMotion ? "show" : "hidden"}
                animate="show"
                custom={rank - 1}
              >
                <PodiumCornerFrame rank={rank} />
                <ShellGridOverlay roundedClassName="rounded-none" />
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

                <div
                  className={[
                    "relative z-10 flex h-full items-center",
                    s.px,
                    s.rowPy,
                  ].join(" ")}
                >
                  <div
                    className={["flex w-full items-center justify-between", s.rowMinH].join(" ")}
                  >
                    <div className={["flex min-w-0 items-center", s.gap].join(" ")}>
                      <div
                        className={[
                          "flex shrink-0 translate-y-[6px] items-center justify-center text-center leading-none",
                          rankHudNumClass,
                          s.rankW,
                          s.rankText,
                        ].join(" ")}
                        style={rank === 2 ? ink.solidStyle : ink.gradStyle}
                      >
                        {rank}
                      </div>

                      <div className="flex shrink-0 translate-y-[6px] items-center justify-center">
                        <RankingsAvatarCircle
                          photoURL={row.photoURL}
                          displayName={row.displayName ?? row.handle ?? "?"}
                          boxClassName={s.avatar}
                          initialTextClassName={s.avatarText}
                          gateReady
                        />
                      </div>

                      {/* バッジは SVG がはみ出すため、overflow-hidden は名前テキスト側のみにかける */}
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 max-w-full items-center gap-1">
                          <div
                            className={[
                              "min-w-0 truncate font-black leading-none tracking-[0.005em]",
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
                          <RankDeltaBadge delta={row.rankDeltaPlaces} />
                          {row.plan === "pro" ? (
                            <ProCyberBadge
                              {...proBadgeStaticMotion}
                              compact
                              ariaLabel={t(language).common.proMember}
                            />
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div
                      className={[
                        "flex shrink-0 translate-y-[6px] flex-col items-end justify-center",
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