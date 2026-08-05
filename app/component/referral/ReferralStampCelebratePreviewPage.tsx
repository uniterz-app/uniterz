"use client";

/**
 * /dev/referral-stamp-celebrate-preview
 * スタンプ・ドン演出の確認。リプレイでアニメを最初から再生。
 */
import { useCallback, useState } from "react";
import { RefreshCw } from "lucide-react";
import cn from "clsx";
import { nameOxanium, jp } from "@/lib/fonts";
import ReferralStampCelebrateOverlay from "@/app/component/referral/ReferralStampCelebrateOverlay";
import { REFERRAL_REFERRER_MAX_COMPLETED } from "@/lib/referral/referralRewards";
import { referralStampCelebrateContent } from "@/lib/referral/referralStampCelebrate";
import {
  REFERRAL_MILESTONE_STAMP_TONE,
  referralStampToneForSlot,
} from "@/lib/referral/referralStampBoard";

const SLOTS = Array.from(
  { length: REFERRAL_REFERRER_MAX_COMPLETED },
  (_, i) => i + 1
);

export default function ReferralStampCelebratePreviewPage() {
  const [slotIndex, setSlotIndex] = useState(3);
  const [isJa, setIsJa] = useState(true);
  const [open, setOpen] = useState(true);
  const [replayKey, setReplayKey] = useState(0);

  const content = referralStampCelebrateContent(slotIndex, isJa);

  const replay = useCallback(() => {
    setOpen(true);
    setReplayKey((k) => k + 1);
  }, []);

  return (
    <div className="min-h-dvh bg-[#05080c] text-white">
      {/* 偽プロフィール背景（演出時だけオーバーレイが乗る想定） */}
      <div className="pointer-events-none mx-auto max-w-md px-4 pb-40 pt-10 opacity-40">
        <p
          className={cn(
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.16em] text-cyan-200/50"
          )}
        >
          Profile mock
        </p>
        <div className="mt-4 h-28 rounded-sm border border-white/10 bg-gradient-to-br from-white/[0.06] to-transparent" />
        <div className="mt-3 h-4 w-2/3 rounded-sm bg-white/10" />
        <div className="mt-2 h-3 w-1/2 rounded-sm bg-white/5" />
        <div className="mt-6 grid grid-cols-3 gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-16 border border-white/8 bg-white/[0.03]"
            />
          ))}
        </div>
      </div>

      {/* コントロール */}
      <div className="fixed inset-x-0 bottom-0 z-[90] border-t border-cyan-300/20 bg-[#070b10]/95 px-4 py-3 backdrop-blur-md">
        <div className="mx-auto flex max-w-md flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <p
              className={cn(
                nameOxanium.className,
                "text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200/70"
              )}
            >
              Stamp celebrate preview
            </p>
            <button
              type="button"
              onClick={() => setIsJa((v) => !v)}
              className={cn(
                nameOxanium.className,
                "border border-white/15 px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-white/60"
              )}
            >
              {isJa ? "JA" : "EN"}
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {SLOTS.map((n) => {
              const tone = referralStampToneForSlot(n);
              const isMs = n in REFERRAL_MILESTONE_STAMP_TONE;
              const active = n === slotIndex;
              return (
                <button
                  key={n}
                  type="button"
                  onClick={() => {
                    setSlotIndex(n);
                    setOpen(true);
                    setReplayKey((k) => k + 1);
                  }}
                  className={cn(
                    nameOxanium.className,
                    "min-w-[32px] px-2 py-1.5 text-[11px] font-extrabold tabular-nums transition",
                    active
                      ? "border border-cyan-300/60 bg-cyan-400/20 text-cyan-50"
                      : "border border-white/10 bg-white/[0.03] text-white/50 hover:text-white/80",
                    isMs && !active && "border-amber-300/25"
                  )}
                  title={tone}
                >
                  {n}
                </button>
              );
            })}
          </div>

          <p className={cn(jp.className, "text-[11px] text-white/45")}>
            {content.description} · {content.unitsLine}
            {content.bonusUnits > 0 ? " · milestone" : ""}
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={replay}
              className={cn(
                nameOxanium.className,
                "inline-flex flex-1 items-center justify-center gap-2 border border-cyan-300/45 bg-cyan-400/15 px-3 py-2.5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-cyan-50"
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
                "border border-white/15 px-3 py-2.5 text-[11px] font-bold uppercase tracking-[0.12em] text-white/55"
              )}
            >
              {open ? "Hide" : "Show"}
            </button>
          </div>
        </div>
      </div>

      <ReferralStampCelebrateOverlay
        open={open}
        slotIndex={slotIndex}
        isJa={isJa}
        replayKey={replayKey}
        onClose={() => setOpen(false)}
        onViewStampRally={() => {
          setOpen(false);
          window.location.assign("/mobile/invite");
        }}
      />
    </div>
  );
}
