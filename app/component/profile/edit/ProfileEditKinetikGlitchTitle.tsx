"use client";

import { nameOxanium } from "@/lib/fonts";

type Props = {
  children: string;
  compact?: boolean;
  className?: string;
};

export default function ProfileEditKinetikGlitchTitle({
  children,
  compact = false,
  className = "",
}: Props) {
  return (
    <p
      className={[
        nameOxanium.className,
        "truncate font-bold uppercase tracking-[0.12em] text-white/88",
        compact ? "text-[10px]" : "text-[11px]",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </p>
  );
}
