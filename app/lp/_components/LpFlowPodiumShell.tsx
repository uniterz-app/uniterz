"use client";

import type { ReactNode } from "react";
import { ShellGridOverlay } from "@/app/component/ui/ShellGridOverlay";

export type LpFlowPodiumPalette = "cyan" | "green";

type Tone = {
  edge: string;
  edgeGlow: string;
  ring: string;
  glow: string;
  topLine: string;
  sheenSkew: string;
};

const PALETTES: Record<LpFlowPodiumPalette, Tone> = {
  cyan: {
    edge: "rgba(94, 234, 250, 0.82)",
    edgeGlow: "rgba(56, 189, 248, 0.38)",
    ring: "rgba(103, 232, 249, 0.42)",
    glow: "rgba(34, 211, 238, 0.17)",
    topLine:
      "linear-gradient(90deg, rgba(255,255,255,0), rgba(224, 250, 255, 0.82), rgba(255,255,255,0))",
    sheenSkew:
      "linear-gradient(135deg, rgba(224, 250, 255, 0.20) 0%, rgba(255,255,255,0.10) 22%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0) 62%)",
  },
  green: {
    edge: "rgba(110, 231, 183, 0.88)",
    edgeGlow: "rgba(52, 211, 153, 0.42)",
    ring: "rgba(52, 211, 153, 0.48)",
    glow: "rgba(16, 185, 129, 0.22)",
    topLine:
      "linear-gradient(90deg, rgba(255,255,255,0), rgba(209, 250, 229, 0.88), rgba(255,255,255,0))",
    sheenSkew:
      "linear-gradient(135deg, rgba(167, 243, 208, 0.24) 0%, rgba(255,255,255,0.10) 22%, rgba(255,255,255,0.03) 40%, rgba(255,255,255,0) 62%)",
  },
};

function FlowCornerFrame({ edge, edgeGlow }: { edge: string; edgeGlow: string }) {
  return (
    <div className="pointer-events-none absolute inset-0 z-30">
      <div
        className="absolute inset-0 border"
        style={{
          inset: "0.5px",
          borderColor: edge,
          borderWidth: 0.6,
          boxShadow: `0 0 12px ${edgeGlow}`,
        }}
      />
      <div
        className="absolute left-0 top-0 h-5 w-5 border-l-[2.5px] border-t-[2.5px]"
        style={{ borderColor: edge }}
      />
      <div
        className="absolute right-0 top-0 h-5 w-5 border-r-[2.5px] border-t-[2.5px]"
        style={{ borderColor: edge }}
      />
      <div
        className="absolute bottom-0 left-0 h-5 w-5 border-b-[2.5px] border-l-[2.5px]"
        style={{ borderColor: edge }}
      />
      <div
        className="absolute bottom-0 right-0 h-5 w-5 border-b-[2.5px] border-r-[2.5px]"
        style={{ borderColor: edge }}
      />
    </div>
  );
}

export function LpFlowPodiumShell({
  children,
  className = "",
  palette = "cyan",
}: {
  children: ReactNode;
  className?: string;
  palette?: LpFlowPodiumPalette;
}) {
  const P = PALETTES[palette];

  return (
    <div
      className={[
        "relative z-0 min-h-0 flex-1 overflow-hidden rounded-none border",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      style={{
        borderColor: P.ring,
        background:
          "linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.045) 42%, rgba(6, 18, 38, 0.92) 100%)",
        boxShadow: [
          "0 10px 24px rgba(0,0,0,0.22)",
          "inset 0 1px 0 rgba(255,255,255,0.22)",
          "inset 0 -1px 0 rgba(255,255,255,0.05)",
          `inset 0 0 0 1px ${P.ring}`,
          `0 0 18px ${P.glow}`,
        ].join(", "),
      }}
    >
      <FlowCornerFrame edge={P.edge} edgeGlow={P.edgeGlow} />
      <ShellGridOverlay roundedClassName="rounded-none" />
      <div
        className="pointer-events-none absolute left-3 right-3 top-0 z-6 h-px"
        style={{
          background: P.topLine,
          opacity: 0.55,
        }}
      />
      <div
        className="pointer-events-none absolute -left-[12%] top-0 z-6 h-[65%] w-[58%]"
        style={{
          background: P.sheenSkew,
          transform: "skewX(-18deg)",
          opacity: 0.34,
        }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-6 h-[38%]"
        style={{
          background:
            "linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0.12) 100%)",
        }}
      />
      <div className="relative z-10 flex min-h-0 min-w-0 flex-1 flex-col">
        {children}
      </div>
    </div>
  );
}
