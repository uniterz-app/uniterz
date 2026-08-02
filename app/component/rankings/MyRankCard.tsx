"use client";

import { jp, nameOxanium, summaryMetricNumClass } from "@/lib/fonts";
import { CyberRankNumber, CyberRankingListRow, CyberRankingScore } from "@/app/component/rankings/CyberRankingListParts";
import { cyberMetricTag } from "@/lib/rankings/cyberRankVisual";
import type { MobileMetric } from "@/lib/rankings/rankingMetrics";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";
import { motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { RankingsAvatarCircle } from "@/app/component/rankings/RankingsAvatarCircle";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import { RankDeltaBadge } from "@/app/component/rankings/RankDeltaBadge";
import { FLAG_SRC } from "@/lib/rankings/country";
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";
import { rankingMetricAccent } from "@/lib/rankings/rankingMetricAccent";
import {
  MyRankCardFrame,
  resolveMyRankCardFrameTone,
} from "@/app/component/rankings/MyRankCardFrame";
import { listRowAvgText } from "@/lib/rankings/listRowMetricMeta";
import {
  computeMyRankTopPercent,
  deriveMyRankListAvgRow,
  MY_RANK_METRIC_HUD_LABEL,
  myRankCardAccent,
  myRankMetricUnitSuffix,
  type MyRankStatsSource,
} from "@/lib/rankings/myRankCardFocus";
import {
  formatRankTierGapForHud,
  type RankTierGapHint,
  type RankTierGapHudText,
} from "@/lib/rankings/rankTierMilestone";
import MyRankRankingProgress from "@/app/component/rankings/MyRankRankingProgress";
import {
  resolveMyRankProgressSnapshotLimit,
  type MyRankProgressPoint,
} from "@/lib/rankings/myRankRankingProgress";

export type { MyRankProgressPoint };

export type MyRankMiniMetric = {
  key: string;
  label: string;
  value: string;
  pct: number;
  dayDelta?: string | null;
};

type Props = {
  rank: number | null;
  metric: MobileMetric;
  value: number;
  displayName: string;
  photoURL?: string | null;
  totalPosts?: number;
  loading?: boolean;
  statsScramble?: boolean;
  language?: Language;
  isPro?: boolean;
  mobileWide?: boolean;
  rankDeltaPlaces?: number | null;
  totalEntries?: number | null;
  streak?: number | null;
  countryCode?: string | null;
  miniMetrics?: MyRankMiniMetric[];
  leagueLabel?: string;
  cardResetKey?: string;
  layout?: "mobile" | "web";
  /** false = 順位数字のカウントアップを省略 */
  animateRank?: boolean;
  /** VOL/AVG 算出用（省略時は totalPosts のみ） */
  statsSource?: MyRankStatsSource | null;
  /**
   * Free / Pro UI ゲート（dev プレビュー・段階ロールアウト用）。
   * 未指定 = 現行本番（TOP50%・順位前日比あり）
   */
  displayTier?: "free" | "pro";
  /** Pro のみ — 次順位帯までの総合得点差（totalScore タブ時） */
  rankTierGap?: RankTierGapHint | null;
  /** dev プレビュー等 — 入場・チルト・ストリーク等のモーションを止める */
  disableMotion?: boolean;
  /** Ranking Progress（下段右・YOUR RANK 横） */
  rankProgress?: MyRankProgressPoint[] | null;
  rankProgressLoading?: boolean;
  /** Weekly / Monthly 等でプログレスを隠す */
  hideRankProgress?: boolean;
};

type CardLayout = NonNullable<Props["layout"]>;

const GOLD = "#FFD65A";
const STREAK_SWEEP_MIN = 3;
const STATS_PENDING_MARK = "···";
const RANK_COUNT_DURATION_MS = 520;

const ENTER_EASE = [0.22, 1, 0.36, 1] as const;
const ENTER_DURATION = 0.28;

const LAYOUT = {
  mobile: {
    outerPad: "max-w-full overflow-x-clip px-2 pt-3",
    /** rankings 親 px-3 の内側をリスト px-2 と揃える */
    outerPadWide:
      "-mx-1 w-[calc(100%+0.5rem)] max-w-[calc(100%+0.5rem)] overflow-x-clip px-2 pt-3",
    towerGrid: "grid-cols-[100px_1fr]",
    entriesSize: "12px",
    topPercentSize: "10px",
    nameSize: "15px",
    statValueSize: "24px",
    unitSize: "10px",
    dayDeltaSize: "14px",
    rankLabelSize: "7.5px",
    avatar: "h-9 w-9",
    avatarText: "text-[10px]",
    deltaSize: "sm" as const,
  },
  web: {
    outerPad: "mx-auto w-full max-w-[860px] px-2 pt-3",
    towerGrid: "grid-cols-[120px_1fr]",
    entriesSize: "13px",
    topPercentSize: "11px",
    nameSize: "17px",
    statValueSize: "28px",
    unitSize: "11px",
    dayDeltaSize: "15px",
    rankLabelSize: "8px",
    avatar: "h-11 w-11",
    avatarText: "text-[12px]",
    deltaSize: "md" as const,
  },
} satisfies Record<CardLayout, Record<string, unknown>>;

function easeOutBack(t: number): number {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}

function useOvershootCount(
  target: number,
  durationMs: number,
  enabled: boolean
) {
  const [value, setValue] = useState(() => (enabled ? 0 : target));

  useEffect(() => {
    if (!enabled) {
      setValue(target);
      return;
    }
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    if (prefersReduced) {
      setValue(target);
      return;
    }
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / durationMs);
      setValue(Math.max(0, Math.round(target * easeOutBack(p))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, enabled]);

  return value;
}

function useHoloTilt(enabled: boolean) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const glareRef = useRef<HTMLDivElement>(null);

  const onMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled || e.pointerType !== "mouse") return;
      const wrap = wrapRef.current;
      const glare = glareRef.current;
      if (!wrap) return;
      const r = wrap.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rotY = (px - 0.5) * 16;
      const rotX = (0.5 - py) * 16;
      wrap.style.transform = `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`;
      wrap.style.transition = "transform 60ms linear";
      if (glare) {
        glare.style.background = `radial-gradient(380px circle at ${px * 100}% ${py * 100}%, rgba(255,255,255,0.12) 0%, transparent 55%)`;
        glare.style.opacity = "0.45";
      }
    },
    [enabled]
  );

  const onLeave = useCallback(() => {
    const wrap = wrapRef.current;
    const glare = glareRef.current;
    if (wrap) {
      wrap.style.transform = "perspective(900px) rotateX(0deg) rotateY(0deg)";
      wrap.style.transition = "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)";
    }
    if (glare) glare.style.opacity = "0";
  }, []);

  return { wrapRef, glareRef, onMove, onLeave };
}

function ScanTexture() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px, transparent 1px, transparent 4px)",
      }}
    />
  );
}

function GlassSheen() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.03) 28%, transparent 52%)",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-3 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.42), transparent)",
        }}
      />
    </>
  );
}

function RankMetaStrip({
  posts,
  metric,
  avgRow,
  metaSize,
  flush,
  alignEnd,
}: {
  posts: number;
  metric: MobileMetric;
  avgRow?: ReturnType<typeof deriveMyRankListAvgRow>;
  metaSize: number;
  flush?: boolean;
  alignEnd?: boolean;
}) {
  const avgText = avgRow ? listRowAvgText(metric, avgRow) : null;

  if (posts === 0 && !avgText) {
    return null;
  }

  return (
    <div
      className={[
        flush ? "" : "mt-1",
        "flex min-w-0 flex-row flex-wrap items-center gap-x-1.5 gap-y-0.5",
        alignEnd ? "justify-end" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <span
        className={[
          nameOxanium.className,
          "shrink-0 font-bold uppercase tracking-[0.14em] tabular-nums leading-none",
        ].join(" ")}
        style={{ color: "rgba(255,255,255,0.42)", fontSize: metaSize }}
      >
        VOL:{posts}
      </span>
      {avgText ? (
        <span
          className={[
            nameOxanium.className,
            "min-w-0 truncate font-bold uppercase tracking-[0.12em] tabular-nums leading-none",
          ].join(" ")}
          style={{ color: "rgba(0,245,255,0.55)", fontSize: metaSize }}
        >
          {avgText}
        </span>
      ) : null}
    </div>
  );
}

function MetricHudInline({
  metric,
  metricValue,
  metricValueColor,
  dayDeltaNode,
  statValueSize,
  unitSize,
  dayDeltaSize,
}: {
  metric: MobileMetric;
  metricValue: string;
  metricValueColor: string;
  dayDeltaNode: ReactNode;
  statValueSize: string;
  unitSize: string;
  dayDeltaSize: string;
}) {
  const unit = myRankMetricUnitSuffix(metric);

  return (
    <div className="min-w-0 text-right">
      {dayDeltaNode ? (
        <div
          className="leading-none"
          style={{ fontSize: dayDeltaSize, marginBottom: -4, lineHeight: 1 }}
        >
          {dayDeltaNode}
        </div>
      ) : null}
      <div className="flex items-baseline justify-end gap-1.5">
        <span
          className={[
            summaryMetricNumClass,
            "leading-none tabular-nums",
          ].join(" ")}
          style={{
            fontSize: statValueSize,
            color: metricValueColor,
          }}
        >
          {metricValue}
        </span>
        {unit ? (
          <span
            className={[
              nameOxanium.className,
              "shrink-0 font-bold uppercase tracking-[0.08em] leading-none",
            ].join(" ")}
            style={{
              fontSize: unitSize,
              color: "rgba(255,255,255,0.45)",
            }}
          >
            {unit}
          </span>
        ) : null}
      </div>
    </div>
  );
}

function RankTierGapUnderAvatar({
  hud,
  gapTextSize,
  invisible = false,
}: {
  hud: RankTierGapHudText;
  gapTextSize: string;
  invisible?: boolean;
}) {
  const bodyColor = "rgba(140,240,255,0.88)";

  return (
    <p
      className={[
        nameOxanium.className,
        "text-left whitespace-nowrap font-bold leading-none tabular-nums",
        invisible ? "invisible" : "",
      ].join(" ")}
      style={{ fontSize: gapTextSize, color: bodyColor }}
      aria-hidden={invisible || undefined}
    >
      {hud.segments.map((segment, index) => (
        <span
          key={index}
          style={
            segment.tone === "tier"
              ? { color: GOLD }
              : undefined
          }
        >
          {segment.text}
        </span>
      ))}
      {!hud.segments.length ? "\u00a0" : null}
    </p>
  );
}

function MyRankCardFooter({
  badgeLabel,
  dateLine,
  metaLine,
}: {
  badgeLabel: string;
  dateLine: string;
  metaLine: string;
}) {
  return (
    <div className="relative z-10 flex items-end justify-between gap-3 px-2.5 pt-0 pb-1.5">
      <div className="relative shrink-0 pb-1">
        <span
          className={[
            nameOxanium.className,
            "inline-block bg-white px-2 py-[5px] font-black uppercase leading-none tracking-[0.18em] text-black",
          ].join(" ")}
          style={{ fontSize: badgeLabel.length > 8 ? "7px" : "8px" }}
        >
          {badgeLabel}
        </span>
        <span
          className="pointer-events-none absolute -bottom-0.5 -left-1 text-[9px] leading-none text-white/30"
          aria-hidden
        >
          ✦
        </span>
      </div>

      <div className="min-w-0 text-right leading-tight">
        <p
          className={[
            nameOxanium.className,
            "truncate font-semibold uppercase tracking-[0.14em] text-white/38",
          ].join(" ")}
          style={{ fontSize: "7px" }}
        >
          {dateLine}
        </p>
        <p
          className={[
            nameOxanium.className,
            "mt-0.5 truncate font-semibold uppercase tracking-[0.12em] text-white/30",
          ].join(" ")}
          style={{ fontSize: "7px" }}
        >
          {metaLine}
        </p>
      </div>
    </div>
  );
}

function formatMetricDayDeltaDisplay(
  dayDelta: string | null | undefined,
  accentPrimary: string
) {
  if (!dayDelta) return null;
  const trimmed = dayDelta.trim();
  if (!trimmed || trimmed === "0" || trimmed === "0.0") return null;
  const up = trimmed.startsWith("+");
  const down = trimmed.startsWith("-");
  const color = up
    ? accentPrimary
    : down
      ? "rgba(34,211,238,0.85)"
      : "rgba(255,255,255,0.45)";

  return (
    <span
      className={[summaryMetricNumClass, "leading-none tabular-nums"].join(" ")}
      style={{ color }}
    >
      {trimmed}
    </span>
  );
}

export default function MyRankCard({
  rank,
  metric,
  value,
  displayName,
  photoURL,
  totalPosts,
  loading = false,
  statsScramble = false,
  language = "ja",
  isPro = false,
  mobileWide = false,
  rankDeltaPlaces = null,
  totalEntries = null,
  streak = null,
  countryCode = null,
  miniMetrics,
  leagueLabel,
  cardResetKey: _cardResetKey,
  layout = "mobile",
  animateRank = true,
  statsSource = null,
  displayTier,
  rankTierGap = null,
  disableMotion = false,
  rankProgress,
  rankProgressLoading = false,
  hideRankProgress = false,
}: Props) {
  void _cardResetKey;
  const ui = LAYOUT[layout];
  const m = t(language);
  const reduceMotion = useReducedMotion();
  const motionOff = disableMotion || reduceMotion === true;
  const ready = !loading;
  const statsPending = statsScramble && !loading;

  const freeTier = displayTier === "free";
  const proTier = displayTier === "pro";

  const frameTone = resolveMyRankCardFrameTone(
    displayTier != null ? null : rankDeltaPlaces
  );
  const accent = myRankCardAccent(frameTone);

  const displayRankDelta = displayTier != null ? null : rankDeltaPlaces;
  const showProBadge = isPro && !freeTier;
  const proSpecFrame = proTier;

  const tiltEnabled = !motionOff && layout !== "web";
  const tilt = useHoloTilt(tiltEnabled);

  const countEnabled = ready && !motionOff && animateRank;
  const rankCount = useOvershootCount(
    rank ?? 0,
    RANK_COUNT_DURATION_MS,
    countEnabled && rank != null
  );

  const shouldFlash =
    displayTier == null &&
    countEnabled &&
    rank != null &&
    typeof rankDeltaPlaces === "number" &&
    rankDeltaPlaces > 0;
  const [flashOn, setFlashOn] = useState(false);
  useEffect(() => {
    setFlashOn(false);
    if (!shouldFlash) return;
    const id = window.setTimeout(
      () => setFlashOn(true),
      RANK_COUNT_DURATION_MS + 60
    );
    return () => clearTimeout(id);
  }, [shouldFlash, rank]);

  const selectedMini = useMemo(
    () => miniMetrics?.find((mt) => mt.key === metric),
    [miniMetrics, metric]
  );

  const metricAccent = rankingMetricAccent(metric);

  const rankVisualMuted = loading || statsPending || rank == null;
  const rankVisualValue = rankVisualMuted
    ? loading
      ? "--"
      : statsPending
        ? STATS_PENDING_MARK
        : "--"
    : motionOff
      ? rank!
      : rankCount;

  const topPercent =
    !loading &&
    !freeTier &&
    rank != null &&
    typeof totalEntries === "number" &&
    totalEntries > 0
      ? computeMyRankTopPercent(rank, totalEntries, {
          showMax: proTier ? null : undefined,
        })
      : null;

  const entriesDisplay =
    !loading &&
    typeof totalEntries === "number" &&
    totalEntries > 0
      ? totalEntries.toLocaleString(language === "ja" ? "ja-JP" : "en-US")
      : null;

  const streakN =
    typeof streak === "number" && streak >= STREAK_SWEEP_MIN ? streak : null;
  const streakSweep = !motionOff && !loading && streakN != null;

  const flagSrc = countryCode ? FLAG_SRC[countryCode.toUpperCase()] : undefined;
  const footerBadgeLabel =
    displayTier != null
      ? proTier
        ? "UNITERZ/PRO"
        : "UNITERZ"
      : isPro
        ? "UNITERZ/PRO"
        : "UNITERZ";
  const serialDateKey = useRef(dateKeyJST()).current;
  const footerDateLine = `SYNC // ${serialDateKey}`;
  const footerMetaLine = [
    (leagueLabel?.trim() || "NBA").toUpperCase(),
    MY_RANK_METRIC_HUD_LABEL[metric],
  ].join(" · ");

  const posts =
    typeof totalPosts === "number"
      ? totalPosts
      : (statsSource?.totalPosts ?? 0);

  const avgRow = useMemo(
    () => deriveMyRankListAvgRow(statsSource),
    [statsSource]
  );

  const metricValueDisplay = useMemo(() => {
    if (loading || statsPending) return STATS_PENDING_MARK;
    if (selectedMini?.value) {
      const raw = selectedMini.value;
      return metric === "winRate" ? raw.replace(/%$/, "") : raw;
    }
    if (metric === "winRate") return `${Math.round(value)}`;
    if (metric === "streak" || metric === "goalScorerHits") {
      return `${Math.round(value)}`;
    }
    if (metric === "totalScore") {
      return Math.round(value).toLocaleString("en-US");
    }
    return formatMetricDecimals(value, 1);
  }, [loading, statsPending, selectedMini, metric, value]);

  const dayDeltaNode = formatMetricDayDeltaDisplay(
    selectedMini?.dayDelta,
    accent.primary
  );

  const metaSize = layout === "web" ? 13 : 11;
  const topPercentLabel =
    topPercent != null
      ? m.rankings.topPercent.replace("{n}", topPercent)
      : null;

  const rankTierGapHud =
    metric === "totalScore" && rankTierGap
      ? formatRankTierGapForHud(
          rankTierGap,
          language === "en" ? "en" : "ja"
        )
      : null;

  const showRankTierGapHud = proTier && rankTierGapHud != null;
  const gapTextSize = layout === "web" ? "11px" : "10px";
  const showRankingProgress =
    !freeTier &&
    !hideRankProgress &&
    metric === "totalScore" &&
    (displayTier != null || rankProgress !== undefined);
  const progressSnapshotLimit = resolveMyRankProgressSnapshotLimit({
    displayTier,
    isPro,
  });
  const progressPoints = rankProgress ?? [];

  const outerPad =
    layout === "mobile" && mobileWide && "outerPadWide" in ui
      ? (ui.outerPadWide as string)
      : (ui.outerPad as string);

  if (freeTier) {
    const listRank = rank != null && rank >= 1 ? rank : 99;
    const freeInner =
      loading || statsPending || rank == null ? (
        <div
          className="rounded-sm border border-white/10 bg-black/20 px-3 py-4 text-[11px] text-white/40"
          aria-busy
        >
          {m.rankings.loadingRankStats}
        </div>
      ) : (
        <CyberRankingListRow
          rank={listRank}
          displayName={displayName}
          photoURL={photoURL}
          metric={metric}
          metricTag={cyberMetricTag(metric, language)}
          posts={posts}
          countryCode={countryCode}
          avgRow={avgRow}
          compact={layout === "mobile"}
          scoreLayout={layout === "web" ? "web" : "stack"}
          hideAccentBar
          rankOverline={m.rankings.yourRank}
          scoreSlot={
            <CyberRankingScore
              rank={listRank}
              metric={metric}
              counted={value}
              compact={layout === "mobile"}
              scoreLayout={layout === "web" ? "web" : "stack"}
              plainWhite
            />
          }
        />
      );

    const freeBody = (
      <MyRankCardFrame
        tone="neutral"
        hideLeftEdge
        className="w-full overflow-hidden"
      >
        <div className="relative z-10 px-1.5 py-1.5">
          {freeInner}
        </div>
      </MyRankCardFrame>
    );

    if (motionOff) {
      return <div className={outerPad}>{freeBody}</div>;
    }

    return (
      <motion.div
        className={outerPad}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          opacity: { duration: ENTER_DURATION, ease: ENTER_EASE },
          y: { duration: ENTER_DURATION, ease: ENTER_EASE },
        }}
      >
        {freeBody}
      </motion.div>
    );
  }

  const body = (
    <MyRankCardFrame
      tone={frameTone}
      proSpec={proSpecFrame}
      className="w-full overflow-hidden"
    >
      <div
        className="relative overflow-hidden"
        aria-busy={statsScramble || undefined}
      >
        {streakSweep ? (
          <div
            data-capture-skip
            className="pointer-events-none absolute inset-0 z-30 overflow-hidden result-card-streak-sweep"
            aria-hidden
          >
            <div className="result-card-streak-sweep__spin" />
          </div>
        ) : null}

        {flagSrc ? (
          <div
            data-capture-skip
            className="pointer-events-none absolute inset-0 overflow-hidden"
          >
            <img
              src={flagSrc}
              alt=""
              crossOrigin="anonymous"
              className="absolute right-[-6%] top-1/2 h-[120%] -translate-y-1/2 object-contain"
              style={{
                opacity: 0.05,
                maskImage:
                  "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.45) 50%, black 100%)",
                WebkitMaskImage:
                  "linear-gradient(90deg, transparent 0%, rgba(0,0,0,0.45) 50%, black 100%)",
              }}
              draggable={false}
            />
          </div>
        ) : null}

        <GlassSheen />
        <ScanTexture />

        {tiltEnabled ? (
          <div
            ref={tilt.glareRef}
            data-capture-skip
            className="pointer-events-none absolute inset-0 z-20"
            style={{
              background:
                "radial-gradient(380px circle at 50% 50%, rgba(255,255,255,0.12) 0%, transparent 55%)",
              opacity: 0,
              transition: "opacity 300ms ease",
            }}
          />
        ) : null}

        <motion.div
          data-capture-skip
          className="pointer-events-none absolute inset-0 z-20"
          initial={false}
          animate={
            flashOn
              ? {
                  boxShadow: [
                    "inset 0 0 0px rgba(34,211,238,0)",
                    "inset 0 0 36px rgba(34,211,238,0.32)",
                    "inset 0 0 0px rgba(34,211,238,0)",
                  ],
                  opacity: [0, 1, 0],
                }
              : { opacity: 0 }
          }
          transition={{ duration: 1.0, times: [0, 0.18, 1], ease: "easeOut" }}
          style={{ background: "rgba(34,211,238,0.04)" }}
        />

        {statsScramble && !loading && (
          <span className="sr-only">{m.rankings.loadingRankStats}</span>
        )}

        {/* 上段2列: ユーザー | 順位+スタッツ / 下段: Progress */}
        <div className="relative z-10 flex flex-col">
          <div className="flex min-h-[96px] items-stretch gap-1.5 px-2 py-2">
          <div className="flex w-[92px] shrink-0 flex-col items-center gap-1.5 pt-0.5">
            <div
              className="relative h-11 w-11 overflow-hidden rounded-sm"
              style={{
                border: "1px solid rgba(245,215,142,0.4)",
                background: "rgba(0,0,0,0.4)",
              }}
            >
              <RankingsAvatarCircle
                photoURL={photoURL}
                displayName={displayName}
                boxClassName="h-full w-full"
                initialTextClassName="text-[12px]"
                gateReady={ready}
                shape="square"
              />
            </div>
            <div
              className={[
                jp.className,
                "w-full text-center text-[12px] font-black leading-tight text-white",
              ].join(" ")}
            >
              <span className="line-clamp-2 break-all">{displayName}</span>
            </div>
            {showProBadge ? (
              <ProCyberBadge
                {...proBadgeStaticMotion}
                compact
                ariaLabel={m.common.proMember}
              />
            ) : null}
          </div>

            <div
              className="flex min-w-0 flex-[1.6] overflow-hidden rounded-sm border"
              style={{
                borderColor: "rgba(255,255,255,0.1)",
                background: "rgba(0,0,0,0.28)",
              }}
            >
              <div
                className="flex flex-1 flex-col items-center justify-center gap-1 border-r px-1 py-2"
                style={{
                  borderColor: "rgba(245,215,142,0.2)",
                  background: "rgba(0,0,0,0.16)",
                }}
              >
                <div className="flex flex-col items-center">
                  <div className="flex items-center justify-center gap-0.5">
                    <span
                      className={[
                        nameOxanium.className,
                        "text-[16px] font-bold text-white/55",
                      ].join(" ")}
                    >
                      #
                    </span>
                    <CyberRankNumber
                      rank={
                        rankVisualMuted
                          ? 4
                          : motionOff
                            ? rank!
                            : rankCount
                      }
                      compact={layout === "mobile"}
                      variant="tower"
                      displayValue={
                        rankVisualMuted
                          ? loading
                            ? "--"
                            : statsPending
                              ? STATS_PENDING_MARK
                              : "--"
                          : undefined
                      }
                      muted={rankVisualMuted}
                    />
                  </div>
                  {entriesDisplay ? (
                    <span
                      className={[
                        nameOxanium.className,
                        "text-[11px] font-semibold tabular-nums text-white/45 leading-none",
                      ].join(" ")}
                      style={{ marginTop: -3 }}
                    >
                      / {entriesDisplay}
                    </span>
                  ) : null}
                </div>
                {topPercentLabel ? (
                  <span
                    className={[
                      nameOxanium.className,
                      "text-[9px] font-bold uppercase tracking-wide",
                    ].join(" ")}
                    style={{ color: GOLD }}
                  >
                    {topPercentLabel}
                  </span>
                ) : null}
              </div>

              <div className="flex min-w-0 flex-1 flex-col items-end justify-center gap-1 px-2 py-2">
                <MetricHudInline
                  metric={metric}
                  metricValue={metricValueDisplay}
                  metricValueColor={
                    loading || statsPending
                      ? "rgba(255,255,255,0.92)"
                      : metricAccent.value
                  }
                  dayDeltaNode={dayDeltaNode}
                  statValueSize={layout === "web" ? "30px" : "26px"}
                  unitSize={layout === "web" ? "13px" : "12px"}
                  dayDeltaSize="10px"
                />
                <RankMetaStrip
                  posts={posts}
                  metric={metric}
                  avgRow={avgRow}
                  metaSize={9}
                  flush
                  alignEnd
                />
                {showRankTierGapHud && rankTierGapHud ? (
                  <div className="w-full text-right">
                    <RankTierGapUnderAvatar
                      hud={rankTierGapHud}
                      gapTextSize={gapTextSize}
                    />
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {showRankingProgress ? (
            <div
              className="min-h-[64px] border-t px-2 pb-1.5 pt-1"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            >
              <MyRankRankingProgress
                points={progressPoints}
                maxSnapshots={progressSnapshotLimit}
                loading={loading || rankProgressLoading}
                language={language}
                layout={layout}
                numbersOnly
                dense
              />
            </div>
          ) : null}
        </div>
      </div>
    </MyRankCardFrame>
  );

  const tiltWrapped = (
    <div
      ref={tilt.wrapRef}
      data-rank-card-root
      onPointerMove={tiltEnabled ? tilt.onMove : undefined}
      onPointerLeave={tiltEnabled ? tilt.onLeave : undefined}
      onPointerCancel={tiltEnabled ? tilt.onLeave : undefined}
    >
      {body}
    </div>
  );

  if (motionOff) {
    return <div className={outerPad}>{tiltWrapped}</div>;
  }

  return (
    <motion.div
      className={outerPad}
      initial={{
        opacity: 0,
        y: 12,
      }}
      animate={{
        opacity: 1,
        y: 0,
      }}
      transition={{
        opacity: { duration: ENTER_DURATION, ease: ENTER_EASE },
        y: { duration: ENTER_DURATION, ease: ENTER_EASE },
      }}
    >
      {tiltWrapped}
    </motion.div>
  );
}
