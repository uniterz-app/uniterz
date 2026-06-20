"use client";

import { jp, nameOxanium, summaryMetricNumClass } from "@/lib/fonts";
import { CyberRankNumber } from "@/app/component/rankings/CyberRankingListParts";
import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
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
import { CyberSlantedSegBar } from "@/app/component/rankings/CyberSlantedSegBar";
import { listRowAvgText } from "@/lib/rankings/listRowMetricMeta";
import {
  computeMyRankTopPercent,
  deriveMyRankListAvgRow,
  MY_RANK_METRIC_HUD_LABEL,
  myRankCardAccent,
  type MyRankStatsSource,
} from "@/lib/rankings/myRankCardFocus";

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
  barsReady?: boolean;
  cardResetKey?: string;
  layout?: "mobile" | "web";
  /** false = 順位数字のカウントアップを省略 */
  animateRank?: boolean;
  /** VOL/AVG 算出用（省略時は totalPosts のみ） */
  statsSource?: MyRankStatsSource | null;
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
    statValueSize: "22px",
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
    statValueSize: "24px",
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
  topPercentLabel,
  posts,
  metric,
  avgRow,
  topPercentSize,
  metaSize,
}: {
  topPercentLabel?: string | null;
  posts: number;
  metric: MobileMetric;
  avgRow?: ReturnType<typeof deriveMyRankListAvgRow>;
  topPercentSize: string;
  metaSize: number;
}) {
  const avgText = avgRow ? listRowAvgText(metric, avgRow) : null;

  if (!topPercentLabel && posts === 0 && !avgText) {
    return null;
  }

  return (
    <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-0.5">
      {topPercentLabel ? (
        <span
          className={[
            "rounded px-2 py-[3px] font-bold tracking-wide",
            nameOxanium.className,
            "shrink-0 uppercase tabular-nums leading-none",
          ].join(" ")}
          style={{
            color: GOLD,
            fontSize: topPercentSize,
            background: "rgba(255,214,90,0.08)",
          }}
        >
          {topPercentLabel}
        </span>
      ) : null}
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
  barsReady = true,
  cardResetKey,
  layout = "mobile",
  animateRank = true,
  statsSource = null,
}: Props) {
  const ui = LAYOUT[layout];
  const m = t(language);
  const reduceMotion = useReducedMotion();
  const ready = !loading;
  const statsPending = statsScramble && !loading;

  const frameTone = resolveMyRankCardFrameTone(rankDeltaPlaces);
  const accent = myRankCardAccent(frameTone);

  const tiltEnabled = reduceMotion !== true && layout !== "web";
  const tilt = useHoloTilt(tiltEnabled);

  const countEnabled = ready && reduceMotion !== true && animateRank;
  const rankCount = useOvershootCount(
    rank ?? 0,
    RANK_COUNT_DURATION_MS,
    countEnabled && rank != null
  );

  const shouldFlash =
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

  const [segEnter, setSegEnter] = useState(false);
  useEffect(() => {
    if (!ready || !barsReady) {
      setSegEnter(false);
      return;
    }
    setSegEnter(true);
  }, [ready, barsReady, cardResetKey]);

  const selectedMini = useMemo(
    () => miniMetrics?.find((mt) => mt.key === metric),
    [miniMetrics, metric]
  );

  const metricAccent = rankingMetricAccent(metric);
  const segAccent = useMemo(
    () => ({
      border: accent.primary,
      glow: accent.glow,
      bg: accent.dim,
    }),
    [accent]
  );

  const rankVisualMuted = loading || statsPending || rank == null;
  const rankVisualValue = rankVisualMuted
    ? loading
      ? "--"
      : statsPending
        ? STATS_PENDING_MARK
        : "--"
    : reduceMotion === true
      ? rank!
      : rankCount;

  const topPercent =
    !loading &&
    rank != null &&
    typeof totalEntries === "number" &&
    totalEntries > 0
      ? computeMyRankTopPercent(rank, totalEntries)
      : null;

  const entriesDisplay =
    !loading &&
    typeof totalEntries === "number" &&
    totalEntries > 0
      ? totalEntries.toLocaleString(language === "ja" ? "ja-JP" : "en-US")
      : null;

  const streakN =
    typeof streak === "number" && streak >= STREAK_SWEEP_MIN ? streak : null;
  const streakSweep = !loading && streakN != null;

  const flagSrc = countryCode ? FLAG_SRC[countryCode.toUpperCase()] : undefined;
  const leagueDisplay =
    leagueLabel && leagueLabel.toUpperCase() !== "NBA" ? leagueLabel : null;
  const serialDateKey = useRef(dateKeyJST()).current;

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
    if (selectedMini?.value) return selectedMini.value;
    if (metric === "winRate") return `${Math.round(value)}%`;
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

  const segPct = selectedMini?.pct ?? 0;
  const metaSize = layout === "web" ? 13 : 11;
  const topPercentLabel =
    topPercent != null
      ? m.rankings.topPercent.replace("{n}", topPercent)
      : null;

  const outerPad =
    layout === "mobile" && mobileWide && "outerPadWide" in ui
      ? (ui.outerPadWide as string)
      : (ui.outerPad as string);

  const body = (
    <MyRankCardFrame
      tone={frameTone}
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

        <div className={["relative z-10 grid", ui.towerGrid as string].join(" ")}>
          {/* 左: YOUR RANK 塔 */}
          <div
            className="flex min-h-full flex-col items-center justify-between gap-1 px-1.5 py-2.5"
            style={{
              borderRight: `1px solid ${accent.hairline}`,
              background: accent.towerBg,
            }}
          >
            <span
              className={[
                nameOxanium.className,
                "whitespace-nowrap text-center font-bold uppercase tracking-[0.14em] text-white/42",
              ].join(" ")}
              style={{ fontSize: ui.rankLabelSize as string }}
            >
              {m.rankings.yourRank}
            </span>

            <div className="flex flex-col items-center gap-1">
              <CyberRankNumber
                rank={
                  rankVisualMuted
                    ? 4
                    : reduceMotion === true
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

              {entriesDisplay ? (
                <span
                  className={[
                    nameOxanium.className,
                    "font-medium tabular-nums text-white/38",
                  ].join(" ")}
                  style={{ fontSize: ui.entriesSize as string }}
                >
                  / {entriesDisplay}
                </span>
              ) : null}

              {!loading && !statsPending && rank != null ? (
                <RankDeltaBadge
                  delta={rankDeltaPlaces}
                  size={ui.deltaSize as "sm" | "md"}
                  variant="tower"
                  language={language}
                />
              ) : null}
            </div>
          </div>

          {/* 右 */}
          <div className="flex min-h-full min-w-0 flex-col px-2.5 py-2.5">
            <div className="flex items-start gap-2">
              <div className="relative shrink-0">
                <div
                  className={[
                    "relative shrink-0 overflow-hidden rounded-sm",
                    ui.avatar as string,
                  ].join(" ")}
                  style={{
                    border: `1px solid ${accent.hairline}`,
                    background: accent.avatarBg,
                  }}
                >
                  <RankingsAvatarCircle
                    photoURL={photoURL}
                    displayName={displayName}
                    boxClassName="h-full w-full"
                    initialTextClassName={ui.avatarText as string}
                    gateReady={ready}
                    shape="square"
                  />
                </div>
              </div>

              <div className="min-w-0 flex-1 self-start truncate -mt-1 pr-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <div
                    className={[
                      jp.className,
                      "min-w-0 truncate font-black leading-none text-white",
                    ].join(" ")}
                    style={{ fontSize: ui.nameSize as string }}
                  >
                    {displayName}
                  </div>
                  {isPro ? (
                    <ProCyberBadge
                      {...proBadgeStaticMotion}
                      compact
                      ariaLabel={m.common.proMember}
                    />
                  ) : null}
                </div>
              </div>

              <div className="ml-auto shrink-0 border-l border-white/8 pl-2.5 text-right">
                <span
                  className={[
                    nameOxanium.className,
                    "block font-semibold uppercase tracking-[0.12em]",
                  ].join(" ")}
                  style={{ fontSize: "7px", color: metricAccent.labelDim }}
                >
                  {MY_RANK_METRIC_HUD_LABEL[metric]}
                </span>
                <span
                  className={[
                    summaryMetricNumClass,
                    "mt-1 block leading-none tabular-nums text-white",
                  ].join(" ")}
                  style={{
                    fontSize: ui.statValueSize as string,
                    color:
                      loading || statsPending
                        ? "rgba(255,255,255,0.92)"
                        : metricAccent.value,
                  }}
                >
                  {metricValueDisplay}
                </span>
                {dayDeltaNode ? (
                  <div
                    className="mt-1"
                    style={{ fontSize: ui.dayDeltaSize as string }}
                  >
                    {dayDeltaNode}
                  </div>
                ) : null}
              </div>
            </div>

            <RankMetaStrip
              topPercentLabel={topPercentLabel}
              posts={posts}
              metric={metric}
              avgRow={avgRow}
              topPercentSize={ui.topPercentSize as string}
              metaSize={metaSize}
            />

            <div className="mt-2.5">
              <CyberSlantedSegBar
                pct={segPct}
                segments={12}
                compact
                enter={segEnter && !statsPending}
                accent={segAccent}
                maxWidthClass="max-w-full"
              />
            </div>
          </div>
        </div>

        <div
          className="relative z-10 px-2.5 py-1"
          style={{ borderTop: "1px solid rgba(255,255,255,0.08)" }}
        >
          <span
            className={[
              nameOxanium.className,
              "block truncate font-medium uppercase tracking-[0.18em] text-white/26",
            ].join(" ")}
            style={{ fontSize: "7px" }}
          >
            UNITERZ
            {leagueDisplay ? ` · ${leagueDisplay}` : ""}
            {` · ${MY_RANK_METRIC_HUD_LABEL[metric]}`}
            {` // ${serialDateKey}`}
          </span>
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

  if (reduceMotion === true) {
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
