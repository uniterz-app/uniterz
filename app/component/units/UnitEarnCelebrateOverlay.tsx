"use client";

/**
 * Unit 獲得 Phase A — サイバーパネル + Vault コイン + 付与量
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
import { nameOxanium, jp } from "@/lib/fonts";
import { UnitEarnVaultCoin } from "@/app/component/units/UnitEarnCelebrateVisual";
import {
  UNIT_EARN_CELEBRATE_MOTION as M,
  type UnitEarnCelebratePresetId,
  unitEarnCelebrateContent,
} from "@/lib/units/unitEarnCelebrate";

const CYBER_CHAMFER_CLIP =
  "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)";

type Props = {
  open: boolean;
  presetId: UnitEarnCelebratePresetId;
  isJa?: boolean;
  replayKey?: number;
  onClose: () => void;
  onClaim: () => void;
  onViewHistory: () => void;
};

export default function UnitEarnCelebrateOverlay({
  open,
  presetId,
  isJa = true,
  replayKey = 0,
  onClose,
  onClaim,
  onViewHistory,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion() === true;
  const content = unitEarnCelebrateContent(presetId, isJa);

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

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key={`unit-earn-celebrate-${replayKey}-${presetId}`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="unit-earn-celebrate-title"
          className="fixed inset-0 z-[80] flex items-center justify-center px-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0.01 : M.backdropFadeS }}
        >
          <button
            type="button"
            aria-label={content.dismissLabel}
            className="absolute inset-0 bg-[rgba(2,6,12,0.82)] backdrop-blur-md"
            onClick={onClose}
          />

          <motion.div
            className="relative z-10 w-full max-w-[360px] overflow-hidden border border-cyan-300/20 bg-[rgba(4,10,16,0.96)] shadow-[0_24px_80px_rgba(0,0,0,0.65)]"
            style={{
              clipPath: CYBER_CHAMFER_CLIP,
              WebkitClipPath: CYBER_CHAMFER_CLIP,
            }}
            initial={
              reduceMotion
                ? false
                : { opacity: 0, y: 18, scale: 0.96, filter: "blur(6px)" }
            }
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={
              reduceMotion
                ? { duration: 0.01 }
                : {
                    duration: M.panelEnterS,
                    ease: M.panelEnterEase as [number, number, number, number],
                  }
            }
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-200/55 to-transparent"
            />
            <div
              aria-hidden
              className="cyber-side-menu-scanlines pointer-events-none absolute inset-0 opacity-[0.28]"
            />
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[0.12]"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(0,245,255,0.35), transparent 70%)",
              }}
            />

            <div className="relative px-5 pb-5 pt-6">
              <p
                className={cn(
                  nameOxanium.className,
                  "text-center text-[9px] font-bold uppercase tracking-[0.2em] text-cyan-200/55",
                )}
              >
                {content.kicker}
              </p>

              <div className="relative mt-5 flex flex-col items-center">
                {!reduceMotion ? (
                  <motion.div
                    aria-hidden
                    className="pointer-events-none absolute inset-x-4 top-1/2 h-px bg-gradient-to-r from-transparent via-amber-100/50 to-transparent"
                    initial={{ scaleX: 0, opacity: 0 }}
                    animate={{ scaleX: 1, opacity: [0, 0.9, 0] }}
                    transition={{
                      delay: M.amountSlamS * 0.85,
                      duration: M.impactScanS,
                      ease: "easeOut",
                    }}
                  />
                ) : null}

                <motion.div
                  className="flex items-center gap-4"
                  initial={
                    reduceMotion
                      ? false
                      : {
                          opacity: 0,
                          scale: 1.28,
                          y: -12,
                          filter: "blur(8px)",
                        }
                  }
                  animate={{
                    opacity: 1,
                    scale: 1,
                    y: 0,
                    filter: "blur(0px)",
                  }}
                  transition={
                    reduceMotion
                      ? { duration: 0.01 }
                      : {
                          delay: 0.08,
                          duration: M.amountSlamS,
                          ease: M.amountSlamEase as [number, number, number, number],
                        }
                  }
                >
                  <UnitEarnVaultCoin size={64} />
                  <div className="text-left">
                    <p
                      className={cn(
                        nameOxanium.className,
                        "text-[44px] font-extrabold leading-none tabular-nums tracking-tight text-[#ffe9a8]",
                      )}
                      style={{
                        textShadow: "0 0 20px rgba(246,195,68,0.35)",
                      }}
                    >
                      {content.amountHero}
                    </p>
                    <p
                      className={cn(
                        nameOxanium.className,
                        "mt-1 text-[11px] font-bold uppercase tracking-[0.32em] text-amber-200/45",
                      )}
                    >
                      UNIT
                    </p>
                  </div>
                </motion.div>
              </div>

              <motion.div
                className="mt-6 border-t border-white/[0.06] pt-5 text-center"
                initial={reduceMotion ? false : { opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0.01 }
                    : {
                        delay: M.copyDelayS,
                        duration: M.copyFadeS,
                        ease: M.panelEnterEase as [number, number, number, number],
                      }
                }
              >
                <h2
                  id="unit-earn-celebrate-title"
                  className={cn(
                    jp.className,
                    "text-[18px] font-extrabold leading-snug text-white",
                  )}
                >
                  {content.title}
                </h2>
                {content.subtitle ? (
                  <p
                    className={cn(
                      jp.className,
                      "mt-2 text-[12px] font-medium text-white/45",
                    )}
                  >
                    {content.subtitle}
                  </p>
                ) : null}
              </motion.div>

              <motion.div
                className="pointer-events-auto mt-6 flex flex-col gap-2"
                initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={
                  reduceMotion
                    ? { duration: 0.01 }
                    : {
                        delay: M.ctaDelayS,
                        duration: M.ctaFadeS,
                        ease: M.panelEnterEase as [number, number, number, number],
                      }
                }
              >
                <button
                  type="button"
                  onClick={onClaim}
                  className={cn(
                    nameOxanium.className,
                    "w-full border border-amber-200/40 bg-gradient-to-b from-amber-300/25 to-amber-500/10 px-4 py-3.5 text-[11px] font-extrabold uppercase tracking-[0.16em] text-[#fff7e6] transition hover:from-amber-300/35",
                  )}
                  style={{
                    clipPath: CYBER_CHAMFER_CLIP,
                    WebkitClipPath: CYBER_CHAMFER_CLIP,
                  }}
                >
                  {content.claimLabel}
                </button>
                <button
                  type="button"
                  onClick={onViewHistory}
                  className={cn(
                    nameOxanium.className,
                    "w-full border border-cyan-300/25 bg-transparent px-4 py-2.5 text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-100/75 transition hover:border-cyan-300/45 hover:text-cyan-50",
                  )}
                >
                  {content.historyLabel}
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={cn(
                    nameOxanium.className,
                    "py-2 text-[10px] font-bold uppercase tracking-[0.14em] text-white/35 transition hover:text-white/55",
                  )}
                >
                  {content.dismissLabel}
                </button>
              </motion.div>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
