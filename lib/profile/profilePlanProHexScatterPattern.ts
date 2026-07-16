/** ランダム散布六角形 — SVG タイル（CSS background 用） */

type HexSpec = {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  stroke: string;
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

function buildHexScatterSpecs(tile: number, count: number, seed: number): HexSpec[] {
  const rand = mulberry32(seed);
  const specs: HexSpec[] = [];
  const strokes = [
    "rgba(34,211,238,1)",
    "rgba(103,232,249,1)",
    "rgba(167,139,250,1)",
    "rgba(79,247,244,1)",
  ];

  for (let i = 0; i < count; i += 1) {
    specs.push({
      cx: rand() * tile,
      cy: rand() * tile,
      r: 6 + rand() * 16,
      opacity: 0.1 + rand() * 0.18,
      stroke: strokes[Math.floor(rand() * strokes.length)]!,
    });
  }

  return specs;
}

function specsToSvg(tile: number, specs: HexSpec[]): string {
  const paths = specs
    .map(
      (h) =>
        `<path d="${hexPoints(h.cx, h.cy, h.r)}" fill="none" stroke="${h.stroke}" stroke-opacity="${h.opacity.toFixed(2)}" stroke-width="1"/>`
    )
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${tile}" height="${tile}" viewBox="0 0 ${tile} ${tile}">${paths}</svg>`;
}

const TILE = 280;
const SCATTER_SPECS = buildHexScatterSpecs(TILE, 26, 0x7e4a_2026);

export const PROFILE_PLAN_PRO_HEX_SCATTER_TILE_PX = TILE;

export const PROFILE_PLAN_PRO_HEX_SCATTER_PATTERN = `url("data:image/svg+xml,${encodeURIComponent(
  specsToSvg(TILE, SCATTER_SPECS)
)}")`;

/** 二層目 — 位相ずらし用 */
const SCATTER_SPECS_ALT = buildHexScatterSpecs(TILE, 18, 0x9c31_2026);

export const PROFILE_PLAN_PRO_HEX_SCATTER_PATTERN_ALT = `url("data:image/svg+xml,${encodeURIComponent(
  specsToSvg(TILE, SCATTER_SPECS_ALT)
)}")`;
