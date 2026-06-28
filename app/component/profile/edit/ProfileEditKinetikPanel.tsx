"use client";

import { useCallback, useState } from "react";
import { Menu } from "lucide-react";
import {
  CYBER_MENU_ICON_CLASS,
  CYBER_MENU_ICON_STROKE,
} from "@/lib/ui/cyberMenuButton";
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
import { ProfileEditKinetikAvatarWithStreak } from "./ProfileEditKinetikStreakFx";
import { KINETIK_STREAK_VARIANT } from "./kinetikStreakFx";
import ProfileEditKinetikHeaderTabs from "./ProfileEditKinetikHeaderTabs";
import ProfileEditKinetikGlitchTitle from "./ProfileEditKinetikGlitchTitle";
import ProfileEditKinetikBadgeRow from "./ProfileEditKinetikBadgeRow";
import ProfileMetricInfoTip from "./ProfileMetricInfoTip";
import ProfileKinetikPanelFrame from "@/app/component/profile/ui/ProfileKinetikPanelFrame";
import CountryFlag from "@/app/component/games/CountryFlag";
import { ProCyberBadge } from "@/app/component/common/ProCyberBadge";
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
import type { ProfileKinetikMetricsSection } from "@/lib/profile/profileKinetikMetricsSection";

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
}: {
  filled: number;
  total?: number;
  accent: Accent;
  reduceMotion: boolean;
  startDelay?: number;
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
    <div className="flex gap-[3px]" role="presentation">
      {Array.from({ length: total }).map((_, i) => {
        const lit = i < filled;
        return (
          <motion.div
            key={i}
            custom={i}
            variants={segVariants}
            initial={reduceMotion ? false : "hidden"}
            animate="visible"
            className="h-[5px] min-w-0 flex-1"
            style={{
              transformOrigin: "left center",
              background: lit ? colors.fill : "rgba(255,255,255,0.08)",
              boxShadow: lit ? `0 0 6px ${colors.glow}` : undefined,
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
  tooltip,
  dayDelta,
  dayDeltaTitle,
  dayDeltaTone,
  rankBelowSegBar = false,
  reduceUiMotion = false,
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
  tooltip?: string;
  dayDelta?: string | null;
  dayDeltaTitle?: string;
  dayDeltaTone?: "up" | "down" | null;
  /** 順位バッジをセグバーの下に置く（総合得点など） */
  rankBelowSegBar?: boolean;
  reduceUiMotion?: boolean;
}) {
  const reduceMotion = reduceUiMotion || useReducedMotion() === true;
  const colors = ACCENT[accent];
  const valueHasUnit = value.includes("%");
  const showRankInline = rankLabel && segmentsReady && !rankBelowSegBar;
  const showRankBelow = rankLabel && segmentsReady && rankBelowSegBar;

  const rankBadge = showRankInline || showRankBelow ? (
    <motion.span
      className={[
        nameOxanium.className,
        "shrink-0 border border-white/12 bg-transparent font-semibold tracking-[0.08em] text-white/55",
        rankBelowSegBar ? "inline-block" : "mb-px",
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
        layout === "web" ? "p-4 md:p-5" : "p-3.5",
      ].join(" ")}
      initial={reduceMotion ? false : { opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
    >
      <div
        className="absolute top-3 bottom-3 left-0 w-[2px]"
        style={{ background: colors.line, boxShadow: `0 0 8px ${colors.glow}` }}
        aria-hidden
      />
      <div className="flex items-center gap-1 pl-2.5">
        <p
          className={[
            nameOxanium.className,
            "tracking-[0.14em] uppercase",
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
              "tracking-[0.08em] text-white/38 uppercase",
              layout === "web" ? "text-[9px]" : "text-[8px]",
            ].join(" ")}
          >
            {unitHint}
          </span>
        ) : null}
        {tooltip ? <ProfileMetricInfoTip label={tooltip} compact /> : null}
      </div>
      <div
        className={[
          nameOxanium.className,
          "mt-1.5 flex flex-wrap items-end gap-x-1.5 gap-y-0.5 pl-2.5 leading-none",
        ].join(" ")}
      >
        <span
          className={[
            "font-semibold tabular-nums tracking-tight",
            layout === "mobile"
              ? "text-[17px]"
              : "text-[30px] md:text-[32px]",
          ].join(" ")}
          style={{ color: colors.text }}
        >
          {value}
        </span>
        {unit && !valueHasUnit ? (
          <span
            className={[
              nameOxanium.className,
              "mb-0.5 font-medium tracking-[0.06em] text-white/45 uppercase",
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
        <div className="mt-2.5 pl-2.5">
          {segmentsReady ? (
            <KinetikSegBar
              key={`${accent}-${filledSegs}-${rankLabel ?? "none"}`}
              filled={filledSegs}
              accent={accent}
              reduceMotion={reduceMotion}
              startDelay={delay + 0.18}
            />
          ) : (
            <div className="h-[5px]" aria-hidden />
          )}
        </div>
      ) : null}
      {showRankBelow ? (
        <div className="mt-2 pl-2.5">{rankBadge}</div>
      ) : null}
      {footnote ? (
        <p
          className={[
            nameOxanium.className,
            "mt-1.5 pl-2.5 leading-tight tabular-nums",
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

function ProfileKinetikIdentityIdChip({
  systemId,
  shareLabel,
  shareCopiedLabel,
  shareCopied,
  onShare,
}: {
  systemId: string;
  shareLabel: string;
  shareCopiedLabel: string;
  shareCopied: boolean;
  onShare: () => void;
}) {
  if (!systemId) return null;

  return (
    <button
      type="button"
      className={[
        "profile-edit-kinetik-footer-ref mt-1 inline-block max-w-full truncate transition",
        "hover:text-white/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
      ].join(" ")}
      onClick={onShare}
      aria-label={shareLabel}
      title={shareCopied ? shareCopiedLabel : shareLabel}
    >
      {shareCopied ? shareCopiedLabel : `ID: ${systemId}`}
    </button>
  );
}

function ProfileKinetikIdentityMetaRow({
  memberSinceLabel,
  countryCode,
  systemId,
  shareLabel,
  shareCopiedLabel,
  shareCopied,
  onShare,
  align = "start",
}: {
  memberSinceLabel: string | null;
  countryCode?: string | null;
  systemId: string;
  shareLabel: string;
  shareCopiedLabel: string;
  shareCopied: boolean;
  onShare: () => void;
  align?: "start" | "center";
}) {
  const flagIso = countryCode?.trim().toUpperCase() || null;

  return (
    <div
      className={[
        "flex w-full items-center justify-between gap-3",
        align === "center" ? "self-center" : "self-start",
      ].join(" ")}
    >
      <div className="flex min-w-0 items-center gap-2">
        {flagIso ? (
          <CountryFlag
            iso2={flagIso}
            variant="inline"
            className="h-[0.56rem] w-[0.75rem] shrink-0 sm:h-[0.6rem] sm:w-[0.8rem]"
            alt={flagIso}
          />
        ) : null}
        <p className="profile-edit-kinetik-footer-ref min-w-0 truncate">
          {memberSinceLabel ?? ""}
        </p>
      </div>
      <button
        type="button"
        className={[
          "profile-edit-kinetik-footer-ref shrink-0 transition",
          "hover:text-white/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
        ].join(" ")}
        onClick={onShare}
        aria-label={shareLabel}
        title={shareCopied ? shareCopiedLabel : shareLabel}
      >
        {shareCopied ? shareCopiedLabel : `ID: ${systemId}`}
      </button>
    </div>
  );
}

function getKinetikMetricCopy(isJa: boolean) {
  return {
    dayDeltaTitle: isJa ? "前日比" : "Day-over-day",
    ptsUnit: "pts",
    matchUnit: isJa ? "試合" : "matches",
    winRateUnitHint: "%",
    cumulativeUnitHint: isJa ? "累計" : "CUM",
    winRateTooltip: isJa
      ? "確定試合の的中率。100% = 全試合的中。"
      : "Hit rate on settled picks. 100% = all picks correct.",
    totalPointsTooltip: isJa
      ? "勝者的中・スコア精度・アップセット等を合算した期間内の総合得点。"
      : "Combined score from wins, precision, upsets, and bonuses for the period.",
    scorePrecisionTooltip: isJa
      ? "予想スコアと実際スコアの近さを0〜10で評価し、期間内の合計を算出。"
      : "Sum of 0–10 score-accuracy ratings per settled pick in the period.",
    exactHitTooltip: isJa
      ? "予想スコアが結果と完全一致した試合数（期間内の累計）。"
      : "Number of matches where your predicted score exactly matched the final score.",
    upsetTooltip: isJa
      ? "アップセットが起きた試合で少数派を当てたときだけ加点。期間内の累計。"
      : "Bonus points when you picked the minority side on an upset. Period total.",
    shareProfile: isJa ? "プロフィールを共有" : "Share profile",
    shareCopied: isJa ? "コピー済" : "Copied",
    proMember: isJa ? "Pro 会員" : "Pro member",
  };
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
};

export default function ProfileEditKinetikPanel({
  layout,
  identity = PROFILE_EDIT_KINETIK_MOCK.identity,
  stats = PROFILE_EDIT_KINETIK_MOCK.stats,
  language = "ja",
  editable = false,
  canOpenMenu = false,
  onOpenMenu,
  menuUnreadCount = 0,
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
  shareHandle,
  metricValueDeltas = null,
  rankingLeague = "nba",
  visualEffects = "full",
  statsPending = false,
  stackedMetricsSections,
}: Props) {
  const isJa = language === "ja";
  const isWcProfile = rankingLeague === "worldcup";
  const reduceUiMotion =
    useReducedMotion() === true || visualEffects === "lite";
  const metricCopy = getKinetikMetricCopy(isJa);
  const [shareCopied, setShareCopied] = useState(false);
  const memberSinceLabel = formatProfileMemberSince(memberSinceMs, language);
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
  const metricsSectionTitle = wcStackedActive
    ? "WORLD CUP // STATS"
    : metricsTitle ?? "WORLD CUP // GROUP STAGE STATS";
  const flagIso = countryCode?.trim().toUpperCase() || null;

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

    return (
      <div
        className={[
          "grid grid-cols-2 gap-2 p-2",
          layout === "web" ? "gap-3 p-3" : "",
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
          tooltip={metricCopy.winRateTooltip}
          dayDelta={sectionWinRateDelta}
          dayDeltaTitle={dayDeltaTitle}
          dayDeltaTone={profileMetricDeltaTone(sectionDeltas?.winRate ?? null)}
          reduceUiMotion={reduceUiMotion}
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
          tooltip={metricCopy.totalPointsTooltip}
          dayDelta={
            sectionTotalPointsDelta
              ? `${sectionTotalPointsDelta} ${metricCopy.ptsUnit}`
              : null
          }
          dayDeltaTitle={dayDeltaTitle}
          dayDeltaTone={profileMetricDeltaTone(
            sectionDeltas?.totalPoints ?? null
          )}
          reduceUiMotion={reduceUiMotion}
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
          tooltip={
            isWcProfile
              ? metricCopy.exactHitTooltip
              : metricCopy.scorePrecisionTooltip
          }
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
          reduceUiMotion={reduceUiMotion}
        />
        <MetricCard
          label={isJa ? "アップセット" : "UPSET"}
          value={formatMetricDecimals(sectionStats.upset, 1)}
          accent="red"
          filledSegs={0}
          layout={layout}
          delay={0.16}
          showSegBar={false}
          unit={metricCopy.ptsUnit}
          unitHint={metricCopy.cumulativeUnitHint}
          tooltip={metricCopy.upsetTooltip}
          dayDelta={
            sectionUpsetDelta ? `${sectionUpsetDelta} ${metricCopy.ptsUnit}` : null
          }
          dayDeltaTitle={dayDeltaTitle}
          dayDeltaTone={profileMetricDeltaTone(
            sectionDeltas?.totalUpset ?? null
          )}
          reduceUiMotion={reduceUiMotion}
        />
      </div>
    );
  };

  const metricsGrid = renderMetricsGrid(stats, metricValueDeltas, {
    totalPointsRank: activeTotalPointsRank,
    totalPointsRankDenominator: activeRankDenominator,
  });

  const metricsContent = statsPending ? (
    <MetricsGridSkeleton layout={layout} />
  ) : wcStackedActive ? (
    <div className="divide-y divide-white/8">
      {stackedMetricsSections!.map((section) => (
        <div key={section.title}>
          <div className="border-b border-white/8 px-2 py-1.5">
            <ProfileEditKinetikGlitchTitle compact={layout === "mobile"}>
              {section.title}
            </ProfileEditKinetikGlitchTitle>
            <div className="mt-1.5">
              <ProfileEditKinetikHeaderTabs
                rankBadge={section.rankBadge}
                winStreak={section.winStreak}
                language={language}
                compact={layout === "mobile"}
              />
            </div>
          </div>
          {renderMetricsGrid(section.stats, section.metricValueDeltas, {
            totalPointsRank: section.totalPointsRank,
            totalPointsRankDenominator: section.totalPointsRankDenominator,
          })}
        </div>
      ))}
    </div>
  ) : (
    metricsGrid
  );

  const menuButton =
    canOpenMenu ? (
      <button
        type="button"
        className={[
          "profile-edit-kinetik-menu-btn",
          `profile-edit-kinetik-menu-btn--${menuAccent}`,
          "relative flex shrink-0 items-center justify-center",
        ].join(" ")}
        onClick={() => onOpenMenu?.()}
        aria-label={isJa ? "メニュー" : "Menu"}
      >
        <Menu
          className={CYBER_MENU_ICON_CLASS.sm}
          strokeWidth={CYBER_MENU_ICON_STROKE}
          aria-hidden
        />
        {menuUnreadCount > 0 ? (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white shadow-sm"
            aria-hidden
          >
            {menuUnreadCount > 9 ? "9+" : menuUnreadCount}
          </span>
        ) : null}
      </button>
    ) : null;

  const metricsScopeHeader = (
    <div className="flex items-center gap-2 border-b border-white/8 px-2 py-1.5">
      {onToggleMetricsScope ? (
        <>
          <button
            type="button"
            className="shrink-0 text-[10px] text-white/35 transition hover:text-white/70"
            onClick={onToggleMetricsScope}
            aria-label={isJa ? "前のスポーツ統計" : "Previous sport stats"}
          >
            ◀
          </button>
          <button
            type="button"
            className="min-w-0 flex-1 cursor-pointer text-left"
            onClick={onToggleMetricsScope}
          >
            <ProfileEditKinetikGlitchTitle compact={layout === "mobile"}>
              {metricsSectionTitle}
            </ProfileEditKinetikGlitchTitle>
          </button>
          <button
            type="button"
            className="shrink-0 text-[10px] text-white/35 transition hover:text-white/70"
            onClick={onToggleMetricsScope}
            aria-label={isJa ? "次のスポーツ統計" : "Next sport stats"}
          >
            ▶
          </button>
        </>
      ) : (
        <ProfileEditKinetikGlitchTitle compact={layout === "mobile"}>
          {metricsSectionTitle}
        </ProfileEditKinetikGlitchTitle>
      )}
    </div>
  );

  const tierTagsOnly = wcStackedActive ? null : (
    <ProfileEditKinetikHeaderTabs
      rankBadge={rankBadge}
      winStreak={activeWinStreak}
      language={language}
      compact={layout === "mobile"}
    />
  );

  const tierTagsRowMobile = wcStackedActive ? (
    menuButton ? (
      <div className="profile-edit-kinetik-header-bar flex w-full justify-end">
        {menuButton}
      </div>
    ) : null
  ) : (
    <div className="profile-edit-kinetik-header-bar flex w-full items-stretch gap-2">
      <div className="min-w-0 flex-1">{tierTagsOnly}</div>
      {menuButton}
    </div>
  );

  const isWeb = layout === "web";

  if (isWeb) {
    return (
      <ProfileKinetikPanelFrame
        className={[
          "profile-edit-kinetik-card profile-edit-kinetik-card--web relative w-full",
          `profile-kinetik-panel--accent-${profileAccent}`,
        ].join(" ")}
      >
        <div className="profile-edit-kinetik-layout-web grid md:grid-cols-[minmax(300px,36%)_1fr]">
          <aside className="profile-edit-kinetik-layout-web__side relative flex flex-col overflow-visible border-b border-white/10 px-6 py-7 md:border-r md:border-b-0 md:px-7 md:py-8">
            {menuButton ? (
              <div className="absolute right-6 top-7 z-20 md:right-7 md:top-8">
                {menuButton}
              </div>
            ) : null}
            <div className="flex flex-col items-center text-center md:items-stretch md:text-left">
              <ProfileEditKinetikAvatarWithStreak
                variant={KINETIK_STREAK_VARIANT}
                streak={activeWinStreak}
                accentKey={menuAccent}
                language={language}
                photoURL={identity.photoURL}
                displayName={identity.displayName}
                editable={editable}
              />
              <div className="mt-4 w-full">
                <ProfileKinetikIdentityMetaRow
                  memberSinceLabel={memberSinceLabel}
                  countryCode={countryCode}
                  systemId={identity.systemId}
                  shareLabel={metricCopy.shareProfile}
                  shareCopiedLabel={metricCopy.shareCopied}
                  shareCopied={shareCopied}
                  onShare={handleShareProfile}
                  align="center"
                />
              </div>
              {tierTagsOnly ? (
                <div className="mt-3 w-full">{tierTagsOnly}</div>
              ) : null}
              <div
                className={[
                  "mt-3 flex min-w-0 items-center gap-2",
                  "justify-center md:justify-start",
                ].join(" ")}
              >
                <h2
                  className={[
                    nameOxanium.className,
                    "min-w-0 truncate leading-tight font-bold italic tracking-tight text-white",
                    "text-[22px] sm:text-[24px] md:text-[26px]",
                  ].join(" ")}
                >
                  {identity.displayName}
                </h2>
                {isPro ? (
                  <ProCyberBadge
                    compact
                    ariaLabel={metricCopy.proMember}
                  />
                ) : null}
              </div>
              {bio?.trim() ? (
                <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-white/50 md:text-[15px]">
                  {bio.trim()}
                </p>
              ) : null}
              <div className="mt-3 w-full">
                <ProfileEditKinetikBadgeRow
                  badges={badges}
                  layout={layout}
                  onBadgeClick={onBadgeClick}
                />
              </div>
            </div>
          </aside>

          <div className="profile-edit-kinetik-layout-web__main flex min-w-0 flex-col px-6 py-7 md:px-7 md:py-8">
            <div className="overflow-visible border border-white/10 bg-transparent">
              {metricsScopeHeader}
              {metricsContent}
            </div>
          </div>
        </div>
      </ProfileKinetikPanelFrame>
    );
  }

  return (
    <ProfileKinetikPanelFrame
      className={[
        "profile-edit-kinetik-card relative mx-auto w-full max-w-[520px] p-4 sm:p-5",
        layout === "mobile" ? "profile-edit-kinetik-card--compact" : "",
        `profile-kinetik-panel--accent-${profileAccent}`,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* ヘッダー */}
      <div className="profile-edit-kinetik-header relative flex gap-4">
        <ProfileEditKinetikAvatarWithStreak
          variant={KINETIK_STREAK_VARIANT}
          streak={activeWinStreak}
          accentKey={menuAccent}
          language={language}
          photoURL={identity.photoURL}
          displayName={identity.displayName}
          editable={editable}
        />
        <div className="profile-edit-kinetik-header__meta min-w-0 flex-1">
          {tierTagsRowMobile ? (
            <div className="mb-2">{tierTagsRowMobile}</div>
          ) : null}
          <div className="flex min-w-0 flex-wrap items-center gap-1.5">
            <h2
              className={[
                nameOxanium.className,
                "min-w-0 truncate text-[16px] leading-tight font-bold italic tracking-tight text-white sm:text-[18px]",
              ].join(" ")}
            >
              {identity.displayName}
            </h2>
            {flagIso ? (
              <CountryFlag
                iso2={flagIso}
                variant="profileInline"
                decorative
                alt={flagIso}
              />
            ) : null}
            {isPro ? (
              <ProCyberBadge compact ariaLabel={metricCopy.proMember} />
            ) : null}
          </div>
          <ProfileKinetikIdentityIdChip
            systemId={identity.systemId}
            shareLabel={metricCopy.shareProfile}
            shareCopiedLabel={metricCopy.shareCopied}
            shareCopied={shareCopied}
            onShare={handleShareProfile}
          />
          {bio?.trim() ? (
            <p className="mt-1.5 line-clamp-3 text-xs leading-relaxed text-white/50">
              {bio.trim()}
            </p>
          ) : null}
        </div>
        <div
          className="profile-edit-kinetik-hatch pointer-events-none absolute top-0 right-0 h-16 w-24 opacity-40"
          aria-hidden
        />
      </div>

      {/* バッジ行（旧: WORLD CUP タイトル行） */}
      <div className="mt-4">
        <ProfileEditKinetikBadgeRow
          badges={badges}
          layout={layout}
          onBadgeClick={onBadgeClick}
        />
      </div>

      {/* 主要メトリクス */}
      <div className="mt-3 overflow-visible border border-white/10 bg-transparent">
        {metricsScopeHeader}
        {metricsContent}
      </div>

      {memberSinceLabel ? (
        <footer className="profile-edit-kinetik-footer mt-4 pt-3">
          <p className="profile-edit-kinetik-footer-ref inline-block max-w-full truncate">
            {memberSinceLabel}
          </p>
        </footer>
      ) : null}
    </ProfileKinetikPanelFrame>
  );
}
