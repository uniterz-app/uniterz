"use client";

import { jp, nameOxanium, summaryMetricNumClass } from "@/lib/fonts";
import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import type { Language } from "@/lib/i18n/language";
import { postsLabel, streakShortLabel } from "@/lib/i18n/rankings";
import { useRankCountUp } from "@/lib/hooks/useCountUpRanking";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";
import { motion, useReducedMotion } from "framer-motion";
import type { Variants } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { RankingsAvatarCircle } from "@/app/component/rankings/RankingsAvatarCircle";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";

type Props = {
  rank: number | null;
  metric: MobileMetric;
  value: number;
  displayName: string;
  photoURL?: string | null;
  handle?: string | null;
  totalPosts?: number;
  loading?: boolean;
  /** 一覧はあるが自分順位・数値だけ未取得のときの解読風演出 */
  statsScramble?: boolean;
  language?: Language;
};

function formatValue(metric: MobileMetric, value: number) {
  if (metric === "winRate") return `${Math.round(value)}%`;
  if (metric === "streak") {
    return `${Math.round(value)}`;
  }
  return `${formatMetricDecimals(value, 1)} pts`;
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

const CARD_SHELL = {
  background:
    "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
  borderColor: "rgba(255,255,255,0.12)",
  boxShadow:
    "0 10px 30px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.2)",
} as const;

const numClass = summaryMetricNumClass;

/** ResultCardReveal と同系：ブラー段階解除＋初回エッジ発光 */
const MY_RANK_ENTER_EASE = [0.22, 1, 0.36, 1] as const;
const MY_RANK_ENTER_DURATION = 0.5;
const MY_RANK_BLUR_DURATION = 0.88;
const MY_RANK_BLUR_KEYFRAMES = [
  "blur(22px) brightness(0.88) saturate(0.82)",
  "blur(14px) brightness(0.93) saturate(0.9)",
  "blur(7px) brightness(0.97) saturate(0.96)",
  "blur(2px) brightness(0.99) saturate(0.99)",
  "blur(0px) brightness(1) saturate(1)",
] as const;
const MY_RANK_BLUR_TIMES = [0, 0.22, 0.42, 0.64, 1] as const;
const MY_RANK_EDGE_GLOW_INITIAL =
  "0 0 0 1px rgba(186,230,253,0.48), 0 0 36px rgba(34,211,238,0.4), 0 0 72px rgba(56,189,248,0.16), 0 0 100px rgba(14,165,233,0.07)";
const MY_RANK_EDGE_GLOW_CLEAR =
  "0 0 0 0px rgba(0,0,0,0), 0 0 0px rgba(0,0,0,0), 0 0 0px rgba(0,0,0,0), 0 0 0px rgba(0,0,0,0)";

const identityEase: [number, number, number, number] = [0.16, 0.82, 0.32, 1];
/** アバター・名前フェード */
const AVATAR_REVEAL_DURATION = 0.34;
const IDENTITY_DELAY_CHILDREN = 0.06;

/** ProfileHeroCard と同様：画像は motion せず、読み込み後に円ごとフェード */
const identityContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      delayChildren: IDENTITY_DELAY_CHILDREN,
      staggerChildren: 0,
    },
  },
};

const avatarIdentityItem: Variants = {
  hidden: { opacity: 0, scale: 0.94 },
  show: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: AVATAR_REVEAL_DURATION,
      ease: identityEase,
    },
  },
};

const nameIdentityItem: Variants = {
  hidden: { opacity: 0, y: 5 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: AVATAR_REVEAL_DURATION,
      ease: identityEase,
    },
  },
};

export default function MyRankCard({
  rank,
  metric,
  value,
  displayName,
  photoURL,
  handle,
  totalPosts,
  loading = false,
  statsScramble = false,
  language = "ja",
}: Props) {
  const reduceMotion = useReducedMotion();
  const ready = !loading;
  const rankStyle = getRankStyle(rank, loading || statsScramble);

  const [avatarMediaOk, setAvatarMediaOk] = useState(false);
  const avatarFadeReady = avatarMediaOk;
  const handleAvatarReady = useCallback((ok: boolean) => {
    setAvatarMediaOk(ok);
  }, []);

  const valueDecimals =
    metric === "totalScore" ||
    metric === "marginPrecision" ||
    metric === "upsetScore"
      ? 1
      : 0;

  const [showSideColumns, setShowSideColumns] = useState(false);
  const identityDoneRef = useRef(false);

  useEffect(() => {
    identityDoneRef.current = false;
    setShowSideColumns(false);
    setAvatarMediaOk(false);
  }, [metric]);

  const onIdentityAnimationComplete = useCallback(() => {
    if (identityDoneRef.current) return;
    identityDoneRef.current = true;
    setShowSideColumns(true);
  }, []);

  /** 子の show アニメ完了に相当するタイミング（hidden 時の onComplete 誤発火を避ける） */
  useEffect(() => {
    if (reduceMotion === true) return;
    if (!avatarFadeReady) return;
    const ms =
      Math.round((IDENTITY_DELAY_CHILDREN + AVATAR_REVEAL_DURATION) * 1000) + 55;
    const id = window.setTimeout(onIdentityAnimationComplete, ms);
    return () => clearTimeout(id);
  }, [avatarFadeReady, metric, reduceMotion, onIdentityAnimationComplete]);

  const rankCount = useRankCountUp(
    rank ?? 0,
    700,
    0,
    ready && showSideColumns && rank != null
  );

  const valueCount = useRankCountUp(
    value,
    720,
    valueDecimals,
    ready && showSideColumns
  );

  if (reduceMotion === true) {
    return (
      <div className="px-3 pt-3">
        <div
          className="relative overflow-hidden rounded-[18px] border px-4 py-3"
          style={CARD_SHELL}
          aria-busy={statsScramble || undefined}
        >
          <ShellGridOverlay roundedClassName="rounded-[18px]" />
          {statsScramble && !loading && (
            <span className="sr-only">
              {language === "en"
                ? "Loading your rank and stats"
                : "順位とスコアを読み込み中"}
            </span>
          )}
          <div className="relative z-1 flex items-center justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <RankingsAvatarCircle
              photoURL={photoURL}
              displayName={displayName}
              boxClassName="h-11 w-11"
              gateReady={ready}
              onDisplayReadyChange={handleAvatarReady}
            />
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
          <div className="flex flex-col items-center justify-center">
            <div
              className={[
                "text-[9px] font-semibold uppercase tracking-[0.16em] text-white/45",
                nameOxanium.className,
              ].join(" ")}
            >
              YOUR RANK
            </div>
            <div
              className={[numClass, "leading-none"].join(" ")}
              style={{
                fontSize: 18,
                color: rankStyle.color,
                textShadow: rankStyle.textShadow,
              }}
            >
              {loading
                ? "--"
                : rank
                    ? `#${rank}`
                    : "-"}
            </div>
          </div>
          <div className="flex flex-col items-end">
            {loading ? (
              <div
                className={[numClass, "text-[17px] leading-none text-white/90"].join(
                  " "
                )}
              >
                --
              </div>
            ) : metric === "streak" ? (
              <div
                className={[
                  "inline-flex items-baseline justify-end gap-1 leading-none",
                  jp.className,
                ].join(" ")}
                style={{
                  color: "rgba(255,255,255,0.9)",
                  textShadow: "0 0 10px rgba(255,255,255,0.08)",
                }}
              >
                <span className={[numClass, "text-[17px]"].join(" ")}>
                  {Math.round(value)}
                </span>
                <span
                  style={{
                    fontSize: 12,
                    letterSpacing: "0.03em",
                    transform: "translateY(-1px)",
                  }}
                >
                  {streakShortLabel(language)}
                </span>
              </div>
            ) : (
              <div
                className={[numClass, "text-[17px] leading-none text-white/90"].join(
                  " "
                )}
              >
                {formatValue(metric, value)}
              </div>
            )}
            {!loading && metric === "winRate" && totalPosts !== undefined && (
              <div className="text-[11px] text-white/40">
                {postsLabel(language)} {totalPosts}
              </div>
            )}
          </div>
          </div>
          <div
            className="pointer-events-none absolute inset-0 z-2 rounded-[18px]"
            style={{ boxShadow: "0 0 40px rgba(0,255,255,0.06)" }}
          />
        </div>
      </div>
    );
  }

  const centerContent = loading ? (
    "--"
  ) : rank == null ? (
    "-"
  ) : (
    `#${rankCount}`
  );

  return (
    <motion.div
      key={`my-rank-reveal-${metric}`}
      className="overflow-visible px-3 pt-3"
      initial={{
        opacity: 0,
        y: 22,
        filter: MY_RANK_BLUR_KEYFRAMES[0],
        boxShadow: MY_RANK_EDGE_GLOW_INITIAL,
      }}
      animate={{
        opacity: 1,
        y: 0,
        filter: [...MY_RANK_BLUR_KEYFRAMES],
        boxShadow: MY_RANK_EDGE_GLOW_CLEAR,
      }}
      transition={{
        opacity: { duration: MY_RANK_ENTER_DURATION, ease: MY_RANK_ENTER_EASE },
        y: { duration: MY_RANK_ENTER_DURATION + 0.04, ease: MY_RANK_ENTER_EASE },
        filter: {
          duration: MY_RANK_BLUR_DURATION,
          ease: "linear",
          times: [...MY_RANK_BLUR_TIMES],
        },
        boxShadow: { duration: 0.68, ease: MY_RANK_ENTER_EASE },
      }}
    >
      {statsScramble && !loading && (
        <span className="sr-only">
          {language === "en"
            ? "Loading your rank and stats"
            : "順位とスコアを読み込み中"}
        </span>
      )}
      <motion.div
        key={metric}
        className="relative overflow-hidden rounded-[18px] border px-4 py-3 will-change-[clip-path,filter]"
        aria-busy={statsScramble || undefined}
        style={{
          ...CARD_SHELL,
          transformOrigin: "50% 50%",
        }}
        initial={{
          clipPath: "inset(46% round 17px)",
          opacity: 0.75,
          scale: 0.97,
        }}
        animate={{
          clipPath: "inset(0% round 18px)",
          opacity: 1,
          scale: 1,
        }}
        transition={{
          duration: 0.48,
          ease: [0.2, 0.88, 0.32, 1],
        }}
      >
        <ShellGridOverlay roundedClassName="rounded-[18px]" />
        <div className="relative z-1 flex items-center justify-between">
        <motion.div
          key={`id-${metric}`}
          className="flex min-w-0 items-center gap-3"
          variants={identityContainer}
          initial="hidden"
          animate={avatarFadeReady ? "show" : "hidden"}
        >
          <motion.div variants={avatarIdentityItem} className="shrink-0">
            <RankingsAvatarCircle
              photoURL={photoURL}
              displayName={displayName}
              boxClassName="h-11 w-11"
              gateReady={ready}
              onDisplayReadyChange={handleAvatarReady}
            />
          </motion.div>

          <motion.div variants={nameIdentityItem} className="min-w-0">
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
          </motion.div>
        </motion.div>

        <motion.div
          className="flex flex-col items-center justify-center"
          initial={false}
          animate={{
            opacity: showSideColumns ? 1 : 0,
            y: showSideColumns ? 0 : 3,
          }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <div
            className={[
              "text-[9px] font-semibold uppercase tracking-[0.16em] text-white/45",
              nameOxanium.className,
            ].join(" ")}
          >
            YOUR RANK
          </div>
          <div
            className={[numClass, "leading-none"].join(" ")}
            style={{
              fontSize: 18,
              color: rankStyle.color,
              textShadow: rankStyle.textShadow,
            }}
          >
            {centerContent}
          </div>
        </motion.div>

        <motion.div
          className="flex flex-col items-end"
          initial={false}
          animate={{
            opacity: showSideColumns ? 1 : 0,
            y: showSideColumns ? 0 : 3,
          }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          {loading ? (
            <div
              className={[numClass, "text-[17px] leading-none text-white/90"].join(
                " "
              )}
            >
              --
            </div>
          ) : metric === "streak" ? (
            <div
              className={[
                "inline-flex items-baseline justify-end gap-1 leading-none",
                jp.className,
              ].join(" ")}
              style={{
                color: "rgba(255,255,255,0.9)",
                textShadow: "0 0 10px rgba(255,255,255,0.08)",
              }}
            >
              <span className={[numClass, "text-[17px]"].join(" ")}>
                {Math.round(valueCount)}
              </span>
              <span
                style={{
                  fontSize: 12,
                  letterSpacing: "0.03em",
                  transform: "translateY(-1px)",
                }}
              >
                {streakShortLabel(language)}
              </span>
            </div>
          ) : (
            <div
              className={[numClass, "text-[17px] leading-none text-white/90"].join(
                " "
              )}
            >
              {formatValue(metric, valueCount)}
            </div>
          )}
          {metric === "winRate" &&
            totalPosts !== undefined &&
            !loading && (
            <div className="text-[11px] text-white/40">
              {postsLabel(language)} {totalPosts}
            </div>
          )}
        </motion.div>
        </div>

        <div
          className="pointer-events-none absolute inset-0 z-2 rounded-[18px]"
          style={{ boxShadow: "0 0 40px rgba(0,255,255,0.06)" }}
        />
      </motion.div>
    </motion.div>
  );
}
