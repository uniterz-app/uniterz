"use client";

import type { ReactNode } from "react";

const CYBER_CLIP =
  "polygon(0 0, 100% 0, 100% calc(100% - 10px), calc(100% - 10px) 100%, 0 100%)";

type Props = {
  children: ReactNode;
  className?: string;
  /** リザルト日付帯より少しコンパクト */
  compact?: boolean;
  /** 親の `group/{name}` が active のときフラッシュ（例: "create"） */
  pressGroup?: string;
};

/** リザルト一覧の日付 / hit / 得点帯と同系のサイバーパネル枠 */
export function CyberPanelFrame({
  children,
  className = "",
  compact = false,
  pressGroup,
}: Props) {
  const pressFlashClass = pressGroup
    ? `opacity-0 transition-opacity duration-150 group-active/${pressGroup}:opacity-100`
    : "hidden";
  return (
    <div
      className={[
        "group relative w-full max-w-full overflow-hidden",
        "border border-cyan-400/70 bg-[#030308]/95",
        "shadow-[0_0_32px_-4px_rgba(34,211,238,0.35),inset_0_1px_0_0_rgba(34,211,238,0.25)]",
        compact ? "px-3 py-3" : "px-4 py-3.5 sm:px-5",
        className,
      ].join(" ")}
      style={{ clipPath: CYBER_CLIP }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(34,211,238,0.5)_1px,transparent_1px),linear-gradient(90deg,rgba(34,211,238,0.5)_1px,transparent_1px)] [background-size:11px_11px]"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] [background:repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(34,211,238,0.12)_2px,rgba(34,211,238,0.12)_3px)]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute left-0 top-0 z-[1] h-3 w-3 border-l-2 border-t-2 border-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-0 right-0 z-[1] h-3 w-3 border-b-2 border-r-2 border-fuchsia-500/90 shadow-[0_0_10px_rgba(217,70,239,0.55)]"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute right-0 top-0 z-[1] h-3 w-3 border-r-2 border-t-2 border-cyan-400/50"
        aria-hidden
      />
      <span
        className="pointer-events-none absolute bottom-0 left-0 z-[1] h-3 w-3 border-b-2 border-l-2 border-cyan-400/40"
        aria-hidden
      />
      <span
        className={[
          "pointer-events-none absolute inset-0 z-[3] bg-[linear-gradient(105deg,transparent_10%,rgba(34,211,238,0.16)_50%,transparent_90%)]",
          pressFlashClass,
        ].join(" ")}
        aria-hidden
      />
      <div className="relative z-[2]">{children}</div>
    </div>
  );
}
