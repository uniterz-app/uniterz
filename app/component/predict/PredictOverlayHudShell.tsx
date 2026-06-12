"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";
import { nameOxanium } from "@/lib/fonts";
import { PREDICT_HUD_HAIRLINE, PREDICT_HUD_SHELL_CLASS } from "@/lib/predict/predictOverlayHud";

type Props = {
  match: ReactNode;
  form: ReactNode;
  /** 上段メタ（例: GROUP B） */
  headerLabel?: string | null;
  /** 右上の補助メタ（例: キックオフ日付） */
  headerMeta?: string | null;
  onClose?: () => void;
  closeAriaLabel?: string;
  isMobile?: boolean;
};

function HudCornerBrackets() {
  const corner =
    "pointer-events-none absolute z-[4] h-5 w-5 border-cyan-400/65 sm:h-6 sm:w-6";
  return (
    <>
      <span className={`${corner} left-0 top-0 border-l border-t`} aria-hidden />
      <span className={`${corner} right-0 top-0 border-r border-t`} aria-hidden />
      <span
        className={`${corner} bottom-0 left-0 border-b border-l`}
        aria-hidden
      />
      <span
        className={`${corner} bottom-0 right-0 border-b border-r`}
        aria-hidden
      />
    </>
  );
}

/**
 * 試合予想オーバーレイの外枠。MatchCard + PredictionForm を1枚の HUD パネルにまとめる。
 */
export default function PredictOverlayHudShell({
  match,
  form,
  headerLabel,
  headerMeta,
  onClose,
  closeAriaLabel = "Close",
  isMobile = false,
}: Props) {
  const showHeader = Boolean(headerLabel?.trim() || headerMeta?.trim());

  return (
    <div className={PREDICT_HUD_SHELL_CLASS}>
      <HudCornerBrackets />
      <ShellGridOverlay roundedClassName="rounded-none" className="opacity-[0.28]" />

      {onClose ? (
        <button
          type="button"
          aria-label={closeAriaLabel}
          className={[
            "absolute right-2 top-2 z-30 flex h-9 w-9 items-center justify-center",
            "border border-cyan-400/35 bg-[rgba(4,10,18,0.72)] text-cyan-50/90 backdrop-blur-sm",
            isMobile ? "" : "transition hover:border-cyan-300/55 hover:bg-[rgba(6,14,24,0.85)]",
          ]
            .filter(Boolean)
            .join(" ")}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
        >
          <X size={16} strokeWidth={2.4} />
        </button>
      ) : null}

      {showHeader ? (
        <div
          className={[
            "relative z-[2] flex items-center justify-between gap-3 border-b px-3 py-2 sm:px-4",
            nameOxanium.className,
          ].join(" ")}
          style={{ borderColor: PREDICT_HUD_HAIRLINE }}
        >
          <span className="min-w-0 truncate text-[10px] font-bold uppercase tracking-[0.22em] text-cyan-200/75 sm:text-[11px]">
            {headerLabel?.trim() || "\u00a0"}
          </span>
          <span className="shrink-0 text-[10px] font-semibold tracking-[0.14em] text-white/42 sm:text-[11px]">
            {headerMeta?.trim() || ""}
          </span>
        </div>
      ) : null}

      <div className="relative z-[2]">{match}</div>

      <div
        className="relative z-[2] border-t"
        style={{ borderColor: PREDICT_HUD_HAIRLINE }}
      >
        {form}
      </div>
    </div>
  );
}
