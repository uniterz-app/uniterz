"use client";

import {
  type CSSProperties,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
} from "recharts";
import type { BarShapeProps, XAxisTickContentProps } from "recharts";
import type { Language } from "@/lib/i18n/language";
import { nameBebas, nameRajdhani, resultStatsMetricNumClass } from "@/lib/fonts";
import { cyberNoDataLabelStyle } from "@/lib/ui/cyberNoDataLabelStyle";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import { formatMetricDecimals } from "@/lib/format/metricDecimals";
import { m, useReducedMotion } from "framer-motion";
import { Info } from "lucide-react";
import { cyberMetricValueStyle, hexToRgb } from "./detailMetricGlassCard";
import styles from "./profileChartInfoFaq.module.css";
import "./profileDailyTrendChartBars.css";

/**
 * 日別データ
 */
export type ProfileDailyTrendPoint = {
  date: string;
  posts: number;
  wins: number;
  pointsV3: number;
  scorePrecision: number;
  upsetPoints: number;
};

type Props = {
  data: ProfileDailyTrendPoint[];
  range?: "7d" | "30d";
  allowAll?: boolean;
  language?: Language;
  /**
   * true のとき Intersection 待ちをせずチャートを即マウントし、Recharts の描画アニメを切る。
   * 親の入場（例: motion のフェードアップ）と同期させる用途。
   */
  entranceSync?: boolean;
  /**
   * entranceSync 時のみ有効。false の間は棒・線のアニメを止め、true で再生（親のカード入場後に渡す）。
   */
  rechartsAfterEntrance?: boolean;
};

/** Daily Combo：棒入場 → 折れ線パス → 静止 の1本道 */
type ProfileDailyEntrancePhase = "done" | "bars" | "lines";

/* ===== colors ===== */
const COLORS = {
  posts: "#F97316",
  wins: "#A855F7",
  total: "#FACC15",
  score: "#22C55E",
};

/** 棒：左から順に立ち上がる stagger 間隔（ms） */
const BAR_STAGGER_MS = 46;
const BAR_ANIM_MS = 540;

/** 折れ線：パスを左端から伸ばす（stroke-dashoffset）。Recharts 内蔵アニメはオフにして DOM で制御 */
const LINE_PATH_DRAW_MS = 1100;
const LINE_PATH_STAGGER_MS = 180;
const LINE_PATH_FALLBACK_MS =
  LINE_PATH_STAGGER_MS + LINE_PATH_DRAW_MS + LINE_PATH_STAGGER_MS + 200;

/** 棒の入場が終わるまでの時間（最後のカテゴリの delay + 余白） */
function barEntranceEndMs(pointCount: number): number {
  const maxIdx = Math.max(0, pointCount - 1);
  return BAR_ANIM_MS + maxIdx * BAR_STAGGER_MS + 80;
}

function collectDailyLinePaths(root: HTMLElement): SVGPathElement[] {
  return Array.from(root.querySelectorAll<SVGPathElement>(".recharts-line-curve"));
}

function resetDailyLinePathStyles(root: HTMLElement | null): void {
  if (!root) return;
  for (const path of collectDailyLinePaths(root)) {
    path.style.transition = "";
    path.style.strokeDasharray = "";
    path.style.strokeDashoffset = "";
    path.style.opacity = "";
  }
}

/** パス長に合わせた dash（単一値より `len len` の方がエンジン差で安定しやすい） */
function setPathClosedDash(path: SVGPathElement, len: number): void {
  path.style.transition = "none";
  path.style.strokeDasharray = `${len} ${len}`;
  path.style.strokeDashoffset = `${len}`;
  path.style.opacity = "0";
}

/** 線フェーズ直後に同期で「線を隠す」（runDaily の rAF までの一瞬の全表示を防ぐ） */
function primeDailyLinePathsClosed(root: HTMLElement | null): void {
  if (!root) return;
  for (const path of collectDailyLinePaths(root)) {
    let len = 0;
    try {
      len = path.getTotalLength();
    } catch {
      continue;
    }
    if (!Number.isFinite(len) || len <= 0) continue;
    setPathClosedDash(path, len);
  }
}

function restoreDailyLineStrokeStyle(path: SVGPathElement): void {
  const stroke = (path.getAttribute("stroke") ?? "").toLowerCase();
  path.style.transition = "";
  path.style.opacity = "1";
  if (stroke === COLORS.score.toLowerCase()) {
    path.style.strokeDasharray = "5 3";
    path.style.strokeDashoffset = "0";
  } else {
    path.style.strokeDasharray = "";
    path.style.strokeDashoffset = "";
  }
}

function pathSupportsWebAnim(path: SVGPathElement): boolean {
  return typeof path.animate === "function";
}

/**
 * 折れ線パスを左から伸ばす。onComplete は高々1回（正常終了・安全タイムアウト・root 無しのみ）。
 * クリーンアップ後に遅延コールバックが走っても onComplete は呼ばない（cancelled ガード）。
 */
function runDailyLinePathDraw(
  root: HTMLElement | null,
  onComplete: () => void
): () => void {
  let cancelled = false;
  let completed = false;
  let rafKickOuter = 0;
  let rafKickInner = 0;
  const timers: number[] = [];
  const webAnims: Animation[] = [];

  const completeOnce = () => {
    if (completed || cancelled) return;
    completed = true;
    onComplete();
  };

  const stopTimersAndRaf = () => {
    cancelAnimationFrame(rafKickOuter);
    cancelAnimationFrame(rafKickInner);
    for (const id of timers) {
      window.clearTimeout(id);
    }
    timers.length = 0;
    for (const a of webAnims) {
      try {
        a.cancel();
      } catch {
        /* 既に終了 */
      }
    }
    webAnims.length = 0;
  };

  if (!root) {
    const tid = window.setTimeout(() => {
      if (!cancelled) completeOnce();
    }, 0);
    timers.push(tid);
    return () => {
      cancelled = true;
      window.clearTimeout(tid);
      if (!completed) {
        completed = true;
        onComplete();
      }
    };
  }

  /** レイアウト確定後に開始（短い rAF 連打で prime 後の Recharts と整合） */
  const kick = () => {
    if (cancelled) return;
    const paths = collectDailyLinePaths(root);
    if (paths.length === 0) {
      completeOnce();
      return;
    }

    const lineEndMs =
      (paths.length - 1) * LINE_PATH_STAGGER_MS + LINE_PATH_DRAW_MS + 120;
    const safetyTid = window.setTimeout(() => {
      if (cancelled) return;
      for (const a of webAnims) {
        try {
          a.cancel();
        } catch {
          /* 既に終了 */
        }
      }
      webAnims.length = 0;
      for (const p of collectDailyLinePaths(root)) {
        restoreDailyLineStrokeStyle(p);
      }
      completeOnce();
    }, LINE_PATH_FALLBACK_MS);
    timers.push(safetyTid);

    paths.forEach((path, index) => {
      const tid = window.setTimeout(() => {
        if (cancelled) return;
        let len = 0;
        try {
          len = path.getTotalLength();
        } catch {
          return;
        }
        if (!Number.isFinite(len) || len <= 0) return;

        setPathClosedDash(path, len);
        void path.getBoundingClientRect();
        path.style.opacity = "1";

        if (pathSupportsWebAnim(path)) {
          try {
            const dashPair = `${len} ${len}`;
            const anim = path.animate(
              [
                {
                  strokeDasharray: dashPair,
                  strokeDashoffset: String(len),
                },
                {
                  strokeDasharray: dashPair,
                  strokeDashoffset: "0",
                },
              ],
              {
                duration: LINE_PATH_DRAW_MS,
                easing: "cubic-bezier(0.22, 1, 0.36, 1)",
                fill: "forwards",
              }
            );
            webAnims.push(anim);
            return;
          } catch {
            /* フォールバックへ */
          }
        }

        /** CSS transition（WAAPI 不可時） */
        path.style.transition = "none";
        path.style.strokeDashoffset = `${len}`;
        void path.getBoundingClientRect();
        path.style.transition = `strokeDashoffset ${LINE_PATH_DRAW_MS}ms cubic-bezier(0.22, 1, 0.36, 1)`;
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            if (cancelled) return;
            path.style.strokeDashoffset = "0";
          });
        });
      }, index * LINE_PATH_STAGGER_MS);
      timers.push(tid);
    });

    /** 全パス分の stagger + 描画時間を待ってから WAAPI を止めて復元・フェーズ完了 */
    const finishTid = window.setTimeout(() => {
      if (cancelled) return;
      for (const a of webAnims) {
        try {
          a.cancel();
        } catch {
          /* 既に終了 */
        }
      }
      webAnims.length = 0;
      for (const p of collectDailyLinePaths(root)) {
        restoreDailyLineStrokeStyle(p);
      }
      completeOnce();
    }, lineEndMs);
    timers.push(finishTid);
  };

  rafKickOuter = requestAnimationFrame(() => {
    if (cancelled) return;
    rafKickInner = requestAnimationFrame(kick);
  });

  return () => {
    cancelled = true;
    stopTimersAndRaf();
    resetDailyLinePathStyles(root);
  };
}

function clampNum(v: any) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toInt(v: any) {
  const n = Math.floor(clampNum(v));
  return n < 0 ? 0 : n;
}

/** 立体的な棒の右面（暗め）・上面（明るめ） */
function barFaceShade(hex: string, face: "right" | "top"): string {
  const rgb = hexToRgb(hex);
  if (!rgb) return hex;
  const { r, g, b } = rgb;
  if (face === "right") {
    return `rgb(${Math.round(r * 0.5)},${Math.round(g * 0.58)},${Math.round(b * 0.68)})`;
  }
  return `rgb(${Math.min(255, Math.round(r + (255 - r) * 0.26))},${Math.min(255, Math.round(g + (255 - g) * 0.26))},${Math.min(255, Math.round(b + (255 - b) * 0.26))})`;
}

function blockFaceFill(hex: string): { main: string; side: string; top: string } {
  return {
    main: hex,
    side: barFaceShade(hex, "right"),
    top: barFaceShade(hex, "top"),
  };
}

/**
 * Tracer風のブロック縦棒（複数セグメント）。
 * Recharts の棒アニメは LabelList が消えるため isAnimationActive は false のまま、
 * CSS の scaleY（下基準）＋ index ごとの delay で左→右に立ち上げる。
 */
function createTracerBlockBarShape() {
  return function ProfileDailyTracerBlockBarShape(props: BarShapeProps) {
    const x = props.x;
    const y = props.y;
    const width = props.width;
    const height = props.height;
    const fill = String(props.fill ?? COLORS.posts);
    const idx = typeof props.index === "number" ? props.index : 0;
    if (x == null || y == null || width <= 0 || height <= 1) return null;

    const skew = Math.min(7, Math.max(2.2, width * 0.3));
    const skewY = Math.min(5.5, skew * 0.4);
    const frontW = Math.max(width - skew, width * 0.54);
    const frontX = x;
    const frontY = y;
    const frontH = height;
    const rawValue = props.value;
    const valueCount = Math.max(0, Math.floor(clampNum(rawValue)));
    if (valueCount <= 0) return null;

    const innerH = Math.max(4, frontH - 2);
    const segGap = Math.max(1.1, Math.min(2.2, innerH * 0.015));
    const maxSegmentsByHeight = Math.max(1, Math.floor(innerH / 3.6));
    const segmentCount = Math.max(1, Math.min(valueCount, maxSegmentsByHeight));
    const segH = Math.max(2.6, (innerH - segGap * (segmentCount - 1)) / segmentCount);
    const fills = blockFaceFill(fill);

    const originX = frontX + frontW / 2;
    const originY = frontY + frontH;
    const groupStyle: CSSProperties & { "--profile-daily-bar-delay"?: string } = {
      transformOrigin: `${originX}px ${originY}px`,
      "--profile-daily-bar-delay": `${idx * BAR_STAGGER_MS}ms`,
    };

    const segments = Array.from({ length: segmentCount }, (_, i) => {
      const segY = frontY + frontH - (i + 1) * segH - i * segGap;
      const sidePath = `M ${frontX + frontW} ${segY} L ${x + width} ${segY - skewY} L ${x + width} ${segY + segH} L ${frontX + frontW} ${segY + segH} Z`;
      const topPath = `M ${frontX} ${segY} L ${frontX + frontW} ${segY} L ${x + width} ${segY - skewY} L ${frontX + skew * 0.12} ${segY - skewY} Z`;
      return (
        <g key={i}>
          <path d={sidePath} fill={fills.side} stroke="none" />
          <path d={topPath} fill={fills.top} stroke="none" />
          <rect
            x={frontX}
            y={segY}
            width={frontW}
            height={segH}
            fill={fills.main}
            stroke="rgba(255,255,255,0.22)"
            strokeWidth={0.55}
          />
        </g>
      );
    });

    return (
      <g className="recharts-layer profile-daily-bar-group" style={groupStyle}>
        {segments}
      </g>
    );
  };
}

/** Recharts LabelList の formatter 型に合わせる */
function formatBarTopLabel(label: unknown): string {
  if (typeof label === "number" || typeof label === "string") {
    const n = toInt(label);
    return n > 0 ? `${n}` : "";
  }
  return "";
}

/** 累積計算 */
function buildCumulative(rows: ProfileDailyTrendPoint[]) {
  let p = 0;
  let sp = 0;

  return rows.map((r) => {
    const pointsDay = clampNum(r.pointsV3);
    const spDay = clampNum(r.scorePrecision);

    p += pointsDay;
    sp += spDay;

    return {
      ...r,
      pointsCum: p,
      scorePrecisionCum: sp,
    };
  });
}

function formatDateLabel(value: string) {
  if (!value) return "";
  const parts = value.split("-");
  if (parts.length >= 3) return `${parts[1]}/${parts[2]}`;
  return value;
}

/** X 軸 tick の payload から日付キー（YYYY-MM-DD）を取り出す */
function xAxisTickDateKey(payload: XAxisTickContentProps["payload"]): string {
  if (payload == null) return "";
  const pl = payload as unknown as Record<string, unknown>;
  const v = pl.value;
  if (v != null && String(v) !== "") return String(v);
  const row = pl.payload as { date?: unknown } | undefined;
  if (row?.date != null && String(row.date) !== "") return String(row.date);
  return "";
}

/** 正の数を「きりのいい」上限へ切り上げ（軸の上限用） */
function niceCeil(x: number): number {
  if (!Number.isFinite(x) || x <= 0) return 1;
  const exp = Math.floor(Math.log10(x));
  const f = x / 10 ** exp;
  let nf: number;
  if (f <= 1) nf = 1;
  else if (f <= 2) nf = 2;
  else if (f <= 5) nf = 5;
  else nf = 10;
  return nf * 10 ** exp;
}

/** 0 … max を均等分割した目盛り（右軸の小数も許容） */
function linspaceTicks(min: number, max: number, count: number): number[] {
  if (count < 2) return [min];
  const lo = clampNum(min);
  const hi = clampNum(max);
  if (hi <= lo) return [lo];
  const out: number[] = [];
  for (let i = 0; i < count; i++) {
    const t = lo + ((hi - lo) * i) / (count - 1);
    out.push(Math.round(t * 1e6) / 1e6);
  }
  return out;
}

/** 棒グラフ用：整数上限と 0 始まりの目盛り */
function buildCountAxis(chartRows: ReturnType<typeof buildCumulative>) {
  let maxBar = 0;
  for (const row of chartRows) {
    maxBar = Math.max(maxBar, clampNum(row.posts), clampNum(row.wins));
  }
  const top = Math.max(1, Math.ceil(maxBar * 1.12));
  const targetSteps = 6;
  const step = Math.max(1, Math.ceil(top / (targetSteps - 1)));
  const ticks: number[] = [];
  for (let v = 0; v <= top; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] < top) ticks.push(top);
  return { domain: [0, top] as [number, number], ticks };
}

/** 累積ライン用：データ最大に合わせた上限と目盛り */
function buildPointsAxis(chartRows: ReturnType<typeof buildCumulative>) {
  let maxPt = 0;
  for (const row of chartRows) {
    maxPt = Math.max(
      maxPt,
      clampNum(row.pointsCum),
      clampNum(row.scorePrecisionCum)
    );
  }
  const padded = Math.max(maxPt * 1.08, maxPt > 0 ? 0 : 1);
  const top = niceCeil(padded);
  const ticks = linspaceTicks(0, top, 7);
  return { domain: [0, top] as [number, number], ticks, top };
}

/** 内訳数値：前回の表示値から新値へ ease-out（初回はゼロを挟まない） */
const DETAIL_COUNT_UP_MS = 520;
const DETAIL_COUNT_EASE = 2.15;

function formatDetailCountDisplay(v: number, decimals: number): string {
  if (decimals <= 0) return String(Math.max(0, Math.round(v)));
  return formatMetricDecimals(v, decimals);
}

function DetailCountUpNumber({
  end,
  decimals,
  token,
  reduceMotion,
  delayMs = 0,
}: {
  end: number;
  decimals: number;
  /** `detailDate` と列キーでアニメを張り直す */
  token: string;
  reduceMotion: boolean;
  delayMs?: number;
}) {
  const safe = Number.isFinite(end) ? end : 0;
  const finalText =
    decimals <= 0
      ? String(toInt(safe))
      : formatMetricDecimals(safe, decimals);

  const prevEndRef = useRef<number | null>(null);
  const [text, setText] = useState(finalText);

  useEffect(() => {
    if (reduceMotion) {
      setText(finalText);
      prevEndRef.current = safe;
      return;
    }

    const from =
      prevEndRef.current == null || !Number.isFinite(prevEndRef.current)
        ? safe
        : prevEndRef.current;

    if (from === safe) {
      setText(finalText);
      prevEndRef.current = safe;
      return;
    }

    setText(formatDetailCountDisplay(from, decimals));
    let raf = 0;
    let t0: number | null = null;
    const step = (ts: number) => {
      if (t0 == null) t0 = ts;
      const elapsed = ts - t0 - delayMs;
      if (elapsed < 0) {
        raf = requestAnimationFrame(step);
        return;
      }
      const p = Math.min(1, elapsed / DETAIL_COUNT_UP_MS);
      const eased = 1 - (1 - p) ** DETAIL_COUNT_EASE;
      const cur = from + (safe - from) * eased;
      setText(formatDetailCountDisplay(cur, decimals));
      if (p < 1) raf = requestAnimationFrame(step);
      else {
        setText(finalText);
        prevEndRef.current = safe;
      }
    };
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
    };
  }, [safe, decimals, token, reduceMotion, delayMs, finalText]);

  return <>{text}</>;
}

export default function ProfileDailyTrendChart({
  data,
  range = "7d",
  allowAll = false,
  language = "ja",
  entranceSync = false,
  rechartsAfterEntrance = false,
}: Props) {
  const isEn = language === "en";

  const lockedMsg = isEn
    ? "Pro lets you view monthly trends."
    : "Proでは月ごとの推移が確認できます";

  const postsLabel = isEn ? "Posts" : "投稿数";
  const hitsLabel = isEn ? "Correct Picks" : "的中数";
  /** 内訳カード：的中数 / 投稿数（例: 2/3） */
  const hitsPostsLabel = isEn ? "Hits / Posts" : "的中 / 投稿";
  const totalLabel = isEn ? "Total Points" : "総合得点";
  const scorePrecisionLabel = isEn ? "Score Precision" : "スコア精度";
  const unitCount = isEn ? "items" : "件";
  const unitPts = "pts";
  const title = "Daily Combo Chart";
  const subtitle = isEn
    ? "Trend of stats over the last 10 days"
    : "過去10日のスタッツの推移";

  /** Info ツールチップ：凡例・操作の補足のみ */
  const chartInfoTooltipMsg = isEn
    ? "Orange / purple bars: daily posts and correct picks. Yellow / green lines: cumulative totals. Tap the chart for that day’s breakdown below."
    : "オレンジ・紫の棒＝日ごとの投稿数・的中数。黄・緑の線＝累積の総合得点・スコア精度。グラフをタップすると下に内訳を表示します。";

  const ref = useRef<HTMLDivElement>(null);
  /** 折れ線パス query（ResponsiveContainer ラッパ） */
  const lineDrawHostRef = useRef<HTMLDivElement>(null);
  /** 線描画セッション（クリーンアップ後の遅延 onComplete を無視） */
  const lineDrawSessionRef = useRef(0);
  const [ioVisible, setIoVisible] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (entranceSync) return;
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIoVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.95 }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [entranceSync]);

  const chartVisible = entranceSync || ioVisible;

  /** 親の入場同期：false の間は線・棒の入場アニメを再生しない */
  const allowEntranceAnim = !entranceSync || rechartsAfterEntrance;

  const limitedData = useMemo(() => {
    const rows = Array.isArray(data) ? data : [];

    if (range === "7d") return rows.slice(-7);
    return rows.slice(-10);
  }, [data, range]);

  /** range 切り替えで Recharts が内部状態を持ち越さないようキーに含める */
  const composedChartKey = entranceSync
    ? rechartsAfterEntrance
      ? `trend-rc-on-${range}-${limitedData.length}`
      : `trend-rc-hold-${range}-${limitedData.length}`
    : `trend-io-${range}-${limitedData.length}`;

  const chartData = useMemo(() => buildCumulative(limitedData), [limitedData]);

  const isLocked = false;
  const isEmpty = limitedData.length === 0;

  /** 棒 → 折れ線 → 完了 の入場シーケンス（`runDailyLinePathDraw` と連動） */
  const [entrancePhase, setEntrancePhase] =
    useState<ProfileDailyEntrancePhase>("done");

  /** キー・可視・許可が変わったらシーケンスを頭から決め直す */
  useLayoutEffect(() => {
    if (!chartVisible || isEmpty || !allowEntranceAnim) {
      setEntrancePhase("done");
      return;
    }
    setEntrancePhase("bars");
  }, [allowEntranceAnim, chartVisible, composedChartKey, isEmpty]);

  /** 棒フェーズ終了 → 線フェーズへ（キー・許可が変わったらタイマーを張り直す） */
  useEffect(() => {
    if (entrancePhase !== "bars") return;
    if (isEmpty || !chartVisible) return;
    const ms = barEntranceEndMs(chartData.length);
    const t = window.setTimeout(() => setEntrancePhase("lines"), ms);
    return () => window.clearTimeout(t);
  }, [
    allowEntranceAnim,
    chartData.length,
    chartVisible,
    composedChartKey,
    entrancePhase,
    isEmpty,
  ]);

  /** 線フェーズ：ブラウザ描画前にパスを閉じた状態へ（棒→線の切り替え直後のフラッシュ防止） */
  useLayoutEffect(() => {
    if (entrancePhase !== "lines" || !chartVisible || isEmpty) return;
    const root = lineDrawHostRef.current;
    primeDailyLinePathsClosed(root);
    const raf = requestAnimationFrame(() => {
      primeDailyLinePathsClosed(root);
    });
    return () => cancelAnimationFrame(raf);
  }, [chartVisible, composedChartKey, entrancePhase, isEmpty]);

  /** 線フェーズ：パス描画（古いセッションの onComplete は無視） */
  useEffect(() => {
    if (entrancePhase !== "lines" || !chartVisible || isEmpty) return;
    const session = ++lineDrawSessionRef.current;
    const cleanupDraw = runDailyLinePathDraw(lineDrawHostRef.current, () => {
      if (lineDrawSessionRef.current !== session) return;
      setEntrancePhase("done");
    });
    return () => {
      cleanupDraw();
      lineDrawSessionRef.current += 1;
    };
  }, [chartVisible, composedChartKey, entrancePhase, isEmpty]);

  const barShapeFn = useMemo(() => createTracerBlockBarShape(), []);

  const { countDomain, countTicks, pointsDomain, pointTicks, pointsTop } =
    useMemo(() => {
      const c = buildCountAxis(chartData);
      const p = buildPointsAxis(chartData);
      return {
        countDomain: c.domain,
        countTicks: c.ticks,
        pointsDomain: p.domain,
        pointTicks: p.ticks,
        pointsTop: p.top,
      };
    }, [chartData]);

  const [detailDate, setDetailDate] = useState<string | null>(null);

  const detailRow = useMemo(
    () => limitedData.find((r) => r.date === detailDate) ?? null,
    [limitedData, detailDate]
  );

  const detailSelectHint = isEn
    ? "Tap the chart to select a day."
    : "グラフをタップで日付を選択";

  const handleComposedChartClick = (
    state: { activeLabel?: string | number },
    _e?: unknown
  ) => {
    const label = state?.activeLabel;
    if (label == null || label === "") return;
    setDetailDate(String(label));
  };

  const handleBarClick = (item: { payload?: { date?: string } }) => {
    const d = item?.payload?.date as string | undefined;
    if (d != null && d !== "") setDetailDate(String(d));
  };

  /** 選択中の日付だけシアン系で強調（グラフ下の日付ラベル） */
  const renderXAxisTick = useCallback(
    (props: XAxisTickContentProps) => {
      const { x, y, payload, textAnchor } = props;
      const dateKey = xAxisTickDateKey(payload);
      const selected = detailDate != null && dateKey === detailDate;
      const label = formatDateLabel(dateKey);
      const fill = selected ? "#67e8f9" : "rgba(148,163,184,0.9)";
      return (
        <text
          x={x}
          y={y}
          dy={12}
          textAnchor={textAnchor}
          fill={fill}
          fontSize={selected ? 10 : 9}
          fontWeight={selected ? 700 : 500}
          style={{
            textShadow: selected
              ? "0 0 10px rgba(34,211,238,0.55), 0 0 20px rgba(34,211,238,0.2)"
              : undefined,
          }}
        >
          {label}
        </text>
      );
    },
    [detailDate]
  );

  useEffect(() => {
    if (!detailDate) return;
    // 棒/線の入場中は選択状態の補正を遅らせ、Recharts レイヤ差し替えを避ける
    if (entrancePhase !== "done") return;
    if (!limitedData.some((r) => r.date === detailDate)) {
      setDetailDate(null);
    }
  }, [detailDate, entrancePhase, limitedData]);

  /** 期間変更や初回表示で、無効な選択を直しつつ最終日を初期フォーカスにする */
  useEffect(() => {
    if (isEmpty || isLocked || limitedData.length === 0) return;
    // 棒/線の入場中に detailDate を更新すると棒が再描画に見えるため、完了後に反映
    if (entrancePhase !== "done") return;
    const last = limitedData[limitedData.length - 1]?.date;
    if (!last) return;
    if (detailDate != null && limitedData.some((r) => r.date === detailDate)) return;
    setDetailDate(last);
  }, [isEmpty, isLocked, limitedData, detailDate, entrancePhase]);

  return (
    <div
      ref={ref}
      className={[
        "relative overflow-x-clip rounded-xl border border-white/[0.12] bg-[#050814]/55 p-3",
        "backdrop-blur-xl shadow-[inset_0_1px_0_rgba(255,255,255,0.07),0_10px_30px_rgba(0,0,0,0.42)]",
        "ring-1 ring-inset ring-white/[0.05]",
      ].join(" ")}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.38]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="relative z-1">
      <div className="relative z-20 px-1 pt-0.5">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p
            className={[
              nameRajdhani.className,
              "font-semibold tracking-wide text-white/95 text-lg sm:text-[1.72rem]",
            ].join(" ")}
          >
            {title}
          </p>
          <div className={styles.wrap}>
            <button
              type="button"
              className={styles.faqButton}
              aria-label={chartInfoTooltipMsg}
            >
              <Info className="shrink-0" strokeWidth={1.75} aria-hidden />
            </button>
            <div className={styles.tooltip} aria-hidden>
              {chartInfoTooltipMsg}
            </div>
          </div>
        </div>
        <p className="mt-0.5 text-[11px] text-white/60 sm:text-xs">{subtitle}</p>
      </div>
      {/* カードの p-3 と相殺して横いっぱい */}
      <div className="relative z-0 -mx-3 h-52 cursor-pointer overflow-hidden rounded-2xl sm:h-56">
        {isEmpty ? (
          <div
            role="status"
            className="absolute inset-0 grid place-items-center px-3"
          >
            <p
              className={[
                nameBebas.className,
                "text-center text-[clamp(1.25rem,4.2vw,2.1rem)] leading-none tracking-[0.2em]",
              ].join(" ")}
              style={cyberNoDataLabelStyle}
            >
              NO DATA
            </p>
          </div>
        ) : (
          <>
            <div
              ref={lineDrawHostRef}
              className="profile-daily-line-draw-host h-full min-h-0 w-full"
              data-daily-line-entrance={entrancePhase}
            >
            <ResponsiveContainer width="100%" height="100%">
              {chartVisible && (
                <ComposedChart
                  key={composedChartKey}
                  data={chartData}
                  margin={{ top: 18, right: 4, left: 0, bottom: 2 }}
                  barCategoryGap="12%"
                  barGap={5}
                  onClick={handleComposedChartClick}
                >
                  <CartesianGrid
                    stroke="rgba(148,163,184,0.07)"
                    strokeDasharray="3 3"
                    vertical={false}
                  />

                  <XAxis
                    dataKey="date"
                    tick={renderXAxisTick}
                    tickLine={false}
                    axisLine={false}
                    interval="preserveStartEnd"
                    minTickGap={14}
                    height={22}
                    tickMargin={4}
                  />

                  <YAxis
                    yAxisId="count"
                    width={26}
                    ticks={countTicks}
                    domain={countDomain}
                    tick={{ fontSize: 9, fill: "rgba(148,163,184,0.9)" }}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                  />

                  <YAxis
                    yAxisId="points"
                    orientation="right"
                    width={32}
                    ticks={pointTicks}
                    domain={pointsDomain}
                    tick={{ fontSize: 9, fill: "rgba(148,163,184,0.9)" }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => {
                      const n = clampNum(v);
                      return pointsTop < 20
                        ? formatMetricDecimals(n, 1)
                        : `${toInt(n)}`;
                    }}
                  />

                  <Bar
                    yAxisId="count"
                    dataKey="posts"
                    name={postsLabel}
                    fill={COLORS.posts}
                    shape={barShapeFn}
                    maxBarSize={46}
                    /** クリックで state が変わるたびに棒アニメが走り、Recharts がアニメ中だけ LabelList を隠すため false */
                    isAnimationActive={false}
                    onClick={handleBarClick}
                  >
                    <LabelList
                      className={nameRajdhani.className}
                      dataKey="posts"
                      position="top"
                      offset={9}
                      fill="#f8fafc"
                      fontSize={11}
                      fontWeight={700}
                      formatter={formatBarTopLabel}
                    />
                  </Bar>
                  <Bar
                    yAxisId="count"
                    dataKey="wins"
                    name={hitsLabel}
                    fill={COLORS.wins}
                    shape={barShapeFn}
                    maxBarSize={46}
                    isAnimationActive={false}
                    onClick={handleBarClick}
                  >
                    <LabelList
                      className={nameRajdhani.className}
                      dataKey="wins"
                      position="top"
                      offset={9}
                      fill="#f8fafc"
                      fontSize={11}
                      fontWeight={700}
                      formatter={formatBarTopLabel}
                    />
                  </Bar>

                  <Line
                    yAxisId="points"
                    type="monotone"
                    dataKey="pointsCum"
                    name={totalLabel}
                    stroke={COLORS.total}
                    strokeWidth={2}
                    strokeOpacity={0.95}
                    dot={false}
                    style={{
                      filter:
                        "drop-shadow(0 0 4px rgba(250,204,21,0.35)) drop-shadow(0 0 10px rgba(250,204,21,0.15))",
                    }}
                    /** パス描画は `entrancePhase === "lines"` 時の `runDailyLinePathDraw` */
                    isAnimationActive={false}
                  />
                  <Line
                    yAxisId="points"
                    type="monotone"
                    dataKey="scorePrecisionCum"
                    name={scorePrecisionLabel}
                    stroke={COLORS.score}
                    strokeWidth={2}
                    strokeOpacity={0.92}
                    dot={false}
                    strokeDasharray="5 3"
                    style={{
                      filter:
                        "drop-shadow(0 0 4px rgba(34,197,94,0.35)) drop-shadow(0 0 10px rgba(34,197,94,0.15))",
                    }}
                    /** 同上（緑・破線は終了時に `restoreDailyLineStrokeStyle` で復元） */
                    isAnimationActive={false}
                  />
                </ComposedChart>
              )}
            </ResponsiveContainer>
            </div>

            {isLocked && (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="absolute inset-0 bg-[#050814]/58 backdrop-blur-[3px]" />
                <div className="relative mx-4 rounded-2xl border border-white/15 bg-black/35 px-4 py-4 text-center shadow-[0_10px_30px_rgba(0,0,0,0.35)]">
                  <div className="text-sm font-semibold text-white">
                    {lockedMsg}
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {!isEmpty && (
        <div className="mt-2.5 min-w-0 sm:mt-3">
          {detailDate && detailRow ? (
            <div className="text-[11px] font-medium leading-snug sm:text-xs">
              <m.div
                key={detailDate}
                className="mb-3 min-w-0 sm:mb-3.5"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: reduceMotion ? 0 : 0.4,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <p
                  className={[
                    nameRajdhani.className,
                    "text-[clamp(1.15rem,4.5vw,1.35rem)] font-semibold leading-none tracking-wide tabular-nums sm:text-[1.4rem]",
                    "text-cyan-200 [text-shadow:0_0_18px_rgba(34,211,238,0.35)]",
                  ].join(" ")}
                >
                  {formatDateLabel(detailDate)}
                </p>
              </m.div>

              {/* Ranking Progress の統計帯と同型（枠・グリッド・区切り・上ラベル/下数値） */}
              <div
                className={[
                  "rounded-lg border border-cyan-300/25 bg-white/[0.06] px-2.5 py-2",
                  "backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]",
                  "ring-1 ring-inset ring-cyan-400/15",
                  "sm:px-3 sm:py-2.5",
                ].join(" ")}
              >
                <div
                  className={[
                    "grid min-w-0 items-center gap-1.5",
                    "grid-cols-[1fr_auto_1fr_auto_1fr]",
                  ].join(" ")}
                >
                  <m.div
                    className="min-w-0 px-0.5 py-0.5 text-center sm:px-1"
                    initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.44,
                      delay: reduceMotion ? 0 : 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <p
                      className={[
                        "leading-tight text-slate-400",
                        isEn
                          ? "text-[9px] font-semibold uppercase tracking-[0.12em]"
                          : "text-[9px] font-medium",
                      ].join(" ")}
                    >
                      {hitsPostsLabel}
                    </p>
                    <p
                      className={[
                        resultStatsMetricNumClass,
                        "mt-1 inline-flex flex-wrap items-baseline justify-center gap-0.5 leading-none",
                        "text-[1.25rem] sm:text-4xl",
                      ].join(" ")}
                    >
                      <span style={cyberMetricValueStyle(COLORS.wins)}>
                        <DetailCountUpNumber
                          end={clampNum(detailRow.wins)}
                          decimals={0}
                          token={`${detailDate}-wins`}
                          reduceMotion={!!reduceMotion}
                          delayMs={50}
                        />
                      </span>
                      <span
                        className="text-white/35"
                        style={{ textShadow: "0 1px 1px rgba(0,0,0,0.5)" }}
                        aria-hidden
                      >
                        /
                      </span>
                      <span style={cyberMetricValueStyle(COLORS.posts)}>
                        <DetailCountUpNumber
                          end={clampNum(detailRow.posts)}
                          decimals={0}
                          token={`${detailDate}-posts`}
                          reduceMotion={!!reduceMotion}
                          delayMs={120}
                        />
                      </span>
                      <span
                        className={[
                          resultStatsMetricNumClass,
                          "translate-y-px text-[11px] sm:text-xs",
                        ].join(" ")}
                        style={cyberMetricValueStyle(COLORS.posts, "soft")}
                      >
                        {unitCount}
                      </span>
                    </p>
                  </m.div>
                  <span className="text-center text-cyan-100/30">|</span>
                  <m.div
                    className="min-w-0 px-0.5 py-0.5 text-center sm:px-1"
                    initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.44,
                      delay: reduceMotion ? 0 : 0.05 + 0.09,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <p
                      className={[
                        "leading-tight text-slate-400",
                        isEn
                          ? "text-[9px] font-semibold uppercase tracking-[0.12em]"
                          : "text-[9px] font-medium",
                      ].join(" ")}
                    >
                      {scorePrecisionLabel}
                    </p>
                    <p
                      className={[
                        resultStatsMetricNumClass,
                        "mt-1 leading-none text-[1.25rem] sm:text-4xl",
                      ].join(" ")}
                      style={cyberMetricValueStyle(COLORS.score)}
                    >
                      <DetailCountUpNumber
                        end={clampNum(detailRow.scorePrecision)}
                        decimals={1}
                        token={`${detailDate}-sp`}
                        reduceMotion={!!reduceMotion}
                        delayMs={140}
                      />
                      <span
                        className="translate-y-px text-[11px] sm:text-xs"
                        style={cyberMetricValueStyle(COLORS.score, "soft")}
                      >
                        {" "}
                        {unitPts}
                      </span>
                    </p>
                  </m.div>
                  <span className="text-center text-cyan-100/30">|</span>
                  <m.div
                    className="min-w-0 px-0.5 py-0.5 text-center sm:px-1"
                    initial={reduceMotion ? false : { opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: reduceMotion ? 0 : 0.44,
                      delay: reduceMotion ? 0 : 0.05 + 0.18,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                  >
                    <p
                      className={[
                        "leading-tight text-slate-400",
                        isEn
                          ? "text-[9px] font-semibold uppercase tracking-[0.12em]"
                          : "text-[9px] font-medium",
                      ].join(" ")}
                    >
                      {totalLabel}
                    </p>
                    <p
                      className={[
                        resultStatsMetricNumClass,
                        "mt-1 leading-none text-[1.25rem] sm:text-4xl",
                      ].join(" ")}
                      style={cyberMetricValueStyle(COLORS.total)}
                    >
                      <DetailCountUpNumber
                        end={clampNum(detailRow.pointsV3)}
                        decimals={1}
                        token={`${detailDate}-pts`}
                        reduceMotion={!!reduceMotion}
                        delayMs={230}
                      />
                      <span
                        className="translate-y-px text-[11px] sm:text-xs"
                        style={cyberMetricValueStyle(COLORS.total, "soft")}
                      >
                        {" "}
                        {unitPts}
                      </span>
                    </p>
                  </m.div>
                </div>
              </div>
            </div>
          ) : (
            <p className="px-0.5 text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">
              {detailSelectHint}
            </p>
          )}
        </div>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-[10px] text-white/80 sm:gap-x-2.5">
        <Chip label={postsLabel} hex={COLORS.posts} />
        <Chip label={hitsLabel} hex={COLORS.wins} />
        <Chip label={totalLabel} hex={COLORS.total} />
        <Chip label={scorePrecisionLabel} hex={COLORS.score} dashed />
      </div>

      </div>
    </div>
  );
}

function Chip({
  label,
  hex,
  dashed,
}: {
  label: string;
  hex: string;
  /** 破線のライン系列（スコア精度） */
  dashed?: boolean;
}) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-black/40 px-2 py-0.5">
      {dashed ? (
        <span
          className="inline-block h-[2px] w-3.5 shrink-0 rounded-[1px]"
          style={{
            background: `repeating-linear-gradient(90deg, ${hex} 0 3px, transparent 3px 5px)`,
          }}
          aria-hidden
        />
      ) : (
        <span
          className="inline-block h-2 w-2 shrink-0 rounded-full ring-1 ring-white/30"
          style={{ backgroundColor: hex }}
        />
      )}
      <span>{label}</span>
    </div>
  );
}