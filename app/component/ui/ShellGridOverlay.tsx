"use client";

import { PROFILE_SHELL_GRID_STYLE } from "@/lib/profile/profileShellGrid";

type Props = {
  /** 親の角丸に合わせる（例: rounded-2xl / rounded-xl / rounded-[18px]） */
  roundedClassName?: string;
  className?: string;
};

/** マッチカード等と同系の方眼オーバーレイ（pointer-events-none） */
export function ShellGridOverlay({
  roundedClassName = "rounded-2xl",
  className = "",
}: Props) {
  return (
    <div
      className={[
        "pointer-events-none absolute inset-0 z-0 opacity-[0.32]",
        roundedClassName,
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={PROFILE_SHELL_GRID_STYLE}
      aria-hidden
    />
  );
}
