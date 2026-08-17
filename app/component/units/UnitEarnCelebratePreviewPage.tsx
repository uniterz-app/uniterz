"use client";

/**
 * /dev/unit-earn-celebrate-preview
 */
import { useCallback, useRef, useState } from "react";
import { RefreshCw } from "lucide-react";
import cn from "clsx";
import { motion } from "framer-motion";
import { nameOxanium, jp } from "@/lib/fonts";
import { useCountUp } from "@/lib/hooks/useCountUp";
import UnitEarnCelebrateOverlay from "@/app/component/units/UnitEarnCelebrateOverlay";
import UnitEarnVaultSettleFly, {
  type UnitEarnFlyPayload,
} from "@/app/component/units/UnitEarnVaultSettleFly";
import {
  UNIT_EARN_CELEBRATE_MOTION,
  UNIT_EARN_CELEBRATE_PREVIEW_PRESETS,
  type UnitEarnCelebratePresetId,
  unitEarnCelebrateContent,
} from "@/lib/units/unitEarnCelebrate";

const PREVIEW_BALANCE_START = 1240;

export default function UnitEarnCelebratePreviewPage() {
  const [presetId, setPresetId] =
    useState<UnitEarnCelebratePresetId>("monthly-rank-1");
  const [isJa, setIsJa] = useState(true);
  const [open, setOpen] = useState(true);
  const [replayKey, setReplayKey] = useState(0);
  const [balanceTarget, setBalanceTarget] = useState(PREVIEW_BALANCE_START);
  const [countRun, setCountRun] = useState(true);
  const [vaultPulse, setVaultPulse] = useState(false);
  const [fly, setFly] = useState<UnitEarnFlyPayload | null>(null);

  const vaultRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const content = unitEarnCelebrateContent(presetId, isJa);
  const displayBalance = useCountUp(
    balanceTarget,
    UNIT_EARN_CELEBRATE_MOTION.balanceCountMs,
    countRun,
    0,
    "target"
  );

  const replay = useCallback(() => {
    setFly(null);
    setVaultPulse(false);
    setBalanceTarget(PREVIEW_BALANCE_START);
    setCountRun(true);
    setOpen(true);
    setReplayKey((k) => k + 1);
  }, []);

  const applyBalance = useCallback(
    (amount: number) => {
      setBalanceTarget((b) => b + amount);
      setCountRun(true);
      setVaultPulse(true);
      window.setTimeout(
        () => setVaultPulse(false),
        UNIT_EARN_CELEBRATE_MOTION.vaultPulseS * 1000
      );
    },
    []
  );

  const startFlyThenCredit = useCallback(() => {
    const amount = content.amount;
    const card = cardRef.current;
    const vault = vaultRef.current;
    if (!card || !vault) {
      applyBalance(amount);
      return;
    }
    const cardRect = card.getBoundingClientRect();
    const vaultRect = vault.getBoundingClientRect();
    setFly({
      amount,
      label: content.amountHero,
      fromX: cardRect.left + cardRect.width / 2,
      fromY: cardRect.top + cardRect.height * 0.38,
      toX: vaultRect.left + vaultRect.width / 2,
      toY: vaultRect.top + vaultRect.height / 2,
    });
  }, [applyBalance, content.amount, content.amountHero]);

  const onFlyComplete = useCallback(() => {
    setFly(null);
    applyBalance(content.amount);
  }, [applyBalance, content.amount]);

  return (
    <div className="min-h-dvh bg-[#05080c] text-white">
      <div ref={cardRef} className="mx-auto max-w-md px-4 pb-48 pt-8">
        <p
          className={cn(
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.16em] text-white/35",
          )}
        >
          Profile mock
        </p>
        <div className="relative mt-4 border border-white/10 bg-gradient-to-br from-white/[0.07] to-transparent p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="h-14 w-14 rounded-full border border-white/15 bg-white/10" />
            <motion.div
              ref={vaultRef}
              className={cn(
                "profile-edit-kinetik-unit-vault profile-edit-kinetik-unit-vault--corner",
              )}
              animate={
                vaultPulse
                  ? { scale: [1, 1.08, 1], filter: ["brightness(1)", "brightness(1.25)", "brightness(1)"] }
                  : { scale: 1 }
              }
              transition={{ duration: UNIT_EARN_CELEBRATE_MOTION.vaultPulseS }}
            >
              <span className="profile-edit-kinetik-unit-vault__disc" aria-hidden>
                <span className="profile-edit-kinetik-unit-vault__sheen" />
                <span className="profile-edit-kinetik-unit-vault__disc-inner">
                  U
                </span>
              </span>
              <span
                className={cn(
                  nameOxanium.className,
                  "profile-edit-kinetik-unit-vault__value",
                )}
              >
                {displayBalance.toLocaleString("en-US")}
              </span>
            </motion.div>
          </div>
          <div className="mt-4 h-3 w-2/3 bg-white/10" />
          <div className="mt-2 h-3 w-1/2 bg-white/5" />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-amber-300/20 bg-[#070b10]/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <div className="flex items-center justify-between">
            <p
              className={cn(
                nameOxanium.className,
                "text-[10px] font-bold uppercase tracking-[0.14em] text-amber-200/70",
              )}
            >
              Unit earn preview
            </p>
            <button
              type="button"
              onClick={() => setIsJa((v) => !v)}
              className={cn(
                nameOxanium.className,
                "border border-white/15 px-2 py-1 text-[10px] font-bold uppercase text-white/60",
              )}
            >
              {isJa ? "JA" : "EN"}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {UNIT_EARN_CELEBRATE_PREVIEW_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setPresetId(p.id);
                  replay();
                }}
                className={cn(
                  nameOxanium.className,
                  "px-2 py-1.5 text-[9px] font-bold uppercase tracking-wide transition",
                  presetId === p.id
                    ? "border border-amber-300/50 bg-amber-400/15 text-amber-100"
                    : "border border-white/10 text-white/45",
                )}
              >
                {p.id.replace(/-/g, " ")}
              </button>
            ))}
          </div>

          <p className={cn(jp.className, "text-[11px] text-white/45")}>
            {content.title} · {content.amountHero} UNIT
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={replay}
              className={cn(
                nameOxanium.className,
                "inline-flex flex-1 items-center justify-center gap-2 border border-amber-300/45 bg-amber-400/10 px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-amber-100",
              )}
            >
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Replay
            </button>
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              className={cn(
                nameOxanium.className,
                "border border-white/15 px-3 py-2.5 text-[11px] font-bold uppercase text-white/55",
              )}
            >
              {open ? "Hide" : "Show"}
            </button>
          </div>
        </div>
      </div>

      <UnitEarnCelebrateOverlay
        open={open}
        presetId={presetId}
        isJa={isJa}
        replayKey={replayKey}
        onClose={() => {
          setOpen(false);
          applyBalance(content.amount);
        }}
        onClaim={() => {
          setOpen(false);
          startFlyThenCredit();
        }}
        onViewHistory={() => {
          setOpen(false);
          applyBalance(content.amount);
          window.location.assign("/mobile/units");
        }}
      />

      <UnitEarnVaultSettleFly fly={fly} onComplete={onFlyComplete} />
    </div>
  );
}
