"use client";

/**
 * 試合カードへのタップ誘導 — パルス枠 + リップル（カードの面取りに合わせる）。
 * 対象: data-tutorial-target="match-card"
 */

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useState,
  type RefObject,
} from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
import { nameOxanium } from "@/lib/fonts";
import { TUTORIAL_PULSE_HINT_LABEL } from "@/lib/tutorial/tutorialCopy";
import {
  TUTORIAL_CYAN,
  TUTORIAL_EXIT_S,
  TUTORIAL_PULSE_PERIOD_S,
} from "@/lib/tutorial/tutorialMotion";

/** `.match-list-cyber-card` と同じ 10px 面取り */
const CARD_CHAMFER_CLIP =
  "polygon(10px 0%, calc(100% - 10px) 0%, 100% 10px, 100% calc(100% - 10px), calc(100% - 10px) 100%, 10px 100%, 0% calc(100% - 10px), 0% 10px)";

type Rect = { top: number; left: number; width: number; height: number };

type Props = {
  active: boolean;
  /** 対象を探すルート */
  rootRef?: RefObject<HTMLElement | null>;
  /** バッジ文言（未指定時は日本語フォールバック） */
  label?: string;
  /** true のときオーバーレイがクリックを取る（プレビュー用）。本番は false で下のカードに通す */
  captureClicks?: boolean;
  onDismiss?: () => void;
  /** カードタップ相当（プレビュー用） */
  onTargetClick?: () => void;
};

export default function TutorialPulseHint({
  active,
  rootRef,
  label,
  captureClicks = false,
  onDismiss,
  onTargetClick,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const [rect, setRect] = useState<Rect | null>(null);
  const reduceMotion = useReducedMotion() === true;

  useEffect(() => {
    setMounted(true);
  }, []);

  const measure = useCallback(() => {
    const scope = rootRef?.current ?? document;
    const el = scope.querySelector(
      '[data-tutorial-target="match-card"]'
    ) as HTMLElement | null;
    if (!el) {
      setRect(null);
      return;
    }
    const r = el.getBoundingClientRect();
    setRect({
      top: r.top,
      left: r.left,
      width: r.width,
      height: r.height,
    });
  }, [rootRef]);

  useLayoutEffect(() => {
    if (!active) return;
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    const t1 = window.setTimeout(measure, 40);
    const t2 = window.setTimeout(measure, 200);
    const t3 = window.setTimeout(measure, 500);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [active, measure]);

  if (!mounted) return null;

  const badge = label ?? TUTORIAL_PULSE_HINT_LABEL;

  return createPortal(
    <AnimatePresence>
      {active && rect ? (
        <motion.div
          key="tutorial-pulse"
          className="pointer-events-none fixed z-[1000002]"
          style={{
            top: rect.top - 2,
            left: rect.left - 2,
            width: rect.width + 4,
            height: rect.height + 4,
          }}
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: TUTORIAL_EXIT_S } }}
        >
          {/* 外枠パルス（カードと同型の面取り） */}
          <motion.div
            aria-hidden
            className="absolute inset-0"
            style={{
              clipPath: CARD_CHAMFER_CLIP,
              WebkitClipPath: CARD_CHAMFER_CLIP,
              boxShadow: `0 0 0 2px ${TUTORIAL_CYAN}`,
            }}
            animate={
              reduceMotion
                ? undefined
                : {
                    boxShadow: [
                      `0 0 0 2px ${TUTORIAL_CYAN}, 0 0 12px ${TUTORIAL_CYAN}66`,
                      `0 0 0 3px ${TUTORIAL_CYAN}, 0 0 26px ${TUTORIAL_CYAN}99`,
                      `0 0 0 2px ${TUTORIAL_CYAN}, 0 0 12px ${TUTORIAL_CYAN}66`,
                    ],
                  }
            }
            transition={{
              duration: TUTORIAL_PULSE_PERIOD_S,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          {/* 広がるリップル */}
          {!reduceMotion
            ? [0, 0.55].map((delay) => (
                <motion.div
                  key={`ripple-${delay}`}
                  aria-hidden
                  className="absolute inset-[3px]"
                  style={{
                    clipPath: CARD_CHAMFER_CLIP,
                    WebkitClipPath: CARD_CHAMFER_CLIP,
                    boxShadow: `inset 0 0 0 2px ${TUTORIAL_CYAN}`,
                  }}
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 0 }}
                  transition={{
                    duration: TUTORIAL_PULSE_PERIOD_S,
                    repeat: Infinity,
                    ease: "easeOut",
                    delay,
                  }}
                />
              ))
            : null}

          {captureClicks ? (
            <button
              type="button"
              className="pointer-events-auto absolute inset-0 cursor-pointer bg-transparent"
              aria-label={badge}
              onClick={() => {
                onTargetClick?.();
                onDismiss?.();
              }}
            />
          ) : null}

          {/*
            カード内に置く（-top はコーチ暗幕の穴外で見切れる）。
            浮遊は下方向のみにして上端クリップを避ける。
          */}
          <motion.span
            className={cn(
              nameOxanium.className,
              "pointer-events-none absolute top-2 right-2 z-20 rounded px-2.5 py-1 text-[10px] font-black uppercase tracking-wider"
            )}
            style={{
              background: TUTORIAL_CYAN,
              color: "#050508",
              boxShadow: `0 0 14px ${TUTORIAL_CYAN}99`,
            }}
            animate={reduceMotion ? undefined : { y: [0, 3, 0] }}
            transition={{
              duration: TUTORIAL_PULSE_PERIOD_S,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            {badge}
          </motion.span>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
