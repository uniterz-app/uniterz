"use client";

/**
 * パターンB: スポットライト式ツアー（コーチマーク）。
 * data-tutorial-target を持つ要素をくり抜きハイライトし、吹き出しで案内する。
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type CSSProperties,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
import { nameOxanium, nameRajdhani, jp } from "@/lib/fonts";
import {
  TUTORIAL_SLIDES,
  TUTORIAL_SPOTLIGHT_STEPS,
  type TutorialTargetId,
} from "@/lib/tutorial/tutorialCopy";
import {
  TUTORIAL_BG_FADE_S,
  TUTORIAL_CALLOUT_DURATION_S,
  TUTORIAL_CYAN,
  TUTORIAL_EXIT_S,
  TUTORIAL_SPOTLIGHT_DURATION_S,
} from "@/lib/tutorial/tutorialMotion";

const CYBER_CHAMFER_CLIP =
  "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)";

const EASE = [0.22, 1, 0.36, 1] as const;
const PAD = 8;

type Rect = { top: number; left: number; width: number; height: number };

type Props = {
  open: boolean;
  onClose: () => void;
  /** 対象要素を探すルート（プレビュー内モック）。未指定なら document */
  rootRef?: RefObject<HTMLElement | null>;
  resetKey?: number;
};

function readTargetRect(
  target: TutorialTargetId,
  root: ParentNode | null
): Rect | null {
  const scope = root ?? document;
  const el = scope.querySelector(
    `[data-tutorial-target="${target}"]`
  ) as HTMLElement | null;
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width < 1 || r.height < 1) return null;
  return {
    top: r.top - PAD,
    left: r.left - PAD,
    width: r.width + PAD * 2,
    height: r.height + PAD * 2,
  };
}

export default function TutorialSpotlightTour({
  open,
  onClose,
  rootRef,
  resetKey = 0,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState(0);
  const [hole, setHole] = useState<Rect | null>(null);
  const reduceMotion = useReducedMotion() === true;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (open) setStep(0);
  }, [open, resetKey]);

  const measure = useCallback(() => {
    const spot = TUTORIAL_SPOTLIGHT_STEPS[step];
    if (!spot) {
      setHole(null);
      return;
    }
    const root = rootRef?.current ?? null;
    setHole(readTargetRect(spot.target, root));
  }, [step, rootRef]);

  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const t = window.setTimeout(measure, 50);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.clearTimeout(t);
    };
  }, [open, measure, step]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight" || e.key === "Enter") {
        e.preventDefault();
        setStep((s) => {
          if (s >= TUTORIAL_SPOTLIGHT_STEPS.length - 1) {
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
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  const spot = TUTORIAL_SPOTLIGHT_STEPS[step];
  const slide = TUTORIAL_SLIDES[spot?.slideIndex ?? 0];
  const isLast = step >= TUTORIAL_SPOTLIGHT_STEPS.length - 1;
  const placement = spot?.placement ?? "bottom";

  const calloutStyle: CSSProperties = (() => {
    if (!hole) {
      return {
        position: "fixed",
        left: "50%",
        bottom: 96,
        transform: "translateX(-50%)",
        width: "min(340px, calc(100vw - 32px))",
      };
    }
    if (placement === "top") {
      return {
        position: "fixed",
        left: Math.max(16, Math.min(hole.left, window.innerWidth - 356)),
        bottom: window.innerHeight - hole.top + 12,
        width: "min(340px, calc(100vw - 32px))",
      };
    }
    return {
      position: "fixed",
      left: Math.max(16, Math.min(hole.left, window.innerWidth - 356)),
      top: hole.top + hole.height + 12,
      width: "min(340px, calc(100vw - 32px))",
    };
  })();

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="tutorial-spotlight"
          role="dialog"
          aria-modal="true"
          aria-labelledby="tutorial-spotlight-title"
          className="pointer-events-none fixed inset-0 z-[70]"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: TUTORIAL_EXIT_S } }}
          transition={{ duration: TUTORIAL_BG_FADE_S, ease: EASE }}
        >
          {/* 暗幕 + くり抜き（4枚の矩形で穴を作る） */}
          {hole ? (
            <>
              <motion.div
                className="pointer-events-auto absolute bg-black/72"
                animate={{
                  top: 0,
                  left: 0,
                  right: 0,
                  height: Math.max(0, hole.top),
                }}
                transition={{
                  duration: TUTORIAL_SPOTLIGHT_DURATION_S,
                  ease: EASE,
                }}
                onClick={onClose}
              />
              <motion.div
                className="pointer-events-auto absolute bg-black/72"
                animate={{
                  top: hole.top + hole.height,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                transition={{
                  duration: TUTORIAL_SPOTLIGHT_DURATION_S,
                  ease: EASE,
                }}
                onClick={onClose}
              />
              <motion.div
                className="pointer-events-auto absolute bg-black/72"
                animate={{
                  top: hole.top,
                  left: 0,
                  width: Math.max(0, hole.left),
                  height: hole.height,
                }}
                transition={{
                  duration: TUTORIAL_SPOTLIGHT_DURATION_S,
                  ease: EASE,
                }}
                onClick={onClose}
              />
              <motion.div
                className="pointer-events-auto absolute bg-black/72"
                animate={{
                  top: hole.top,
                  left: hole.left + hole.width,
                  right: 0,
                  height: hole.height,
                }}
                transition={{
                  duration: TUTORIAL_SPOTLIGHT_DURATION_S,
                  ease: EASE,
                }}
                onClick={onClose}
              />
              {/* 穴の枠線 */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute rounded-lg"
                animate={{
                  top: hole.top,
                  left: hole.left,
                  width: hole.width,
                  height: hole.height,
                }}
                transition={{
                  duration: TUTORIAL_SPOTLIGHT_DURATION_S,
                  ease: EASE,
                }}
                style={{
                  boxShadow: `0 0 0 2px ${TUTORIAL_CYAN}, 0 0 20px ${TUTORIAL_CYAN}66`,
                }}
              />
            </>
          ) : (
            <div
              className="pointer-events-auto absolute inset-0 bg-black/72"
              onClick={onClose}
            />
          )}

          {/* 吹き出し */}
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              className="pointer-events-auto"
              style={calloutStyle}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: -6 }}
              transition={{
                duration: TUTORIAL_CALLOUT_DURATION_S,
                ease: EASE,
              }}
            >
              <div
                className="border border-cyan-400/40 bg-[#071018]/95 p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.55)] backdrop-blur-md"
                style={{
                  clipPath: CYBER_CHAMFER_CLIP,
                  WebkitClipPath: CYBER_CHAMFER_CLIP,
                }}
              >
                <div className="mb-1 flex items-center justify-between gap-2">
                  <span
                    className={cn(
                      nameOxanium.className,
                      "text-[9px] font-bold uppercase tracking-[0.2em]"
                    )}
                    style={{ color: TUTORIAL_CYAN }}
                  >
                    {slide.kicker} · {step + 1}/{TUTORIAL_SPOTLIGHT_STEPS.length}
                  </span>
                  <button
                    type="button"
                    onClick={onClose}
                    className={cn(
                      nameOxanium.className,
                      "text-[10px] font-bold uppercase tracking-wider text-white/45 hover:text-white/80"
                    )}
                  >
                    スキップ
                  </button>
                </div>
                <h2
                  id="tutorial-spotlight-title"
                  className={cn(
                    jp.className,
                    "mb-1 text-[16px] font-bold text-white"
                  )}
                >
                  {slide.title}
                </h2>
                <p
                  className={cn(
                    nameRajdhani.className,
                    "mb-3 text-[13px] leading-relaxed text-white/65"
                  )}
                >
                  {slide.body}
                </p>
                <div className="flex gap-2">
                  {step > 0 ? (
                    <button
                      type="button"
                      onClick={() => setStep((s) => Math.max(0, s - 1))}
                      className={cn(
                        nameOxanium.className,
                        "border border-white/20 px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-white/70"
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
                      "flex-1 py-2 text-[12px] font-black uppercase tracking-[0.12em]"
                    )}
                    style={{
                      background: TUTORIAL_CYAN,
                      color: "#050508",
                      clipPath: CYBER_CHAMFER_CLIP,
                      WebkitClipPath: CYBER_CHAMFER_CLIP,
                      boxShadow: `0 0 12px ${TUTORIAL_CYAN}55`,
                    }}
                  >
                    {isLast ? "完了" : "次へ"}
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
