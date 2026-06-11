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
import {
  MyRankCardBacklight,
  MY_RANK_CARD_RIM_FILTER,
} from "@/app/component/rankings/MyRankCardBacklight";
import { FLAG_SRC } from "@/lib/rankings/country";
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";
import { Flame } from "lucide-react";

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
  /** web ランキングは余白・タイポ・バーを一回り大きく */
  layout?: "mobile" | "web";
};

type CardLayout = NonNullable<Props["layout"]>;

const CARD_LAYOUT: Record<
  CardLayout,
  {
    outerPad: string;
    gridCols: string;
    rankTower: string;
    rankLabel: string;
    rankNum: string;
    rankGlow: string;
    totalEntries: string;
    rankMetaRow: string;
    topChip: string;
    headerPad: string;
    avatar: string;
    name: string;
    subMeta: string;
    flame: string;
    cellPad: string;
    metricLabel: string;
    metricValue: string;
    dayDelta: string;
    barMt: string;
    segRow: string;
    segMinH: string;
    footerPad: string;
    footerText: string;
    decorStripe: string;
    fallbackValue: string;
  }
> = {
  mobile: {
    outerPad: "overflow-visible px-3 pt-3",
    gridCols: "grid-cols-[118px_1fr]",
    rankTower: "px-2 pb-2 pt-2.5",
    rankLabel: "text-[11px] tracking-[0.22em]",
    rankNum: "text-[68px] leading-[0.84]",
    rankGlow: "0 0 34px rgba(34,211,238,0.22)",
    totalEntries: "text-[9px] tracking-[0.08em]",
    rankMetaRow: "min-h-[18px] gap-1.5",
    topChip: "text-[9px]",
    headerPad: "px-2.5 py-1.5",
    avatar: "h-7 w-7",
    name: "text-[13px]",
    subMeta: "text-[8px] tracking-[0.18em]",
    flame: "h-2.5 w-2.5",
    cellPad: "px-2.5 py-1.5",
    metricLabel: "text-[7.5px] tracking-[0.18em]",
    metricValue: "text-[15px]",
    dayDelta: "text-[9px]",
    barMt: "mt-1.5",
    segRow: "h-[5px] gap-[2px]",
    segMinH: "min-h-[5px]",
    footerPad: "px-2.5 py-[5px]",
    footerText: "text-[8px] tracking-[0.26em]",
    decorStripe: "h-[44px] w-[44px]",
    fallbackValue: "text-[21px]",
  },
  web: {
    outerPad: "overflow-visible px-0 pt-4",
    gridCols: "grid-cols-[156px_1fr]",
    rankTower: "px-3 pb-3 pt-3",
    rankLabel: "text-[13px] tracking-[0.24em]",
    rankNum: "text-[92px] leading-[0.82]",
    rankGlow: "0 0 42px rgba(34,211,238,0.26)",
    totalEntries: "text-[10px] tracking-[0.1em]",
    rankMetaRow: "min-h-[22px] gap-2",
    topChip: "text-[10px]",
    headerPad: "px-3.5 py-2.5",
    avatar: "h-9 w-9",
    name: "text-[15px]",
    subMeta: "text-[9px] tracking-[0.2em]",
    flame: "h-3 w-3",
    cellPad: "px-3.5 py-3",
    metricLabel: "text-[9px] tracking-[0.2em]",
    metricValue: "text-[19px]",
    dayDelta: "text-[10px]",
    barMt: "mt-2",
    segRow: "h-[7px] gap-[3px]",
    segMinH: "min-h-[7px]",
    footerPad: "px-3.5 py-2",
    footerText: "text-[9px] tracking-[0.28em]",
    decorStripe: "h-[52px] w-[52px]",
    fallbackValue: "text-[24px]",
  },
};

const CYAN = "#22d3ee";
const HAIRLINE = "rgba(34,211,238,0.16)";
const GOLD = "#FFD65A";

/** 連勝スイープを出す閾値 */
const STREAK_SWEEP_MIN = 3;

const RANK_GRADIENT: CSSProperties = {
  backgroundImage:
    "linear-gradient(180deg, #F2FEFF 0%, #9BEAF6 38%, #22d3ee 72%, #0E7490 100%)",
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
};

/** 右下コーナーカット（14px ノッチ） */
const CARD_NOTCH_CLIP =
  "polygon(0 0, 100% 0, 100% calc(100% - 14px), calc(100% - 14px) 100%, 0 100%)";

const CARD_SHELL: CSSProperties = {
  border: "1px solid rgba(34,211,238,0.5)",
  background:
    "linear-gradient(170deg, rgba(22,34,54,0.98) 0%, rgba(7,12,24,1) 60%)",
  // 外側の落ち影は clip-path で切れるためラッパーの drop-shadow が担う
  boxShadow:
    "inset 0 0 0 1px rgba(8,14,26,0.9), inset 0 0 24px rgba(34,211,238,0.05)",
  clipPath: CARD_NOTCH_CLIP,
  WebkitClipPath: CARD_NOTCH_CLIP,
};

/** ノッチ形状に追従する落ち影 + 案C リムライト（ラッパー側） */
const CARD_DROP_SHADOW = MY_RANK_CARD_RIM_FILTER;

/** 金属パネルのざらつき（SVG fractal noise・静的） */
const NOISE_TEXTURE_URL =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")";

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
const EDGE_GLOW_INITIAL =
  "0 0 0 1px rgba(186,230,253,0.48), 0 0 36px rgba(34,211,238,0.4), 0 0 72px rgba(56,189,248,0.16), 0 0 100px rgba(14,165,233,0.07)";
const EDGE_GLOW_CLEAR =
  "0 0 0 0px rgba(0,0,0,0), 0 0 0px rgba(0,0,0,0), 0 0 0px rgba(0,0,0,0), 0 0 0px rgba(0,0,0,0)";

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
 * ホロカード傾き（CSS transform のみ・±8度）
 * touchAction は固定しない＝スクロールは阻害しない
 * ============================================================ */
function useHoloTilt(enabled: boolean) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<CSSProperties>({});
  const [glare, setGlare] = useState({ x: 50, y: 50, o: 0 });

  const onMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!enabled || !ref.current) return;
      const r = ref.current.getBoundingClientRect();
      if (r.width <= 0 || r.height <= 0) return;
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      const rotY = (px - 0.5) * 16;
      const rotX = (0.5 - py) * 16;
      setStyle({
        transform: `perspective(900px) rotateX(${rotX.toFixed(2)}deg) rotateY(${rotY.toFixed(2)}deg)`,
        transition: "transform 60ms linear",
      });
      setGlare({ x: px * 100, y: py * 100, o: 0.45 });
    },
    [enabled]
  );

  const onLeave = useCallback(() => {
    setStyle({
      transform: "perspective(900px) rotateX(0deg) rotateY(0deg)",
      transition: "transform 420ms cubic-bezier(0.22, 1, 0.36, 1)",
    });
    setGlare((g) => ({ ...g, o: 0 }));
  }, []);

  return { ref, style, glare, onMove, onLeave };
}

/* ============================================================
 * 案A 由来: 12分割セグメントバー（skew 付き）
 * 左→右で冷色→シアン→金→白と段階的に色が変わる
 * ============================================================ */
const SEG_TIERS = [
  { hi: "#5EEAD4", lo: "#0E7490", glow: "rgba(14,116,144,0.45)" },
  { hi: "#8CF0FF", lo: "#22d3ee", glow: "rgba(34,211,238,0.55)" },
  { hi: "#FFE38A", lo: "#FFBE3B", glow: "rgba(255,190,59,0.5)" },
  { hi: "#FFFDE8", lo: "#FFFFFF", glow: "rgba(255,255,255,0.65)" },
] as const;

function segTierStyle(index: number, total: number) {
  const t = total <= 1 ? 0 : index / (total - 1);
  const tier =
    t < 0.34 ? 0 : t < 0.67 ? 1 : t < 0.84 ? 2 : 3;
  const { hi, lo, glow } = SEG_TIERS[tier];
  return {
    background: `linear-gradient(180deg, ${hi}, ${lo})`,
    boxShadow: `0 0 6px ${glow}`,
  };
}

const SEG_STAGGER_S = 0.038;

function SegBar({
  pct,
  enter,
  reduceMotion,
  segRowClass,
  segMinHClass,
}: {
  pct: number;
  /** true で全セグメントが左→右に同期スタagger（4 指標同時） */
  enter: boolean;
  reduceMotion: boolean | null;
  segRowClass: string;
  segMinHClass: string;
}) {
  const SEGS = 12;
  const filled = enter
    ? Math.round((Math.min(100, Math.max(0, pct)) / 100) * SEGS)
    : 0;
  const motionOff = reduceMotion === true;

  return (
    <div
      className="my-rank-seg-track origin-left"
      style={{ transform: "skewX(-12deg)" }}
    >
      <div className={["flex", segRowClass, segMinHClass].join(" ")}>
        {Array.from({ length: SEGS }).map((_, i) => {
          const lit = i < filled;
          const tier = lit ? segTierStyle(i, SEGS) : null;
          const delay = i * SEG_STAGGER_S;
          const shown = enter || motionOff;

          return (
            <motion.div
              key={i}
              className={["my-rank-seg", segMinHClass].join(" ")}
              initial={false}
              animate={{ scaleY: shown ? 1 : 0 }}
              transition={
                motionOff
                  ? { duration: 0 }
                  : {
                      scaleY: {
                        delay: enter ? delay : 0,
                        type: "spring",
                        stiffness: 560,
                        damping: 24,
                      },
                    }
              }
              style={{
                transformOrigin: "center bottom",
                opacity: shown ? (lit ? 1 : 0.38) : 0,
                background: lit
                  ? tier!.background
                  : "rgba(255, 255, 255, 0.09)",
                boxShadow: lit ? tier!.boxShadow : "none",
              }}
            />
          );
        })}
      </div>
    </div>
  );
}

/** 微細スキャンライン（質感） */
function ScanTexture() {
  return (
    <div
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "repeating-linear-gradient(0deg, rgba(255,255,255,0.025) 0px, rgba(255,255,255,0.025) 1px, transparent 1px, transparent 3px)",
      }}
    />
  );
}

/** ノイズ質感（静的・キャプチャ可） */
function NoiseTexture() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        backgroundImage: NOISE_TEXTURE_URL,
        backgroundRepeat: "repeat",
        opacity: 0.045,
      }}
    />
  );
}

/** 順位タワー右縁の目盛り（計器パネル風・静的） */
function RulerTicks() {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-y-2 right-0">
      {/* 小目盛り */}
      <div
        className="absolute inset-y-0 right-0 w-[4px]"
        style={{
          background:
            "repeating-linear-gradient(180deg, rgba(34,211,238,0.2) 0 1px, transparent 1px 6px)",
        }}
      />
      {/* 大目盛り */}
      <div
        className="absolute inset-y-0 right-0 w-[7px]"
        style={{
          background:
            "repeating-linear-gradient(180deg, rgba(34,211,238,0.4) 0 1px, transparent 1px 24px)",
        }}
      />
    </div>
  );
}

/** 上辺・左辺だけ光る配線（HUD の電源ライン） */
function GlowWireFrame() {
  const wire =
    "linear-gradient(90deg, rgba(140,240,255,0.95), rgba(34,211,238,0.75), rgba(34,211,238,0.2))";
  const wireV =
    "linear-gradient(180deg, rgba(140,240,255,0.95), rgba(34,211,238,0.7), rgba(34,211,238,0.12))";
  const glow = "0 0 10px rgba(34,211,238,0.7), 0 0 22px rgba(34,211,238,0.22)";
  return (
    <div className="pointer-events-none absolute inset-0 z-[25]">
      <div
        className="absolute left-0 right-0 top-0 h-[1.5px]"
        style={{ background: wire, boxShadow: glow }}
      />
      <div
        className="absolute bottom-0 left-0 top-0 w-[1.5px]"
        style={{ background: wireV, boxShadow: glow }}
      />
      <div
        className="absolute left-0 top-0 h-4 w-4 border-l-2 border-t-2"
        style={{
          borderColor: "rgba(140,240,255,0.92)",
          boxShadow: "0 0 10px rgba(34,211,238,0.55)",
        }}
      />
      {/* 右下ノッチの斜めエッジライン */}
      <div
        className="absolute right-0 h-[1.5px] w-[20px]"
        style={{
          bottom: "13px",
          transform: "rotate(45deg)",
          transformOrigin: "100% 50%",
          background:
            "linear-gradient(90deg, rgba(34,211,238,0.2), rgba(140,240,255,0.85))",
          boxShadow: "0 0 8px rgba(34,211,238,0.5)",
        }}
      />
      {/* 右下の L 字ブラケット（左上と対） */}
      <div
        className="absolute bottom-2 right-2 h-3.5 w-3.5 border-b border-r"
        style={{
          borderColor: "rgba(140,240,255,0.55)",
          boxShadow: "0 0 8px rgba(34,211,238,0.3)",
        }}
      />
    </div>
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

  const tiltEnabled = reduceMotion !== true;
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

  const outerPad = mobileWide
    ? "overflow-visible -mx-1.5 px-0 pt-3 sm:mx-0 sm:px-3"
    : ui.outerPad;

  const rankDisplay =
    loading || rank == null
      ? "--"
      : String(reduceMotion === true ? rank : rankCount);

  const topPercent =
    !loading &&
    rank != null &&
    typeof totalEntries === "number" &&
    totalEntries > 0
      ? (() => {
          const pct = Math.max(0.1, (rank / totalEntries) * 100);
          return pct < 10 ? pct.toFixed(1) : String(Math.round(pct));
        })()
      : null;

  const totalEntriesLabel =
    !loading &&
    typeof totalEntries === "number" &&
    totalEntries > 0
      ? (() => {
          const n = totalEntries.toLocaleString(
            language === "ja" ? "ja-JP" : "en-US"
          );
          return language === "ja" ? `/ ${n}人` : `/ ${n}`;
        })()
      : null;

  const streakN = typeof streak === "number" && streak > 0 ? streak : null;
  const streakSweep =
    !loading && streakN != null && streakN >= STREAK_SWEEP_MIN;

  const flagSrc = countryCode ? FLAG_SRC[countryCode.toUpperCase()] : undefined;

  const hasCells = !!miniMetrics && miniMetrics.length > 0;

  /** シリアル帯の日付（JST・マウント時固定） */
  const serialDateKey = useRef(dateKeyJST()).current;

  const body = (
    <div
      className="relative overflow-hidden rounded-none"
      style={CARD_SHELL}
      aria-busy={statsScramble || undefined}
    >
      {/* 連勝スイープ（3連勝以上） */}
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
          className="pointer-events-none absolute inset-0 overflow-hidden"
        >
          <img
            src={flagSrc}
            alt=""
            crossOrigin="anonymous"
            className="absolute right-[-8%] top-1/2 h-[130%] -translate-y-1/2 object-contain"
            style={{ opacity: 0.07 }}
            draggable={false}
          />
        </div>
      ) : null}

      <ScanTexture />
      <NoiseTexture />
      <GlowWireFrame />

      {/* 左上の斜めストライプ装飾 */}
      <div
        className={["pointer-events-none absolute left-0 top-0", ui.decorStripe].join(
          " "
        )}
        style={{
          background:
            "repeating-linear-gradient(135deg, rgba(34,211,238,0.55) 0 2px, transparent 2px 6px)",
          maskImage: "linear-gradient(135deg, black 0%, transparent 62%)",
          WebkitMaskImage: "linear-gradient(135deg, black 0%, transparent 62%)",
          opacity: 0.5,
        }}
      />

      {/* ホロのグレア */}
      {tiltEnabled ? (
        <div
          data-capture-skip
          className="pointer-events-none absolute inset-0 z-20"
          style={{
            background: `radial-gradient(420px circle at ${tilt.glare.x}% ${tilt.glare.y}%, rgba(140,240,255,0.14) 0%, rgba(140,240,255,0.04) 32%, transparent 60%)`,
            opacity: tilt.glare.o,
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

      <div className={["relative z-10 grid", ui.gridCols].join(" ")}>
        {/* 左セル: 順位の塔 */}
        <div
          className={[
            "relative flex flex-col items-center justify-between",
            ui.rankTower,
          ].join(" ")}
          style={{
            borderRight: `1px solid ${HAIRLINE}`,
            background: "rgba(34,211,238,0.045)",
          }}
        >
          <RulerTicks />
          <span
            className={[
              "self-stretch text-center font-extrabold uppercase text-cyan-300/80",
              ui.rankLabel,
              nameOxanium.className,
            ].join(" ")}
          >
            {m.rankings.yourRank}
          </span>
          <span
            className={[nameBebas.className, ui.rankNum].join(" ")}
            style={{
              ...RANK_GRADIENT,
              textShadow: ui.rankGlow,
            }}
          >
            {rankDisplay}
          </span>
          {totalEntriesLabel ? (
            <span
              className={[
                "-mt-0.5 font-bold tabular-nums text-cyan-300/45",
                ui.totalEntries,
                nameOxanium.className,
              ].join(" ")}
            >
              {totalEntriesLabel}
            </span>
          ) : null}
          <div className={["flex items-center", ui.rankMetaRow].join(" ")}>
            {!loading && rank != null ? (
              <RankDeltaBadge delta={rankDeltaPlaces} />
            ) : null}
            {topPercent ? (
              <span
                className={[
                  "px-1.5 py-[3px] font-extrabold",
                  ui.topChip,
                  nameOxanium.className,
                ].join(" ")}
                style={{
                  border: "1px solid rgba(255,214,90,0.4)",
                  color: GOLD,
                  background: "rgba(255,214,90,0.06)",
                }}
              >
                TOP {topPercent}%
              </span>
            ) : null}
          </div>
        </div>

        {/* 右: ヘッダー行 + 2×2 メトリクスセル */}
        <div className="flex flex-col">
          <div
            className={["flex items-center justify-between gap-2", ui.headerPad].join(
              " "
            )}
            style={{ borderBottom: `1px solid ${HAIRLINE}` }}
          >
            <div className="flex min-w-0 items-center gap-2">
              <RankingsAvatarCircle
                photoURL={photoURL}
                displayName={displayName}
                boxClassName={ui.avatar}
                gateReady={ready}
              />
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1">
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
                </div>
                <div
                  className={[
                    "mt-1 flex items-center gap-1.5 font-bold uppercase text-cyan-300/60",
                    ui.subMeta,
                    nameOxanium.className,
                  ].join(" ")}
                >
                  {leagueLabel ? <span>{leagueLabel}</span> : null}
                  {streakN ? (
                    <span className="flex items-center gap-0.5 text-orange-400">
                      <Flame className={ui.flame} aria-hidden />
                      {streakN}
                      {streakShortLabel(language)}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {hasCells ? (
            <div className="grid flex-1 grid-cols-2">
              {miniMetrics!.slice(0, 4).map((mt, i) => {
                const selected = mt.key === metric;
                return (
                  <div
                    key={mt.key}
                    className={[
                      "relative flex flex-col justify-center",
                      ui.cellPad,
                    ].join(" ")}
                    style={{
                      borderRight:
                        i % 2 === 0 ? `1px solid ${HAIRLINE}` : undefined,
                      borderBottom: i < 2 ? `1px solid ${HAIRLINE}` : undefined,
                      background: selected ? "rgba(34,211,238,0.05)" : undefined,
                      transition: "background 240ms ease",
                    }}
                  >
                    {selected ? (
                      <span
                        aria-hidden
                        className="pointer-events-none absolute left-0 top-0 h-[7px] w-[7px]"
                        style={{
                          background: CYAN,
                          clipPath: "polygon(0 0, 100% 0, 0 100%)",
                          WebkitClipPath: "polygon(0 0, 100% 0, 0 100%)",
                          filter: "drop-shadow(0 0 4px rgba(34,211,238,0.7))",
                        }}
                      />
                    ) : null}
                    <div
                      className={[
                        "font-bold uppercase transition-colors duration-200",
                        selected ? "text-cyan-300/90" : "text-cyan-300/55",
                        ui.metricLabel,
                        nameOxanium.className,
                      ].join(" ")}
                    >
                      {mt.label}
                    </div>
                    <div className="mt-1 flex items-baseline gap-1.5">
                      <div
                        className={[
                          summaryMetricNumClass,
                          "leading-none text-white",
                          ui.metricValue,
                        ].join(" ")}
                      >
                        {loading ? "--" : mt.value}
                      </div>
                      {!loading && mt.dayDelta ? (
                        <span
                          className={[
                            "font-extrabold tabular-nums leading-none",
                            ui.dayDelta,
                            nameOxanium.className,
                          ].join(" ")}
                          style={{
                            color:
                              mt.dayDelta.startsWith("-")
                                ? "rgba(255,255,255,0.45)"
                                : GOLD,
                          }}
                        >
                          {mt.dayDelta}
                        </span>
                      ) : null}
                    </div>
                    <div className={ui.barMt}>
                      <SegBar
                        pct={mt.pct}
                        enter={segEnter}
                        reduceMotion={reduceMotion}
                        segRowClass={ui.segRow}
                        segMinHClass={ui.segMinH}
                      />
                    </div>
                  </div>
                );
              })}
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
                {loading
                  ? "--"
                  : metric === "winRate"
                    ? `${Math.round(value)}%`
                    : metric === "streak" || metric === "goalScorerHits"
                      ? `${Math.round(value)}`
                      : `${formatMetricDecimals(value, 1)} ${m.rankings.pts}`}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 下部シリアル帯 */}
      <div
        className={["relative z-10 flex items-center justify-between", ui.footerPad].join(
          " "
        )}
        style={{
          borderTop: `1px solid ${HAIRLINE}`,
          background: "rgba(0,0,0,0.25)",
        }}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          <span
            aria-hidden
            className="my-rank-footer-dot inline-block h-[5px] w-[5px] shrink-0 rounded-full"
            style={{
              background: CYAN,
              boxShadow: "0 0 6px rgba(34,211,238,0.8)",
            }}
          />
          <span
            className={[
              "truncate font-semibold uppercase text-white/30",
              ui.footerText,
              nameOxanium.className,
            ].join(" ")}
          >
            UNITERZ{leagueLabel ? ` · ${leagueLabel}` : ""}
            {` // ${serialDateKey}`}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-2">
          <span
            className={[
              "font-semibold uppercase text-white/30",
              ui.footerText,
              nameOxanium.className,
            ].join(" ")}
          >
            {typeof totalPosts === "number"
              ? `${postsLabel(language).toUpperCase()} ${totalPosts}`
              : ""}
          </span>
          {/* バーコード風ストライプ */}
          <span
            aria-hidden
            className="h-[10px] w-[28px]"
            style={{
              background:
                "repeating-linear-gradient(90deg, rgba(255,255,255,0.24) 0 1px, transparent 1px 3px, rgba(255,255,255,0.24) 3px 5px, transparent 5px 8px, rgba(255,255,255,0.24) 8px 10px, transparent 10px 11px)",
            }}
          />
        </span>
      </div>
    </div>
  );

  const tiltWrapped = (
    <div
      data-rank-card-root
      className="relative isolate"
    >
      <MyRankCardBacklight />
      <div
        ref={tilt.ref}
        className="relative z-10"
        style={{
          filter: CARD_DROP_SHADOW,
          ...(tiltEnabled ? tilt.style : undefined),
        }}
        onPointerMove={tiltEnabled ? tilt.onMove : undefined}
        onPointerLeave={tiltEnabled ? tilt.onLeave : undefined}
        onPointerCancel={tiltEnabled ? tilt.onLeave : undefined}
      >
        {body}
      </div>
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
        boxShadow: EDGE_GLOW_INITIAL,
      }}
      animate={{
        opacity: 1,
        y: 0,
        filter: [...BLUR_KEYFRAMES],
        boxShadow: EDGE_GLOW_CLEAR,
      }}
      transition={{
        opacity: { duration: ENTER_DURATION, ease: ENTER_EASE },
        y: { duration: ENTER_DURATION + 0.04, ease: ENTER_EASE },
        filter: {
          duration: BLUR_DURATION,
          ease: "linear",
          times: [...BLUR_TIMES],
        },
        boxShadow: { duration: 0.68, ease: ENTER_EASE },
      }}
    >
      {tiltWrapped}
    </motion.div>
  );
}
