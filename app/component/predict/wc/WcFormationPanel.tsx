"use client";

import {
  getWcResolvedLineup,
  getWcPredictedLineup,
  hasWcSquadData,
} from "@/lib/wc/squads";
import type { WcSquadPlayer } from "@/lib/wc/squadTypes";
import type { Language } from "@/lib/i18n/language";
import { t } from "@/lib/i18n/t";

type Props = {
  teamId: string;
  language: Language;
  isMobile: boolean;
  className?: string;
};

const CYBER = {
  line: "rgba(92, 248, 255, 0.95)",
  lineGlow: "rgba(48, 220, 255, 0.72)",
  grid: "rgba(72, 210, 255, 0.14)",
  gridFine: "rgba(72, 210, 255, 0.07)",
  base: "#010c18",
  stripeDark: "#021424",
  stripeLight: "#0c2d4f",
  circuit: "rgba(56, 200, 255, 0.22)",
  circuitNode: "rgba(100, 240, 255, 0.45)",
} as const;

type LabelLayout = {
  above: boolean;
  align: "start" | "center" | "end";
  offsetX: number;
  offsetY: number;
};

function buildLabelLayouts(
  players: Array<{
    id: string;
    pos: WcSquadPlayer["pos"];
    left: number;
    top: number;
  }>,
): Map<string, LabelLayout> {
  const layouts = new Map<string, LabelLayout>();

  for (const player of players) {
    if (player.pos === "GK") {
      layouts.set(player.id, {
        above: false,
        align: "center",
        offsetX: 0,
        offsetY: 0,
      });
      continue;
    }

    let align: LabelLayout["align"] = "center";
    if (player.left < 15) align = "start";
    else if (player.left > 85) align = "end";

    let above = true;
    if (player.top < 18) above = false;

    layouts.set(player.id, { above, align, offsetX: 0, offsetY: 0 });
  }

  for (let i = 0; i < players.length; i++) {
    for (let j = i + 1; j < players.length; j++) {
      const a = players[i]!;
      const b = players[j]!;
      if (a.pos === "GK" || b.pos === "GK") continue;
      const dLeft = Math.abs(a.left - b.left);
      const dTop = Math.abs(a.top - b.top);
      if (dLeft >= 10 || dTop >= 15) continue;

      const la = { ...layouts.get(a.id)! };
      const lb = { ...layouts.get(b.id)! };

      if (dLeft < 6) {
        la.above = true;
        lb.above = false;
        la.offsetY = -2;
        lb.offsetY = 2;
      } else if (a.left < b.left) {
        la.offsetX = -6;
        lb.offsetX = 6;
      } else {
        la.offsetX = 6;
        lb.offsetX = -6;
      }

      layouts.set(a.id, la);
      layouts.set(b.id, lb);
    }
  }

  return layouts;
}

/** ピッチ aspect 16:10 — width% 基準で真円サイズを算出 */
const PITCH_ASPECT = 16 / 10;

function circleDims(widthPct: number) {
  return {
    width: `${widthPct}%`,
    height: `${widthPct * PITCH_ASPECT}%`,
  };
}

/** 縦座標（GK=下）→ 横ピッチ座標（GK=左）へ変換 */
function toHorizontalCoords(
  x: number,
  y: number,
  pos?: WcSquadPlayer["pos"],
) {
  if (pos === "GK") {
    return { left: 11.5, top: 50 };
  }
  const left = 13 + ((90 - y) / 70) * 78;
  const top = 8 + (x / 100) * 84;
  return { left, top };
}

export default function WcFormationPanel({
  teamId,
  language,
  isMobile,
  className,
}: Props) {
  if (!hasWcSquadData(teamId)) return null;

  const lineup = getWcResolvedLineup(teamId);
  const predicted = getWcPredictedLineup(teamId);
  if (!lineup?.length || !predicted) return null;

  const m = t(language);
  const web = !isMobile;
  const labelLayouts = buildLabelLayouts(
    lineup.map((player) => ({
      id: player.id,
      pos: player.pos,
      ...toHorizontalCoords(player.x, player.y, player.pos),
    })),
  );

  return (
    <div className={["mt-3", className].filter(Boolean).join(" ")}>
      <div
        className={[
          "mb-3 text-center",
          web
            ? "grid min-h-[3.5rem] grid-rows-[1.25rem_1.75rem] items-center justify-items-center"
            : "flex flex-col items-center",
        ].join(" ")}
      >
        <div
          className={[
            "font-bold uppercase tracking-[0.16em] text-white/55",
            web ? "text-sm leading-none" : "text-xs",
          ].join(" ")}
        >
          {m.wc.predictedLineup}
        </div>
        <div
          className={[
            "font-[family-name:var(--font-geist-mono)] font-bold tabular-nums tracking-wider text-cyan-300/85",
            web ? "text-lg leading-none" : "mt-1 text-sm",
          ].join(" ")}
        >
          {predicted.formation}
        </div>
      </div>

      <div
        className="relative mx-auto w-full overflow-hidden rounded-md border border-cyan-400/35"
        style={{
          boxShadow:
            "0 0 18px rgba(48,220,255,0.18), inset 0 0 24px rgba(48,220,255,0.06)",
        }}
      >
        <div className="relative aspect-[16/10] w-full overflow-hidden">
          <PitchSurface web={web} />
          {lineup.map((player) => (
            <PlayerMarker
              key={player.id}
              player={player}
              web={web}
              labelLayout={labelLayouts.get(player.id)!}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function PitchSurface({ web }: { web: boolean }) {
  const gridSize = web ? "16px 16px" : "10px 10px";
  const fineGrid = web ? "8px 8px" : "5px 5px";

  return (
    <div className="absolute inset-0" style={{ backgroundColor: CYBER.base }}>
      {/* 芝生風の太い縦ストライプ */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: `repeating-linear-gradient(90deg, ${CYBER.stripeDark} 0%, ${CYBER.stripeDark} 12.5%, ${CYBER.stripeLight} 12.5%, ${CYBER.stripeLight} 25%)`,
        }}
      />

      <CircuitPattern />

      {/* 細かい方眼グリッド */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            `linear-gradient(${CYBER.gridFine} 1px, transparent 1px)`,
            `linear-gradient(90deg, ${CYBER.gridFine} 1px, transparent 1px)`,
          ].join(", "),
          backgroundSize: fineGrid,
        }}
      />

      {/* メイングリッド */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            `linear-gradient(${CYBER.grid} 1px, transparent 1px)`,
            `linear-gradient(90deg, ${CYBER.grid} 1px, transparent 1px)`,
          ].join(", "),
          backgroundSize: gridSize,
        }}
      />

      {/* 中央ホログラムグロー */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage: [
            "radial-gradient(ellipse 78% 58% at 50% 50%, rgba(48,220,255,0.14) 0%, transparent 62%)",
            "linear-gradient(180deg, rgba(48,220,255,0.05) 0%, transparent 35%, transparent 65%, rgba(1,10,22,0.5) 100%)",
          ].join(", "),
        }}
      />

      <PitchMarkings />
    </div>
  );
}

/** 基板トレース風の背景パターン */
function CircuitPattern() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 160 100"
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <filter id="wc-circuit-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.35" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <g
        fill="none"
        stroke={CYBER.circuit}
        strokeWidth="0.18"
        filter="url(#wc-circuit-glow)"
        opacity="0.85"
      >
        <path d="M 8 12 H 42 V 28 H 68 V 18 H 96 V 34 H 128 V 22 H 152" />
        <path d="M 14 78 H 38 V 62 H 58 V 74 H 88 V 58 H 118 V 70 H 148" />
        <path d="M 22 42 H 52 V 52 H 78 V 44 H 108 V 56 H 138" />
        <path d="M 6 50 H 26 V 38 H 46 V 50 H 66" />
        <path d="M 94 82 H 114 V 68 H 134 V 84 H 154" />
        <path d="M 48 8 V 24 H 62 V 8 H 82 V 20" />
        <path d="M 100 88 V 72 H 84 V 88 H 64 V 76" />
      </g>

      <g fill={CYBER.circuitNode} opacity="0.7">
        {[
          [8, 12],
          [42, 28],
          [68, 18],
          [96, 34],
          [128, 22],
          [14, 78],
          [58, 74],
          [88, 58],
          [22, 42],
          [52, 52],
          [108, 56],
          [46, 50],
          [114, 68],
          [62, 24],
          [84, 88],
          [100, 72],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="0.55" />
        ))}
      </g>
    </svg>
  );
}

function cyberLine(className: string) {
  return {
    className,
    style: {
      backgroundColor: CYBER.line,
      boxShadow: `0 0 5px ${CYBER.lineGlow}, 0 0 12px ${CYBER.lineGlow}, 0 0 20px rgba(54,230,255,0.15)`,
    },
  };
}

function cyberBorder(className: string) {
  return {
    className: `absolute border ${className}`,
    style: {
      borderColor: CYBER.line,
      boxShadow: `0 0 8px ${CYBER.lineGlow}, 0 0 16px rgba(54,230,255,0.2), inset 0 0 8px rgba(54,230,255,0.12)`,
    },
  };
}

function PitchMarkings() {
  const hl = cyberLine("absolute");
  const hb = cyberBorder("");

  return (
    <>
      <div {...hb} className={`${hb.className} inset-[4%] rounded-sm`} />

      <div {...hl} className={`${hl.className} bottom-[4%] left-1/2 top-[4%] w-px -translate-x-1/2`} />

      <div
        {...hb}
        className={`${hb.className} left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full`}
        style={{ ...hb.style, ...circleDims(22) }}
      />
      {/* センタースポット — 強めのグロー */}
      <div
        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
        style={{
          ...circleDims(1.4),
          backgroundColor: CYBER.line,
          boxShadow: `0 0 6px ${CYBER.lineGlow}, 0 0 16px rgba(100,250,255,0.9), 0 0 28px rgba(48,220,255,0.55)`,
        }}
      />

      <div {...hb} className={`${hb.className} bottom-[22%] left-[4%] top-[22%] w-[15%] border-l-0`} />
      <div {...hb} className={`${hb.className} bottom-[32%] left-[4%] top-[32%] w-[6%] border-l-0`} />
      <div
        {...hl}
        className={`${hl.className} left-[12%] top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full`}
        style={{
          ...hl.style,
          boxShadow: `0 0 5px ${CYBER.lineGlow}, 0 0 12px rgba(48,220,255,0.45)`,
        }}
      />

      <div {...hb} className={`${hb.className} bottom-[22%] right-[4%] top-[22%] w-[15%] border-r-0`} />
      <div {...hb} className={`${hb.className} bottom-[32%] right-[4%] top-[32%] w-[6%] border-r-0`} />
      <div
        {...hl}
        className={`${hl.className} left-[88%] top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full`}
        style={{
          ...hl.style,
          boxShadow: `0 0 5px ${CYBER.lineGlow}, 0 0 12px rgba(48,220,255,0.45)`,
        }}
      />

      <CornerArc corner="tl" />
      <CornerArc corner="tr" />
      <CornerArc corner="bl" />
      <CornerArc corner="br" />

      <GoalFrame side="left" />
      <GoalFrame side="right" />
    </>
  );
}

function CornerArc({ corner }: { corner: "tl" | "tr" | "bl" | "br" }) {
  const styles = {
    tl: "left-[4%] top-[4%] rounded-br-full border-r border-b",
    tr: "right-[4%] top-[4%] rounded-bl-full border-b border-l",
    bl: "bottom-[4%] left-[4%] rounded-tr-full border-r border-t",
    br: "bottom-[4%] right-[4%] rounded-tl-full border-l border-t",
  }[corner];

  return (
    <div
      className={`absolute h-[3%] w-[2%] ${styles}`}
      style={{
        borderColor: CYBER.line,
        boxShadow: `0 0 4px ${CYBER.lineGlow}`,
      }}
    />
  );
}

function GoalFrame({ side }: { side: "left" | "right" }) {
  const pos = side === "left" ? "left-[3.5%]" : "right-[3.5%]";
  return (
    <div
      className={`absolute ${pos} bottom-[34%] top-[34%] w-[1.2%] border bg-cyan-400/12`}
      style={{
        borderColor: CYBER.line,
        boxShadow: `0 0 12px ${CYBER.lineGlow}, 0 0 20px rgba(48,220,255,0.25), inset 0 0 8px rgba(48,220,255,0.22)`,
      }}
    />
  );
}

type MarkerStyle = {
  fill: string;
  glow: string;
  ring: string;
};

const POS_MARKER: Record<WcSquadPlayer["pos"], MarkerStyle> = {
  GK: { fill: "#e8fdff", glow: "rgba(200, 245, 255, 0.85)", ring: "rgba(180, 240, 255, 0.9)" },
  DF: { fill: "#36e6ff", glow: "rgba(54, 230, 255, 0.75)", ring: "rgba(120, 240, 255, 0.85)" },
  MF: { fill: "#7c8cff", glow: "rgba(124, 140, 255, 0.7)", ring: "rgba(160, 170, 255, 0.8)" },
  FW: { fill: "#ff9f2f", glow: "rgba(255, 159, 47, 0.75)", ring: "rgba(255, 190, 100, 0.85)" },
};

function PlayerMarker({
  player,
  web,
  labelLayout,
}: {
  player: WcSquadPlayer & { x: number; y: number };
  web: boolean;
  labelLayout: LabelLayout;
}) {
  const label = formatPlayerLabel(player.name);
  const { left, top } = toHorizontalCoords(player.x, player.y, player.pos);
  const colors = POS_MARKER[player.pos];
  const dotSize = web ? 16 : 12;
  const alignClass =
    labelLayout.align === "start"
      ? "items-start"
      : labelLayout.align === "end"
        ? "items-end"
        : "items-center";
  const textAlignClass =
    labelLayout.align === "start"
      ? "text-left"
      : labelLayout.align === "end"
        ? "text-right"
        : "text-center";

  return (
    <div
      className="absolute z-10 -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${left}%`, top: `${top}%` }}
      title={player.name}
    >
      <div
        className={[
          "flex gap-0.5",
          labelLayout.above ? "flex-col-reverse" : "flex-col",
          alignClass,
        ].join(" ")}
      >
        <div className="relative shrink-0" style={{ width: dotSize, height: dotSize }}>
          <div
            className={[
              "absolute inset-0 rounded-full",
              web ? "blur-[3px]" : "blur-[2.5px]",
            ].join(" ")}
            style={{ backgroundColor: colors.glow, opacity: web ? 0.85 : 0.65 }}
            aria-hidden
          />
          <div
            className="absolute inset-0 rounded-full border"
            style={{
              backgroundColor: colors.fill,
              borderColor: colors.ring,
              boxShadow: web
                ? `0 0 6px ${colors.glow}, 0 0 12px ${colors.glow}`
                : `0 0 4px ${colors.glow}, 0 0 8px ${colors.glow}`,
            }}
          />
        </div>
        <span
          className={[
            "block max-w-[4.25rem] truncate rounded-sm border border-cyan-400/30 bg-[#030b18]/92 py-0.5",
            textAlignClass,
            "font-[family-name:var(--font-geist-mono)] font-medium uppercase leading-tight tracking-wider text-cyan-100/90",
            web ? "max-w-[5.5rem] px-2 text-[11px]" : "px-1.5 text-[9px]",
          ].join(" ")}
          style={{
            transform: `translate(${labelLayout.offsetX}px, ${labelLayout.offsetY}px)`,
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

/** "Harry Kane" → "H.Kane" */
function formatPlayerLabel(full: string): string {
  const parts = full.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) return parts[0] ?? full;
  const first = parts[0]!;
  const last = parts[parts.length - 1]!;
  const initial = first.charAt(0).toUpperCase();
  return `${initial}.${last}`;
}
