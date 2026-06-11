"use client";

import { jp, nameBebas, nameOxanium, summaryMetricNumClass } from "@/lib/fonts";
import type { MobileMetric } from "@/app/component/rankings/_data/mockRows";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";
import { postsLabel, streakShortLabel } from "@/lib/i18n/rankings";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";
import { motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { RankingsAvatarCircle } from "@/app/component/rankings/RankingsAvatarCircle";
import {
  ProCyberBadge,
  proBadgeStaticMotion,
} from "@/app/component/common/ProCyberBadge";
import { RankDeltaBadge } from "@/app/component/rankings/RankDeltaBadge";
import { FLAG_SRC } from "@/lib/rankings/country";
import { metricLabel } from "@/lib/i18n/rankings";
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";
import { Flame } from "lucide-react";
import {
  rankingMetricAccent,
} from "@/lib/rankings/rankingMetricAccent";
import { MyRankCardFrame } from "@/app/component/rankings/MyRankCardFrame";
import { CyberSlantedSegBar } from "@/app/component/rankings/CyberSlantedSegBar";

export type MyRankMiniMetric = {
  /** 選択中メトリクスのハイライト用（MobileMetric と一致させる） */
  key: string;
  label: string;
  value: string;
  /** 0-100 のバー充足率 */
  pct: number;
  /** 前日比（例: +4.9）— データが無いときは省略 */
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
  /** 一覧はあるが自分順位・数値だけ未取得のときの解読風演出 */
  statsScramble?: boolean;
  language?: Language;
  /** Pro プラン（users.plan）— 自分カードにバッジ */
  isPro?: boolean;
  /** モバイルランキング用：外側パディングを抑えてカードを横に少し広げる */
  mobileWide?: boolean;
  /** 前日比順位（正=上昇）。API の myRankDeltaPlaces */
  rankDeltaPlaces?: number | null;
  /** ランキング参加者総数 — TOP◯% チップ表示用 */
  totalEntries?: number | null;
  /** 現在の連勝数 — 3連勝以上で枠スイープ演出 */
  streak?: number | null;
  /** 国旗の薄バック用 ISO2 コード */
  countryCode?: string | null;
  /** 2×2 メトリクスセル（PTS / WIN% / PREC / UPSET） */
  miniMetrics?: MyRankMiniMetric[];
  /** 下部シリアル帯のリーグ表記（例: WORLD CUP / NBA） */
  leagueLabel?: string;
  /** 4 指標バー用リーダー行がすべて取得済み */
  barsReady?: boolean;
  /** リーグ/ラウンド切替でセグメント入場をリセット */
  cardResetKey?: string;
  /** web も mobile と同一レイアウト */
  layout?: "mobile" | "web";
};

type CardLayout = NonNullable<Props["layout"]>;

type CardLayoutTokens = {
  outerPad: string;
  gridCols: string;
  rankTower: string;
  rankLeagueLabel: string;
  rankLabel: string;
  rankNum: string;
  rankGlow: string;
  totalEntries: string;
  rankMetaRow: string;
  topChip: string;
  headerPad: string;
  avatar: string;
  name: string;
  postsChip: string;
  subMeta: string;
  flame: string;
  streakHubNum: string;
  streakHubLabel: string;
  streakFlame: string;
  streakFlameWrap: string;
  metricsMinH: string;
  cellPad: string;
  metricLabel: string;
  metricValue: string;
  dayDelta: string;
  barMt: string;
  segRow: string;
  segMinH: string;
  footerPad: string;
  footerText: string;
  fallbackValue: string;
};

const MOBILE_CARD_LAYOUT: CardLayoutTokens = {
  outerPad: "max-w-full overflow-x-clip px-2 pt-3",
  gridCols: "grid-cols-[72px_1fr]",
  rankTower: "px-1 py-2",
  rankLeagueLabel: "text-[7px] tracking-[0.16em]",
  rankLabel: "text-[8px] tracking-[0.2em]",
  rankNum: "text-[44px] leading-[0.9]",
  rankGlow: "0 0 30px rgba(34,211,238,0.3)",
  totalEntries: "text-[8px] tracking-[0.06em]",
  rankMetaRow: "min-h-0 flex-row flex-wrap items-center justify-center gap-1",
  topChip: "text-[8px]",
  headerPad: "px-2 py-1.5",
  avatar: "h-9 w-9",
  name: "text-[14px]",
  postsChip: "text-[7px] tracking-[0.1em]",
  subMeta: "text-[7.5px] tracking-[0.16em]",
  flame: "h-2.5 w-2.5",
  streakHubNum: "text-[18px] leading-none",
  streakHubLabel: "text-[6px] tracking-[0.12em]",
  streakFlame: "h-10 w-10",
  streakFlameWrap: "h-10 w-10",
  metricsMinH: "min-h-[100px]",
  cellPad: "px-2 py-1.5",
  metricLabel: "text-[7px] tracking-[0.16em]",
  metricValue: "text-[18px]",
  dayDelta: "text-[8px]",
  barMt: "mt-1",
  segRow: "h-[6px] gap-[2px]",
  segMinH: "min-h-[6px]",
  footerPad: "px-2.5 py-1",
  footerText: "text-[7.5px] tracking-[0.2em]",
  fallbackValue: "text-[19px]",
};

const WEB_CARD_LAYOUT: CardLayoutTokens = {
  ...MOBILE_CARD_LAYOUT,
  outerPad: "mx-auto w-full max-w-[860px] px-2 pt-3",
  gridCols: "grid-cols-[118px_1fr]",
  rankTower: "px-2 pb-2 pt-4",
  headerPad: "px-3 py-3.5",
  avatar: "h-14 w-14",
  name: "text-[18px]",
  rankNum: "text-[68px] leading-[0.84]",
  rankGlow: "0 0 38px rgba(34,211,238,0.32)",
  streakHubNum: "text-[20px] leading-none",
  streakHubLabel: "text-[6.5px] tracking-[0.14em]",
  streakFlame: "h-11 w-11",
  streakFlameWrap: "h-11 w-11",
  metricValue: "text-[26px]",
  metricsMinH: "min-h-[156px]",
};

/** 4 象限セル（余白・寄せは CSS で統一） — 案B HUD グリッドへ移行済み */

/** 案B HUD — 指標コード表示（PTS 等の代わり） */
const HUD_METRIC_CODE: Record<string, string> = {
  totalScore: "TOT_SCORE",
  winRate: "WIN_RATIO",
  marginPrecision: "SCO_PREC",
  upsetScore: "UPSET_VAL",
};

const CARD_LAYOUT: Record<CardLayout, CardLayoutTokens> = {
  mobile: MOBILE_CARD_LAYOUT,
  web: WEB_CARD_LAYOUT,
};

const HAIRLINE = "rgba(255,255,255,0.12)";
const HAIRLINE_ACCENT = "rgba(255,255,255,0.18)";
const GOLD = "#FFD65A";

/** 連勝表示・スイープ演出を出す閾値（3連勝以上） */
const STREAK_SWEEP_MIN = 3;

/** TOP ◯% バッジを出す上限（上位50%以内のみ） */
const TOP_PERCENT_SHOW_MAX = 50;

function rankTextGradient(gradient: string): CSSProperties {
  return {
    backgroundImage: gradient,
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
  };
}

type RankTowerTier =
  | "champion"
  | "podium"
  | "elite"
  | "gold"
  | "amber"
  | "orange"
  | "cyan"
  | "green"
  | "slate";

const RANK_TIER_ORDER: RankTowerTier[] = [
  "champion",
  "podium",
  "elite",
  "gold",
  "amber",
  "orange",
  "cyan",
  "green",
  "slate",
];

const RANK_TIER_VISUAL: Record<
  RankTowerTier,
  { gradient: CSSProperties; tierClass: string }
> = {
  champion: {
    gradient: rankTextGradient(
      "linear-gradient(180deg, #FFF7ED 0%, #FDE68A 18%, #F59E0B 42%, #EF4444 70%, #991B1B 100%)"
    ),
    tierClass: "my-rank-tower-num--tier-champion",
  },
  podium: {
    gradient: rankTextGradient(
      "linear-gradient(180deg, #FFFBEB 0%, #FDE68A 24%, #F59E0B 55%, #B45309 100%)"
    ),
    tierClass: "my-rank-tower-num--tier-podium",
  },
  elite: {
    gradient: rankTextGradient(
      "linear-gradient(180deg, #FFFFFF 0%, #FEF3C7 28%, #FCD34D 58%, #D97706 100%)"
    ),
    tierClass: "my-rank-tower-num--tier-elite",
  },
  gold: {
    gradient: rankTextGradient(
      "linear-gradient(180deg, #FFFBEB 0%, #FDE68A 32%, #F59E0B 68%, #B45309 100%)"
    ),
    tierClass: "my-rank-tower-num--tier-gold",
  },
  amber: {
    gradient: rankTextGradient(
      "linear-gradient(180deg, #FFFBEB 0%, #FCD34D 30%, #FB923C 68%, #EA580C 100%)"
    ),
    tierClass: "my-rank-tower-num--tier-amber",
  },
  orange: {
    gradient: rankTextGradient(
      "linear-gradient(180deg, #FFF7ED 0%, #FDBA74 38%, #F97316 72%, #C2410C 100%)"
    ),
    tierClass: "my-rank-tower-num--tier-orange",
  },
  cyan: {
    gradient: rankTextGradient(
      "linear-gradient(180deg, #E0F2FE 0%, #67E8F9 38%, #06B6D4 72%, #0E7490 100%)"
    ),
    tierClass: "my-rank-tower-num--tier-cyan",
  },
  green: {
    gradient: rankTextGradient(
      "linear-gradient(180deg, #D1FAE5 0%, #6EE7B7 38%, #10B981 72%, #047857 100%)"
    ),
    tierClass: "my-rank-tower-num--tier-green",
  },
  slate: {
    gradient: rankTextGradient(
      "linear-gradient(180deg, #E2E8F0 0%, #94A3B8 48%, #475569 100%)"
    ),
    tierClass: "my-rank-tower-num--tier-slate",
  },
};

type RankTowerVisual = {
  gradient: CSSProperties;
  tierClass: string;
};

function pickBetterRankTier(a: RankTowerTier, b: RankTowerTier): RankTowerTier {
  return RANK_TIER_ORDER.indexOf(a) <= RANK_TIER_ORDER.indexOf(b) ? a : b;
}

function rankTierFromPercentile(pct: number): RankTowerTier {
  if (pct <= 1) return "champion";
  if (pct <= 3) return "elite";
  if (pct <= 7) return "gold";
  if (pct <= 15) return "amber";
  if (pct <= 25) return "orange";
  if (pct <= 40) return "cyan";
  if (pct <= 55) return "green";
  return "slate";
}

function rankTierFromAbsolute(rank: number): RankTowerTier {
  if (rank === 1) return "champion";
  if (rank <= 3) return "podium";
  if (rank <= 10) return "orange";
  if (rank <= 25) return "cyan";
  if (rank <= 100) return "green";
  return "slate";
}

function resolveRankTowerTier(
  rank: number,
  totalEntries: number | null | undefined
): RankTowerTier {
  const absTier = rankTierFromAbsolute(rank);
  const pct =
    typeof totalEntries === "number" && totalEntries > 0
      ? (rank / totalEntries) * 100
      : null;

  if (pct == null) return absTier;
  return pickBetterRankTier(absTier, rankTierFromPercentile(pct));
}

/** 順位が上がるほど（数値が小さいほど）ランク数字の色が豪華になる */
function rankTowerVisual(
  rank: number | null,
  totalEntries: number | null | undefined,
  loading: boolean
): RankTowerVisual {
  if (loading || rank == null || rank < 1) return RANK_TIER_VISUAL.cyan;

  const tier = resolveRankTowerTier(rank, totalEntries);
  return RANK_TIER_VISUAL[tier];
}

/** モバイル順位色 — 下位50%は白グレー、上位50%から順位が上がるほど濃いオレンジ */
type MobileRankVisual = {
  tierClass: string;
  style: CSSProperties;
};

function resolveMobileRankVisual(
  rank: number | null,
  totalEntries: number | null | undefined,
  loading: boolean
): MobileRankVisual {
  const raceClass = "my-rank-tower-num--mobile-race";
  if (loading || rank == null || rank < 1) {
    return {
      tierClass: `${raceClass} my-rank-tower-num--mobile-muted`,
      style: {
        color: "#94A3B8",
        filter: "drop-shadow(0 0 6px rgba(148,163,184,0.2))",
      },
    };
  }

  const pct =
    typeof totalEntries === "number" && totalEntries > 0
      ? (rank / totalEntries) * 100
      : null;

  if (pct == null || pct > 50) {
    return {
      tierClass: `${raceClass} my-rank-tower-num--mobile-lower`,
      style: {
        color: "#CBD5E1",
        filter: "drop-shadow(0 0 8px rgba(148,163,184,0.22))",
      },
    };
  }

  /** 50% 境界=0、1位付近=1 */
  const t = Math.min(1, Math.max(0, (50 - pct) / 50));
  const lightness = 70 - t * 28;
  const saturation = 86 + t * 10;

  return {
    tierClass: `${raceClass} my-rank-tower-num--mobile-top`,
    style: {
      color: `hsl(32, ${saturation}%, ${lightness}%)`,
      filter: `drop-shadow(0 0 ${7 + t * 12}px rgba(245, 158, 11, ${0.24 + t * 0.42}))`,
    },
  };
}

const CARD_SHELL: CSSProperties = {
  background: "transparent",
  borderRadius: 0,
};

/** 初回マウント時のみのブラー段階解除（タブ切替では再生しない） */
const ENTER_EASE = [0.22, 1, 0.36, 1] as const;
const ENTER_DURATION = 0.5;
const BLUR_DURATION = 0.88;
const BLUR_KEYFRAMES = [
  "blur(22px) brightness(0.88) saturate(0.82)",
  "blur(14px) brightness(0.93) saturate(0.9)",
  "blur(7px) brightness(0.97) saturate(0.96)",
  "blur(2px) brightness(0.99) saturate(0.99)",
  "blur(0px) brightness(1) saturate(1)",
] as const;
const BLUR_TIMES = [0, 0.22, 0.42, 0.64, 1] as const;

const RANK_COUNT_DURATION_MS = 900;

/* ============================================================
 * 案C: オーバーシュート着地（easeOutBack で揺れて止まる）
 * ============================================================ */
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

/* ============================================================
 * ホロカード傾き（ref 直接操作・再レンダーなし）
 * マウスのみ有効 — タッチスクロール中の誤傾きを防ぐ
 * ============================================================ */
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
      wrap.style.transform =
        "perspective(900px) rotateX(0deg) rotateY(0deg)";
      wrap.style.transition =
        "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)";
    }
    if (glare) {
      glare.style.opacity = "0";
    }
  }, []);

  return { wrapRef, glareRef, onMove, onLeave };
}

function metricAccent(key: string) {
  return rankingMetricAccent(key);
}

/* ============================================================
 * HUD セグメントバー — ランキングリストと共通の斜めセグ
 * ============================================================ */

function HudSegBar({
  pct,
  enter,
  segMinHClass: _segMinHClass,
  accentColor,
  glow,
  accentDim,
  compact = false,
}: {
  pct: number;
  enter: boolean;
  reduceMotion: boolean | null;
  segMinHClass: string;
  accentColor: string;
  glow: string;
  accentDim: string;
  compact?: boolean;
}) {
  return (
    <CyberSlantedSegBar
      pct={pct}
      compact={compact}
      enter={enter}
      accent={{
        border: accentColor,
        glow,
        bg: accentDim,
      }}
      maxWidthClass="max-w-full"
    />
  );
}

type MetricAccent = ReturnType<typeof metricAccent>;

/** 個人統計取得中のプレースホルダ（ネイティブと同じ） */
const STATS_PENDING_MARK = "···";

/** 案B — 2×2 HUD セル（プレビュー /dev/my-rank-stats-hud-preview 案B 準拠） */
function MyRankHudStatCell({
  hudCode,
  value,
  dayDelta,
  pct,
  accent,
  selected,
  dimmed,
  pending,
  segEnter,
  reduceMotion,
  metricValueClass,
  compact = false,
}: {
  hudCode: string;
  value: string;
  dayDelta?: string | null;
  pct: number;
  accent: MetricAccent;
  selected: boolean;
  dimmed: boolean;
  pending: boolean;
  segEnter: boolean;
  reduceMotion: boolean | null;
  metricValueClass: string;
  compact?: boolean;
}) {
  return (
    <div
      className={[
        "my-rank-hud-cell relative flex min-w-0 flex-col text-left",
        compact ? "gap-1 px-2 py-2" : "gap-2 px-3 py-3",
      ].join(" ")}
      style={{
        background: selected ? accent.bg : undefined,
        opacity: dimmed ? 0.58 : 1,
        boxShadow: selected ? `inset 0 0 20px ${accent.bg}` : undefined,
        outline: selected ? `1px solid ${accent.labelDim}` : undefined,
        transition:
          "opacity 200ms ease, background 200ms ease, box-shadow 200ms ease",
      }}
    >
      <span
        aria-hidden
        className="my-rank-hud-cell__accent"
        style={{
          background: accent.border,
          boxShadow: `0 0 8px ${accent.bar.glow}`,
        }}
      />

      <span
        className={[
          "pl-2 font-semibold uppercase tracking-[0.14em]",
          nameOxanium.className,
        ].join(" ")}
        style={{
          color: selected ? accent.label : accent.labelDim,
          fontSize: compact ? "7.5px" : "8.5px",
          lineHeight: 1,
        }}
      >
        {hudCode}
      </span>

      <div className="flex items-baseline gap-1.5 pl-2">
        <span
          className={[
            summaryMetricNumClass,
            "leading-none tabular-nums",
            metricValueClass,
          ].join(" ")}
          style={{
            color: selected ? accent.value : "rgba(255,255,255,0.92)",
          }}
        >
          {pending ? STATS_PENDING_MARK : value}
        </span>
        {!pending && dayDelta ? (
          <span
            className={[
              "font-bold tabular-nums leading-none",
              nameOxanium.className,
            ].join(" ")}
            style={{
              fontSize: "10px",
              color: dayDelta.startsWith("-")
                ? "rgba(255,255,255,0.42)"
                : accent.border,
            }}
          >
            {dayDelta}
          </span>
        ) : null}
      </div>

      <div className="pl-2">
        <HudSegBar
          pct={pct}
          enter={segEnter && !pending}
          reduceMotion={reduceMotion}
          segMinHClass={compact ? "h-[5px]" : "h-[6px]"}
          accentColor={accent.border}
          glow={accent.bar.glow}
          accentDim={accent.bg}
          compact={compact}
        />
      </div>
    </div>
  );
}

/** 2×2 指標のスケルトン（myRow 未到着時） */
const METRICS_SKELETON_CELLS = [
  { key: "totalScore", label: "TOT_SCORE" },
  { key: "winRate", label: "WIN_RATIO" },
  { key: "marginPrecision", label: "SCO_PREC" },
  { key: "upsetScore", label: "UPSET_VAL" },
] as const;

function MyRankMetricsSkeleton({
  ui,
  layout,
}: {
  ui: CardLayoutTokens;
  layout: CardLayout;
}) {
  const compact = layout === "mobile";
  return (
    <div
      className={[
        "my-rank-hud-panel relative shrink-0",
        ui.metricsMinH,
        layout === "web" ? "my-rank-hud-panel--web" : "",
      ].join(" ")}
      aria-hidden
    >
      <div className="grid grid-cols-2 divide-x divide-y divide-white/10">
        {METRICS_SKELETON_CELLS.map((cell) => {
          const accent = metricAccent(cell.key);
          return (
            <MyRankHudStatCell
              key={cell.key}
              hudCode={cell.label}
              value={STATS_PENDING_MARK}
              pct={0}
              accent={accent}
              selected={false}
              dimmed={false}
              pending
              segEnter={false}
              reduceMotion
              metricValueClass={ui.metricValue}
              compact={compact}
            />
          );
        })}
      </div>
    </div>
  );
}

/** 微細スキャンライン（控えめ） */
function ScanTexture() {
  return (
    <div
      className="pointer-events-none absolute inset-0 rounded-[12px]"
      style={{
        background:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.01) 0px, rgba(255,255,255,0.01) 1px, transparent 1px, transparent 4px)",
      }}
    />
  );
}

/** 連勝数ごとの炎・ハブ色（3 / 5 / 7 連勝で段階アップ） */
type StreakFlameVisual = {
  hubExtra: string;
  wrapExtra: string;
  flameExtra: string;
  numExtra: string;
  labelExtra: string;
};

function streakFlameVisual(count: number): StreakFlameVisual {
  if (count <= 0) {
    return {
      hubExtra: "",
      wrapExtra: "",
      flameExtra: "my-rank-streak-flame--cold",
      numExtra: "my-rank-streak-num--cold",
      labelExtra: "text-white/35",
    };
  }
  if (count >= 7) {
    return {
      hubExtra: "my-rank-streak-hub--tier-legend",
      wrapExtra: "my-rank-streak-flame-wrap--tier-legend",
      flameExtra:
        "my-rank-streak-flame--hot my-rank-streak-flame--tier-legend",
      numExtra: "my-rank-streak-num--hot my-rank-streak-num--tier-legend",
      labelExtra: "text-amber-200/85",
    };
  }
  if (count >= 5) {
    return {
      hubExtra: "my-rank-streak-hub--tier-blaze",
      wrapExtra: "my-rank-streak-flame-wrap--tier-blaze",
      flameExtra: "my-rank-streak-flame--hot my-rank-streak-flame--tier-blaze",
      numExtra: "my-rank-streak-num--hot my-rank-streak-num--tier-blaze",
      labelExtra: "text-cyan-200/80",
    };
  }
  if (count >= 3) {
    return {
      hubExtra: "my-rank-streak-hub--tier-warm",
      wrapExtra: "my-rank-streak-flame-wrap--tier-warm",
      flameExtra: "my-rank-streak-flame--hot my-rank-streak-flame--tier-warm",
      numExtra: "my-rank-streak-num--hot my-rank-streak-num--tier-warm",
      labelExtra: "text-amber-300/80",
    };
  }
  return {
    hubExtra: "my-rank-streak-hub--tier-ember",
    wrapExtra: "my-rank-streak-flame-wrap--tier-ember",
    flameExtra: "my-rank-streak-flame--hot my-rank-streak-flame--tier-ember",
    numExtra: "my-rank-streak-num--hot my-rank-streak-num--tier-ember",
    labelExtra: "text-orange-300/75",
  };
}

/** 2×2 グリッド中央 — 連勝数 + 炎アニメ */
function StreakHub({
  streak,
  loading,
  language,
  ui,
  streakSweep,
  reduceMotion,
  selected,
}: {
  streak: number | null;
  loading: boolean;
  language: Language;
  ui: CardLayoutTokens;
  streakSweep: boolean;
  reduceMotion: boolean | null;
  selected: boolean;
}) {
  const label = streakShortLabel(language);
  const streakCount = loading ? 0 : Math.max(0, streak ?? 0);
  const display = loading ? "--" : String(streakCount);
  const flameVisual = streakFlameVisual(streakCount);
  const streakAccent = metricAccent("streak");
  const motionOn = reduceMotion !== true;

  return (
    <div
      className={[
        "my-rank-streak-hub-slot pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
        selected ? "z-[8]" : "z-[6]",
      ].join(" ")}
      aria-label={
        loading
          ? undefined
          : `${display}${label}`
      }
    >
      <div className="my-rank-hub-occluder absolute inset-0 rounded-full" aria-hidden />
      <div
        className={[
          "my-rank-streak-hub relative flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-full transition-[border-color,box-shadow,background] duration-200",
          flameVisual.hubExtra,
          selected ? "my-rank-streak-hub--selected" : "",
        ].join(" ")}
      >
        {streakSweep ? (
          <div
            className="pointer-events-none absolute inset-0 z-[1] overflow-hidden rounded-full result-card-streak-sweep"
            aria-hidden
          >
            <div className="result-card-streak-sweep__spin" />
          </div>
        ) : null}

        <div className="relative z-[2] flex flex-col items-center justify-center gap-px pt-1">
          <div
            className={[
              "my-rank-streak-flame-wrap",
              ui.streakFlameWrap,
              flameVisual.wrapExtra,
            ].join(" ")}
          >
            <Flame
              aria-hidden
              className={[
                "my-rank-streak-flame my-rank-streak-flame--back",
                ui.streakFlame,
                flameVisual.flameExtra,
                motionOn ? "" : "my-rank-streak-flame--static",
              ].join(" ")}
            />
            <span
              className={[
                "my-rank-streak-num",
                summaryMetricNumClass,
                ui.streakHubNum,
                flameVisual.numExtra,
              ].join(" ")}
            >
              {display}
            </span>
          </div>
          <span
            className={[
              "font-bold uppercase transition-colors duration-200",
              ui.streakHubLabel,
              nameOxanium.className,
              selected ? "" : flameVisual.labelExtra,
            ].join(" ")}
            style={selected ? { color: streakAccent.label } : undefined}
          >
            {label}
          </span>
        </div>
      </div>
    </div>
  );
}

/** ガラス面のハイライト */
function GlassSheen() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[12px]"
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
}: Props) {
  const ui = CARD_LAYOUT[layout];
  const m = t(language);
  const reduceMotion = useReducedMotion();
  const ready = !loading;

  const tiltEnabled = reduceMotion !== true && layout !== "web";
  const tilt = useHoloTilt(tiltEnabled);

  const countEnabled = ready && reduceMotion !== true;
  const rankCount = useOvershootCount(
    rank ?? 0,
    RANK_COUNT_DURATION_MS,
    countEnabled && rank != null
  );

  /* 案C: 順位上昇時のみ、カウント完了後にシアン発火（下降は演出しない） */
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

  /** 4 指標バー — リーダー行が全部揃ってから一斉スタagger（タブ切替では再生しない） */
  const [segEnter, setSegEnter] = useState(false);
  useEffect(() => {
    if (!ready || !barsReady) {
      setSegEnter(false);
      return;
    }
    setSegEnter(true);
  }, [ready, barsReady, cardResetKey]);

  const outerPad = ui.outerPad;

  /** カード表示用（NBA はページ文脈で自明なため省略） */
  const leagueDisplay =
    leagueLabel && leagueLabel.toUpperCase() !== "NBA" ? leagueLabel : null;

  const rankTowerLeague = leagueLabel?.trim() || null;

  const statsPending = statsScramble && !loading;
  const rankDisplay = loading
    ? "--"
    : statsPending
      ? STATS_PENDING_MARK
      : rank == null
        ? "--"
        : String(reduceMotion === true ? rank : rankCount);

  const rankVisualPending = loading || statsPending;
  const mobileRankVisual = resolveMobileRankVisual(
    rank,
    totalEntries,
    rankVisualPending
  );
  const webRankVisual = rankTowerVisual(rank, totalEntries, rankVisualPending);

  const topPercent =
    !loading &&
    rank != null &&
    typeof totalEntries === "number" &&
    totalEntries > 0
      ? (() => {
          const pct = (rank / totalEntries) * 100;
          // 上位50%以内のみ表示（TOP 50%が表示上限・下位50%は非表示）
          if (pct > TOP_PERCENT_SHOW_MAX) return null;
          const clamped = Math.min(
            TOP_PERCENT_SHOW_MAX,
            Math.max(0.1, pct)
          );
          return clamped < 10
            ? clamped.toFixed(1)
            : String(Math.round(clamped));
        })()
      : null;

  const totalEntriesLabel =
    !loading &&
    typeof totalEntries === "number" &&
    totalEntries > 0
      ? m.rankings.entriesOf.replace(
          "{n}",
          totalEntries.toLocaleString(
            language === "ja" ? "ja-JP" : "en-US"
          )
        )
      : null;

  const streakN =
    typeof streak === "number" && streak >= STREAK_SWEEP_MIN ? streak : null;
  const streakSweep =
    !loading && streakN != null && streakN >= STREAK_SWEEP_MIN;

  const flagSrc = countryCode ? FLAG_SRC[countryCode.toUpperCase()] : undefined;

  const hasCells = !!miniMetrics && miniMetrics.length > 0;
  const showMetricsSkeleton = statsPending && !hasCells;
  const streakMetricSelected = metric === "streak";
  const goalScorerMetricSelected = metric === "goalScorerHits";
  const outsideGridMetricSelected =
    goalScorerMetricSelected ||
    (streakMetricSelected && !miniMetrics?.some((mt) => mt.key === "streak"));

  const fallbackMetricValue = loading
    ? "--"
    : metric === "winRate"
      ? `${Math.round(value)}%`
      : metric === "streak" || metric === "goalScorerHits"
        ? `${Math.round(value)}`
        : `${formatMetricDecimals(value, 1)} ${m.rankings.pts}`;
  /** シリアル帯の日付（JST・マウント時固定） */
  const serialDateKey = useRef(dateKeyJST()).current;

  const body = (
    <MyRankCardFrame>
    <div
      className="relative overflow-hidden rounded-none"
      style={CARD_SHELL}
      aria-busy={statsScramble || undefined}
    >
      {streakSweep ? (
        <div
          data-capture-skip
          className="pointer-events-none absolute inset-0 z-30 overflow-hidden rounded-none result-card-streak-sweep"
          aria-hidden
        >
          <div className="result-card-streak-sweep__spin" />
        </div>
      ) : null}

      {flagSrc ? (
        <div
          data-capture-skip
          className="pointer-events-none absolute inset-0 overflow-hidden rounded-none"
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
          className="pointer-events-none absolute inset-0 z-20 rounded-none"
          style={{
            background:
              "radial-gradient(380px circle at 50% 50%, rgba(255,255,255,0.12) 0%, transparent 55%)",
            opacity: 0,
            transition: "opacity 300ms ease",
          }}
        />
      ) : null}

      {/* 案C: 上昇フラッシュ */}
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

      <div
        className={[
          "relative z-10 grid",
          ui.gridCols,
          layout === "mobile" ? "my-rank-card__grid--mobile" : "",
        ].join(" ")}
      >
        {/* 左セル: 順位の塔 */}
        <div
          className={[
            "relative flex flex-col items-center",
            layout === "mobile"
              ? "justify-center gap-0.5"
              : "justify-between",
            ui.rankTower,
          ].join(" ")}
          style={{
            borderRight: `1px solid ${HAIRLINE_ACCENT}`,
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)",
          }}
        >
          <div className="flex w-full flex-col items-center gap-0.5">
            {rankTowerLeague ? (
              <span
                className={[
                  "text-center font-bold uppercase text-cyan-300/55",
                  ui.rankLeagueLabel,
                  nameOxanium.className,
                ].join(" ")}
              >
                {rankTowerLeague}
              </span>
            ) : null}
            <span
              className={[
                "text-center font-bold uppercase text-white/55",
                ui.rankLabel,
                nameOxanium.className,
              ].join(" ")}
            >
              {m.rankings.yourRank}
            </span>
          </div>
          <span
            className={[
              nameBebas.className,
              ui.rankNum,
              layout === "mobile"
                ? mobileRankVisual.tierClass
                : webRankVisual.tierClass,
            ].join(" ")}
            style={
              layout === "mobile"
                ? mobileRankVisual.style
                : webRankVisual.gradient
            }
          >
            {rankDisplay}
          </span>
          {totalEntriesLabel ? (
            <span
              className={[
                "-mt-0.5 font-medium tabular-nums text-white/35",
                ui.totalEntries,
                nameOxanium.className,
              ].join(" ")}
            >
              {totalEntriesLabel}
            </span>
          ) : null}
          <div className={["flex", ui.rankMetaRow].join(" ")}>
            {!loading && !statsPending && rank != null ? (
              <RankDeltaBadge
                delta={rankDeltaPlaces}
                size="lg"
                language={language}
              />
            ) : null}
            {!statsPending && topPercent ? (
              <span
                className={[
                  "rounded px-1.5 py-[2px] font-bold tracking-wide",
                  ui.topChip,
                  nameOxanium.className,
                ].join(" ")}
                style={{
                  color: GOLD,
                  background: "rgba(255,214,90,0.08)",
                }}
              >
                {m.rankings.topPercent.replace("{n}", topPercent)}
              </span>
            ) : null}
          </div>
        </div>

        {/* 右: ヘッダー行 + 2×2 メトリクスセル */}
        <div className="flex h-full min-h-0 flex-col">
          <div
            className={["flex flex-1 items-center gap-2", ui.headerPad].join(" ")}
            style={{ borderBottom: `1px solid ${HAIRLINE}` }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <div
                className={[
                  "relative shrink-0 overflow-hidden rounded-sm",
                  ui.avatar,
                ].join(" ")}
                style={{ border: "1px solid rgba(255,255,255,0.12)" }}
              >
                <RankingsAvatarCircle
                  photoURL={photoURL}
                  displayName={displayName}
                  boxClassName="h-full w-full rounded-sm"
                  initialTextClassName={
                    layout === "web" ? "text-[14px]" : "text-[11px]"
                  }
                  gateReady={ready}
                />
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1.5">
                  <div
                    className={[
                      "min-w-0 truncate font-black leading-none text-white",
                      ui.name,
                      jp.className,
                    ].join(" ")}
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
                  {typeof totalPosts === "number" ? (
                    <span
                      className={[
                        "shrink-0 font-semibold uppercase text-white/45",
                        ui.postsChip,
                        nameOxanium.className,
                      ].join(" ")}
                    >
                      {postsLabel(language)} {totalPosts}
                    </span>
                  ) : null}
                </div>
                {leagueDisplay ? (
                  <div
                    className={[
                      "mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 font-bold uppercase text-cyan-300/60",
                      ui.subMeta,
                      nameOxanium.className,
                    ].join(" ")}
                  >
                    <span>{leagueDisplay}</span>
                    {streakN ? (
                      <span className="inline-flex items-center gap-0.5 text-orange-400">
                        <Flame className="h-2.5 w-2.5 shrink-0" aria-hidden />
                        {streakN}
                        {streakShortLabel(language)}
                      </span>
                    ) : null}
                  </div>
                ) : streakN ? (
                  <div
                    className={[
                      "mt-1 inline-flex items-center gap-0.5 font-bold uppercase text-orange-400",
                      ui.subMeta,
                      nameOxanium.className,
                    ].join(" ")}
                  >
                    <Flame className="h-2.5 w-2.5 shrink-0" aria-hidden />
                    {streakN}
                    {streakShortLabel(language)}
                  </div>
                ) : null}
              </div>
            </div>
          </div>

          {showMetricsSkeleton ? (
            <MyRankMetricsSkeleton ui={ui} layout={layout} />
          ) : hasCells ? (
            <div
              className={[
                "my-rank-hud-panel relative shrink-0",
                ui.metricsMinH,
                layout === "web" ? "my-rank-hud-panel--web" : "",
                streakMetricSelected ? "my-rank-hud-panel--streak-selected" : "",
                goalScorerMetricSelected
                  ? "my-rank-hud-panel--goal-scorer-selected"
                  : "",
              ].join(" ")}
            >
              <div className="grid grid-cols-2 divide-x divide-y divide-white/10">
                {miniMetrics!.slice(0, 4).map((mt) => {
                  const selected = mt.key === metric;
                  const accent = metricAccent(mt.key);
                  const hudCode = HUD_METRIC_CODE[mt.key] ?? mt.label;
                  const dimmed =
                    (outsideGridMetricSelected || streakMetricSelected) &&
                    !selected;
                  return (
                    <MyRankHudStatCell
                      key={mt.key}
                      hudCode={hudCode}
                      value={mt.value}
                      dayDelta={mt.dayDelta}
                      pct={mt.pct}
                      accent={accent}
                      selected={selected}
                      dimmed={dimmed}
                      pending={loading || statsPending}
                      segEnter={segEnter}
                      reduceMotion={reduceMotion}
                      metricValueClass={ui.metricValue}
                      compact={layout === "mobile"}
                    />
                  );
                })}
              </div>
              {streakMetricSelected ? (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                  <StreakHub
                    streak={streak}
                    loading={loading}
                    language={language}
                    ui={ui}
                    streakSweep={streakSweep}
                    reduceMotion={reduceMotion}
                    selected
                  />
                </div>
              ) : null}
              {goalScorerMetricSelected ? (
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-black/25">
                  <div
                    className="flex min-w-[108px] flex-col items-center rounded-none border px-3 py-2 text-center"
                    style={{
                      borderColor: metricAccent("goalScorerHits").border,
                      background: metricAccent("goalScorerHits").bg,
                      boxShadow: "0 0 24px rgba(244,114,182,0.18)",
                    }}
                  >
                    <span
                      className={[
                        "font-semibold uppercase",
                        ui.metricLabel,
                        nameOxanium.className,
                      ].join(" ")}
                      style={{ color: metricAccent("goalScorerHits").label }}
                    >
                      {metricLabel("goalScorerHits", language)}
                    </span>
                    <span
                      className={[
                        summaryMetricNumClass,
                        "mt-1 leading-none",
                        ui.metricValue,
                      ].join(" ")}
                      style={{ color: metricAccent("goalScorerHits").value }}
                    >
                      {statsPending ? STATS_PENDING_MARK : fallbackMetricValue}
                    </span>
                  </div>
                </div>
              ) : null}
            </div>
          ) : (
            /* miniMetrics 未提供の文脈（月間リーダーボード等）は現在値のみ */
            <div className="flex flex-1 items-center justify-end px-3 py-2">
              <div
                className={[
                  summaryMetricNumClass,
                  "leading-none text-white/92",
                  ui.fallbackValue,
                ].join(" ")}
              >
                {loading || statsPending ? STATS_PENDING_MARK : fallbackMetricValue}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 下部シリアル帯 */}
      <div
        className={["relative z-10", ui.footerPad].join(" ")}
        style={{
          borderTop: `1px solid ${HAIRLINE}`,
        }}
      >
        <span
          className={[
            "block min-w-0 truncate font-medium uppercase text-white/32",
            ui.footerText,
            nameOxanium.className,
          ].join(" ")}
        >
          UNITERZ{leagueDisplay ? ` · ${leagueDisplay}` : ""}
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

  /* key は固定 — タブ切替で再マウントせず、順位・ハイライトだけが変わる */
  return (
    <motion.div
      className={outerPad}
      initial={{
        opacity: 0,
        y: 22,
        filter: BLUR_KEYFRAMES[0],
      }}
      animate={{
        opacity: 1,
        y: 0,
        filter: [...BLUR_KEYFRAMES],
      }}
      transition={{
        opacity: { duration: ENTER_DURATION, ease: ENTER_EASE },
        y: { duration: ENTER_DURATION + 0.04, ease: ENTER_EASE },
        filter: {
          duration: BLUR_DURATION,
          ease: "linear",
          times: [...BLUR_TIMES],
        },
      }}
    >
      {tiltWrapped}
    </motion.div>
  );
}
