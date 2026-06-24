"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export type TooltipPlacement = "above" | "below" | "auto";

const TOOLTIP_WIDTH = 260;
const TOOLTIP_GAP = 10;
const TOOLTIP_ESTIMATED_HEIGHT = 110;

function resolvePlacement(
  anchorRect: DOMRect,
  placement: TooltipPlacement
): "above" | "below" {
  if (placement === "above") return "above";
  if (placement === "below") return "below";

  const spaceAbove = anchorRect.top - TOOLTIP_GAP;
  const spaceBelow =
    window.innerHeight - anchorRect.bottom - TOOLTIP_GAP;

  if (spaceAbove >= TOOLTIP_ESTIMATED_HEIGHT) return "above";
  if (spaceBelow >= TOOLTIP_ESTIMATED_HEIGHT) return "below";
  return spaceBelow > spaceAbove ? "below" : "above";
}

export default function Tooltip({
  anchorRect,
  message,
  onClose,
  placement = "auto",
}: {
  anchorRect: DOMRect | null;
  message: string;
  onClose: () => void;
  placement?: TooltipPlacement;
}) {
  if (!anchorRect || typeof document === "undefined") return null;

  const sw = window.innerWidth;
  const resolved = resolvePlacement(anchorRect, placement);

  const centerX = anchorRect.left + anchorRect.width / 2;
  let leftPx = centerX - TOOLTIP_WIDTH / 2;
  leftPx = Math.max(12, Math.min(leftPx, sw - TOOLTIP_WIDTH - 12));

  const topPx =
    resolved === "above" ? anchorRect.top : anchorRect.bottom;
  const transform =
    resolved === "above"
      ? `translateY(calc(-100% - ${TOOLTIP_GAP}px))`
      : `translateY(${TOOLTIP_GAP}px)`;

  useEffect(() => {
    function handler(e: MouseEvent) {
      const box = document.getElementById("tooltip-box");
      if (box && box.contains(e.target as Node)) return;
      onClose();
    }

    window.addEventListener("click", handler, true);
    return () => window.removeEventListener("click", handler, true);
  }, [onClose]);

  return createPortal(
    <div
      className="fixed z-[9999]"
      style={{
        left: leftPx,
        top: topPx,
        width: TOOLTIP_WIDTH,
        transform,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div
        id="tooltip-box"
        className="relative rounded-lg bg-gray-800 p-3 text-[13px] text-white shadow-xl"
      >
        <div className="leading-relaxed whitespace-pre-line">{message}</div>

        <div
          className={[
            "absolute left-[50%] h-0 w-0 -translate-x-1/2",
            resolved === "above" ? "-bottom-2" : "-top-2",
          ].join(" ")}
          style={
            resolved === "above"
              ? {
                  borderLeft: "7px solid transparent",
                  borderRight: "7px solid transparent",
                  borderTop: "7px solid #1f2937",
                }
              : {
                  borderLeft: "7px solid transparent",
                  borderRight: "7px solid transparent",
                  borderBottom: "7px solid #1f2937",
                }
          }
        />
      </div>
    </div>,
    document.body
  );
}
