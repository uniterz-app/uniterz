/** 六角レイアウト — パネル全体を 1 枚で描画（タイル反復なし・継ぎ目なし） */

export type ProfilePlanProHexLayoutId =
  | "grid"
  | "honeycomb"
  | "stagger"
  | "radial"
  | "corners"
  | "corners-l"
  | "corners-quad"
  | "spine";

/** 描画キャンバス — 縦長（モバイルカード相当のアスペクト） */
export const PROFILE_PLAN_PRO_HEX_LAYOUT_W = 300;
export const PROFILE_PLAN_PRO_HEX_LAYOUT_H = 430;

/** @deprecated 旧タイル幅。W を参照 */
export const PROFILE_PLAN_PRO_HEX_LAYOUT_TILE_PX = PROFILE_PLAN_PRO_HEX_LAYOUT_W;

export type HexCell = {
  cx: number;
  cy: number;
  r: number;
  opacity: number;
  stroke: string;
};

export type ProfilePlanProHexLayoutArt = {
  cells: HexCell[];
};

const CYAN = "rgba(34,211,238,1)";
const VIOLET = "rgba(167,139,250,1)";
const TEAL = "rgba(103,232,249,1)";

const W = PROFILE_PLAN_PRO_HEX_LAYOUT_W;
const H = PROFILE_PLAN_PRO_HEX_LAYOUT_H;

type HexOrientation = "flat" | "pointy";

type BuildOpts = {
  r: number;
  orientation: HexOrientation;
  include?: (col: number, row: number) => boolean;
  style?: (col: number, row: number) => Pick<HexCell, "stroke" | "opacity"> | null;
};

function hex(cx: number, cy: number, r: number, stroke = CYAN, opacity = 0.2): HexCell {
  return { cx, cy, r, stroke, opacity };
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** 座標から決まる 0..1 の疑似乱数（毎回同じ＝配置は固定、値だけばらつく） */
function hash01(a: number, b: number): number {
  const n = Math.sin(a * 12.9898 + b * 78.233) * 43758.5453;
  return n - Math.floor(n);
}

const VARIED_STROKES = [CYAN, TEAL, VIOLET, CYAN, TEAL] as const;

/** 不透明度・色を 1 個ずつばらつかせる（決定論的） */
function variedStyle(
  col: number,
  row: number
): Pick<HexCell, "stroke" | "opacity"> {
  const h = hash01(col, row);
  const h2 = hash01(col * 1.7 + 3.1, row * 0.9 + 5.7);
  const opacity = round1(0.09 + h * 0.28); // 0.09〜0.37
  const stroke = VARIED_STROKES[Math.floor(h2 * VARIED_STROKES.length)] ?? CYAN;
  return { stroke, opacity };
}

/** フラット／ポインティ頂点の整列ハニカム（パネル全体を充填） */
function buildAlignedHoneycomb({
  r,
  orientation,
  include,
  style,
}: BuildOpts): HexCell[] {
  const cells: HexCell[] = [];

  if (orientation === "flat") {
    const colStep = Math.sqrt(3) * r;
    const rowStep = 1.5 * r;
    const cols = Math.ceil(W / colStep) + 2;
    const rows = Math.ceil(H / rowStep) + 2;
    const offsetX = colStep / 2;
    const offsetY = r;

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        if (include && !include(col, row)) continue;
        const cx = round1(col * colStep + (row % 2) * (colStep / 2) + offsetX);
        const cy = round1(row * rowStep + offsetY);
        if (cx < -r || cy < -r || cx > W + r || cy > H + r) continue;
        const accent = style?.(col, row) ?? variedStyle(col, row);
        cells.push(hex(cx, cy, r, accent.stroke, accent.opacity));
      }
    }
    return cells;
  }

  const colStep = 1.5 * r;
  const rowStep = Math.sqrt(3) * r;
  const cols = Math.ceil(W / colStep) + 2;
  const rows = Math.ceil(H / rowStep) + 2;
  const offsetX = r;
  const offsetY = rowStep / 2;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      if (include && !include(col, row)) continue;
      const cx = round1(col * colStep + offsetX);
      const cy = round1(row * rowStep + (col % 2) * (rowStep / 2) + offsetY);
      if (cx < -r || cy < -r || cx > W + r || cy > H + r) continue;
      const accent = style?.(col, row) ?? variedStyle(col, row);
      cells.push(hex(cx, cy, r, accent.stroke, accent.opacity));
    }
  }
  return cells;
}

/** 方眼 — 正方格子上に六角 */
function layoutGrid(): ProfilePlanProHexLayoutArt {
  const r = 12;
  const step = r * 2 + 6;
  const cells: HexCell[] = [];
  const cols = Math.floor(W / step);
  const rows = Math.floor(H / step);
  const padX = (W - (cols - 1) * step) / 2;
  const padY = (H - (rows - 1) * step) / 2;

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const accent = variedStyle(col, row);
      cells.push(
        hex(round1(padX + col * step), round1(padY + row * step), r, accent.stroke, accent.opacity)
      );
    }
  }
  return { cells };
}

/** ハニカム — 密なフラットトップ */
function layoutHoneycomb(): ProfilePlanProHexLayoutArt {
  return { cells: buildAlignedHoneycomb({ r: 11, orientation: "flat" }) };
}

/** 千鳥 — ポインティトップ */
function layoutStagger(): ProfilePlanProHexLayoutArt {
  return { cells: buildAlignedHoneycomb({ r: 11, orientation: "pointy" }) };
}

/** チェッカー — 整列ハニカムの交互強調 */
function layoutRadial(): ProfilePlanProHexLayoutArt {
  return {
    cells: buildAlignedHoneycomb({
      r: 11,
      orientation: "flat",
      style: (col, row) =>
        (col + row) % 2 === 0
          ? { stroke: CYAN, opacity: 0.24 }
          : { stroke: VIOLET, opacity: 0.14 },
    }),
  };
}

/** 四隅ミニハニカム */
function buildCornerCluster(
  anchorX: number,
  anchorY: number,
  r: number,
  flipX: boolean,
  flipY: boolean,
  accentStroke = CYAN
): HexCell[] {
  const colStep = Math.sqrt(3) * r;
  const rowStep = 1.5 * r;
  const slots = [
    { col: 0, row: 0, stroke: accentStroke, opacity: 0.24 },
    { col: 1, row: 0, stroke: TEAL, opacity: 0.2 },
    { col: 0, row: 1, stroke: CYAN, opacity: 0.18 },
    { col: 1, row: 1, stroke: VIOLET, opacity: 0.16 },
    { col: 2, row: 0, stroke: CYAN, opacity: 0.17 },
    { col: 0, row: 2, stroke: TEAL, opacity: 0.17 },
  ];

  return slots.map(({ col, row, stroke, opacity }) => {
    const lx = col * colStep + (row % 2) * (colStep / 2);
    const ly = row * rowStep;
    const cx = round1(flipX ? anchorX - lx : anchorX + lx);
    const cy = round1(flipY ? anchorY - ly : anchorY + ly);
    return hex(cx, cy, r, stroke, opacity);
  });
}

function layoutCorners(): ProfilePlanProHexLayoutArt {
  const r = 11;
  const inset = 14;

  return {
    cells: [
      ...buildCornerCluster(inset, inset, r, false, false, TEAL),
      ...buildCornerCluster(W - inset, inset, r, true, false, VIOLET),
      ...buildCornerCluster(inset, H - inset, r, false, true, CYAN),
      ...buildCornerCluster(W - inset, H - inset, r, true, true, TEAL),
    ],
  };
}

/** 四隅 L 字 — 辺に沿った整列 */
function layoutCornersL(): ProfilePlanProHexLayoutArt {
  const r = 10;
  const step = Math.sqrt(3) * r;
  const inset = 16;
  const count = 4;
  const cells: HexCell[] = [];

  const pushL = (
    ox: number,
    oy: number,
    dirX: 1 | -1,
    dirY: 1 | -1,
    stroke: string
  ) => {
    for (let i = 0; i < count; i += 1) {
      cells.push(hex(round1(ox + dirX * i * step), oy, r, stroke, 0.2 - i * 0.02));
      if (i === 0) continue;
      cells.push(hex(ox, round1(oy + dirY * i * 1.5 * r), r, stroke, 0.18 - i * 0.015));
    }
    cells.push(hex(ox, oy, r, stroke, 0.26));
  };

  pushL(inset, inset, 1, 1, TEAL);
  pushL(W - inset, inset, -1, 1, VIOLET);
  pushL(inset, H - inset, 1, -1, CYAN);
  pushL(W - inset, H - inset, -1, -1, TEAL);

  return { cells };
}

/** 四隅象限 — 各コーナー領域に小グリッド */
function layoutCornersQuad(): ProfilePlanProHexLayoutArt {
  const r = 9;
  const colStep = Math.sqrt(3) * r;
  const rowStep = 1.5 * r;
  const zone = 96;
  const cells: HexCell[] = [];

  const quadrants = [
    { x0: 0, y0: 0, flipX: false, flipY: false },
    { x0: W, y0: 0, flipX: true, flipY: false },
    { x0: 0, y0: H, flipX: false, flipY: true },
    { x0: W, y0: H, flipX: true, flipY: true },
  ] as const;

  for (const q of quadrants) {
    for (let row = 0; row < 5; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const lx = 12 + col * colStep + (row % 2) * (colStep / 2);
        const ly = 12 + row * rowStep;
        if (lx > zone || ly > zone) continue;
        const cx = round1(q.flipX ? q.x0 - lx : q.x0 + lx);
        const cy = round1(q.flipY ? q.y0 - ly : q.y0 + ly);
        cells.push(
          hex(
            cx,
            cy,
            r,
            (col + row) % 2 === 0 ? CYAN : VIOLET,
            0.14 + ((col + row) % 3) * 0.02
          )
        );
      }
    }
  }

  return { cells };
}

/** カラム — 等間隔の縦列だけ */
function layoutSpine(): ProfilePlanProHexLayoutArt {
  return {
    cells: buildAlignedHoneycomb({
      r: 11,
      orientation: "flat",
      include: (col) => col % 3 === 0,
    }),
  };
}

export function hexCellToPathD(cell: HexCell): string {
  return hexPoints(cell.cx, cell.cy, cell.r);
}

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i += 1) {
    const a = (Math.PI / 3) * i - Math.PI / 6;
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join(" L")} Z`;
}

function toSvg(art: ProfilePlanProHexLayoutArt, faint = false): string {
  const hexPaths = art.cells
    .map((h) => {
      const opacity = faint ? h.opacity * 0.45 : h.opacity;
      const fill = faint ? "rgba(34,211,238,0.015)" : "rgba(34,211,238,0.03)";
      return `<path d="${hexPoints(h.cx, h.cy, h.r)}" fill="${fill}" stroke="${h.stroke}" stroke-opacity="${opacity.toFixed(2)}" stroke-width="1"/>`;
    })
    .join("");

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none">${hexPaths}</svg>`;
}

const BUILDERS: Record<ProfilePlanProHexLayoutId, () => ProfilePlanProHexLayoutArt> = {
  grid: layoutGrid,
  honeycomb: layoutHoneycomb,
  stagger: layoutStagger,
  radial: layoutRadial,
  corners: layoutCorners,
  "corners-l": layoutCornersL,
  "corners-quad": layoutCornersQuad,
  spine: layoutSpine,
};

export function getProfilePlanProHexLayoutArt(
  layout: ProfilePlanProHexLayoutId
): ProfilePlanProHexLayoutArt {
  return BUILDERS[layout]();
}

function toPatternUrl(art: ProfilePlanProHexLayoutArt, faint = false): string {
  return `url("data:image/svg+xml,${encodeURIComponent(toSvg(art, faint))}")`;
}

export function getProfilePlanProHexLayoutPatterns(layout: ProfilePlanProHexLayoutId) {
  const art = getProfilePlanProHexLayoutArt(layout);
  return {
    pattern: toPatternUrl(art),
    depth: toPatternUrl(art, true),
  };
}

export function parseProfilePlanProHexLayoutFromVariant(
  variant: string
): ProfilePlanProHexLayoutId | null {
  if (!variant.startsWith("geo-hex-layout-")) return null;
  const id = variant.slice("geo-hex-layout-".length) as ProfilePlanProHexLayoutId;
  return id in BUILDERS ? id : null;
}
