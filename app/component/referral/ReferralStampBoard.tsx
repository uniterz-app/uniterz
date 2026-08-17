"use client";

/**
 * 紹介者 1〜10 人サイバー・スタンプラリー（たたき台）
 * 達成マスに円形 UNITERZ INVITE スタンプを押印
 */
import { useMemo } from "react";
import { nameOxanium } from "@/lib/fonts";
import { renderReferralSkewedDigits, REFERRAL_DIGIT_SKEW } from "@/lib/referral/referralSkewedDigits";
import {
  nextReferralMilestone,
  referralReferrerUnitsEarned,
} from "@/lib/referral/referralRewards";
import { buildReferralStampSlots } from "@/lib/referral/referralStampBoard";
import UniterzClearStamp, {
  type UniterzClearStampTone,
} from "@/app/component/referral/UniterzClearStamp";

type Props = {
  completedCount: number;
  isJa: boolean;
};

// Ledger background: thin hex-outline pattern (subtle, static).
const PATTERN_VB_W = 640;
const PATTERN_VB_H = 420;
const HEX_R = 18;
const INNER_HEX_R = 10.5;
const HEX_DX = 1.5 * HEX_R;
const HEX_DY = Math.sqrt(3) * HEX_R;

function hexPoints(cx: number, cy: number, r: number): string {
  // flat-top-ish hex; the rotation is handled by angle offset.
  const a0 = Math.PI / 6;
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = a0 + (Math.PI / 3) * i;
    const x = cx + Math.cos(a) * r;
    const y = cy + Math.sin(a) * r;
    pts.push(`${x.toFixed(2)},${y.toFixed(2)}`);
  }
  return pts.join(" ");
}

function buildHexBackdrop(): Array<{ outer: string; inner: string; key: string }> {
  const arr: Array<{ outer: string; inner: string; key: string }> = [];
  const cols = Math.ceil(PATTERN_VB_W / HEX_DX) + 3;
  const rows = Math.ceil(PATTERN_VB_H / HEX_DY) + 3;

  for (let row = -1; row < rows; row++) {
    const y = row * HEX_DY - HEX_DY;
    const xOffset = row % 2 === 1 ? HEX_DX / 2 : 0;
    for (let col = -1; col < cols; col++) {
      const x = col * HEX_DX - HEX_DX + xOffset;
      const outer = hexPoints(x, y, HEX_R);
      const inner = hexPoints(x, y, INNER_HEX_R);
      arr.push({ outer, inner, key: `${row}:${col}` });
    }
  }

  return arr;
}

function cellShellClass(
  stamped: boolean,
  isNextTarget: boolean,
  cellTone: UniterzClearStampTone,
  isMilestone: boolean
): string {
  if (!stamped) {
    return isNextTarget
      ? "border border-dashed border-cyan-300/55 bg-cyan-300/[0.05]"
      : "border border-white/14 bg-black/35";
  }
  switch (cellTone) {
    case "lime":
      return "rounded-full border border-[#B8FF3C]/55 bg-[#B8FF3C]/[0.08] shadow-[0_0_14px_rgba(184,255,60,0.22)]";
    case "amber":
      return "rounded-full border border-amber-300/55 bg-amber-300/[0.08] shadow-[0_0_14px_rgba(251,191,36,0.2)]";
    case "ink":
      return "rounded-full border border-[#FF2D55]/55 bg-[#FF2D55]/[0.08] shadow-[0_0_14px_rgba(255,45,85,0.22)]";
    default:
      return isMilestone
        ? "rounded-full border border-cyan-300/55 bg-cyan-300/[0.08] shadow-[0_0_12px_rgba(0,245,255,0.18)]"
        : "rounded-full border border-cyan-300/45 bg-cyan-300/[0.06] shadow-[0_0_12px_rgba(0,245,255,0.18)]";
  }
}

function bonusChipClass(
  stamped: boolean,
  tone: UniterzClearStampTone
): string {
  if (!stamped) {
    const border =
      tone === "lime"
        ? "border-[#B8FF3C]/50 text-[#D9FF8A]"
        : tone === "ink"
          ? "border-[#FF2D55]/50 text-[#FF8AA3]"
          : "border-amber-300/50 text-amber-200/90";
    return `border bg-black/70 ${border}`;
  }
  if (tone === "lime") return "bg-[#B8FF3C] text-[#050508]";
  if (tone === "ink") return "bg-[#FF2D55] text-white";
  if (tone === "amber") return "bg-amber-300 text-[#050508]";
  return "bg-cyan-300 text-[#050508]";
}

function StampCell({
  index,
  stamped,
  milestoneBonusUnits,
  isNextTarget,
  milestoneTone,
  tone,
}: {
  index: number;
  stamped: boolean;
  milestoneBonusUnits: number | null;
  isNextTarget: boolean;
  milestoneTone: UniterzClearStampTone | null;
  tone: UniterzClearStampTone;
}) {
  const isMilestone = milestoneBonusUnits != null;
  const cellTone: UniterzClearStampTone = milestoneTone ?? tone;

  return (
    <div
      className={[
        "relative aspect-square min-h-0",
        stamped ? "overflow-visible" : "overflow-hidden rounded-full",
        cellShellClass(stamped, isNextTarget, cellTone, isMilestone),
      ].join(" ")}
      aria-label={
        stamped
          ? `invite ${index} stamped`
          : isNextTarget
            ? `invite ${index} next`
            : `invite ${index} empty`
      }
    >
      {stamped ? (
        <div className="absolute inset-[4%] flex items-center justify-center">
          <UniterzClearStamp
            compact
            tone={cellTone}
            size={78}
            rotateDeg={-8 - (index % 3)}
            className="max-h-full max-w-full"
          />
        </div>
      ) : (
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={[
              nameOxanium.className,
              "inline-block text-[15px] font-extrabold tabular-nums leading-none tracking-wide sm:text-[17px]",
              isNextTarget ? "text-cyan-100/90" : "text-white/35",
            ].join(" ")}
            style={{ transform: REFERRAL_DIGIT_SKEW }}
          >
            {index}
          </span>
        </div>
      )}

      {isMilestone && milestoneTone ? (
        <span
          className={[
            nameOxanium.className,
            "absolute -right-0.5 -top-0.5 z-[1] inline-block rounded-[2px] px-1 py-[1px] text-[7px] font-extrabold tracking-wide tabular-nums",
            bonusChipClass(stamped, milestoneTone),
          ].join(" ")}
          style={{ transform: REFERRAL_DIGIT_SKEW }}
        >
          +{milestoneBonusUnits}
        </span>
      ) : null}
    </div>
  );
}

export default function ReferralStampBoard({ completedCount, isJa }: Props) {
  const slots = useMemo(
    () => buildReferralStampSlots(completedCount),
    [completedCount]
  );
  const hexBackdrop = useMemo(() => buildHexBackdrop(), []);
  const earned = referralReferrerUnitsEarned(completedCount);
  const next = nextReferralMilestone(completedCount);
  const tone: UniterzClearStampTone = "cyan";

  return (
    <section className="relative overflow-hidden border border-cyan-300/25 bg-[rgba(4,10,16,0.96)] p-3">
      {/* thin hex pattern background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ opacity: 0.22 }}
      >
        <svg
          viewBox={`0 0 ${PATTERN_VB_W} ${PATTERN_VB_H}`}
          width="100%"
          height="100%"
          preserveAspectRatio="none"
        >
          {hexBackdrop.map((h) => (
            <g key={h.key}>
              <polygon
                points={h.outer}
                fill="none"
                stroke="rgba(255,255,255,0.26)"
                strokeWidth={1}
                strokeLinejoin="round"
              />
              <polygon
                points={h.inner}
                fill="none"
                stroke="rgba(0,245,255,0.14)"
                strokeWidth={0.8}
                strokeLinejoin="round"
              />
            </g>
          ))}
        </svg>
      </div>

      <div
        aria-hidden
        className="cyber-side-menu-scanlines pointer-events-none absolute inset-0 opacity-40"
      />

      <div className="relative space-y-3">
        <div className="flex items-end justify-between gap-2">
          <div>
            <p
              className={[
                nameOxanium.className,
                "text-[9px] font-bold uppercase tracking-[0.16em] text-cyan-200/70",
              ].join(" ")}
            >
              {isJa ? "招待スタンプラリー" : "Invite stamp rally"}
            </p>
            <h2
              className={[
                nameOxanium.className,
                "mt-1 text-[13px] font-extrabold uppercase tracking-[0.14em] text-white",
              ].join(" ")}
            >
              {renderReferralSkewedDigits(`${completedCount} / 10`)}
              {isJa ? " 達成" : " locked"}
            </h2>
          </div>
          <div className="text-right">
            <p
              className={[
                nameOxanium.className,
                "text-[8px] font-bold uppercase tracking-[0.12em] text-white/40",
              ].join(" ")}
            >
              {isJa ? "獲得" : "Earned"}
            </p>
            <p
              className={[
                nameOxanium.className,
                "inline-block text-[18px] font-extrabold tabular-nums text-cyan-100",
              ].join(" ")}
              style={{ transform: REFERRAL_DIGIT_SKEW }}
            >
              {earned.total}
              <span className="ml-1 text-[9px] tracking-[0.1em] text-white/45">
                UNIT
              </span>
            </p>
          </div>
        </div>

        {/* 台帳本体（本番寄せ: プレビュー枠は削除） */}
        <div
          className="grid grid-cols-5 gap-2 sm:gap-2.5"
          role="list"
          aria-label={isJa ? "招待スタンプ 1から10" : "Invite stamps 1 to 10"}
        >
          {slots.map((slot) => (
            <div key={slot.index} role="listitem">
              <StampCell
                {...slot}
                milestoneTone={slot.milestoneTone as UniterzClearStampTone | null}
                tone={tone}
              />
            </div>
          ))}
        </div>

        <p className="text-[11px] leading-relaxed text-white/50">
          {next
            ? isJa
              ? `次のスタンプ目標: ${next.target} 人目（あと ${next.remaining}）· ボーナス +${next.bonusUnits} Unit`
              : `Next stamp: #${next.target} (need ${next.remaining}) · bonus +${next.bonusUnits}`
            : isJa
              ? "10 枠すべて INVITE。マイルストーン上限到達（モック）"
              : "All 10 slots INVITE. Milestone cap reached (mock)"}
        </p>
        <p className="text-[10px] text-white/35">
          {isJa
            ? `内訳: 基本 ${earned.base} + マイルストーン ${earned.milestones} · 3 LIME / 5 AMBER / 10 INK`
            : `Base ${earned.base} + milestones ${earned.milestones} · 3 LIME / 5 AMBER / 10 INK`}
        </p>
      </div>
    </section>
  );
}

