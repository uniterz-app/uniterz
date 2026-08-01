"use client";

/**
 * Web `SquadBattle` 初回イントロ相当。
 * アンバー〜レッドの戦闘警告系フルスクリーン。通常のシアングリッドとは別世界。
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, RefreshCw } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
import { nameOxanium, jp } from "@/lib/fonts";
import {
  SQUAD_BATTLE_INTRO_STORAGE_KEY,
  SQUAD_BATTLE_MAX_MEMBERS,
  SQUAD_BATTLE_SEASON_PHASES,
} from "@/lib/squads/squadBattleMock";
import {
  SQUAD_INTRO_BG_FADE_S,
  SQUAD_INTRO_ENTER_DELAY_S,
  SQUAD_INTRO_ENTER_DURATION_S,
  SQUAD_INTRO_KICKER_DELAY_S,
  SQUAD_INTRO_LOOP_DELAY_S,
  SQUAD_INTRO_PHASE_DURATION_S,
  SQUAD_INTRO_RULE_DELAY_S,
  SQUAD_INTRO_TITLE_DELAY_S,
  SQUAD_INTRO_TITLE_DURATION_S,
  squadIntroPhaseDelayS,
} from "@/lib/squads/squadBattleIntroMotion";

/** 左上・右下 5px カット */
const CYBER_CHAMFER_CLIP =
  "polygon(5px 0%, 100% 0%, 100% calc(100% - 5px), calc(100% - 5px) 100%, 0% 100%, 0% 5px)";

const chamferStyle = {
  clipPath: CYBER_CHAMFER_CLIP,
  WebkitClipPath: CYBER_CHAMFER_CLIP,
} as const;

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  open: boolean;
  onClose: () => void;
};

/**
 * 既読フラグを保存して閉じる。
 * SSR 安全: window なしでは何もしない。
 */
export function markSquadBattleIntroSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SQUAD_BATTLE_INTRO_STORAGE_KEY, "1");
  } catch {
    // private mode 等は無視
  }
}

/** 既読フラグを消す（プレビュー再生用） */
export function clearSquadBattleIntroSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SQUAD_BATTLE_INTRO_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** 初回未読かどうか（クライアントのみ） */
export function hasSeenSquadBattleIntro(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.localStorage.getItem(SQUAD_BATTLE_INTRO_STORAGE_KEY) === "1";
  } catch {
    return true;
  }
}

export default function SquadBattleIntroOverlay({ open, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion() === true;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        markSquadBattleIntroSeen();
        onClose();
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

  function handleDismiss() {
    markSquadBattleIntroSeen();
    onClose();
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="squad-battle-intro"
          role="dialog"
          aria-modal="true"
          aria-labelledby="squad-battle-intro-title"
          className="fixed inset-0 z-[70] flex flex-col overflow-hidden"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: reduceMotion ? 0 : SQUAD_INTRO_BG_FADE_S,
            ease: EASE,
          }}
        >
          {/* 背景 — ほぼ黒 + 赤ラジアル */}
          <div
            aria-hidden
            className="absolute inset-0"
            style={{ background: "#0a0402" }}
          />
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse 70% 55% at 50% 18%, rgba(180,40,20,0.38), transparent 62%), radial-gradient(ellipse 50% 40% at 80% 90%, rgba(251,191,36,0.12), transparent 55%)",
            }}
          />

          {/* スキップ */}
          <motion.button
            type="button"
            onClick={handleDismiss}
            className="absolute right-3 top-3 z-20 flex h-10 w-10 items-center justify-center border border-amber-400/35 bg-black/40 text-amber-100/90 transition hover:border-amber-300/55 hover:bg-amber-400/10"
            style={chamferStyle}
            aria-label="スキップ"
            initial={reduceMotion ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{
              delay: reduceMotion ? 0 : 0.2,
              duration: 0.2,
            }}
          >
            <X size={16} strokeWidth={2.4} />
          </motion.button>

          {/* 本体 */}
          <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-5 py-10">
            {/* キッカー */}
            <motion.p
              className={cn(
                nameOxanium.className,
                "mb-3 text-[10px] font-bold uppercase tracking-[0.32em] text-amber-200/70"
              )}
              style={{ textShadow: "0 0 10px rgba(251,191,36,0.35)" }}
              initial={reduceMotion ? false : { opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : SQUAD_INTRO_KICKER_DELAY_S,
                duration: 0.28,
                ease: EASE,
              }}
            >
              Season cycle · every 2 months
            </motion.p>

            {/* グリッチタイトル */}
            <motion.div
              className="relative mb-2"
              initial={reduceMotion ? false : { opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{
                delay: reduceMotion ? 0 : SQUAD_INTRO_TITLE_DELAY_S,
                duration: reduceMotion ? 0 : SQUAD_INTRO_TITLE_DURATION_S,
                ease: EASE,
              }}
            >
              {/* 色ずれレイヤ */}
              {!reduceMotion ? (
                <>
                  <span
                    aria-hidden
                    className={cn(
                      nameOxanium.className,
                      "pointer-events-none absolute inset-0 text-center text-[28px] font-black uppercase tracking-[0.08em] text-rose-500/50 sm:text-[34px]"
                    )}
                    style={{ transform: "translate(-2px, 1px)" }}
                  >
                    Squad Battle
                  </span>
                  <span
                    aria-hidden
                    className={cn(
                      nameOxanium.className,
                      "pointer-events-none absolute inset-0 text-center text-[28px] font-black uppercase tracking-[0.08em] text-amber-300/40 sm:text-[34px]"
                    )}
                    style={{ transform: "translate(2px, -1px)" }}
                  >
                    Squad Battle
                  </span>
                </>
              ) : null}
              <h2
                id="squad-battle-intro-title"
                className={cn(
                  nameOxanium.className,
                  "relative text-center text-[28px] font-black uppercase tracking-[0.08em] text-[#FFF7E6] sm:text-[34px]"
                )}
                style={{
                  textShadow:
                    "0 0 18px rgba(251,191,36,0.55), 0 0 40px rgba(180,40,20,0.35)",
                }}
              >
                Squad Battle
              </h2>
            </motion.div>

            {/* ルール1行 */}
            <motion.p
              className={cn(
                jp.className,
                "mb-6 max-w-sm text-center text-[13px] leading-relaxed text-white/60"
              )}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : SQUAD_INTRO_RULE_DELAY_S,
                duration: 0.28,
                ease: EASE,
              }}
            >
              {SQUAD_BATTLE_MAX_MEMBERS}
              人固定のスクワッドで平均得点を競う期間限定バトル。
            </motion.p>

            {/* フェーズタイムライン */}
            <div className="relative w-full max-w-sm">
              {/* 縦レール */}
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-3 left-[11px] top-3 w-px bg-gradient-to-b from-amber-400/50 via-amber-400/25 to-rose-500/40"
              />

              <ul className="flex flex-col gap-2.5">
                {SQUAD_BATTLE_SEASON_PHASES.map((phase, i) => (
                  <motion.li
                    key={phase.key}
                    className="relative flex items-stretch gap-3 pl-1"
                    initial={reduceMotion ? false : { opacity: 0, x: -14 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      delay: reduceMotion ? 0 : squadIntroPhaseDelayS(i),
                      duration: reduceMotion
                        ? 0
                        : SQUAD_INTRO_PHASE_DURATION_S,
                      ease: EASE,
                    }}
                  >
                    <span
                      aria-hidden
                      className="mt-3.5 h-2.5 w-2.5 shrink-0 rounded-full border border-amber-300/80 bg-amber-400/90 shadow-[0_0_10px_rgba(251,191,36,0.65)]"
                    />
                    <div
                      className="min-w-0 flex-1 border border-amber-400/28 bg-black/45 px-3 py-2.5"
                      style={{
                        ...chamferStyle,
                        boxShadow:
                          "inset 0 0 0 1px rgba(20,12,4,0.8), 0 0 16px rgba(251,191,36,0.06)",
                      }}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p
                          className={cn(
                            nameOxanium.className,
                            "text-[12px] font-black uppercase tracking-[0.18em] text-amber-100"
                          )}
                        >
                          {phase.label}
                        </p>
                        <p
                          className={cn(
                            nameOxanium.className,
                            "shrink-0 text-[10px] font-bold uppercase tracking-[0.12em] text-amber-200/55"
                          )}
                        >
                          {phase.period}
                        </p>
                      </div>
                      <p
                        className={cn(
                          jp.className,
                          "mt-1 text-[12px] leading-snug text-white/55"
                        )}
                      >
                        {phase.desc}
                      </p>
                    </div>
                  </motion.li>
                ))}
              </ul>

              {/* 循環ヒント */}
              <motion.div
                className="mt-3 flex items-center justify-center gap-2 text-amber-200/50"
                initial={reduceMotion ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                  delay: reduceMotion ? 0 : SQUAD_INTRO_LOOP_DELAY_S,
                  duration: 0.28,
                }}
              >
                <RefreshCw size={12} strokeWidth={2.4} aria-hidden />
                <p
                  className={cn(
                    nameOxanium.className,
                    "text-[9px] font-bold uppercase tracking-[0.22em]"
                  )}
                >
                  Loop · next entry opens
                </p>
              </motion.div>
            </div>

            {/* ENTER */}
            <motion.button
              type="button"
              onClick={handleDismiss}
              className={cn(
                nameOxanium.className,
                "mt-8 w-full max-w-sm border border-amber-400/55 bg-amber-400/20 px-4 py-3.5 text-sm font-black uppercase tracking-[0.28em] text-amber-50 transition hover:bg-amber-400/30 active:brightness-95"
              )}
              style={{
                ...chamferStyle,
                boxShadow:
                  "0 0 28px rgba(251,191,36,0.28), inset 0 0 0 1px rgba(251,191,36,0.15)",
                textShadow: "0 0 12px rgba(251,191,36,0.45)",
              }}
              initial={reduceMotion ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: reduceMotion ? 0 : SQUAD_INTRO_ENTER_DELAY_S,
                duration: reduceMotion ? 0 : SQUAD_INTRO_ENTER_DURATION_S,
                ease: EASE,
              }}
            >
              Enter
            </motion.button>
          </div>

          {/* 退出用の暗転は AnimatePresence 側の opacity で十分 */}
          <span className="sr-only" aria-live="polite">
            {open
              ? "スクワッドバトルの説明。エントリー約2週間、バトル1ヶ月、終了後解散。"
              : ""}
          </span>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
