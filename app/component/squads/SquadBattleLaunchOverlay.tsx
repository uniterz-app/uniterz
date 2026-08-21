"use client";

/**
 * スクワッドバトル開催告知のたたき台。
 * 初回イントロ（ルール説明）とは別。募集開始を一度知らせる。
 */

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import cn from "clsx";
import { nameOxanium, jp } from "@/lib/fonts";
import {
  SQUAD_BATTLE_LAUNCH_CTA,
  SQUAD_BATTLE_LAUNCH_FACTS,
  SQUAD_BATTLE_LAUNCH_KICKER,
  SQUAD_BATTLE_LAUNCH_LEAD,
  SQUAD_BATTLE_LAUNCH_LATER,
  SQUAD_BATTLE_LAUNCH_STORAGE_KEY,
  SQUAD_BATTLE_LAUNCH_TITLE,
  SQUAD_BATTLE_MOCK_DEADLINE_LABEL,
  SQUAD_INVITE_DEADLINE_PREFIX,
} from "@/lib/squads/squadBattleUiCopy";
import { SQUAD_GOLD, SQUAD_GOLD_CHAMFER } from "@/lib/squads/squadBattleGoldTheme";

const chamferStyle = {
  clipPath: SQUAD_GOLD_CHAMFER,
  WebkitClipPath: SQUAD_GOLD_CHAMFER,
} as const;

const EASE = [0.22, 1, 0.36, 1] as const;

type Props = {
  open: boolean;
  onClose: () => void;
  onEnter: () => void;
  deadlineLabel?: string | null;
  battleId?: string | null;
};

export function markSquadBattleLaunchSeen(battleId?: string | null): void {
  if (typeof window === "undefined") return;
  try {
    const id = String(battleId ?? "").trim();
    window.localStorage.setItem(
      SQUAD_BATTLE_LAUNCH_STORAGE_KEY,
      id || "1"
    );
  } catch {
    // ignore
  }
}

export function clearSquadBattleLaunchSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(SQUAD_BATTLE_LAUNCH_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** 見た大会 ID。未設定・旧 `"1"` は null */
export function readSquadBattleLaunchSeenBattleId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    const v = window.localStorage.getItem(SQUAD_BATTLE_LAUNCH_STORAGE_KEY);
    if (!v || v === "1") return null;
    return v;
  } catch {
    return null;
  }
}

/** @deprecated battleId 指定の shouldShow を使う */
export function hasSeenSquadBattleLaunch(): boolean {
  if (typeof window === "undefined") return true;
  try {
    const v = window.localStorage.getItem(SQUAD_BATTLE_LAUNCH_STORAGE_KEY);
    return Boolean(v && v !== "1");
  } catch {
    return true;
  }
}

export default function SquadBattleLaunchOverlay({
  open,
  onClose,
  onEnter,
  deadlineLabel,
  battleId,
}: Props) {
  const [mounted, setMounted] = useState(false);
  const reduceMotion = useReducedMotion() === true;
  const deadline = deadlineLabel?.trim() || SQUAD_BATTLE_MOCK_DEADLINE_LABEL;

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        markSquadBattleLaunchSeen(battleId);
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
  }, [open, onClose, battleId]);

  function dismiss() {
    markSquadBattleLaunchSeen(battleId);
    onClose();
  }

  function enter() {
    markSquadBattleLaunchSeen(battleId);
    onEnter();
  }

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open ? (
        <motion.div
          key="squad-battle-launch"
          role="dialog"
          aria-modal="true"
          aria-labelledby="squad-battle-launch-title"
          className="fixed inset-0 z-[1000035] flex items-center justify-center p-5"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.22, ease: EASE }}
        >
          <button
            type="button"
            aria-label="閉じる"
            className="absolute inset-0 bg-[#050308]/82"
            onClick={dismiss}
          />
          <motion.div
            className="relative z-[1] w-full max-w-sm overflow-hidden border border-amber-300/45 px-5 py-6"
            style={{
              ...chamferStyle,
              background:
                "linear-gradient(168deg, rgba(42,30,10,0.96) 0%, rgba(10,8,5,0.98) 58%)",
              boxShadow: `0 0 48px rgba(${SQUAD_GOLD.glowRgb},0.22), inset 0 1px 0 rgba(255,236,179,0.16)`,
            }}
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reduceMotion ? undefined : { opacity: 0, y: 10 }}
            transition={{ duration: reduceMotion ? 0 : 0.28, ease: EASE }}
          >
            <div className="mb-5 flex items-center gap-2">
              <span
                aria-hidden
                className="h-1.5 w-1.5 rounded-full bg-amber-300 shadow-[0_0_8px_#FBBF24]"
              />
              <p
                className={cn(
                  nameOxanium.className,
                  "text-[10px] font-black uppercase tracking-[0.28em] text-amber-200/80"
                )}
              >
                {SQUAD_BATTLE_LAUNCH_KICKER}
              </p>
            </div>

            <h2
              id="squad-battle-launch-title"
              className={cn(
                nameOxanium.className,
                "text-[26px] font-black uppercase leading-none tracking-[0.08em] text-[#FFF7E6]"
              )}
              style={{
                textShadow: `0 0 18px rgba(${SQUAD_GOLD.glowRgb},0.5)`,
              }}
            >
              {SQUAD_BATTLE_LAUNCH_TITLE}
            </h2>
            <p
              className={cn(
                jp.className,
                "mt-3 text-[13px] leading-relaxed text-white/62"
              )}
            >
              {SQUAD_BATTLE_LAUNCH_LEAD}
            </p>

            <p
              className={cn(
                nameOxanium.className,
                "mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-amber-100/70"
              )}
            >
              {SQUAD_INVITE_DEADLINE_PREFIX} {deadline}
            </p>

            <dl className="mt-4 flex flex-col border-t border-amber-400/20 pt-3">
              {SQUAD_BATTLE_LAUNCH_FACTS.map((fact) => (
                <div
                  key={fact.kicker}
                  className="flex items-baseline justify-between gap-3 py-1.5"
                >
                  <dt
                    className={cn(
                      nameOxanium.className,
                      "shrink-0 text-[10px] font-bold uppercase tracking-[0.16em] text-amber-200/50"
                    )}
                  >
                    {fact.kicker}
                  </dt>
                  <dd
                    className={cn(
                      jp.className,
                      "text-right text-[12px] leading-snug text-white/70"
                    )}
                  >
                    {fact.value}
                  </dd>
                </div>
              ))}
            </dl>

            <button
              type="button"
              onClick={enter}
              className={cn(
                nameOxanium.className,
                "mt-6 flex w-full items-center justify-center py-3.5 text-sm font-black uppercase tracking-[0.22em] text-[#1A1002]"
              )}
              style={{
                ...chamferStyle,
                background: `linear-gradient(180deg, ${SQUAD_GOLD.acc}, ${SQUAD_GOLD.accDeep})`,
              }}
            >
              {SQUAD_BATTLE_LAUNCH_CTA}
            </button>
            <button
              type="button"
              onClick={dismiss}
              className={cn(
                nameOxanium.className,
                "mt-2.5 w-full py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/45"
              )}
            >
              {SQUAD_BATTLE_LAUNCH_LATER}
            </button>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body
  );
}
