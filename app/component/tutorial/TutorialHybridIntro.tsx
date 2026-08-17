"use client";

/**
 * パターンC: 短いスライド（3枚）オーバーレイ。
 * 閉じた後は TutorialPulseHint で試合カードを誘導する。
 */

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
import { nameOxanium, nameRajdhani, jp } from "@/lib/fonts";
import { t } from "@/lib/i18n/t";
import type { Language } from "@/lib/i18n/language";
import {
  TUTORIAL_BG_FADE_S,
  TUTORIAL_CALLOUT_GLASS_BG,
  TUTORIAL_CALLOUT_GLASS_BLUR_PX,
  TUTORIAL_CALLOUT_GLASS_SATURATE,
  TUTORIAL_CTA_DELAY_S,
  TUTORIAL_CYAN,
  TUTORIAL_EXIT_S,
  TUTORIAL_SLIDE_DURATION_S,
  TUTORIAL_SLIDE_OFFSET_PX,
} from "@/lib/tutorial/tutorialMotion";
import TutorialRichBody from "@/app/component/tutorial/TutorialRichBody";

const CYBER_CHAMFER_CLIP =
  "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)";

const EASE = [0.22, 1, 0.36, 1] as const;

export type TutorialHybridFinishReason = "skip" | "complete";

type Props = {
  open: boolean;
  language?: Language;
  /** skip=完全既読 / complete=スライド完了→パルスへ */
  onFinish: (reason: TutorialHybridFinishReason) => void;
  resetKey?: number;
};

export default function TutorialHybridIntro({
  open,
  language = "ja",
  onFinish,
  resetKey = 0,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const reduceMotion = useReducedMotion() === true;
  const m = t(language);

  const slides = useMemo(
    () => [
      {
        id: "welcome",
        kicker: m.tutorial.hybrid.welcomeKicker,
        title: m.tutorial.hybrid.welcomeTitle,
        body: m.tutorial.hybrid.welcomeBody,
      },
      {
        id: "flow",
        kicker: m.tutorial.hybrid.flowKicker,
        title: m.tutorial.hybrid.flowTitle,
        body: m.tutorial.hybrid.flowBody,
      },
      {
        id: "start",
        kicker: m.tutorial.hybrid.startKicker,
        title: m.tutorial.hybrid.startTitle,
        body: m.tutorial.hybrid.startBody,
      },
    ],
    [m]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setStep(0);
  }, [open, resetKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onFinish("skip");
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        setStep((s) => {
          if (s >= slides.length - 1) {
            onFinish("complete");
            return s;
          }
          return s + 1;
        });
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        setStep((s) => Math.max(0, s - 1));
      }
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onFinish, slides.length]);

  if (!mounted) return null;

  const slide = slides[step];
  const isLast = step >= slides.length - 1;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="tutorial-hybrid"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-hybrid-title"
          className="fixed inset-0 z-[70] flex flex-col justify-end sm:justify-center"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: TUTORIAL_EXIT_S } }}
          transition={{ duration: TUTORIAL_BG_FADE_S, ease: EASE }}
        >
          <button
            type="button"
            aria-label={m.tutorial.skip}
            className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
            onClick={() => onFinish("skip")}
          />

          <motion.div
            className="relative z-10 mx-auto w-full max-w-md overflow-hidden border border-cyan-400/35 px-5 pb-6 pt-5"
            style={{
              clipPath: CYBER_CHAMFER_CLIP,
              WebkitClipPath: CYBER_CHAMFER_CLIP,
              background: TUTORIAL_CALLOUT_GLASS_BG,
              backdropFilter: `blur(${TUTORIAL_CALLOUT_GLASS_BLUR_PX}px) saturate(${TUTORIAL_CALLOUT_GLASS_SATURATE})`,
              WebkitBackdropFilter: `blur(${TUTORIAL_CALLOUT_GLASS_BLUR_PX}px) saturate(${TUTORIAL_CALLOUT_GLASS_SATURATE})`,
              boxShadow: `0 0 40px rgba(0,245,255,0.12), inset 0 1px 0 rgba(255,255,255,0.14)`,
            }}
            initial={reduceMotion ? false : { opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: TUTORIAL_SLIDE_DURATION_S, ease: EASE }}
          >
            <div className="mb-3 flex items-center justify-between">
              <span
                className={cn(
                  nameOxanium.className,
                  "text-[10px] font-bold uppercase tracking-[0.2em] text-cyan-300/70"
                )}
              >
                Tutorial
              </span>
              <button
                type="button"
                onClick={() => onFinish("skip")}
                className={cn(
                  nameOxanium.className,
                  "text-[11px] font-bold uppercase tracking-wider text-white/50 hover:text-white/80"
                )}
              >
                {m.tutorial.skip}
              </button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                initial={
                  reduceMotion
                    ? false
                    : { opacity: 0, x: TUTORIAL_SLIDE_OFFSET_PX }
                }
                animate={{ opacity: 1, x: 0 }}
                exit={
                  reduceMotion
                    ? undefined
                    : { opacity: 0, x: -TUTORIAL_SLIDE_OFFSET_PX }
                }
                transition={{
                  duration: TUTORIAL_SLIDE_DURATION_S,
                  ease: EASE,
                }}
              >
                <p
                  className={cn(
                    nameOxanium.className,
                    "mb-1.5 text-[10px] font-bold uppercase tracking-[0.2em]"
                  )}
                  style={{ color: TUTORIAL_CYAN }}
                >
                  {slide.kicker}
                </p>
                <h2
                  id="tutorial-hybrid-title"
                  className={cn(
                    jp.className,
                    "mb-2 text-[20px] font-bold text-white"
                  )}
                >
                  {slide.title}
                </h2>
                <TutorialRichBody
                  text={slide.body}
                  className={cn(
                    nameRajdhani.className,
                    "text-[14px] leading-relaxed text-white/65"
                  )}
                />
              </motion.div>
            </AnimatePresence>

            <div className="mt-5 flex items-center justify-center gap-1.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`${i + 1}`}
                  onClick={() => setStep(i)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === step ? 16 : 6,
                    background:
                      i === step ? TUTORIAL_CYAN : "rgba(255,255,255,0.22)",
                  }}
                />
              ))}
            </div>

            <motion.div
              className="mt-4 flex gap-2"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: TUTORIAL_CTA_DELAY_S }}
            >
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className={cn(
                    nameOxanium.className,
                    "border border-white/20 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-white/70"
                  )}
                  style={{
                    clipPath: CYBER_CHAMFER_CLIP,
                    WebkitClipPath: CYBER_CHAMFER_CLIP,
                  }}
                >
                  {m.tutorial.back}
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  if (isLast) onFinish("complete");
                  else setStep((s) => s + 1);
                }}
                className={cn(
                  nameOxanium.className,
                  "flex-1 py-3 text-[13px] font-black uppercase tracking-[0.14em]"
                )}
                style={{
                  background: TUTORIAL_CYAN,
                  color: "#050508",
                  clipPath: CYBER_CHAMFER_CLIP,
                  WebkitClipPath: CYBER_CHAMFER_CLIP,
                  boxShadow: `0 0 14px ${TUTORIAL_CYAN}55`,
                }}
              >
                {isLast ? m.tutorial.seeGames : m.tutorial.next}
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
