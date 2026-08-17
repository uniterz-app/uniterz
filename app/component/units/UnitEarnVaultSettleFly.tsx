"use client";

/**
 * Unit 獲得 Phase B — 金貨チップが Vault へ流れる
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import { UnitEarnFlyChip } from "@/app/component/units/UnitEarnCelebrateVisual";
import { UNIT_EARN_CELEBRATE_MOTION as M } from "@/lib/units/unitEarnCelebrate";

export type UnitEarnFlyPayload = {
  amount: number;
  label: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
};

type Props = {
  fly: UnitEarnFlyPayload | null;
  onComplete: () => void;
};

export default function UnitEarnVaultSettleFly({ fly, onComplete }: Props) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion() === true;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!fly || reduceMotion) {
      if (fly) onComplete();
      return;
    }
    const t = window.setTimeout(onComplete, M.flyDurationS * 1000 + 40);
    return () => window.clearTimeout(t);
  }, [fly, onComplete, reduceMotion]);

  if (!mounted || !fly) return null;

  if (reduceMotion) return null;

  return createPortal(
    <div className="pointer-events-none fixed inset-0 z-[85]">
      <motion.div
        className="absolute"
        initial={{
          left: fly.fromX,
          top: fly.fromY,
          x: "-50%",
          y: "-50%",
          scale: 1,
          opacity: 1,
          filter: "blur(0px)",
        }}
        animate={{
          left: fly.toX,
          top: fly.toY,
          x: "-50%",
          y: "-50%",
          scale: 0.42,
          opacity: 0.88,
          filter: "blur(1px)",
        }}
        transition={{
          duration: M.flyDurationS,
          ease: M.flyEase as [number, number, number, number],
        }}
      >
        <UnitEarnFlyChip label={fly.label} />
      </motion.div>
    </div>,
    document.body
  );
}
