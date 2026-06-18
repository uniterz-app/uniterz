"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

export type CyberSegAccent = {
  border: string;
  glow: string;
  bg?: string;
};

const SEG_STAGGER_S = 0.055;
const SEG_OPACITY_DURATION_S = 0.32;

function filledSegCount(pct: number, segments: number): number {
  return Math.round((Math.min(100, Math.max(0, pct)) / 100) * segments);
}

export function CyberSlantedSegBar({
  pct,
  segments = 10,
  compact = false,
  tall = false,
  enterDelay = 0,
  accent,
  maxWidthClass,
  enter,
  forceStatic = false,
}: {
  pct: number;
  segments?: number;
  compact?: boolean;
  /** md より少し高いセグメント（MatchCard 評価行向け） */
  tall?: boolean;
  enterDelay?: number;
  accent: CyberSegAccent;
  /** 例: max-w-[108px] */
  maxWidthClass?: string;
  /** 省略時は mount 後 enterDelay で点灯 */
  enter?: boolean;
  /** reduced-motion 相当で即時表示（プロフィール閲覧 lite 向け） */
  forceStatic?: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const [internalEnter, setInternalEnter] = useState(
    reduceMotion === true || forceStatic === true
  );
  const controlledEnter = enter;
  const enterActive = controlledEnter ?? internalEnter;
  const filled = enterActive ? filledSegCount(pct, segments) : 0;
  const motionOff = reduceMotion === true || forceStatic === true;
  const segH = compact ? 9 : tall ? 13 : 11;
  const widthClass =
    maxWidthClass ??
    (compact ? "max-w-[96px]" : tall ? "max-w-[136px]" : "max-w-[128px]");

  useEffect(() => {
    if (controlledEnter !== undefined) return;
    if (motionOff) {
      setInternalEnter(true);
      return;
    }
    setInternalEnter(false);
    const id = window.setTimeout(() => setInternalEnter(true), enterDelay * 1000);
    return () => window.clearTimeout(id);
  }, [pct, segments, enterDelay, motionOff, controlledEnter, forceStatic]);

  return (
    <div
      className={["cyber-slanted-seg-track flex w-full gap-[4px]", widthClass].join(
        " "
      )}
      role="presentation"
    >
      {Array.from({ length: segments }).map((_, i) => {
        const lit = i < filled;
        const delay = i * SEG_STAGGER_S;
        const shown = enterActive || motionOff;

        return (
          <motion.div
            key={i}
            className="cyber-slanted-seg relative min-w-0 flex-1"
            initial={false}
            animate={{
              opacity: shown ? (lit ? 1 : 0.55) : 0,
              scaleY: shown ? 1 : 0.35,
            }}
            transition={
              motionOff
                ? { duration: 0 }
                : {
                    opacity: {
                      delay: enterActive ? delay : 0,
                      duration: SEG_OPACITY_DURATION_S,
                    },
                    scaleY: {
                      delay: enterActive ? delay : 0,
                      type: "spring",
                      stiffness: 380,
                      damping: 28,
                    },
                  }
            }
            style={{
              height: segH,
              transform: "skewX(-16deg)",
              transformOrigin: "center bottom",
              background: lit ? accent.border : "rgba(255,255,255,0.03)",
              border: lit
                ? `1px solid ${accent.bg ?? accent.border}`
                : "1px solid rgba(0,245,255,0.22)",
              boxShadow: lit ? `0 0 8px ${accent.glow}` : "none",
            }}
          >
            {lit && !motionOff ? (
              <span aria-hidden className="cyber-slanted-seg__scan pointer-events-none" />
            ) : null}
          </motion.div>
        );
      })}
    </div>
  );
}
