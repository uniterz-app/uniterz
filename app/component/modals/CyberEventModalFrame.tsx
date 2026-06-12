"use client";

import type { ReactNode } from "react";
import { X } from "lucide-react";

const CYAN = "#00FFFF";
const MAGENTA = "#FF00FF";
const BG = "#050505";

const MODAL_CLIP =
  "polygon(14px 0, calc(100% - 14px) 0, 100% 14px, 100% calc(100% - 14px), calc(100% - 14px) 100%, 14px 100%, 0 calc(100% - 14px), 0 14px)";

type Props = {
  tagLabel?: string;
  title: string;
  body: ReactNode;
  confirmLabel: string;
  closeAriaLabel: string;
  onClose: () => void;
  monoClassName: string;
};

function CornerBracket({
  className,
  style,
}: {
  className: string;
  style?: React.CSSProperties;
}) {
  return (
    <span
      className={["pointer-events-none absolute h-3 w-3 border-cyan-400", className].join(
        " "
      )}
      style={{ borderColor: CYAN, boxShadow: `0 0 8px ${CYAN}88`, ...style }}
      aria-hidden
    />
  );
}

function ScanlineOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[2] opacity-[0.22]"
      style={{
        background:
          "repeating-linear-gradient(0deg, rgba(0,0,0,0.28) 0px, rgba(0,0,0,0.28) 1px, transparent 1px, transparent 3px)",
      }}
      aria-hidden
    />
  );
}

function GridOverlay() {
  return (
    <div
      className="pointer-events-none absolute inset-0 z-[1] opacity-[0.35]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(0,255,255,0.045) 1px, transparent 1px),
          linear-gradient(90deg, rgba(0,255,255,0.045) 1px, transparent 1px)
        `,
        backgroundSize: "22px 22px",
      }}
      aria-hidden
    />
  );
}

export default function CyberEventModalFrame({
  tagLabel,
  title,
  body,
  confirmLabel,
  closeAriaLabel,
  onClose,
  monoClassName,
}: Props) {
  return (
    <div
      className="relative w-[min(420px,94vw)]"
      style={{
        filter: `drop-shadow(0 0 24px ${CYAN}33) drop-shadow(0 0 48px ${CYAN}18)`,
      }}
    >
      <CornerBracket className="left-0 top-0 border-l-2 border-t-2" />
      <CornerBracket className="right-0 top-0 border-r-2 border-t-2" />
      <CornerBracket className="bottom-0 left-0 border-b-2 border-l-2" />
      <CornerBracket className="bottom-0 right-0 border-b-2 border-r-2" />

      <div
        className={`relative flex max-h-[min(88dvh,520px)] min-h-0 flex-col overflow-hidden ${monoClassName}`}
        style={{
          clipPath: MODAL_CLIP,
          background: BG,
          border: `1px solid ${CYAN}66`,
          boxShadow: `inset 0 0 40px ${CYAN}08, 0 0 0 1px ${CYAN}22`,
        }}
      >
        <GridOverlay />
        <ScanlineOverlay />

        <header className="relative z-10 flex shrink-0 justify-end px-3 pt-3 sm:px-4">
          <button
            type="button"
            onClick={onClose}
            className="flex size-7 items-center justify-center border text-cyan-300/80 transition-colors hover:border-cyan-300 hover:text-cyan-100"
            style={{ borderColor: `${CYAN}44` }}
            aria-label={closeAriaLabel}
          >
            <X className="size-3.5" />
          </button>
        </header>

        <div
          className="relative z-10 min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-4 pt-1 sm:px-5 sm:pb-5"
          style={{ WebkitOverflowScrolling: "touch" }}
        >
          {tagLabel ? (
            <span
              className="inline-block px-2.5 py-0.5 text-[10px] font-bold tracking-[0.12em] text-white sm:text-[11px]"
              style={{
                background: "linear-gradient(90deg, #4F8BFF 0%, #3B6FE8 100%)",
                boxShadow: "0 0 12px rgba(79,139,255,0.55)",
              }}
            >
              {tagLabel}
            </span>
          ) : null}

          <h2
            className={[
              "max-w-full text-xl font-black italic leading-tight tracking-tight text-white sm:text-2xl",
              tagLabel ? "mt-3" : "",
            ].join(" ")}
            style={{
              textShadow: `
                2px 0 ${CYAN}44,
                -1px 0 ${MAGENTA}22,
                0 0 20px rgba(255,255,255,0.12)
              `,
            }}
          >
            {title}
          </h2>

          <div
            className="mt-4 text-[13px] leading-relaxed text-cyan-200/90 sm:text-sm"
            style={{ textShadow: `0 0 12px ${CYAN}18` }}
          >
            {body}
          </div>

          <button
            type="button"
            onClick={onClose}
            className="mt-6 w-full px-3 py-2.5 text-sm font-bold tracking-[0.08em] text-[#041018] transition-[filter] hover:brightness-110"
            style={{
              background: CYAN,
              boxShadow: `0 0 24px ${CYAN}88, 0 0 40px ${CYAN}33`,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
