"use client";

import { nameOxanium } from "@/lib/fonts";

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = Number.parseInt(full, 16);
  if (!Number.isFinite(n)) return `rgba(255,255,255,${alpha})`;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

const DEFAULT_ACCENT = "#e8edf5";

type Props = {
  title: string;
  /** 省略時はニュートラル白系（2 チーム対戦向け） */
  accent?: string;
  className?: string;
};

/** Team / Player Detail の SectionTitle 相当 */
export default function LiveGameSectionTitle({
  title,
  accent = DEFAULT_ACCENT,
  className = "",
}: Props) {
  return (
    <div className={["flex items-center gap-2.5", className].filter(Boolean).join(" ")}>
      <h2
        className={`${nameOxanium.className} text-[10px] font-bold uppercase tracking-[0.16em]`}
        style={{ color: hexToRgba(accent, 0.75) }}
      >
        {title}
      </h2>
      <div
        className="h-px flex-1"
        style={{ backgroundColor: hexToRgba(accent, 0.35) }}
      />
    </div>
  );
}
