/** ランダム六角 + 電子回路トレース — SVG タイル */

import {
  PROFILE_PLAN_PRO_HEX_SCATTER_TILE_PX,
  PROFILE_PLAN_PRO_HEX_SCATTER_PATTERN,
} from "./profilePlanProHexScatterPattern";

type HexCell = {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  stroke: string;
};

type Trace = {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  opacity: number;
};

type Node = {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  fill: string;
};

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
}

function dist(a: HexCell, b: HexCell): number {
  return Math.hypot(a.cx - b.cx, a.cy - b.cy);
}

function buildHexCircuit(tile: number, seed: number) {
  const rand = mulberry32(seed);
  const strokes = [
    "rgba(34,211,238,1)",
    "rgba(103,232,249,1)",
    "rgba(167,139,250,1)",
    "rgba(79,247,244,1)",
  ];

  const cells: HexCell[] = [];
  const maxAttempts = 80;
  const target = 14;

  for (let attempt = 0; attempt < maxAttempts && cells.length < target; attempt += 1) {
    const candidate: HexCell = {
      cx: 16 + rand() * (tile - 32),
      cy: 16 + rand() * (tile - 32),
      r: 10 + rand() * 14,
      opacity: 0.14 + rand() * 0.16,
      stroke: strokes[Math.floor(rand() * strokes.length)]!,
    };
    const tooClose = cells.some((c) => dist(c, candidate) < c.r + candidate.r + 10);
    if (!tooClose) cells.push(candidate);
  }

  const traces: Trace[] = [];
  const nodes: Node[] = [];

  for (let i = 0; i < cells.length; i += 1) {
    const a = cells[i]!;
    nodes.push({
      cx: a.cx,
      cy: a.cy,
      r: 1.4 + rand() * 1.2,
      opacity: 0.35 + rand() * 0.35,
      fill: a.stroke.replace(",1)", ",0.9)"),
    });

    // セル内パッド — 中心から辺へ短いトレース
    const padAngle = rand() * Math.PI * 2;
    const padLen = a.r * (0.45 + rand() * 0.35);
    const px = a.cx + Math.cos(padAngle) * padLen;
    const py = a.cy + Math.sin(padAngle) * padLen;
    traces.push({
      x1: a.cx,
      y1: a.cy,
      x2: px,
      y2: py,
      opacity: 0.16 + rand() * 0.14,
    });
    nodes.push({
      cx: px,
      cy: py,
      r: 0.9,
      opacity: 0.28,
      fill: "rgba(34,211,238,0.9)",
    });

    // 近いセル同士を基板トレースで接続
    for (let j = i + 1; j < cells.length; j += 1) {
      const b = cells[j]!;
      const d = dist(a, b);
      if (d > a.r + b.r + 52) continue;
      if (rand() > 0.62) continue;

      const elbow = rand() > 0.45;
      if (elbow) {
        traces.push({
          x1: a.cx,
          y1: a.cy,
          x2: b.cx,
          y2: a.cy,
          opacity: 0.12 + rand() * 0.12,
        });
        traces.push({
          x1: b.cx,
          y1: a.cy,
          x2: b.cx,
          y2: b.cy,
          opacity: 0.12 + rand() * 0.12,
        });
        nodes.push({
          cx: b.cx,
          cy: a.cy,
          r: 1.1,
          opacity: 0.32,
          fill: "rgba(167,139,250,0.85)",
        });
      } else {
        traces.push({
          x1: a.cx,
          y1: a.cy,
          x2: b.cx,
          y2: b.cy,
          opacity: 0.1 + rand() * 0.14,
        });
      }
    }
  }

  return { cells, traces, nodes };
}

function toSvg(
  tile: number,
  cells: HexCell[],
  traces: Trace[],
  nodes: Node[],
  tracesOnly = false
): string {
  const hexPaths = tracesOnly
    ? ""
    : cells
        .map(
          (h) =>
            `<path d="${hexPoints(h.cx, h.cy, h.r)}" fill="rgba(34,211,238,0.03)" stroke="${h.stroke}" stroke-opacity="${h.opacity.toFixed(2)}" stroke-width="1"/>`
        )
        .join("");

  const traceLines = traces
    .map(
      (t) =>
        `<line x1="${t.x1.toFixed(1)}" y1="${t.y1.toFixed(1)}" x2="${t.x2.toFixed(1)}" y2="${t.y2.toFixed(1)}" stroke="rgba(34,211,238,1)" stroke-opacity="${t.opacity.toFixed(2)}" stroke-width="1"/>`
    )
    .join("");

  const nodeDots = tracesOnly
    ? ""
    : nodes
        .map(
          (n) =>
            `<circle cx="${n.cx.toFixed(1)}" cy="${n.cy.toFixed(1)}" r="${n.r.toFixed(2)}" fill="${n.fill}" fill-opacity="${n.opacity.toFixed(2)}"/>`
        )
        .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}" viewBox="0 0 ${tile} ${tile}">${hexPaths}${traceLines}${nodeDots}</svg>`;
}

const TILE = PROFILE_PLAN_PRO_HEX_SCATTER_TILE_PX;
const CIRCUIT = buildHexCircuit(TILE, 0xc17c_2026);

export const PROFILE_PLAN_PRO_HEX_CIRCUIT_PATTERN = `url("data:image/svg+xml,${encodeURIComponent(
  toSvg(TILE, CIRCUIT.cells, CIRCUIT.traces, CIRCUIT.nodes)
)}")`;

export const PROFILE_PLAN_PRO_HEX_CIRCUIT_TRACES_PATTERN = `url("data:image/svg+xml,${encodeURIComponent(
  toSvg(TILE, CIRCUIT.cells, CIRCUIT.traces, CIRCUIT.nodes, true)
)}")`;

/** 下層 — 薄い六角のみ（奥行き） */
export { PROFILE_PLAN_PRO_HEX_SCATTER_PATTERN as PROFILE_PLAN_PRO_HEX_CIRCUIT_DEPTH_PATTERN };
