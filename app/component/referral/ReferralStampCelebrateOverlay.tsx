"use client";

/**
 * 招待達成時の「スタンプ・ドン」オーバーレイ。
 * 台帳は出さず、スタンプ + 説明 + スタンプラリー導線のみ。
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
import { nameOxanium, jp } from "@/lib/fonts";
import UniterzClearStamp from "@/app/component/referral/UniterzClearStamp";
import {
  REFERRAL_STAMP_CELEBRATE_MOTION as M,
  referralStampCelebrateContent,
} from "@/lib/referral/referralStampCelebrate";

const CYBER_CHAMFER_CLIP =
  "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)";

type Props = {
  open: boolean;
  /** 達成したスロット番号 1…10（最新1枚） */
  slotIndex: number;
  isJa?: boolean;
  /** アニメーション再起動用（プレビューのリプレイ） */
  replayKey?: number;
  onClose: () => void;
  onViewStampRally: () => void;
};

export default function ReferralStampCelebrateOverlay({
  open,
  slotIndex,
  isJa = true,
  replayKey = 0,
  onClose,
  onViewStampRally,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion() === true;
  const content = referralStampCelebrateContent(slotIndex, isJa);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
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

  const stampRotate = -10 - (content.slotIndex % 3);

  function handleViewStampRally() {
    onClose();
    onViewStampRally();
  }

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key={`referral-stamp-celebrate-${replayKey}-${content.slotIndex}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="referral-stamp-celebrate-title"
          className="fixed inset-0 z-[80] flex items-center justify-center px-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : M.backdropFadeS }}
        >
          <button
            type="button"
            aria-label={content.dismissLabel}
            className="absolute inset-0 bg-black/72 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            aria-hidden
            style={{
              background:
                "radial-gradient(ellipse 70% 50% at 50% 42%, rgba(0,245,255,0.18), transparent 70%)",
            }}
          />

          <motion.div
            className="relative z-10 flex w-full max-w-[340px] flex-col items-center"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {/* スタンプ・ドン */}
            <motion.div
              className="relative flex h-[220px] w-[220px] items-center justify-center"
              initial={
                reduceMotion
                  ? { opacity: 1, scale: 1, y: 0, rotate: stampRotate }
                  : {
                      opacity: 0.2,
                      scale: 2.35,
                      y: -48,
                      rotate: stampRotate - 14,
                    }
              }
              animate={{
                opacity: 1,
                scale: 1,
                y: 0,
                rotate: stampRotate,
              }}
              transition={
                reduceMotion
                  ? { duration: 0.01 }
                  : {
                      duration: M.stampSlamS,
                      ease: M.stampSlamEase as unknown as number[],
                    }
              }
            >
              {/* 着地フラッシュ */}
              {!reduceMotion ? (
                <motion.div
                  aria-hidden
                  className="pointer-events-none absolute inset-[-12%] rounded-full"
                  style={{
                    background:
                      content.tone === "lime"
                        ? "radial-gradient(circle, rgba(184,255,60,0.45), transparent 65%)"
                        : content.tone === "amber"
                          ? "radial-gradient(circle, rgba(251,191,36,0.45), transparent 65%)"
                          : content.tone === "ink"
                            ? "radial-gradient(circle, rgba(255,45,85,0.4), transparent 65%)"
                            : "radial-gradient(circle, rgba(0,245,255,0.45), transparent 65%)",
                  }}
                  initial={{ opacity: 0, scale: 0.6 }}
                  animate={{ opacity: [0, 0.9, 0], scale: [0.6, 1.15, 1.35] }}
                  transition={{
                    duration: 0.55,
                    delay: M.stampSlamS * 0.72,
                    times: [0, 0.35, 1],
                  }}
                />
              ) : null}

              <UniterzClearStamp
                size={200}
                tone={content.tone}
                rotateDeg={0}
              />
            </motion.div>

            {/* 説明 */}
            <motion.div
              className="mt-1 w-full text-center"
              initial={
                reduceMotion ? false : { opacity: 0, y: 14 }
              }
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0.01 }
                  : {
                      delay: M.copyDelayS,
                      duration: M.copyFadeS,
                      ease: [0.22, 1, 0.36, 1],
                    }
              }
            >
              <p
                className={cn(
                  nameOxanium.className,
                  "text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-200/70"
                )}
              >
                INVITE CLEAR
              </p>
              <h2
                id="referral-stamp-celebrate-title"
                className={cn(
                  jp.className,
                  "mt-2 text-[20px] font-extrabold tracking-wide text-white"
                )}
              >
                {content.title}
              </h2>
              <p
                className={cn(
                  jp.className,
                  "mt-2 text-[14px] font-semibold text-white/85"
                )}
              >
                {content.description}
              </p>
              <p
                className={cn(
                  nameOxanium.className,
                  "mt-1.5 text-[15px] font-extrabold tabular-nums tracking-wide text-cyan-100"
                )}
              >
                {content.unitsLine}
              </p>
            </motion.div>

            {/* CTA */}
            <motion.div
              className="pointer-events-auto mt-7 flex w-full flex-col gap-2.5"
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={
                reduceMotion
                  ? { duration: 0.01 }
                  : {
                      delay: M.ctaDelayS,
                      duration: M.ctaFadeS,
                      ease: [0.22, 1, 0.36, 1],
                    }
              }
            >
              <button
                type="button"
                onClick={handleViewStampRally}
                className={cn(
                  nameOxanium.className,
                  "w-full border border-cyan-300/50 bg-cyan-400/15 px-4 py-3 text-[12px] font-extrabold uppercase tracking-[0.14em] text-cyan-50 transition hover:bg-cyan-400/25"
                )}
                style={{
                  clipPath: CYBER_CHAMFER_CLIP,
                  WebkitClipPath: CYBER_CHAMFER_CLIP,
                }}
              >
                {content.ctaLabel}
              </button>
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  nameOxanium.className,
                  "w-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.14em] text-white/45 transition hover:text-white/70"
                )}
              >
                {content.dismissLabel}
              </button>
            </motion.div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
