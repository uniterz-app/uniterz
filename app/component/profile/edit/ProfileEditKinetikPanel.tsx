"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Eye } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import {
  KINETIK_GREEN,
  KINETIK_MAGENTA,
  KINETIK_CYAN,
  KINETIK_RED,
  PROFILE_EDIT_KINETIK_MOCK,
  type ProfileEditKinetikStats,
} from "./profileEditKinetikTypes";
import type { ProfileEditTronIdentity } from "./profileEditTronTypes";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";
import { nameOxanium } from "@/lib/fonts";
import { useCountUp } from "@/lib/hooks/useCountUp";
import { ProfileEditKinetikAvatarWithStreak } from "./ProfileEditKinetikStreakFx";
import { KINETIK_STREAK_VARIANT } from "./kinetikStreakFx";
import ProfileEditKinetikHeaderTabs from "./ProfileEditKinetikHeaderTabs";
import ProfileEditKinetikGlitchTitle from "./ProfileEditKinetikGlitchTitle";
import ProfileEditKinetikBadgeRow from "./ProfileEditKinetikBadgeRow";
import BadgeDetailModal from "@/app/component/badges/BadgeDetailModal";
import ProfileMetricInfoTip from "./ProfileMetricInfoTip";
import ProfileKinetikPanelFrame from "@/app/component/profile/ui/ProfileKinetikPanelFrame";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";
import {
  profilePlanProLuxuryClass,
  type ProfilePlanProLuxuryVariant,
} from "@/lib/profile/profilePlanProLuxuryVariants";
import "@/app/component/profile/pro/profilePlanProLuxuryVariants.css";
import CountryFlag from "@/app/component/games/CountryFlag";
import { ProCyberBadge } from "@/app/component/common/ProCyberBadge";
import { PROFILE_PLAN_PRO_METRIC_CARD_CLASS } from "@/lib/profile/profilePlanVisual";
import ProfilePlanProMetricsVariant from "@/app/component/profile/pro/ProfilePlanProMetricsVariant";
import type { ProfilePlanProMetricLayoutVariant } from "@/lib/profile/profilePlanProMetricLayoutVariants";
import { resolveKinetikRankBadge, resolveKinetikMenuAccent, resolveKinetikProfileAccent } from "./kinetikRankBadge";
import type { ResolvedBadge } from "@/lib/profile/useProfileBadges";
import { formatProfileMemberSince } from "@/lib/profile/formatProfileMemberSince";
import { shareProfileUrl } from "@/lib/profile/shareProfileUrl";
import {
  formatProfileMetricDayDelta,
  profileMetricDeltaTone,
} from "@/lib/profile/formatProfileMetricDelta";
import type { MyRankMetricValueDeltas } from "@/lib/rankings/myRankMetricValueDeltas";
import type { RankingLeagueSource } from "@/lib/rankings/rankingLeagueSource";
import type { ProfileVisualEffects } from "@/lib/profile/profileVisualEffects";
import { showProfilePlanProEffects } from "@/lib/profile/profileVisualEffects";
import {
  KINETIK_UPSET_METRIC_LABEL,
  kinetikMetricLabelUsesLatinUppercase,
} from "@/lib/profile/kinetikMetricDisplay";
import type {
  ProfileKinetikMetricsSection,
  WcKinetikStackedStage,
} from "@/lib/profile/profileKinetikMetricsSection";
import {
  PROFILE_WC_STACKED_STAGE_TAB_ORDER,
  profileWcStackedStageTabLabel,
  profileWcStackedStageTabsLabel,
} from "@/lib/profile/profileWcStackedStageTabs";
import {
  CyberSlantedTab,
  CyberSlantedTabBar,
} from "@/app/component/rankings/CyberSlantedTab";
import type { ProfileKinetikMetricsPeriod } from "@/lib/profile/useNbaKinetikMonthlyStats";

type Accent = "green" | "magenta" | "cyan" | "red";

const ACCENT: Record<
  Accent,
  { line: string; fill: string; glow: string; text: string }
> = {
  green: {
    line: KINETIK_GREEN,
    fill: KINETIK_GREEN,
    glow: "rgba(168,255,42,0.35)",
    text: "rgba(255,255,255,0.92)",
  },
  magenta: {
    line: KINETIK_MAGENTA,
    fill: KINETIK_MAGENTA,
    glow: "rgba(255,43,214,0.35)",
    text: "rgba(255,255,255,0.92)",
  },
  cyan: {
    line: KINETIK_CYAN,
    fill: KINETIK_CYAN,
    glow: "rgba(34,211,238,0.35)",
    text: "rgba(255,255,255,0.92)",
  },
  red: {
    line: KINETIK_RED,
    fill: KINETIK_RED,
    glow: "rgba(255,71,87,0.35)",
    text: "rgba(255,255,255,0.92)",
  },
};

function KinetikSegBar({
  filled,
  total = 5,
  accent,
  reduceMotion,
  startDelay = 0,
  isPlanPro = false,
}: {
  filled: number;
  total?: number;
  accent: Accent;
  reduceMotion: boolean;
  startDelay?: number;
  isPlanPro?: boolean;
}) {
  const colors = ACCENT[accent];
  const segVariants = {
    hidden: { scaleX: 0, opacity: 0.35 },
    visible: (i: number) => ({
      scaleX: 1,
      opacity: 1,
      transition: {
        duration: 0.22,
        delay: reduceMotion ? 0 : startDelay + i * 0.075,
        ease: [0.22, 1, 0.36, 1] as const,
      },
    }),
  };

  return (
    <div
      className={isPlanPro ? "profile-plan-pro-metric-card__seg-row flex gap-[4px]" : "flex gap-[3px]"}
      role="presentation"
    >
      {Array.from({ length: total }).map((_, i) => {
        const lit = i < filled;
        return (
          <motion.div
            key={i}
            custom={i}
            variants={segVariants}
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            className={[
              "min-w-0 flex-1",
              isPlanPro ? "profile-plan-pro-metric-card__seg h-[5px]" : "h-[5px]",
            ].join(" ")}
            style={{
              transformOrigin: "left center",
              background: lit ? colors.fill : "rgba(255,255,255,0.08)",
              boxShadow: lit
                ? isPlanPro
                  ? `0 0 8px color-mix(in srgb, ${colors.glow} 40%, transparent), inset 0 1px 0 rgba(255,255,255,0.28)`
                  : `0 0 6px ${colors.glow}`
                : undefined,
            }}
          />
        );
      })}
    </div>
  );
}

function MetricCard({
  label,
  value,
  rankLabel,
  footnote,
  accent,
  filledSegs,
  layout,
  delay,
  segmentsReady = true,
  showSegBar = true,
  unit,
  unitHint,
  dayDelta,
  dayDeltaTitle,
  dayDeltaTone,
  rankBelowSegBar = false,
  reduceUiMotion = false,
  isPlanPro = false,
  language = "ja",
}: {
  label: string;
  value: string;
  rankLabel?: string;
  /** 勝率カード下など — 控えめな補足（投稿数・的中数など） */
  footnote?: string;
  accent: Accent;
  filledSegs: number;
  layout: "web" | "mobile";
  delay: number;
  segmentsReady?: boolean;
  showSegBar?: boolean;
  /** 値横の単位（pts など） */
  unit?: string;
  /** ラベル横の単位ヒント */
  unitHint?: string;
  dayDelta?: string | null;
  dayDeltaTitle?: string;
  dayDeltaTone?: "up" | "down" | null;
  /** 順位バッジをセグバーの下に置く（総合得点など） */
  rankBelowSegBar?: boolean;
  reduceUiMotion?: boolean;
  isPlanPro?: boolean;
  language?: "ja" | "en";
}) {
  const reduceMotion = reduceUiMotion || useReducedMotion() === true;
  const colors = ACCENT[accent];
  const valueHasUnit = value.includes("%");
  const labelLatinUpper = kinetikMetricLabelUsesLatinUppercase(label);
  const showRankInline = rankLabel && segmentsReady && !rankBelowSegBar;
  const showRankBelow = rankLabel && segmentsReady && rankBelowSegBar;

  const rankBadge = showRankInline || showRankBelow ? (
    <motion.span
      className={[
        nameOxanium.className,
        "shrink-0 border border-white/12 bg-transparent font-semibold tracking-[0.08em] text-white/55",
        rankBelowSegBar ? "inline-block" : "mb-px",
        isPlanPro ? "profile-plan-pro-metric-rank" : "",
        layout === "web"
          ? "px-2 py-0.5 text-[11px]"
          : "px-1.5 py-[2px] text-[9px]",
      ].join(" ")}
      initial={reduceMotion ? false : { opacity: 0, x: -4 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{
        duration: 0.24,
        delay: reduceMotion ? 0 : delay + 0.14,
        ease: [0.22, 1, 0.36, 1],
      }}
    >
      {rankLabel}
    </motion.span>
  ) : null;

  return (
    <motion.div
      className={[
        "relative border border-white/10 bg-transparent",
        isPlanPro
          ? `${PROFILE_PLAN_PRO_METRIC_CARD_CLASS} profile-plan-pro-metric-card--${accent}`
          : "",
        layout === "web" ? "p-4 md:p-5" : "p-3.5",
      ].join(" ")}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {isPlanPro ? (
        <span
          className="profile-plan-pro-metric-card__bar-bloom"
          style={{
            background: `linear-gradient(90deg, ${colors.glow} 0%, transparent 72%)`,
          }}
          aria-hidden
        />
      ) : null}
      <div
        className={[
          "absolute top-3 bottom-3 left-0",
          isPlanPro ? "profile-plan-pro-metric-card__bar w-[4px]" : "w-[2px]",
        ].join(" ")}
        style={{
          background: colors.line,
          /** Pro は矩形シャドウを使わず bloom グラデでにじませる */
          boxShadow: isPlanPro ? "none" : `0 0 8px ${colors.glow}`,
        }}
        aria-hidden
      />
      {isPlanPro ? (
        <span className="profile-plan-pro-metric-card__sheen" aria-hidden />
      ) : null}
      <div className="relative z-[1] flex min-w-0 items-center gap-1 pl-2.5 pr-0.5">
        <div className="flex min-w-0 flex-1 items-baseline gap-1 overflow-hidden">
          <p
            className={[
              nameOxanium.className,
              "min-w-0 truncate whitespace-nowrap",
              labelLatinUpper ? "uppercase tracking-[0.14em]" : "tracking-[0.06em]",
              isPlanPro ? "profile-plan-pro-metric-card__label" : "",
              layout === "web"
                ? "text-[11px] text-white/72 md:text-xs md:text-white/78"
                : "text-[9px] text-white/62",
            ].join(" ")}
          >
            {label}
          </p>
          {unitHint ? (
            <span
              className={[
                nameOxanium.className,
                "shrink-0 whitespace-nowrap uppercase tracking-[0.08em]",
                isPlanPro ? "profile-plan-pro-metric-card__unit-hint" : "text-white/38",
                layout === "web" ? "text-[9px]" : "text-[8px]",
              ].join(" ")}
            >
              {unitHint}
            </span>
          ) : null}
        </div>
      </div>
      <div
        className={[
          nameOxanium.className,
          "relative z-[1] mt-1.5 flex flex-wrap items-end gap-x-1.5 gap-y-0.5 pl-2.5 leading-none",
        ].join(" ")}
      >
        <span
          className={[
            "font-semibold tabular-nums tracking-tight",
            isPlanPro ? "profile-plan-pro-metric-card__value" : "",
            layout === "mobile"
              ? "text-[17px]"
              : "text-[30px] md:text-[32px]",
          ].join(" ")}
          style={{ color: isPlanPro ? colors.line : colors.text }}
        >
          {value}
        </span>
        {unit && !valueHasUnit ? (
          <span
            className={[
              nameOxanium.className,
              "mb-0.5 font-medium tracking-[0.06em] uppercase",
              isPlanPro ? "profile-plan-pro-metric-card__unit" : "text-white/45",
              layout === "web" ? "text-[11px] md:text-xs" : "text-[9px]",
            ].join(" ")}
          >
            {unit}
          </span>
        ) : null}
        {dayDelta ? (
          <span
            className={[
              nameOxanium.className,
              "mb-0.5 font-bold tabular-nums tracking-tight",
              layout === "web"
                ? "text-[13px] md:text-[15px]"
                : "text-[9px]",
              dayDeltaTone === "up"
                ? "text-[#a8ff2a]"
                : dayDeltaTone === "down"
                  ? "text-white/42"
                  : "text-white/55",
            ].join(" ")}
            title={dayDeltaTitle}
          >
            {dayDelta}
          </span>
        ) : null}
        {showRankInline ? rankBadge : null}
      </div>
      {showSegBar ? (
        <div className="relative z-[1] mt-2.5 pl-2.5">
          {segmentsReady ? (
            <KinetikSegBar
              key={`${accent}-${filledSegs}-${rankLabel ?? "none"}`}
              filled={filledSegs}
              accent={accent}
              reduceMotion={reduceMotion}
              startDelay={delay + 0.18}
              isPlanPro={isPlanPro}
            />
          ) : (
            <div className="h-[5px]" aria-hidden />
          )}
        </div>
      ) : null}
      {showRankBelow ? (
        <div className="relative z-[1] mt-2 pl-2.5">{rankBadge}</div>
      ) : null}
      {footnote ? (
        <p
          className={[
            nameOxanium.className,
            "relative z-[1] mt-1.5 pl-2.5 leading-tight tabular-nums",
            isPlanPro ? "profile-plan-pro-metric-card__footnote" : "",
            layout === "mobile"
              ? "text-[10px] tracking-[0.06em] text-white/62"
              : "text-[14px] tracking-[0.08em] text-white/78 md:text-[15px]",
          ].join(" ")}
        >
          {footnote}
        </p>
      ) : null}
    </motion.div>
  );
}

/** 勝率セグメント: 100% = 5/5 */
function kinetikWinRateSegs(winRate: number): number {
  return Math.round((Math.min(100, Math.max(0, winRate)) / 100) * 5);
}

/** 総合得点セグメント: 順位1位 = 5/5（母数に対する相対順位） */
function kinetikTotalPointsRankSegs(
  rank: number | null | undefined,
  denominator: number | null | undefined
): number {
  if (
    typeof rank !== "number" ||
    !Number.isFinite(rank) ||
    typeof denominator !== "number" ||
    !Number.isFinite(denominator) ||
    rank < 1 ||
    denominator < 1
  ) {
    return 0;
  }
  const safeRank = Math.min(Math.floor(rank), Math.floor(denominator));
  const safeDenom = Math.floor(denominator);
  const ratio = (safeDenom - safeRank + 1) / safeDenom;
  return Math.max(0, Math.min(5, Math.round(ratio * 5)));
}

/** 名前行インライン国旗（Native / 参考レイアウト） */
function ProfileKinetikNameFlag({ countryCode }: { countryCode?: string | null }) {
  const flagIso = countryCode?.trim().toUpperCase() || null;
  if (!flagIso) return null;

  return (
    <span className="profile-edit-kinetik-name-flag inline-flex shrink-0 items-center self-center">
      <CountryFlag
        iso2={flagIso}
        variant="profileInline"
        decorative
        alt={flagIso}
      />
    </span>
  );
}

/** ヘッダー: 参加日 / ID / 閲覧数（Unit は別コンポ） */
function ProfileKinetikViewCountChip({
  viewCount,
  viewCountAriaLabel,
}: {
  viewCount: number;
  viewCountAriaLabel: string | null;
}) {
  return (
    <p
      className="profile-edit-kinetik-view-count shrink-0"
      aria-label={viewCountAriaLabel ?? undefined}
      title={viewCountAriaLabel ?? undefined}
    >
      <Eye
        className="profile-edit-kinetik-view-count__icon"
        aria-hidden
        strokeWidth={2.5}
      />
      <span className="profile-edit-kinetik-view-count__num">
        {viewCount.toLocaleString("en-US")}
      </span>
    </p>
  );
}

function ProfileKinetikIdentityJoinIdRow({
  memberSinceLabel,
  systemId,
  shareLabel,
  shareCopiedLabel,
  shareCopied,
  onShare,
}: {
  memberSinceLabel: string | null;
  systemId: string;
  shareLabel: string;
  shareCopiedLabel: string;
  shareCopied: boolean;
  onShare: () => void;
}) {
  if (!memberSinceLabel && !systemId) return null;

  return (
    <div className="profile-edit-kinetik-identity-join-id mt-1 flex w-fit max-w-full min-w-0 items-end justify-start gap-2">
      {memberSinceLabel ? (
        <p className="profile-edit-kinetik-footer-ref profile-edit-kinetik-footer-ref--identity shrink-0 whitespace-nowrap">
          {memberSinceLabel}
        </p>
      ) : null}
      {systemId ? (
        <button
          type="button"
          className={[
            "profile-edit-kinetik-footer-ref profile-edit-kinetik-footer-ref--identity",
            "profile-edit-kinetik-footer-ref--id shrink-0 whitespace-nowrap transition",
            "hover:text-white/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
          ].join(" ")}
          onClick={onShare}
          aria-label={shareLabel}
          title={shareCopied ? shareCopiedLabel : shareLabel}
        >
          {shareCopied ? shareCopiedLabel : `ID: ${systemId}`}
        </button>
      ) : null}
    </div>
  );
}

/** ゲーム内通貨 — 金貨ディスク + イタリック数字（U8）。corner は右上コンパクト */
function ProfileUnitVault({
  balance,
  ariaLabel,
  corner,
}: {
  balance: number;
  ariaLabel: string;
  corner?: boolean;
}) {
  const reduceMotion = useReducedMotion() === true;
  /** Web ランキング系と同系統のカウントアップ（約 0.9s） */
  const displayBalance = useCountUp(balance, 900, !reduceMotion, 0, "target");
  return (
    <motion.div
      className={[
        "profile-edit-kinetik-unit-vault",
        corner ? "profile-edit-kinetik-unit-vault--corner" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      aria-label={ariaLabel}
      title={ariaLabel}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.86, y: -4 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={
        reduceMotion
          ? { duration: 0 }
          : { type: "spring", stiffness: 380, damping: 22, mass: 0.7 }
      }
    >
      <span className="profile-edit-kinetik-unit-vault__disc" aria-hidden>
        <span className="profile-edit-kinetik-unit-vault__sheen" />
        <span className="profile-edit-kinetik-unit-vault__disc-inner">U</span>
      </span>
      <span
        className={[
          nameOxanium.className,
          "profile-edit-kinetik-unit-vault__value",
        ].join(" ")}
      >
        {displayBalance.toLocaleString("en-US")}
      </span>
    </motion.div>
  );
}

function getKinetikMetricCopy(isJa: boolean, opts?: { monthly?: boolean }) {
  const monthly = opts?.monthly === true;
  return {
    dayDeltaTitle: isJa ? "前日比" : "Day-over-day",
    ptsUnit: "pts",
    matchUnit: isJa ? "試合" : "matches",
    winRateUnitHint: "%",
    cumulativeUnitHint: monthly
      ? isJa
        ? "今月"
        : "MO"
      : isJa
        ? "累計"
        : "CUM",
    metricsInfoAria: isJa ? "統計項目の説明" : "Stats metric help",
    winRateTooltip: isJa
      ? "確定試合の的中率。100% = 全試合的中。"
      : "Hit rate on settled picks. 100% = all picks correct.",
    totalPointsTooltip: isJa
      ? monthly
        ? "勝者的中・スコア精度・アップセット等を合算した今月の総合得点。"
        : "勝者的中・スコア精度・アップセット等を合算した期間内の総合得点。"
      : monthly
        ? "Combined score from wins, precision, upsets, and bonuses for this month."
        : "Combined score from wins, precision, upsets, and bonuses for the period.",
    scorePrecisionTooltip: isJa
      ? monthly
        ? "予想スコアと実際スコアの近さを0〜10で評価し、今月の合計を算出。"
        : "予想スコアと実際スコアの近さを0〜10で評価し、期間内の合計を算出。"
      : monthly
        ? "Sum of 0–10 score-accuracy ratings per settled pick this month."
        : "Sum of 0–10 score-accuracy ratings per settled pick in the period.",
    exactHitTooltip: isJa
      ? "予想スコアが結果と完全一致した試合数（期間内の累計）。"
      : "Number of matches where your predicted score exactly matched the final score.",
    upsetTooltip: isJa
      ? monthly
        ? "アップセットが起きた試合で少数派を当てたときだけ加点。今月の合計。"
        : "アップセットが起きた試合で少数派を当てたときだけ加点。期間内の累計。"
      : monthly
        ? "Bonus points when you picked the minority side on an upset. Month total."
        : "Bonus points when you picked the minority side on an upset. Period total.",
    shareProfile: isJa ? "プロフィールを共有" : "Share profile",
    shareCopied: isJa ? "コピー済" : "Copied",
    proMember: isJa ? "Pro 会員" : "Pro member",
  };
}

function buildKinetikMetricsInfoMessage(
  copy: ReturnType<typeof getKinetikMetricCopy>,
  opts: { isJa: boolean; isWcProfile: boolean }
): string {
  const { isJa, isWcProfile } = opts;
  const precisionLabel = isWcProfile
    ? isJa
      ? "完全的中"
      : "Exact hits"
    : isJa
      ? "スコア精度"
      : "Precision";
  const precisionTip = isWcProfile
    ? copy.exactHitTooltip
    : copy.scorePrecisionTooltip;

  return [
    `${isJa ? "勝率" : "Win rate"} — ${copy.winRateTooltip}`,
    `${isJa ? "総合得点" : "Total points"} — ${copy.totalPointsTooltip}`,
    `${precisionLabel} — ${precisionTip}`,
    `${KINETIK_UPSET_METRIC_LABEL} — ${copy.upsetTooltip}`,
  ].join("\n\n");
}

function MetricsGridSkeleton({ layout }: { layout: "web" | "mobile" }) {
  return (
    <div
      className={[
        "grid grid-cols-2 gap-2 p-2",
        layout === "web" ? "gap-3 p-3" : "",
      ].join(" ")}
      aria-busy
      aria-label="Loading stats"
    >
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className={[
            "relative border border-white/10 bg-transparent",
            layout === "web" ? "p-4 md:p-5" : "p-3.5",
          ].join(" ")}
        >
          <div
            className={[
              "skeleton-scan rounded-none bg-white/10",
              layout === "web" ? "h-3 w-20" : "h-2.5 w-16",
            ].join(" ")}
          />
          <div
            className={[
              "skeleton-scan mt-3 rounded-none bg-white/10",
              layout === "web" ? "h-8 w-28" : "h-7 w-24",
            ].join(" ")}
          />
        </div>
      ))}
    </div>
  );
}

type Props = {
  layout: "web" | "mobile";
  identity?: ProfileEditTronIdentity;
  stats?: ProfileEditKinetikStats;
  language?: "ja" | "en";
  editable?: boolean;
  canOpenMenu?: boolean;
  onOpenMenu?: () => void;
  menuUnreadCount?: number;
  /** 連勝数（省略時は stats.winStreak ?? 0） */
  winStreak?: number;
  /** 総合得点順位（省略時は stats.totalPointsRank） */
  totalPointsRank?: number | null;
  /** 順位母数（省略時は stats.totalPointsRankDenominator） */
  totalPointsRankDenominator?: number | null;
  /** 順位変動（省略時は stats.rankDeltaPlaces） */
  rankDeltaPlaces?: number | null;
  /** 主要メトリクス上のグリッチタイトル */
  metricsTitle?: string;
  /** タイトル ◀▶ でスコープ切替 */
  onToggleMetricsScope?: () => void;
  badges?: ResolvedBadge[];
  onBadgeClick?: (badge: ResolvedBadge) => void;
  bio?: string | null;
  countryCode?: string | null;
  memberSinceMs?: number | null;
  isPro?: boolean;
  /** dev: PRO メトリクスレイアウト案 */
  planProMetricLayout?: ProfilePlanProMetricLayoutVariant;
  /** dev: PRO 背景 FX バリエーション */
  planProBgVariant?: ProfilePlanProBgVariant;
  /** dev: PRO 豪華化案（/dev/profile-plan-pro-luxury-showcase） */
  planProLuxuryVariant?: ProfilePlanProLuxuryVariant;
  shareHandle?: string;
  metricValueDeltas?: MyRankMetricValueDeltas | null;
  /** WC プロフィールでは完全的中（整数）を表示 */
  rankingLeague?: RankingLeagueSource;
  /** 他人プロフィールではメトリクスカードのモーションを抑える（連勝 FX は維持） */
  visualEffects?: ProfileVisualEffects;
  /** スタッツ API 取得中 — メトリクス欄のみスケルトン表示 */
  statsPending?: boolean;
  /** WC: ノックアウト（上）+ グループ（下）の縦積み */
  stackedMetricsSections?: ProfileKinetikMetricsSection[];
  /** NBA: Playoffs / Season 切替 */
  metricsPeriod?: ProfileKinetikMetricsPeriod;
  onMetricsPeriodChange?: (period: ProfileKinetikMetricsPeriod) => void;
  /** 累計プロフィール閲覧数（公開） */
  profileViewCount?: number | null;
  /** 保有 Unit（公開） */
  unitBalance?: number | null;
};

export default function ProfileEditKinetikPanel({
  layout,
  identity = PROFILE_EDIT_KINETIK_MOCK.identity,
  stats = PROFILE_EDIT_KINETIK_MOCK.stats,
  language = "ja",
  editable = false,
  winStreak,
  totalPointsRank: totalPointsRankProp,
  totalPointsRankDenominator: totalPointsRankDenominatorProp,
  rankDeltaPlaces: rankDeltaPlacesProp,
  metricsTitle,
  onToggleMetricsScope,
  badges = [],
  onBadgeClick,
  bio,
  countryCode = null,
  memberSinceMs = null,
  isPro = false,
  planProMetricLayout,
  planProBgVariant,
  planProLuxuryVariant,
  shareHandle,
  metricValueDeltas = null,
  rankingLeague = "nba",
  visualEffects = "full",
  statsPending = false,
  stackedMetricsSections,
  metricsPeriod,
  onMetricsPeriodChange,
  profileViewCount = null,
  unitBalance = null,
}: Props) {
  const isJa = language === "ja";
  const isWcProfile = rankingLeague === "worldcup";
  const isSeasonMetrics =
    !isWcProfile && metricsPeriod === "season" && !!onMetricsPeriodChange;
  const showNbaPeriodTabs =
    !isWcProfile && metricsPeriod != null && !!onMetricsPeriodChange;
  const reduceUiMotion =
    useReducedMotion() === true || visualEffects === "lite";
  const animatePlanProBg =
    isPro && showProfilePlanProEffects(isPro) && useReducedMotion() !== true;
  const planProBgAccentReady = !statsPending;
  const metricCopy = getKinetikMetricCopy(isJa, { monthly: isSeasonMetrics });
  const metricsInfoMessage = buildKinetikMetricsInfoMessage(metricCopy, {
    isJa,
    isWcProfile,
  });
  const metricsInfoControl = (
    <span className="profile-edit-kinetik-metrics-info shrink-0">
      <ProfileMetricInfoTip
        label={metricsInfoMessage}
        ariaLabel={metricCopy.metricsInfoAria}
        compact
        planPro={isPro}
      />
    </span>
  );
  const [shareCopied, setShareCopied] = useState(false);
  const [badgeDetail, setBadgeDetail] = useState<ResolvedBadge | null>(null);
  const memberSinceLabel = formatProfileMemberSince(memberSinceMs, language);
  const profileViewCountAria =
    profileViewCount == null
      ? null
      : isJa
        ? `プロフィール閲覧数 ${profileViewCount.toLocaleString("ja-JP")}`
        : `${profileViewCount.toLocaleString("en-US")} profile views`;
  const unitBalanceAria =
    unitBalance == null
      ? null
      : isJa
        ? `保有 Unit ${unitBalance.toLocaleString("ja-JP")}`
        : `${unitBalance.toLocaleString("en-US")} Units`;
  const shareTargetHandle = shareHandle?.trim() || identity.handle?.trim() || "";

  const handleShareProfile = useCallback(async () => {
    if (!shareTargetHandle) return;
    const ok = await shareProfileUrl({
      handle: shareTargetHandle,
      displayName: identity.displayName,
      variant: layout,
      language,
    });
    if (ok) {
      setShareCopied(true);
      window.setTimeout(() => setShareCopied(false), 2200);
    }
  }, [identity.displayName, language, layout, shareTargetHandle]);

  const handleBadgeClick = useCallback(
    (badge: ResolvedBadge) => {
      if (onBadgeClick) {
        onBadgeClick(badge);
        return;
      }
      setBadgeDetail(badge);
    },
    [onBadgeClick]
  );

  const badgeDetailModal =
    badgeDetail != null ? (
      <BadgeDetailModal
        badge={badgeDetail}
        language={language}
        shine={layout === "mobile"}
        onClose={() => setBadgeDetail(null)}
      />
    ) : null;

  const activeWinStreak = Math.max(
    0,
    Math.floor(winStreak ?? stats.winStreak ?? 0)
  );
  const activeTotalPointsRank =
    totalPointsRankProp ?? stats.totalPointsRank ?? null;
  const activeRankDenominator =
    totalPointsRankDenominatorProp ?? stats.totalPointsRankDenominator ?? null;
  const activeRankDelta =
    rankDeltaPlacesProp ?? stats.rankDeltaPlaces ?? null;
  const rankBadge = resolveKinetikRankBadge({
    totalPointsRank: activeTotalPointsRank,
    totalPointsRankDenominator: activeRankDenominator,
    rankDeltaPlaces: activeRankDelta,
    language,
  });
  const menuAccent = resolveKinetikMenuAccent({
    totalPointsRank: activeTotalPointsRank,
    rankBadge,
  });
  const profileAccent = resolveKinetikProfileAccent({
    streak: activeWinStreak,
    totalPointsRank: activeTotalPointsRank,
    rankBadge,
  });

  const wcStackedActive =
    isWcProfile &&
    stackedMetricsSections != null &&
    stackedMetricsSections.length > 0;
  const metricsSectionTitle = isWcProfile
    ? metricsTitle ?? "WORLD CUP // STATS"
    : metricsTitle ?? "NBA // PLAYOFFS STATS";

  const [wcStackedStage, setWcStackedStage] =
    useState<WcKinetikStackedStage>("main");
  const wcStackedAvailableStages = useMemo(
    () =>
      PROFILE_WC_STACKED_STAGE_TAB_ORDER.filter((stage) =>
        stackedMetricsSections?.some((section) => section.wcStage === stage)
      ),
    [stackedMetricsSections]
  );
  useEffect(() => {
    if (wcStackedAvailableStages.length === 0) return;
    setWcStackedStage((prev) =>
      wcStackedAvailableStages.includes(prev) ? prev : wcStackedAvailableStages[0]!
    );
  }, [wcStackedAvailableStages]);
  const showWcStackedStageTabs = wcStackedAvailableStages.length > 1;
  const activeWcStackedSection =
    stackedMetricsSections?.find((section) => section.wcStage === wcStackedStage) ??
    stackedMetricsSections?.[0] ??
    null;

  const dayDeltaTitle = metricCopy.dayDeltaTitle;

  const renderMetricsGrid = (
    sectionStats: ProfileEditKinetikStats,
    sectionDeltas: MyRankMetricValueDeltas | null,
    sectionRank: {
      totalPointsRank: number | null;
      totalPointsRankDenominator: number | null;
    }
  ) => {
    const sectionWinRateFootnote = isJa
      ? `投稿 ${sectionStats.posts} · 的中 ${sectionStats.hits}`
      : `${sectionStats.hits} hits · ${sectionStats.posts} posts`;
    const sectionWinSegs = kinetikWinRateSegs(sectionStats.winRate);
    const sectionPtsSegs = kinetikTotalPointsRankSegs(
      sectionRank.totalPointsRank,
      sectionRank.totalPointsRankDenominator
    );
    const sectionTotalPointsRankLabel =
      sectionRank.totalPointsRank != null
        ? isJa
          ? `${sectionRank.totalPointsRank}位`
          : `#${sectionRank.totalPointsRank}`
        : undefined;
    const sectionPtsSegmentsReady =
      sectionRank.totalPointsRankDenominator != null &&
      Number.isFinite(sectionRank.totalPointsRankDenominator) &&
      sectionRank.totalPointsRankDenominator >= 1;
    const sectionWinRateDelta = formatProfileMetricDayDelta(
      "winRate",
      sectionDeltas?.winRate
    );
    const sectionTotalPointsDelta = formatProfileMetricDayDelta(
      "totalPoints",
      sectionDeltas?.totalPoints
    );
    const sectionPrecisionDelta = formatProfileMetricDayDelta(
      "scorePrecision",
      sectionDeltas?.totalPrecision,
      { integer: isWcProfile }
    );
    const sectionUpsetDelta = formatProfileMetricDayDelta(
      "upset",
      sectionDeltas?.totalUpset
    );

    if (isPro && planProMetricLayout) {
      return (
        <div className="profile-plan-pro-metrics-embedded">
          <ProfilePlanProMetricsVariant
            variant={planProMetricLayout}
            layout={layout}
            language={language}
            data={{
              winRate: sectionStats.winRate,
              posts: sectionStats.posts,
              hits: sectionStats.hits,
              totalPoints: sectionStats.totalPoints,
              totalPointsRank: sectionRank.totalPointsRank,
              scorePrecision: sectionStats.scorePrecision,
              upset: sectionStats.upset,
              winSegs: kinetikWinRateSegs(sectionStats.winRate),
              ptsSegs: kinetikTotalPointsRankSegs(
                sectionRank.totalPointsRank,
                sectionRank.totalPointsRankDenominator
              ),
            }}
          />
        </div>
      );
    }

    return (
      <div
        className={[
          "grid grid-cols-2 gap-2 p-2",
          layout === "web" ? "gap-3 p-3" : "",
          isPro ? "profile-plan-pro-metrics-grid" : "",
        ].join(" ")}
      >
        <MetricCard
          label={isJa ? "勝率" : "WIN RATE"}
          value={`${formatMetricDecimals(sectionStats.winRate, 1)}%`}
          footnote={sectionWinRateFootnote}
          accent="green"
          filledSegs={sectionWinSegs}
          layout={layout}
          delay={0.04}
          unitHint={metricCopy.winRateUnitHint}
          dayDelta={sectionWinRateDelta}
          dayDeltaTitle={dayDeltaTitle}
          dayDeltaTone={profileMetricDeltaTone(sectionDeltas?.winRate ?? null)}
          isPlanPro={isPro}
          reduceUiMotion={reduceUiMotion}
          language={language}
        />
        <MetricCard
          label={isJa ? "総合得点" : "TOTAL PTS"}
          value={sectionStats.totalPoints.toLocaleString()}
          rankLabel={sectionTotalPointsRankLabel}
          accent="magenta"
          filledSegs={sectionPtsSegs}
          layout={layout}
          delay={0.08}
          segmentsReady={sectionPtsSegmentsReady}
          rankBelowSegBar
          unit={metricCopy.ptsUnit}
          unitHint={metricCopy.cumulativeUnitHint}
          dayDelta={
            sectionTotalPointsDelta
              ? `${sectionTotalPointsDelta} ${metricCopy.ptsUnit}`
              : null
          }
          dayDeltaTitle={dayDeltaTitle}
          dayDeltaTone={profileMetricDeltaTone(
            sectionDeltas?.totalPoints ?? null
          )}
          isPlanPro={isPro}
          reduceUiMotion={reduceUiMotion}
          language={language}
        />
        <MetricCard
          label={
            isWcProfile
              ? isJa
                ? "完全的中"
                : "EXACT HITS"
              : isJa
                ? "スコア精度"
                : "PRECISION"
          }
          value={
            isWcProfile
              ? String(Math.max(0, Math.round(sectionStats.scorePrecision)))
              : formatMetricDecimals(sectionStats.scorePrecision, 1)
          }
          accent="cyan"
          filledSegs={0}
          layout={layout}
          delay={0.12}
          showSegBar={false}
          unit={isWcProfile ? metricCopy.matchUnit : metricCopy.ptsUnit}
          unitHint={metricCopy.cumulativeUnitHint}
          dayDelta={
            sectionPrecisionDelta
              ? isWcProfile
                ? `${sectionPrecisionDelta} ${metricCopy.matchUnit}`
                : `${sectionPrecisionDelta} ${metricCopy.ptsUnit}`
              : null
          }
          dayDeltaTitle={dayDeltaTitle}
          dayDeltaTone={profileMetricDeltaTone(
            sectionDeltas?.totalPrecision ?? null,
            { positiveOnly: isWcProfile }
          )}
          isPlanPro={isPro}
          reduceUiMotion={reduceUiMotion}
          language={language}
        />
        <MetricCard
          label={KINETIK_UPSET_METRIC_LABEL}
          value={formatMetricDecimals(sectionStats.upset, 1)}
          accent="red"
          filledSegs={0}
          layout={layout}
          delay={0.16}
          showSegBar={false}
          unit={metricCopy.ptsUnit}
          unitHint={metricCopy.cumulativeUnitHint}
          dayDelta={
            sectionUpsetDelta ? `${sectionUpsetDelta} ${metricCopy.ptsUnit}` : null
          }
          dayDeltaTitle={dayDeltaTitle}
          dayDeltaTone={profileMetricDeltaTone(
            sectionDeltas?.totalUpset ?? null
          )}
          isPlanPro={isPro}
          reduceUiMotion={reduceUiMotion}
          language={language}
        />
      </div>
    );
  };

  const metricsGrid = renderMetricsGrid(stats, metricValueDeltas, {
    totalPointsRank: activeTotalPointsRank,
    totalPointsRankDenominator: activeRankDenominator,
  });

  const proMobileStage = isPro && layout === "mobile";
  const metricsSectionDividerClass = proMobileStage
    ? "px-2 py-1.5"
    : "border-b border-white/8 px-2 py-1.5";
  const wcStageTabWrapClass = proMobileStage
    ? "overflow-visible px-2.5 py-2"
    : "overflow-visible border-b border-white/8 px-2.5 py-2";

  const metricsContent = statsPending ? (
    <MetricsGridSkeleton layout={layout} />
  ) : wcStackedActive && activeWcStackedSection ? (
    <div>
      {showWcStackedStageTabs ? (
        <div className={wcStageTabWrapClass}>
          <CyberSlantedTabBar
            fill
            aria-label={profileWcStackedStageTabsLabel(language)}
          >
            {wcStackedAvailableStages.map((stage) => (
              <CyberSlantedTab
                key={stage}
                role="tab"
                label={profileWcStackedStageTabLabel(stage, language)}
                active={wcStackedStage === stage}
                onClick={() => setWcStackedStage(stage)}
                compact
              />
            ))}
          </CyberSlantedTabBar>
        </div>
      ) : null}
      <div>
        <div className={metricsSectionDividerClass}>
          {!showWcStackedStageTabs ? (
            <ProfileEditKinetikGlitchTitle compact={layout === "mobile"}>
              {activeWcStackedSection.title}
            </ProfileEditKinetikGlitchTitle>
          ) : null}
          <div
            className={[
              "flex items-center justify-between gap-2",
              showWcStackedStageTabs ? undefined : "mt-1.5",
            ].join(" ")}
          >
            <div className="min-w-0 flex-1">
              <ProfileEditKinetikHeaderTabs
                rankBadge={activeWcStackedSection.rankBadge}
                winStreak={activeWcStackedSection.winStreak}
                language={language}
                compact={layout === "mobile"}
              />
            </div>
            {metricsInfoControl}
          </div>
        </div>
        {renderMetricsGrid(
          activeWcStackedSection.stats,
          activeWcStackedSection.metricValueDeltas,
          {
            totalPointsRank: activeWcStackedSection.totalPointsRank,
            totalPointsRankDenominator:
              activeWcStackedSection.totalPointsRankDenominator,
          }
        )}
      </div>
    </div>
  ) : (
    <div>
      {showNbaPeriodTabs ? (
        <div className={wcStageTabWrapClass}>
          <CyberSlantedTabBar
            fill
            aria-label={isJa ? "統計の期間" : "Stats period"}
          >
            <CyberSlantedTab
              role="tab"
              label="PLAYOFF"
              active={metricsPeriod === "playoffs"}
              onClick={() => onMetricsPeriodChange?.("playoffs")}
              compact
            />
            <CyberSlantedTab
              role="tab"
              label="26-27"
              active={metricsPeriod === "season"}
              onClick={() => onMetricsPeriodChange?.("season")}
              compact
            />
          </CyberSlantedTabBar>
        </div>
      ) : null}
      <div className={metricsSectionDividerClass}>
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <ProfileEditKinetikHeaderTabs
              rankBadge={rankBadge}
              winStreak={activeWinStreak}
              language={language}
              compact={layout === "mobile"}
            />
          </div>
          {metricsInfoControl}
        </div>
      </div>
      {metricsGrid}
    </div>
  );

  const unitCorner =
    unitBalance != null && unitBalanceAria ? (
      <ProfileUnitVault
        // UI 確認用モック（実残高が 0 のとき 1,000 を表示）
        balance={unitBalance > 0 ? unitBalance : 1000}
        ariaLabel={unitBalanceAria}
        corner
      />
    ) : null;

  const viewUnderAvatar =
    profileViewCount != null ? (
      <div className="profile-edit-kinetik-avatar-views mt-1.5">
        <ProfileKinetikViewCountChip
          viewCount={profileViewCount}
          viewCountAriaLabel={profileViewCountAria}
        />
      </div>
    ) : null;

  const metricsScopeHeader = (
    <div
      className={[
        "profile-edit-kinetik-metrics-scope-header",
        onToggleMetricsScope
          ? "profile-edit-kinetik-metrics-scope-header--picker profile-edit-kinetik-metrics-scope-header--toggle"
          : "profile-edit-kinetik-metrics-scope-header--static",
        isPro ? "profile-edit-kinetik-metrics-scope-header--pro" : "",
      ].join(" ")}
    >
      {onToggleMetricsScope ? (
        <>
          <button
            type="button"
            className="profile-edit-kinetik-metrics-scope-nav profile-edit-kinetik-metrics-scope-nav--prev"
            onClick={onToggleMetricsScope}
            aria-label={isJa ? "前のスポーツ統計" : "Previous sport stats"}
          >
            <span
              className="profile-edit-kinetik-metrics-scope-arrow profile-edit-kinetik-metrics-scope-arrow--left"
              aria-hidden
            />
          </button>
          <button
            type="button"
            className="profile-edit-kinetik-metrics-scope-title profile-edit-kinetik-metrics-scope-title--breath"
            onClick={onToggleMetricsScope}
            aria-label={isJa ? "統計の種目を切り替え" : "Switch stats league"}
          >
            <ProfileEditKinetikGlitchTitle compact={layout === "mobile"}>
              {metricsSectionTitle}
            </ProfileEditKinetikGlitchTitle>
          </button>
          <button
            type="button"
            className="profile-edit-kinetik-metrics-scope-nav profile-edit-kinetik-metrics-scope-nav--next"
            onClick={onToggleMetricsScope}
            aria-label={isJa ? "次のスポーツ統計" : "Next sport stats"}
          >
            <span
              className="profile-edit-kinetik-metrics-scope-arrow profile-edit-kinetik-metrics-scope-arrow--right"
              aria-hidden
            />
          </button>
        </>
      ) : (
        <div className="profile-edit-kinetik-metrics-scope-title profile-edit-kinetik-metrics-scope-title--static">
          <ProfileEditKinetikGlitchTitle compact={layout === "mobile"}>
            {metricsSectionTitle}
          </ProfileEditKinetikGlitchTitle>
        </div>
      )}
    </div>
  );

  const isWeb = layout === "web";

  const luxuryClass = profilePlanProLuxuryClass(planProLuxuryVariant);

  if (isWeb) {
    return (
      <>
      <ProfileKinetikPanelFrame
        isPlanPro={isPro}
        animatePlanProBg={animatePlanProBg}
        planProBgVariant={planProBgVariant}
        web
        profileAccent={profileAccent}
        planProBgAccentReady={planProBgAccentReady}
        className={[
          "profile-edit-kinetik-card profile-edit-kinetik-card--web relative w-full",
          `profile-kinetik-panel--accent-${profileAccent}`,
          luxuryClass,
        ].join(" ")}
      >
        <div className="profile-edit-kinetik-layout-web grid md:grid-cols-[minmax(300px,36%)_1fr]">
          <aside className="profile-edit-kinetik-layout-web__side relative flex flex-col overflow-visible border-b border-white/10 px-6 py-7 md:border-r md:border-b-0 md:px-7 md:py-8">
            <div className="flex flex-col items-stretch text-left">
              <div className="flex items-start gap-4 sm:gap-5">
                <div className="profile-edit-kinetik-avatar-column shrink-0 items-start">
                  <ProfileEditKinetikAvatarWithStreak
                    variant={KINETIK_STREAK_VARIANT}
                    streak={activeWinStreak}
                    accentKey={menuAccent}
                    isPlanPro={isPro}
                    language={language}
                    photoURL={identity.photoURL}
                    displayName={identity.displayName}
                    editable={editable}
                  />
                  {viewUnderAvatar}
                </div>
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <div className="profile-edit-kinetik-name-with-flag flex min-w-0 items-center gap-2">
                      <h2
                        className={[
                          nameOxanium.className,
                          "leading-none font-bold italic tracking-tight text-white",
                          "text-[22px] sm:text-[24px] md:text-[26px]",
                          isPro
                            ? "profile-plan-pro-display-name inline-block w-fit max-w-full truncate"
                            : "min-w-0 truncate",
                        ].join(" ")}
                      >
                        {identity.displayName}
                      </h2>
                      <ProfileKinetikNameFlag countryCode={countryCode} />
                    </div>
                    {isPro ? (
                      <ProCyberBadge
                        premium
                        ariaLabel={metricCopy.proMember}
                      />
                    ) : null}
                    {unitCorner ? (
                      <div className="ml-auto shrink-0">{unitCorner}</div>
                    ) : null}
                  </div>
                  <div className="mt-1 w-full">
                    <ProfileKinetikIdentityJoinIdRow
                      memberSinceLabel={memberSinceLabel}
                      systemId={identity.systemId}
                      shareLabel={metricCopy.shareProfile}
                      shareCopiedLabel={metricCopy.shareCopied}
                      shareCopied={shareCopied}
                      onShare={handleShareProfile}
                    />
                  </div>
                </div>
              </div>
              {bio?.trim() ? (
                <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-white/50 md:text-[15px]">
                  {bio.trim()}
                </p>
              ) : null}
              {badges.length > 0 ? (
                <div className="profile-edit-kinetik-badge-bridge mt-3 w-full overflow-visible">
                  <ProfileEditKinetikBadgeRow
                    badges={badges}
                    layout={layout}
                    onBadgeClick={handleBadgeClick}
                    variant="proBridge"
                  />
                </div>
              ) : null}
            </div>
          </aside>

          <div className="profile-edit-kinetik-layout-web__main flex min-w-0 flex-col px-6 py-7 md:px-7 md:py-8">
            <div className="overflow-visible bg-transparent">
              {metricsScopeHeader}
              {metricsContent}
            </div>
          </div>
        </div>
      </ProfileKinetikPanelFrame>
      {badgeDetailModal}
      </>
    );
  }

  return (
    <>
    <ProfileKinetikPanelFrame
      isPlanPro={isPro}
      animatePlanProBg={animatePlanProBg}
      planProBgVariant={planProBgVariant}
      proMobileStage={isPro}
      profileAccent={profileAccent}
      planProBgAccentReady={planProBgAccentReady}
      className={[
        "profile-edit-kinetik-card relative mx-auto w-full max-w-[520px]",
        isPro ? "profile-edit-kinetik-card--pro-mobile p-3 sm:p-4" : "p-4 sm:p-5",
        layout === "mobile" ? "profile-edit-kinetik-card--compact" : "",
        `profile-kinetik-panel--accent-${profileAccent}`,
        luxuryClass,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {isPro ? (
        <div className="profile-edit-kinetik-mobile-stage">
          <div className="profile-edit-kinetik-mobile-hero">
            <div className="profile-edit-kinetik-header relative flex gap-3 sm:gap-4">
            <div className="profile-edit-kinetik-avatar-column">
              <ProfileEditKinetikAvatarWithStreak
                variant={KINETIK_STREAK_VARIANT}
                streak={activeWinStreak}
                accentKey={menuAccent}
                isPlanPro={isPro}
                language={language}
                photoURL={identity.photoURL}
                displayName={identity.displayName}
                editable={editable}
              />
              {viewUnderAvatar}
            </div>
            <div className="profile-edit-kinetik-header__meta profile-edit-kinetik-header__meta--stacked min-w-0 flex-1">
              <div className="profile-edit-kinetik-header__identity">
                <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                  <div className="profile-edit-kinetik-name-with-flag flex min-w-0 items-center gap-1.5">
                    <h2
                      className={[
                        nameOxanium.className,
                        "text-[16px] leading-none font-bold italic tracking-tight text-white sm:text-[18px]",
                        "profile-plan-pro-display-name inline-block w-fit max-w-full truncate",
                      ].join(" ")}
                    >
                      {identity.displayName}
                    </h2>
                    <ProfileKinetikNameFlag countryCode={countryCode} />
                  </div>
                  <ProCyberBadge premium ariaLabel={metricCopy.proMember} />
                  {unitCorner ? (
                    <div className="ml-auto shrink-0">{unitCorner}</div>
                  ) : null}
                </div>
                <ProfileKinetikIdentityJoinIdRow
                  memberSinceLabel={memberSinceLabel}
                  systemId={identity.systemId}
                  shareLabel={metricCopy.shareProfile}
                  shareCopiedLabel={metricCopy.shareCopied}
                  shareCopied={shareCopied}
                  onShare={handleShareProfile}
                />
              </div>
            </div>
          </div>
          {bio?.trim() ? (
            <p className="profile-edit-kinetik-header__bio profile-edit-kinetik-header__bio--pro-mobile mt-2.5 line-clamp-3 text-xs leading-relaxed text-white/55">
              {bio.trim()}
            </p>
          ) : null}
          </div>

          {badges.length > 0 ? (
            <div className="profile-edit-kinetik-badge-bridge">
              <ProfileEditKinetikBadgeRow
                badges={badges}
                layout={layout}
                onBadgeClick={handleBadgeClick}
                variant="proBridge"
              />
            </div>
          ) : (
            <div className="profile-edit-kinetik-badge-bridge profile-edit-kinetik-badge-bridge--empty" aria-hidden />
          )}

          <div className="profile-edit-kinetik-mobile-metrics">
            {metricsScopeHeader}
            {metricsContent}
          </div>
        </div>
      ) : (
        <div className="profile-edit-kinetik-header-block">
          <div className="profile-edit-kinetik-header relative flex gap-3 sm:gap-4">
            <div className="profile-edit-kinetik-avatar-column">
              <ProfileEditKinetikAvatarWithStreak
                variant={KINETIK_STREAK_VARIANT}
                streak={activeWinStreak}
                accentKey={menuAccent}
                isPlanPro={isPro}
                language={language}
                photoURL={identity.photoURL}
                displayName={identity.displayName}
                editable={editable}
              />
              {viewUnderAvatar}
            </div>
            <div className="profile-edit-kinetik-header__meta profile-edit-kinetik-header__meta--stacked min-w-0 flex-1">
              <div className="profile-edit-kinetik-header__identity">
                <div className="profile-edit-kinetik-name-with-flag flex min-w-0 flex-wrap items-center gap-1.5">
                  <h2
                    className={[
                      nameOxanium.className,
                      "min-w-0 truncate text-[16px] leading-none font-bold italic tracking-tight text-white sm:text-[18px]",
                    ].join(" ")}
                  >
                    {identity.displayName}
                  </h2>
                  <ProfileKinetikNameFlag countryCode={countryCode} />
                  {unitCorner ? (
                    <div className="ml-auto shrink-0">{unitCorner}</div>
                  ) : null}
                </div>
                <ProfileKinetikIdentityJoinIdRow
                  memberSinceLabel={memberSinceLabel}
                  systemId={identity.systemId}
                  shareLabel={metricCopy.shareProfile}
                  shareCopiedLabel={metricCopy.shareCopied}
                  shareCopied={shareCopied}
                  onShare={handleShareProfile}
                />
              </div>
            </div>
            <div
              className="profile-edit-kinetik-hatch pointer-events-none absolute top-0 right-0 h-16 w-24 opacity-40"
              aria-hidden
            />
          </div>
          {bio?.trim() ? (
            <p className="profile-edit-kinetik-header__bio mt-3 line-clamp-3 text-xs leading-relaxed text-white/50">
              {bio.trim()}
            </p>
          ) : null}
        </div>
      )}

      {!isPro && badges.length > 0 ? (
        <div className="mt-4">
          <ProfileEditKinetikBadgeRow
            badges={badges}
            layout={layout}
            onBadgeClick={handleBadgeClick}
          />
        </div>
      ) : null}

      {!isPro ? (
      <div className="mt-3 overflow-visible bg-transparent">
        {metricsScopeHeader}
        {metricsContent}
      </div>
      ) : null}

    </ProfileKinetikPanelFrame>
    {badgeDetailModal}
    </>
  );
}
