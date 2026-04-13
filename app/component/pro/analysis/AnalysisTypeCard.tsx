"use client";

import { motion, useInView, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { summaryMetricNumClass } from "@/lib/fonts";
import { ANALYSIS_TYPE_META_JA } from "@/shared/analysis/analysisTypeMeta";
import type { AnalysisTypeId, AnalysisTypeMeta } from "@/shared/analysis/types";
import { ANALYSIS_TYPE_COLOR } from "@/shared/analysis/analysisTypeColor";
import type { RadarAxisLevels } from "@/app/component/pro/analysis/radarLevelUtils";
import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";
import {
  summaryCardShadowSmClass,
  summaryCardShadowLgClass,
} from "@/lib/ui/profileCardEdgeGlow";
import type { Language } from "@/lib/i18n/language";

type Props = {
  analysisTypeId: AnalysisTypeId;
  axisLevels?: RadarAxisLevels | null;
  language?: Language;
};

const ALL_TYPE_IDS = Object.keys(ANALYSIS_TYPE_META_JA) as AnalysisTypeId[];
const TOTAL_TYPE_COUNT = ALL_TYPE_IDS.length;
const S2_TYPE_IDS = new Set<AnalysisTypeId>([
  "TWO_WAY_PLAYER",
  "DEEP_BAG",
  "SPARK_PLUG",
  "BIG_GAME_HUNTER",
  "SHARPSHOOTER",
  "CLUTCH",
  "CHAOS_RUNNER",
  "WALKING_BUCKET",
  "BULLDOG",
  "SCRAPPER",
]);
const S1_TYPE_IDS = new Set<AnalysisTypeId>([
  "FINISHER",
  "LASER",
  "HIGH_MOTOR",
  "CHAOS_TAKER",
  "IRON_MAN",
]);
const AXIS_ORDER: Array<keyof RadarAxisLevels> = [
  "winRate",
  "precision",
  "volume",
  "upset",
  "streak",
];
const AXIS_LABEL_JA: Record<keyof RadarAxisLevels, string> = {
  winRate: "勝率",
  precision: "精度",
  volume: "投稿量",
  upset: "Upset対応",
  streak: "継続力",
};

const SPIN_META_FALLBACK: AnalysisTypeMeta = { label: "···", description: "" };

function randomTypeId(): AnalysisTypeId {
  return ALL_TYPE_IDS[Math.floor(Math.random() * ALL_TYPE_IDS.length)]!;
}

function buildDynamicLine(
  levels: RadarAxisLevels | null | undefined,
  mode: "S1" | "S2"
): string {
  const strongLabel = mode === "S1" ? "強み1軸" : "強み2軸";
  if (!levels) {
    return `さらに上を目指すには、平均レベルの指標をもう一段引き上げること。ここが伸びると、${strongLabel}がつながり、オールラウンダーへと近づいていける。`;
  }

  const mLabels = AXIS_ORDER.filter((k) => levels[k] === "M").map(
    (k) => `「${AXIS_LABEL_JA[k]}」`
  );
  if (mLabels.length >= 2) {
    return `さらに上を目指すには、${mLabels[0]}と${mLabels[1]}をもう一段引き上げること。ここが伸びると、${strongLabel}がつながり、オールラウンダーへと近づいていける。`;
  }
  if (mLabels.length === 1) {
    return `さらに上を目指すには、${mLabels[0]}をもう一段引き上げること。ここが伸びると、${strongLabel}がつながり、オールラウンダーへと近づいていける。`;
  }
  return `さらに上を目指すには、平均レベルの指標をもう一段引き上げること。ここが伸びると、${strongLabel}がつながり、オールラウンダーへと近づいていける。`;
}

export default function AnalysisTypeCard({
  analysisTypeId,
  axisLevels,
  language = "ja",
}: Props) {
  const meta = ANALYSIS_TYPE_META_JA[analysisTypeId];
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const isInView = useInView(rootRef, { once: true, amount: 0.22 });

  const [enterDone, setEnterDone] = useState(false);
  /** 正解を最初に出さない（SSR 後すぐランダムへ） */
  const [spinId, setSpinId] = useState<AnalysisTypeId | null>(null);
  const [rouletteDone, setRouletteDone] = useState(false);
  const rouletteStartedRef = useRef(false);

  useLayoutEffect(() => {
    setSpinId(randomTypeId());
  }, []);

  const spinMeta = useMemo(() => {
    if (spinId == null) {
      return SPIN_META_FALLBACK;
    }
    return ANALYSIS_TYPE_META_JA[spinId] ?? meta ?? SPIN_META_FALLBACK;
  }, [spinId, meta]);

  const renderedDescription = useMemo(() => {
    if (!meta?.description) return "";
    const mode = S2_TYPE_IDS.has(analysisTypeId)
      ? "S2"
      : S1_TYPE_IDS.has(analysisTypeId)
        ? "S1"
        : null;
    if (!mode) return meta.description;
    const lines = meta.description.split("\n");
    if (lines.length < 4) return meta.description;
    lines[2] = buildDynamicLine(axisLevels, mode);
    return lines.join("\n");
  }, [analysisTypeId, axisLevels, meta]);

  const onCardEnterComplete = useCallback(() => {
    if (isInView && !reduceMotion) setEnterDone(true);
  }, [isInView, reduceMotion]);

  useEffect(() => {
    if (!reduceMotion || !isInView) return;
    setEnterDone(true);
    setSpinId(analysisTypeId);
    setRouletteDone(true);
    rouletteStartedRef.current = true;
  }, [reduceMotion, isInView, analysisTypeId]);

  useEffect(() => {
    if (!enterDone || reduceMotion || !isInView || rouletteStartedRef.current) {
      return;
    }
    rouletteStartedRef.current = true;

    let cancelled = false;
    const totalTicks = 15 + Math.floor(Math.random() * 6);
    let tick = 0;

    const id = window.setInterval(() => {
      if (cancelled) return;
      tick += 1;
      if (tick < totalTicks) {
        setSpinId(randomTypeId());
      } else {
        window.clearInterval(id);
        setSpinId(analysisTypeId);
        setRouletteDone(true);
      }
    }, 118);

    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [enterDone, reduceMotion, isInView, analysisTypeId]);

  /** onAnimationComplete が来ない環境向けのフォールバック */
  useEffect(() => {
    if (!isInView || reduceMotion || enterDone) return;
    const t = window.setTimeout(() => setEnterDone(true), 700);
    return () => window.clearTimeout(t);
  }, [isInView, reduceMotion, enterDone]);

  const cardEase: [number, number, number, number] = [0.22, 0.61, 0.36, 1];
  const noTypeMeta = !meta;
  const dotColor =
    spinId != null
      ? (ANALYSIS_TYPE_COLOR[spinId] ?? ANALYSIS_TYPE_COLOR.PROSPECT)
      : "rgba(148,163,184,0.45)";
  const emptyLabel = language === "en" ? "No data available" : "データがありません";

  return (
    <motion.div
      ref={rootRef}
      className={[
        "relative overflow-hidden rounded-2xl border border-white/15 bg-[#050814]/80 p-4",
        summaryCardShadowSmClass,
        summaryCardShadowLgClass,
      ].join(" ")}
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      animate={
        isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 18 }
      }
      transition={{
        duration: reduceMotion ? 0 : 0.52,
        ease: cardEase,
      }}
      onAnimationComplete={reduceMotion ? undefined : onCardEnterComplete}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.36]"
        style={PROFILE_SHELL_GRID_STYLE}
        aria-hidden
      />
      <div className="relative z-1">
        <div className="mb-2">
          <div className="text-xs text-white/60">{`分析タイプ（全${TOTAL_TYPE_COUNT}種類）`}</div>
          <div className="mt-1 flex min-h-7 items-center gap-2 text-base tracking-tight md:min-h-10 md:gap-2.5 md:text-2xl">
            <span
              className="h-3.5 w-3.5 shrink-0 rounded-sm transition-colors duration-100 md:h-4 md:w-4"
              style={{ backgroundColor: dotColor }}
            />
            <div
              className={[summaryMetricNumClass, "min-w-0 leading-tight"].join(
                " "
              )}
              style={{ color: dotColor }}
            >
              {noTypeMeta ? "—" : spinMeta.label}
            </div>
          </div>
        </div>

        <motion.p
          className="whitespace-pre-line text-sm leading-relaxed text-white/80"
          initial={false}
          animate={
            noTypeMeta || reduceMotion
              ? { opacity: 1, y: 0 }
              : rouletteDone
                ? { opacity: 1, y: 0 }
                : { opacity: 0, y: 10 }
          }
          transition={{
            duration: reduceMotion ? 0 : 0.48,
            ease: cardEase,
            delay: reduceMotion ? 0 : 0.06,
          }}
        >
          {noTypeMeta ? emptyLabel : renderedDescription}
        </motion.p>
      </div>
    </motion.div>
  );
}
