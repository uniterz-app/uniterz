"use client";

/**
 * チュートリアル — 試合終了シミュレーション中のオーバーレイ
 */

import { createPortal } from "react-dom";
import { motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
import { nameOxanium, jp } from "@/lib/fonts";
import {
  TUTORIAL_CYAN,
  TUTORIAL_PULSE_PERIOD_S,
} from "@/lib/tutorial/tutorialMotion";

type Props = {
  open: boolean;
  title: string;
  body: string;
  spinLabel: string;
};

export default function TutorialResolvingOverlay({
  open,
  title,
  body,
  spinLabel,
}: Props) {
  const reduceMotion = useReducedMotion() === true;
  if (typeof document === "undefined" || !open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[78] flex flex-col items-center justify-center bg-black/75 px-6 backdrop-blur-[2px]">
      <motion.div
        className="w-full max-w-sm border px-5 py-8 text-center"
        style={{
          borderColor: `${TUTORIAL_CYAN}44`,
          background: "rgba(7,16,24,0.96)",
        }}
        initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <motion.p
          className={cn(
            nameOxanium.className,
            "mb-4 text-[13px] font-black uppercase tracking-[0.22em]"
          )}
          style={{ color: TUTORIAL_CYAN }}
          animate={reduceMotion ? undefined : { opacity: [0.45, 1, 0.45] }}
          transition={{
            duration: TUTORIAL_PULSE_PERIOD_S,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {spinLabel}
        </motion.p>
        <p
          className={cn(
            nameOxanium.className,
            "mb-2 text-[18px] font-black text-white"
          )}
        >
          {title}
        </p>
        <p className={cn(jp.className, "text-[13px] leading-relaxed text-white/65")}>
          {body}
        </p>
      </motion.div>
    </div>,
    document.body
  );
}
