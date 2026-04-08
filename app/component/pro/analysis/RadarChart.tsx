"use client";

import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  RadarChart as ReRadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from "recharts";

import type { RadarChartProps } from "./types";
import type { RadarAxisKey, RadarAxisLevel } from "./radarLevelUtils";
import {
  approxPercentileFromRadar10,
  formatPercentileDisplay,
  percentileTierTextClass,
} from "@/app/component/pro/analysis/percentileDisplay";
import { summaryMetricNumClass } from "@/lib/fonts";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import {
  summaryCardShadowLgClass,
  summaryCardShadowSmClass,
} from "@/lib/ui/profileCardEdgeGlow";

/** 上から時計回り（Recharts startAngle=90 の並びに合わせる） */
const AXIS_ROWS: {
  key: RadarAxisKey;
  labelJa: string;
  labelEn: string;
}[] = [
  { key: "winRate", labelJa: "勝率", labelEn: "Win rate" },
  { key: "volume", labelJa: "投稿量", labelEn: "Volume" },
  { key: "precision", labelJa: "スコア精度", labelEn: "Score precision" },
  { key: "upset", labelJa: "Upset", labelEn: "Upset" },
  { key: "streak", labelJa: "耐性", labelEn: "Stamina" },
];

/** 評価ブロックの 0–10 数値用（S/M/W ごとに色分け・サイバー系グロー） */
function levelValueCyberClass(lv: RadarAxisLevel): string {
  switch (lv) {
    case "S":
      return "text-emerald-300 [text-shadow:0_0_14px_rgba(52,211,153,0.5)]";
    case "M":
      return "text-amber-300 [text-shadow:0_0_12px_rgba(251,191,36,0.42)]";
    default:
      return "text-slate-400 [text-shadow:0_0_10px_rgba(148,163,184,0.3)]";
  }
}

/** レーダー用サイバー／ネオン調（チャート・ラベル・評価の数値で共通） */
const RADAR_CYBER = {
  gridStroke: "rgba(34,211,238,0.38)",
  gridDash: "2 6",
  axisTick: "rgba(125,211,252,0.78)",
  labelFill: "rgba(224,242,254,0.95)",
  valueFill: "#7dd3fc",
  strokeOuter: "#22d3ee",
} as const;

/**
 * IntersectionObserver でカードが入ったあと、レイアウトが見えてから演出を始めるまでの待ち。
 * （マウント直後の一瞬でグリッドが動き始めるのを避ける）
 */
const RADAR_ANIM_ENTRANCE_SETTLE_MS = 380;

/** Polar グリッド（点線）→ その後に頂点・輪郭・塗り */
const RADAR_GRID_ANIM = {
  ringStaggerMs: 54,
  ringDurMs: 280,
  /** 同心リングがほぼ揃ってから放射線（グリッド開始からの相対） */
  spokeBaseMs: 520,
  spokeStaggerMs: 42,
  spokeDurMs: 290,
  /** 最後の放射線のフェードが終わってからデータ演出へ */
  dataTailGapMs: 120,
} as const;

function radarDataPhaseStartMs(): number {
  const { spokeBaseMs, spokeStaggerMs, spokeDurMs, dataTailGapMs } =
    RADAR_GRID_ANIM;
  const spokeCount = 5;
  return (
    RADAR_ANIM_ENTRANCE_SETTLE_MS +
    spokeBaseMs +
    (spokeCount - 1) * spokeStaggerMs +
    spokeDurMs +
    dataTailGapMs
  );
}

const RADAR_AXIS_COUNT = 5;

const RADAR_VERTEX_ANIM_MS = 360;
const RADAR_DOT_BASE_AFTER_DATA_MS = 24;
const RADAR_DOT_STAGGER_MS = 88;

const RADAR_STROKE_DELAY_AFTER_DATA_MS = 460;
const RADAR_STROKE_DUR_MS = 720;
const RADAR_FILL_DELAY_AFTER_DATA_MS = 1000;
const RADAR_FILL_DUR_MS = 500;

/** グリッド〜塗りまで含むレーダー SVG 演出の終了（マウント起点・ms） */
function radarChartAnimSequenceEndMs(): number {
  const d = radarDataPhaseStartMs();
  const lastVertexEnd =
    d +
    RADAR_DOT_BASE_AFTER_DATA_MS +
    (RADAR_AXIS_COUNT - 1) * RADAR_DOT_STAGGER_MS +
    RADAR_VERTEX_ANIM_MS;
  const strokeEnd =
    d + RADAR_STROKE_DELAY_AFTER_DATA_MS + RADAR_STROKE_DUR_MS;
  const fillEnd =
    d + RADAR_FILL_DELAY_AFTER_DATA_MS + RADAR_FILL_DUR_MS;
  return Math.max(lastVertexEnd, strokeEnd, fillEnd);
}

const RADAR_EVAL_REVEAL_BUFFER_MS = 100;
const RADAR_EVAL_COUNT_UP_MS = 780;

const RADAR_RADIUS_DOMAIN: [number, number] = [0, 10];

function easeOutCubic(t: number): number {
  return 1 - (1 - t) ** 3;
}

function zeroEvalScores(): Record<RadarAxisKey, number> {
  return Object.fromEntries(
    AXIS_ROWS.map((r) => [r.key, 0])
  ) as Record<RadarAxisKey, number>;
}

/**
 * レーダー SVG の連続アニメが終わってから数値をカウントアップし、完了後に S/M/W を出す。
 */
function useRadarEvalScoresReveal(
  active: boolean,
  targets: Record<RadarAxisKey, number>
) {
  const [scores, setScores] =
    useState<Record<RadarAxisKey, number>>(zeroEvalScores);
  const [phase, setPhase] = useState<"idle" | "counting" | "done">("idle");

  useEffect(() => {
    if (!active) {
      setScores(zeroEvalScores());
      setPhase("idle");
      return;
    }

    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setScores({ ...targets });
      setPhase("done");
      return;
    }

    setScores(zeroEvalScores());
    setPhase("idle");

    let rafId = 0;
    const startTimer = window.setTimeout(() => {
      setPhase("counting");
      const t0 = performance.now();

      const frame = (now: number) => {
        const u = Math.min(1, (now - t0) / RADAR_EVAL_COUNT_UP_MS);
        const e = easeOutCubic(u);
        const next = {} as Record<RadarAxisKey, number>;
        for (const r of AXIS_ROWS) {
          next[r.key] = targets[r.key] * e;
        }
        setScores(next);
        if (u < 1) {
          rafId = requestAnimationFrame(frame);
        } else {
          setScores({ ...targets });
          setPhase("done");
        }
      };
      rafId = requestAnimationFrame(frame);
    }, radarChartAnimSequenceEndMs() + RADAR_EVAL_REVEAL_BUFFER_MS);

    return () => {
      window.clearTimeout(startTimer);
      cancelAnimationFrame(rafId);
    };
  }, [active, targets]);

  return {
    scores,
    showNumbers: phase === "counting" || phase === "done",
    showLevelLetters: phase === "done",
  };
}

type RadarGraphicRow = { key: string; label: string; value: number };

type RadarChartGraphicProps = {
  radarCyberKeyframes: string;
  vizId: string;
  fillGradientId: string;
  glowFilterId: string;
  data: RadarGraphicRow[];
  radarCx: string;
  radarCy: string;
  outerRadius: string;
  rechartsMarginProps: Record<string, unknown>;
  polarAngleTick: (props: Record<string, unknown>) => ReactNode;
  polarRadiusTickProps: { fill: string; fontSize: number };
  radarVertexDot: (dotProps: {
    cx?: number;
    cy?: number;
    index?: number;
  }) => ReactNode;
};

/**
 * 評価ブロックのカウントアップ等で親が毎フレーム再レンダーされても、
 * props が変わらない限り Recharts を動かさない（CSS グリッド／ポリゴンアニメの再実行を防ぐ）。
 */
const RadarChartGraphic = memo(function RadarChartGraphic({
  radarCyberKeyframes,
  vizId,
  fillGradientId,
  glowFilterId,
  data,
  radarCx,
  radarCy,
  outerRadius,
  rechartsMarginProps,
  polarAngleTick,
  polarRadiusTickProps,
  radarVertexDot,
}: RadarChartGraphicProps) {
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: radarCyberKeyframes }} />
      <div id={vizId} className="h-full w-full min-h-0">
        <ResponsiveContainer
          width="100%"
          height="100%"
          className="h-full w-full overflow-visible [&_.recharts-surface]:overflow-visible [&_path.recharts-polygon]:drop-shadow-[0_0_16px_rgba(34,211,238,0.42)]"
        >
          <ReRadarChart
            data={data}
            cx={radarCx}
            cy={radarCy}
            outerRadius={outerRadius}
            startAngle={90}
            endAngle={-270}
            {...rechartsMarginProps}
          >
            <defs>
              <linearGradient
                id={fillGradientId}
                x1="0%"
                y1="100%"
                x2="100%"
                y2="0%"
              >
                <stop offset="0%" stopColor="#06b6d4" stopOpacity={0.55} />
                <stop offset="42%" stopColor="#8b5cf6" stopOpacity={0.48} />
                <stop offset="100%" stopColor="#f472b6" stopOpacity={0.42} />
              </linearGradient>
              <filter
                id={glowFilterId}
                x="-45%"
                y="-45%"
                width="190%"
                height="190%"
              >
                <feGaussianBlur stdDeviation="2.2" result="coloredBlur" />
                <feMerge>
                  <feMergeNode in="coloredBlur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            <PolarGrid
              stroke={RADAR_CYBER.gridStroke}
              strokeDasharray={RADAR_CYBER.gridDash}
              radialLines
            />

            <PolarAngleAxis dataKey="label" tick={polarAngleTick} />

            <PolarRadiusAxis
              angle={90}
              domain={RADAR_RADIUS_DOMAIN}
              tickCount={6}
              tick={polarRadiusTickProps}
              axisLine={false}
            />

            <Radar
              dataKey="value"
              stroke={RADAR_CYBER.strokeOuter}
              strokeWidth={2.35}
              fill={`url(#${fillGradientId})`}
              fillOpacity={0}
              filter={`url(#${glowFilterId})`}
              isAnimationActive={false}
              dot={radarVertexDot}
            />
          </ReRadarChart>
        </ResponsiveContainer>
      </div>
    </>
  );
});

export default function RadarChart({
  value,
  axisLevels,
  language = "ja",
}: RadarChartProps) {
  const cyberDefIds = useMemo(() => {
    const s =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID().replace(/-/g, "").slice(0, 12)
        : `r${Math.floor(Math.random() * 1e9)}`;
    return {
      fill: `radarCyberFill${s}`,
      glow: `radarCyberGlow${s}`,
      viz: `radarViz${s}`,
    };
  }, []);

  /** グリッド（内→外）→ 頂点 → 輪郭 → 塗り（Recharts ポリゴンアニメはオフ） */
  const radarCyberKeyframes = useMemo(() => {
    const v = cyberDefIds.viz;
    const dataPhase = radarDataPhaseStartMs();
    const strokeDelay = dataPhase + RADAR_STROKE_DELAY_AFTER_DATA_MS;
    const fillDelay = dataPhase + RADAR_FILL_DELAY_AFTER_DATA_MS;
    const { ringStaggerMs, ringDurMs, spokeBaseMs, spokeStaggerMs, spokeDurMs } =
      RADAR_GRID_ANIM;

    const t0 = RADAR_ANIM_ENTRANCE_SETTLE_MS;

    const ringDelays = Array.from({ length: 8 }, (_, i) => {
      const n = i + 1;
      return `#${v} .recharts-polar-grid-concentric path.recharts-polar-grid-concentric-polygon:nth-child(${n}){animation-delay:${t0 + i * ringStaggerMs}ms;}`;
    }).join("");

    const spokeDelays = Array.from({ length: 8 }, (_, i) => {
      const n = i + 1;
      const delay = t0 + spokeBaseMs + i * spokeStaggerMs;
      return `#${v} .recharts-polar-grid-angle line:nth-child(${n}){animation-delay:${delay}ms;}`;
    }).join("");

    return `
@keyframes rcGridRing_${v} {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes rcGridSpoke_${v} {
  from { opacity: 0; }
  to { opacity: 1; }
}
@keyframes rcVtx_${v} {
  0% { opacity: 0; transform: scale(0.12); }
  55% { opacity: 1; transform: scale(1.22); }
  100% { opacity: 1; transform: scale(1); }
}
@keyframes rcStroke_${v} {
  to { stroke-dashoffset: 0; }
}
@keyframes rcFill_${v} {
  to { fill-opacity: 0.82; }
}
#${v} .recharts-polar-grid-concentric path.recharts-polar-grid-concentric-polygon {
  opacity: 0;
  animation: rcGridRing_${v} ${ringDurMs}ms ease-out forwards;
}
${ringDelays}
#${v} .recharts-polar-grid-angle line {
  opacity: 0;
  animation: rcGridSpoke_${v} ${spokeDurMs}ms ease-out forwards;
}
${spokeDelays}
#${v} path.recharts-polygon {
  fill-opacity: 0;
  stroke-dasharray: 1000;
  stroke-dashoffset: 1000;
  animation:
    rcStroke_${v} ${RADAR_STROKE_DUR_MS}ms ease-out ${strokeDelay}ms forwards,
    rcFill_${v} ${RADAR_FILL_DUR_MS}ms ease-out ${fillDelay}ms forwards;
}
#${v} circle.rc-radar-vertex {
  transform-box: fill-box;
  transform-origin: center;
  opacity: 0;
  animation: rcVtx_${v} ${RADAR_VERTEX_ANIM_MS}ms cubic-bezier(0.33, 1.45, 0.52, 1) forwards;
}
@media (prefers-reduced-motion: reduce) {
  #${v} .recharts-polar-grid-concentric path.recharts-polar-grid-concentric-polygon,
  #${v} .recharts-polar-grid-angle line {
    animation: none !important;
    opacity: 1 !important;
  }
  #${v} path.recharts-polygon {
    animation: none !important;
    stroke-dasharray: none !important;
    stroke-dashoffset: 0 !important;
    fill-opacity: 0.82 !important;
  }
  #${v} circle.rc-radar-vertex {
    animation: none !important;
    opacity: 1 !important;
    transform: none !important;
  }
}
`.trim();
  }, [cyberDefIds.viz]);

  const cardRef = useRef<HTMLDivElement>(null);
  const [openInfo, setOpenInfo] = useState(false);
  const [isWeb, setIsWeb] = useState(false);
  const [isLg, setIsLg] = useState(false);
  /** カードがビューに入ってからレーダーをマウントしアニメーション開始（総合得点カードの inView パターンに合わせる） */
  const [radarInView, setRadarInView] = useState(false);

  const eligible = value.radarEligible !== false;

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setIsWeb(w >= 960);
      setIsLg(w >= 1024);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  useEffect(() => {
    if (!eligible) {
      setRadarInView(true);
      return;
    }
    setRadarInView(false);
    const el = cardRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRadarInView(true);
          observer.disconnect();
        }
      },
      {
        /** 端ギリより、カードが十分見えてからマウント＋CSS 側でさらに settle 待ち */
        threshold: 0.32,
        rootMargin: "0px 0px -5% 0px",
      }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [eligible]);
  const showLevelPanel = eligible && axisLevels != null;
  /** モバイル: チャートの下に評価表。図の外周には軸名のみ（数値は表側） */
  const mobileStackedPanel = showLevelPanel && !isLg;
  /** 右パネルありのときは軸上の数値を隠し、右（または下）に集約 */
  const showNumericOnChart = !showLevelPanel;

  const evalTargets = useMemo(
    () =>
      Object.fromEntries(
        AXIS_ROWS.map((r) => [r.key, value[r.key]])
      ) as Record<RadarAxisKey, number>,
    [
      value.winRate,
      value.volume,
      value.precision,
      value.upset,
      value.streak,
    ]
  );

  const evalAnimActive = eligible && radarInView && showLevelPanel;

  const {
    scores: evalScores,
    showNumbers: evalShowNumbers,
    showLevelLetters: evalShowLetters,
  } = useRadarEvalScoresReveal(evalAnimActive, evalTargets);

  const data = useMemo(
    () =>
      AXIS_ROWS.map((row) => ({
        key: row.key,
        label: language === "en" ? row.labelEn : row.labelJa,
        value: value[row.key],
      })),
    [
      language,
      value.winRate,
      value.volume,
      value.precision,
      value.upset,
      value.streak,
    ]
  );

  /** モバイルは下の余白を減らすため高さを抑え、評価ブロックを近づける */
  const chartHeight = mobileStackedPanel ? 256 : isWeb ? 280 : 220;
  const outerRadius = mobileStackedPanel
    ? "58%"
    : showLevelPanel && isLg
      ? "62%"
      : isWeb
        ? "64%"
        : "62%";
  const labelFontSize = mobileStackedPanel ? 10 : isWeb ? 15 : 11;
  const valueFontSize = isWeb ? 13 : 10;
  const radiusTickFontSize = isWeb ? 11 : 9;
  const valueYOffset = isWeb ? 16 : 13;
  const offset = mobileStackedPanel ? 10 : isWeb ? 18 : 14;

  const radarMargin = useMemo(() => {
    if (showLevelPanel && isLg) {
      return { top: 6, right: 4, bottom: 6, left: 0 };
    }
    if (mobileStackedPanel) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }
    return undefined;
  }, [showLevelPanel, isLg, mobileStackedPanel]);

  const radarCx = showLevelPanel && isLg ? "42%" : "50%";
  /** 上寄せして枠内の下側の空きを減らす */
  const radarCy = mobileStackedPanel ? "45%" : "50%";

  const chartWrapStyle = useMemo(
    () =>
      mobileStackedPanel
        ? { height: chartHeight, marginBottom: -32 }
        : { height: chartHeight },
    [mobileStackedPanel, chartHeight]
  );

  const polarRadiusTickProps = useMemo(
    () => ({
      fill: RADAR_CYBER.axisTick,
      fontSize: radiusTickFontSize,
    }),
    [radiusTickFontSize]
  );

  const polarAngleTick = useCallback(
    (props: any) => {
      const payloadValue = props?.payload?.value;
      const item = data.find((d) => d.label === payloadValue);
      if (!item) return <g />;

      const x = Number(props?.x);
      const y = Number(props?.y);
      const cx = Number(props?.cx);
      const cy = Number(props?.cy);

      if (
        Number.isNaN(x) ||
        Number.isNaN(y) ||
        Number.isNaN(cx) ||
        Number.isNaN(cy)
      ) {
        return <g />;
      }

      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;

      const nx = (dx / dist) * offset;
      const ny = (dy / dist) * offset;

      return (
        <g transform={`translate(${x + nx}, ${y + ny})`}>
          <text
            y={0}
            textAnchor="middle"
            fill={RADAR_CYBER.labelFill}
            fontSize={labelFontSize}
            fontWeight={600}
          >
            {item.label}
          </text>
          {showNumericOnChart ? (
            <text
              y={valueYOffset}
              textAnchor="middle"
              fill={RADAR_CYBER.valueFill}
              fontSize={valueFontSize}
              className={summaryMetricNumClass}
            >
              {item.value.toFixed(1)}
            </text>
          ) : null}
        </g>
      );
    },
    [
      data,
      offset,
      labelFontSize,
      showNumericOnChart,
      valueFontSize,
      valueYOffset,
    ]
  );

  const rechartsRadarOuterProps = useMemo(
    () => (radarMargin ? { margin: radarMargin } : {}),
    [radarMargin]
  );

  const radarVertexDot = useCallback(
    (dotProps: { cx?: number; cy?: number; index?: number }) => {
      const { cx, cy, index = 0 } = dotProps;
      if (cx == null || cy == null) return null;
      return (
        <circle
          cx={cx}
          cy={cy}
          r={4}
          className="rc-radar-vertex"
          fill={`url(#${cyberDefIds.fill})`}
          stroke="rgba(244,114,182,0.9)"
          strokeWidth={1.15}
          style={{
            animationDelay: `${radarDataPhaseStartMs() + RADAR_DOT_BASE_AFTER_DATA_MS + index * RADAR_DOT_STAGGER_MS}ms`,
          }}
        />
      );
    },
    [cyberDefIds.fill]
  );

  return (
    <div
      ref={cardRef}
      className={[
        "relative overflow-hidden rounded-lg border border-white/15 bg-[#050814]/80 px-3 pb-2 pt-2.5 md:rounded-xl md:border-white/10 lg:px-4 lg:pb-4 lg:pt-5",
        summaryCardShadowSmClass,
        summaryCardShadowLgClass,
      ].join(" ")}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.36]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="relative z-1">
      <div className="mb-0 flex items-start justify-between gap-3 lg:mb-3 lg:gap-4">
        <div className="min-w-0 space-y-0.5 leading-tight">
          <div className="text-[11px] text-white/60 lg:text-sm">分析バランス</div>
          <div className="text-sm font-semibold text-white lg:text-base">
            レーダーチャート
          </div>
        </div>

        <button
          type="button"
          onClick={() => setOpenInfo((v) => !v)}
          className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold text-white/80 transition hover:bg-white/10 lg:text-xs"
        >
          {openInfo ? "説明を閉じる" : "説明を見る"}
        </button>
      </div>

      <div
        className={`flex w-full min-w-0 items-stretch ${showLevelPanel ? "flex-col gap-0 lg:flex-row lg:gap-3" : "flex-col"}`}
      >
        <div
          className={`flex min-h-0 min-w-0 justify-center overflow-visible ${mobileStackedPanel ? "-mt-1" : ""} ${showLevelPanel ? "w-full lg:mt-0 lg:flex-2" : "w-full"}`}
          style={chartWrapStyle}
        >
          {eligible ? (
            radarInView ? (
              <RadarChartGraphic
                radarCyberKeyframes={radarCyberKeyframes}
                vizId={cyberDefIds.viz}
                fillGradientId={cyberDefIds.fill}
                glowFilterId={cyberDefIds.glow}
                data={data}
                radarCx={radarCx}
                radarCy={radarCy}
                outerRadius={outerRadius}
                rechartsMarginProps={rechartsRadarOuterProps}
                polarAngleTick={polarAngleTick}
                polarRadiusTickProps={polarRadiusTickProps}
                radarVertexDot={radarVertexDot}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center rounded-md bg-white/5"
                aria-hidden
              />
            )
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 px-4 text-center">
              <p className="text-sm font-medium text-white/85">
                {language === "en"
                  ? "Radar chart (this month)"
                  : "レーダーチャート（当月）"}
              </p>
              <p className="max-w-sm text-xs leading-relaxed text-white/55">
                {language === "en"
                  ? "You need at least 10 settled posts this month to compare on the same basis as other active users."
                  : "当月の確定投稿が10件以上あると、その月のアクティブユーザー同士の相対位置としてレーダーが表示されます。"}
              </p>
            </div>
          )}
        </div>

        {showLevelPanel ? (
          <>
            {/* モバイル: チャート下に 軸名 → 数値 → パーセンタイル */}
            <div className="-mt-1 w-full space-y-0.5 lg:hidden">
              <div className="grid grid-cols-5 gap-x-0.5 text-center">
                {AXIS_ROWS.map((row) => {
                  const label = language === "en" ? row.labelEn : row.labelJa;
                  return (
                    <div
                      key={row.key}
                      title={label}
                      className="min-w-0 px-0.5 text-[9px] font-semibold leading-tight text-white/80 sm:text-[10px]"
                    >
                      {label}
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-5 gap-x-0.5 text-center">
                {AXIS_ROWS.map((row) => {
                  const lv = axisLevels![row.key];
                  return (
                    <div
                      key={row.key}
                      className="flex min-w-0 flex-col items-center gap-0.5 px-0.5"
                    >
                      <span
                        className={`${summaryMetricNumClass} inline-block min-w-[2.65ch] text-sm tabular-nums transition-opacity duration-200 ${levelValueCyberClass(lv)} ${
                          evalShowNumbers ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        {evalScores[row.key].toFixed(1)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="grid grid-cols-5 gap-x-0.5 text-center">
                {AXIS_ROWS.map((row) => {
                  const pct = approxPercentileFromRadar10(evalScores[row.key]);
                  const disp = formatPercentileDisplay(
                    pct,
                    language === "en" ? "en" : "ja"
                  );
                  return (
                    <div
                      key={`pct-${row.key}`}
                      className={`flex min-w-0 flex-col items-center px-0.5 transition-opacity duration-300 ${
                        evalShowLetters ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <span
                        className={`max-w-full text-[11px] font-semibold leading-tight sm:text-[13px] ${percentileTierTextClass(disp.tier)}`}
                        title={disp.text}
                      >
                        {disp.text}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-0 pt-0.5 text-center text-[9px] leading-snug text-white/40">
                {language === "en"
                  ? "“Top/Bottom %” is a 10% step estimate from the 0–10 score (10+ post cohort)."
                  : "「上位/下位%」は 0–10 スコアからの概算です（10投稿以上コホート）。"}
              </p>
            </div>

            {/* デスクトップ: 右縦並び */}
            <div className="hidden min-w-0 flex-1 flex-col justify-center gap-1.5 border-white/10 lg:flex lg:border-l lg:pl-4">
              {AXIS_ROWS.map((row) => {
                const lv = axisLevels![row.key];
                const label = language === "en" ? row.labelEn : row.labelJa;
                const pct = approxPercentileFromRadar10(evalScores[row.key]);
                const disp = formatPercentileDisplay(
                  pct,
                  language === "en" ? "en" : "ja"
                );
                return (
                  <div
                    key={row.key}
                    className="flex min-w-0 items-start justify-between gap-2 text-xs sm:text-sm"
                  >
                    <span className="min-w-0 truncate pt-0.5 text-white/75">
                      {label}
                    </span>
                    <div className="flex shrink-0 flex-col items-end gap-0.5 text-right">
                      <span
                        className={`${summaryMetricNumClass} inline-block min-w-[2.65ch] text-sm tabular-nums transition-opacity duration-200 sm:text-base ${levelValueCyberClass(lv)} ${
                          evalShowNumbers ? "opacity-100" : "opacity-0"
                        }`}
                      >
                        {evalScores[row.key].toFixed(1)}
                      </span>
                      <span
                        className={`text-sm font-semibold transition-opacity duration-300 sm:text-base ${
                          evalShowLetters ? "opacity-100" : "opacity-0"
                        } ${percentileTierTextClass(disp.tier)}`}
                      >
                        {disp.text}
                      </span>
                    </div>
                  </div>
                );
              })}
              <p className="mt-0.5 text-[9px] leading-snug text-white/40 sm:text-[10px]">
                {language === "en"
                  ? "“Top/Bottom %” is a 10% step estimate from the 0–10 score (10+ post cohort)."
                  : "「上位/下位%」は 0–10 スコアからの概算です（10投稿以上コホート）。"}
              </p>
            </div>
          </>
        ) : null}
      </div>

      {openInfo && (
        <div className="mt-3 rounded-xl border border-white/10 bg-white/3 p-3">
          {language === "en" ? (
            <>
              <div className="space-y-1.5 text-[11px] leading-relaxed text-white/65 lg:text-[13px]">
                <p>
                  <span className="font-semibold text-white/80">Win rate: </span>
                  Relative standing among users with 10+ settled posts this
                  month.
                </p>
                <p>
                  <span className="font-semibold text-white/80">Volume: </span>
                  Post count in your main league vs others in the cohort who
                  posted in that league.
                </p>
                <p>
                  <span className="font-semibold text-white/80">
                    Score precision:{" "}
                  </span>
                  Average score accuracy vs others in the same cohort.
                </p>
                <p>
                  <span className="font-semibold text-white/80">Upset: </span>
                  How you stack up on upset points in that cohort.
                </p>
                <p>
                  <span className="font-semibold text-white/80">Stamina: </span>
                  Derived from max win/lose streaks; higher means steadier
                  month-to-month rhythm within the cohort.
                </p>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/70 lg:text-[13px]">
                Values are 0–10 percentile buckets (10% steps) within the
                monthly active cohort. A larger shape means stronger relative
                balance.
              </p>
            </>
          ) : (
            <>
              <div className="space-y-1.5 text-[11px] leading-relaxed text-white/65 lg:text-[13px]">
                <p>
                  <span className="font-semibold text-white/80">勝率：</span>
                  当月・確定投稿10件以上のユーザー同士での相対位置です。
                </p>
                <p>
                  <span className="font-semibold text-white/80">投稿量：</span>
                  主戦場リーグの投稿数を、そのリーグで投稿した同母集団ユーザーと比較した相対です。
                </p>
                <p>
                  <span className="font-semibold text-white/80">
                    スコア精度：
                  </span>
                  同じ母集団での月次平均スコア精度の相対です。
                </p>
                <p>
                  <span className="font-semibold text-white/80">Upset：</span>
                  Upset
                  得点の合計を、同母集団内で比較した相対です。
                </p>
                <p>
                  <span className="font-semibold text-white/80">耐性：</span>
                  連勝・連敗のパターンから算出した指標を同母集団内で比較した相対です。
                </p>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-white/70 lg:text-[13px]">
                各軸は 0–10（パーセンタイルを10段階に丸めた値）で、当月10投稿以上のユーザーを母集団としています。外側に広がるほど、その月の中でバランスよく強い位置です。
              </p>
            </>
          )}

          {eligible && value.upsetValid === false && (
            <p className="mt-2 text-[11px] leading-relaxed text-white/50 lg:text-[13px]">
              {language === "en"
                ? "Upset is shown but may be noisy: fewer than 5 upset opportunities this month."
                : "Upset は当月の波乱対象試合が5試合未満のため、解釈に注意が必要です。"}
            </p>
          )}
        </div>
          )}
      </div>
    </div>
  );
}