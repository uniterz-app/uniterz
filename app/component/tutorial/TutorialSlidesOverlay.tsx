"use client";

/**
 * パターンA: スライド式フルスクリーンオーバーレイ。
 * ステップごとに図解 + テキスト。ドットインジケーター / 次へ / スキップ。
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
import { nameOxanium, nameRajdhani, jp } from "@/lib/fonts";
import { TUTORIAL_SLIDES } from "@/lib/tutorial/tutorialCopy";
import {
  TUTORIAL_BG_FADE_S,
  TUTORIAL_CTA_DELAY_S,
  TUTORIAL_CYAN,
  TUTORIAL_DOTS_DELAY_S,
  TUTORIAL_EXIT_S,
  TUTORIAL_ILLUST_DELAY_S,
  TUTORIAL_SLIDE_DURATION_S,
  TUTORIAL_SLIDE_OFFSET_PX,
} from "@/lib/tutorial/tutorialMotion";
import TutorialSlideVisual from "@/app/component/tutorial/TutorialSlideVisual";

const CYBER_CHAMFER_CLIP =
  "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)";

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  /** プレビュー再生時に毎回先頭から始める */
  resetKey?: number;
};

export default function TutorialSlidesOverlay({
  open,
  onClose,
  resetKey = 0,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const reduceMotion = useReducedMotion() === true;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setStep(0);
  }, [open, resetKey]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        setStep((s) => {
          if (s >= TUTORIAL_SLIDES.length - 1) {
            onClose();
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
  }, [open, onClose]);

  if (!mounted) return null;

  const slide = TUTORIAL_SLIDES[step];
  const isLast = step >= TUTORIAL_SLIDES.length - 1;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="tutorial-slides"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-slides-title"
          className="fixed inset-0 z-[70] flex flex-col"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: TUTORIAL_EXIT_S } }}
          transition={{ duration: TUTORIAL_BG_FADE_S, ease: EASE }}
        >
          {/* 背景 */}
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 80% 55% at 50% 18%, rgba(0,245,255,0.16), transparent 55%), linear-gradient(180deg, #03060c 0%, #050810 55%, #020408 100%)",
            }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(0,245,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,245,255,0.5) 1px, transparent 1px)",
              backgroundSize: "28px 28px",
            }}
          />

          {/* ヘッダー */}
          <div className="relative z-10 flex items-center justify-between px-4 pb-2 pt-[max(14px,env(safe-area-inset-top))]">
            <span
              className={cn(
                nameOxanium.className,
                "text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-300/70"
              )}
            >
              Tutorial · A
            </span>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                nameOxanium.className,
                "rounded px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-white/55 transition hover:bg-white/5 hover:text-white/85"
              )}
            >
              スキップ
            </button>
          </div>

          {/* 本文 */}
          <div className="relative z-10 flex min-h-0 flex-1 flex-col px-5 pb-6 pt-2">
            <AnimatePresence mode="wait">
              <motion.div
                key={slide.id}
                className="flex min-h-0 flex-1 flex-col"
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
                transition={{ duration: TUTORIAL_SLIDE_DURATION_S, ease: EASE }}
              >
                <motion.div
                  className="mb-5 flex flex-1 items-center justify-center"
                  initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: TUTORIAL_ILLUST_DELAY_S,
                    duration: TUTORIAL_SLIDE_DURATION_S,
                    ease: EASE,
                  }}
                >
                  <TutorialSlideVisual visual={slide.visual} />
                </motion.div>

                <div className="shrink-0">
                  <p
                    className={cn(
                      nameOxanium.className,
                      "mb-1.5 text-[10px] font-bold uppercase tracking-[0.22em]"
                    )}
                    style={{ color: TUTORIAL_CYAN }}
                  >
                    {slide.kicker}
                  </p>
                  <h2
                    id="tutorial-slides-title"
                    className={cn(
                      jp.className,
                      "mb-2 text-[22px] font-bold leading-tight text-white"
                    )}
                  >
                    {slide.title}
                  </h2>
                  <p
                    className={cn(
                      nameRajdhani.className,
                      "text-[15px] leading-relaxed text-white/65"
                    )}
                  >
                    {slide.body}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* ドット */}
            <motion.div
              className="mt-6 flex items-center justify-center gap-1.5"
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: TUTORIAL_DOTS_DELAY_S }}
            >
              {TUTORIAL_SLIDES.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  aria-label={`ステップ ${i + 1}`}
                  onClick={() => setStep(i)}
                  className="h-1.5 rounded-full transition-all"
                  style={{
                    width: i === step ? 18 : 6,
                    background:
                      i === step ? TUTORIAL_CYAN : "rgba(255,255,255,0.22)",
                    boxShadow:
                      i === step ? `0 0 8px ${TUTORIAL_CYAN}88` : undefined,
                  }}
                />
              ))}
            </motion.div>

            {/* CTA */}
            <motion.div
              className="mt-4 flex gap-2"
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: TUTORIAL_CTA_DELAY_S,
                duration: TUTORIAL_SLIDE_DURATION_S,
                ease: EASE,
              }}
            >
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => setStep((s) => Math.max(0, s - 1))}
                  className={cn(
                    nameOxanium.className,
                    "border border-white/20 px-4 py-3 text-[12px] font-bold uppercase tracking-wider text-white/70 transition hover:border-white/35 hover:text-white"
                  )}
                  style={{
                    clipPath: CYBER_CHAMFER_CLIP,
                    WebkitClipPath: CYBER_CHAMFER_CLIP,
                  }}
                >
                  戻る
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => {
                  if (isLast) onClose();
                  else setStep((s) => s + 1);
                }}
                className={cn(
                  nameOxanium.className,
                  "flex-1 py-3 text-[13px] font-black uppercase tracking-[0.14em] transition hover:brightness-110"
                )}
                style={{
                  background: TUTORIAL_CYAN,
                  color: "#050508",
                  clipPath: CYBER_CHAMFER_CLIP,
                  WebkitClipPath: CYBER_CHAMFER_CLIP,
                  boxShadow: `0 0 16px ${TUTORIAL_CYAN}55`,
                }}
              >
                {isLast ? "はじめる" : "次へ"}
              </button>
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
