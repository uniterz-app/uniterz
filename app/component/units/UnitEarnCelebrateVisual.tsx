"use client";

import cn from "clsx";
import { nameOxanium } from "@/lib/fonts";

/** Web `ProfileUnitVault` ディスク — 演出用サイズ */
export function UnitEarnVaultCoin({
  size = 56,
  className,
}: {
  size?: number;
  className?: string;
}) {
  const inner = Math.round(size * 0.72);
  return (
    <span
      className={cn("relative inline-flex shrink-0 items-center justify-center", className)}
      style={{ width: size, height: size }}
      aria-hidden
    >
      <span
        className="absolute inset-0 rounded-full"
        style={{
          background:
            "radial-gradient(circle at 35% 28%, #fff3c4 0%, #f6c344 42%, #c8941a 100%)",
          boxShadow:
            "0 0 0 1px rgba(255,235,180,0.35), 0 0 18px rgba(246,195,68,0.45)",
        }}
      />
      <span
        className="absolute rounded-full"
        style={{
          width: inner,
          height: inner,
          background:
            "radial-gradient(circle at 40% 32%, #ffe9a8, #e8ad2a 70%, #9a6b12)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.35)",
        }}
      />
      <span
        className={cn(nameOxanium.className, "relative z-[1] font-extrabold text-[#241902]")}
        style={{ fontSize: Math.max(11, size * 0.28) }}
      >
        U
      </span>
    </span>
  );
}

/** Phase B 用 — コイン + 付与量チップ */
export function UnitEarnFlyChip({
  label,
  compact = false,
}: {
  label: string;
  compact?: boolean;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-sm border border-amber-200/25 bg-[rgba(8,12,18,0.92)] px-2 py-1",
        compact && "gap-1.5 px-1.5 py-0.5",
      )}
      style={{
        boxShadow: "0 0 20px rgba(246,195,68,0.25), 0 8px 24px rgba(0,0,0,0.45)",
      }}
    >
      <UnitEarnVaultCoin size={compact ? 22 : 28} />
      <span
        className={cn(
          nameOxanium.className,
          "font-extrabold tabular-nums text-[#ffe9a8]",
          compact ? "text-[15px]" : "text-[18px]",
        )}
      >
        {label}
      </span>
    </span>
  );
}
