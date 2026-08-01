"use client";

/**
 * 予想フォーム上のチュートリアル案内バナー
 */

import { motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
import { nameOxanium, jp } from "@/lib/fonts";
import {
  TUTORIAL_CYAN,
  TUTORIAL_PULSE_PERIOD_S,
} from "@/lib/tutorial/tutorialMotion";

type Props = {
  title: string;
  body: string;
  /** 例: 「得点を入れて投稿」 */
  ctaHint?: string;
  className?: string;
};

export default function TutorialPredictGuideBanner({
  title,
  body,
  ctaHint,
  className,
}: Props) {
  const reduceMotion = useReducedMotion() === true;

  return (
    <motion.div
      className={cn(
        "relative overflow-hidden border px-3 py-3",
        className
      )}
      style={{
        borderColor: `${TUTORIAL_CYAN}55`,
        background:
          "linear-gradient(135deg, rgba(0,245,255,0.14), rgba(5,10,16,0.92))",
        boxShadow: `0 0 18px ${TUTORIAL_CYAN}22`,
      }}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span
          className={cn(
            nameOxanium.className,
            "text-[9px] font-black uppercase tracking-[0.18em]"
          )}
          style={{ color: TUTORIAL_CYAN }}
        >
          Tutorial
        </span>
        <motion.span
          aria-hidden
          className="inline-block h-2 w-2 rotate-45"
          style={{
            background: TUTORIAL_CYAN,
            boxShadow: `0 0 10px ${TUTORIAL_CYAN}`,
          }}
          animate={
            reduceMotion ? undefined : { opacity: [0.4, 1, 0.4] }
          }
          transition={{
            duration: TUTORIAL_PULSE_PERIOD_S,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>
      <p
        className={cn(
          nameOxanium.className,
          "mb-1 text-[14px] font-black tracking-wide text-white"
        )}
      >
        {title}
      </p>
      <p className={cn(jp.className, "text-[12px] leading-relaxed text-white/70")}>
        {body}
      </p>
      {ctaHint ? (
        <motion.p
          className={cn(
            nameOxanium.className,
            "mt-2 text-center text-[11px] font-bold uppercase tracking-[0.14em]"
          )}
          style={{ color: TUTORIAL_CYAN }}
          animate={reduceMotion ? undefined : { opacity: [0.55, 1, 0.55] }}
          transition={{
            duration: TUTORIAL_PULSE_PERIOD_S,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        >
          {ctaHint}
        </motion.p>
      ) : null}
    </motion.div>
  );
}
