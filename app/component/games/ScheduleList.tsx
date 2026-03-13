"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import { X } from "lucide-react";

import MatchCard, { type MatchCardProps } from "./MatchCard";
import { toMatchCardProps } from "@/lib/games/transform";
import PredictionFormV2 from "../predict/PredictionFormV2";

export type GameItemRaw = any;

export default function ScheduleList({
  games,
  dense = false,
}: {
  games: GameItemRaw[];
  dense?: boolean;
}) {
  const [openGameId, setOpenGameId] = useState<string | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const propsList = useMemo<MatchCardProps[]>(() => {
    return (games ?? []).map(
      (g: any) => toMatchCardProps(g, { dense }) as MatchCardProps
    );
  }, [games, dense]);

  const selectedProps = useMemo<MatchCardProps | null>(() => {
    if (!openGameId) return null;
    return propsList.find((p) => String(p.id) === String(openGameId)) ?? null;
  }, [propsList, openGameId]);

  const open = useCallback((gameId: string) => {
    setOpenGameId(String(gameId));
  }, []);

  const close = useCallback(() => {
    setOpenGameId(null);
  }, []);

  useEffect(() => {
    if (!openGameId) return;

    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [openGameId]);

  useEffect(() => {
    if (!openGameId) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openGameId, close]);

  if (!propsList.length) {
    return (
      <div className="rounded-xl border border-dashed border-white/10 py-10 text-center text-white/70">
        この日に試合はありません
      </div>
    );
  }

  return (
    <LayoutGroup id="schedule-list">
      <motion.div
        className={[
          "grid gap-6 px-4 md:px-6 lg:px-8",
          openGameId ? "pointer-events-none" : "",
        ].join(" ")}
        animate={{
          scale: openGameId ? 0.988 : 1,
          opacity: openGameId ? 0.94 : 1,
          filter: openGameId ? "blur(0.8px)" : "blur(0px)",
        }}
        transition={{
          duration: 0.28,
          ease: [0.22, 1, 0.36, 1],
        }}
      >
        {propsList.map((props) => {
          const isOpen = String(openGameId) === String(props.id);

          return (
            <div
              key={props.id}
              className={isOpen ? "pointer-events-none opacity-0" : ""}
              aria-hidden={isOpen}
            >
              <MatchCard
                {...props}
                sharedLayoutId={`matchcard-${props.id}`}
                onOpenPredict={open}
                showMarketBias={false}
                disableCardMotion={!!openGameId}
              />
            </div>
          );
        })}
      </motion.div>

      <AnimatePresence mode="wait">
        {openGameId && selectedProps && (
          <motion.div
            key="prediction-page"
            className="fixed inset-0 z-[99999] overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 0.2,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <motion.div
              className="absolute inset-0 z-0 bg-black/22 backdrop-blur-[10px] pointer-events-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22 }}
              onClick={close}
            />

            <div
              className="relative z-10 h-[100dvh] overflow-y-auto overflow-x-hidden pointer-events-auto"
              style={{
                WebkitOverflowScrolling: "touch",
                overscrollBehaviorY: "contain",
                overscrollBehaviorX: "none",
                touchAction: "pan-y",
              }}
              onTouchStartCapture={(e) => {
                const t = e.touches[0];
                if (!t) return;
                touchStartRef.current = { x: t.clientX, y: t.clientY };
              }}
              onTouchMoveCapture={(e) => {
                const start = touchStartRef.current;
                const t = e.touches[0];
                if (!start || !t) return;

                const dx = Math.abs(t.clientX - start.x);
                const dy = Math.abs(t.clientY - start.y);

                if (dx > dy && dx > 8) {
                  e.preventDefault();
                  e.stopPropagation();
                }
              }}
              onTouchEndCapture={() => {
                touchStartRef.current = null;
              }}
              onTouchCancelCapture={() => {
                touchStartRef.current = null;
              }}
            >
              <div
                className="mx-auto w-full max-w-2xl overflow-x-hidden px-3 pt-4 pb-32 sm:px-4 sm:pt-6 sm:pb-36 md:px-6"
                onClick={(e) => e.stopPropagation()}
              >
                <motion.div
                  className="relative w-full overflow-x-hidden"
                  initial={{
                    opacity: 0,
                    y: 18,
                    scale: 0.972,
                    filter: "blur(10px)",
                  }}
                  animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    filter: "blur(0px)",
                  }}
                  exit={{
                    opacity: 0,
                    y: 8,
                    scale: 0.985,
                    filter: "blur(6px)",
                  }}
                  transition={{
                    duration: 0.42,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <button
                    type="button"
                    aria-label="閉じる"
                    className="absolute right-3 top-3 z-30 flex h-10 w-10 items-center justify-center rounded-full border border-white/15 bg-black/40 text-white/90 backdrop-blur-md transition hover:bg-black/55"
                    onClick={(e) => {
                      e.stopPropagation();
                      close();
                    }}
                  >
                    <X size={18} strokeWidth={2.4} />
                  </button>

                  <MatchCard
                    {...selectedProps}
                    sharedLayoutId={`matchcard-${selectedProps.id}`}
                    disableCardMotion
                    hideActions
                    showMarketBias
                    inPredictOverlay
                  />

                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{
                      duration: 0.3,
                      delay: 0.05,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="mt-2 overflow-x-hidden px-0 py-0"
                  >
                    <PredictionFormV2
                      dense={dense}
                      game={selectedProps}
                      user={{ name: "You" }}
                      embedded
                      inOverlay
                      onPostCreated={close}
                    />
                  </motion.div>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </LayoutGroup>
  );
}