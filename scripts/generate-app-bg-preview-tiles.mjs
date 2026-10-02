/**
 * アプリ背景プレビュー用タイルを書き出す。
 * Usage: node scripts/generate-app-bg-preview-tiles.mjs
 */
import { copyFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outWeb = join(root, "public/bg/preview");
const outNative = join(root, "apps/native/assets/bg/preview");
const pyramidRefSrc =
  "/Users/rikuto/.cursor/projects/Users-rikuto-Documents-uniterz/assets/__________2026-08-22_1.29.59-1a06f104-3551-49a0-9379-0fc3629ee21c.png";
const meshRefSrc =
  "/Users/rikuto/.cursor/projects/Users-rikuto-Documents-uniterz/assets/__________2026-08-22_1.30.25-a58ad1e3-b3d2-46c7-90d3-1d94d75a0269.png";
const cloverRefSrc =
  "/Users/rikuto/.cursor/projects/Users-rikuto-Documents-uniterz/assets/__________2026-08-22_1.30.40-5f137534-b630-4e41-a46f-0fef68386a73.png";
const dotsRefSrc =
  "/Users/rikuto/.cursor/projects/Users-rikuto-Documents-uniterz/assets/__________2026-08-22_1.40.26-a7d115ab-f54f-40b9-b2c3-760f5b73f5af.png";
const diamondRefSrc =
  "/Users/rikuto/.cursor/projects/Users-rikuto-Documents-uniterz/assets/__________2026-08-22_1.21.03-83f558ec-269e-424f-8c44-62713041fca6.png";

mkdirSync(outWeb, { recursive: true });
mkdirSync(outNative, { recursive: true });

function rgbTile(size, paint) {
  const data = Buffer.alloc(size * size * 3);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const [r, g, b] = paint(x, y);
      const i = (y * size + x) * 3;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }
  return sharp(data, { raw: { width: size, height: size, channels: 3 } }).png();
}

function gray(v) {
  const n = Math.max(0, Math.min(255, Math.round(v)));
  return [n, n, n];
}

function hash2(x, y) {
  const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

async function writeBoth(name, pipeline) {
  const buf = await pipeline.png().toBuffer();
  writeFileSync(join(outWeb, name), buf);
  writeFileSync(join(outNative, name), buf);
}

/** 指定画像：正方形ピラミッド（4面、上から光） */
function pyramidPaint(cell, shades) {
  const { top, left, right, bottom } = shades;
  return (x, y) => {
    const lx = (((x % cell) + cell) % cell) + 0.5;
    const ly = (((y % cell) + cell) % cell) + 0.5;
    const cx = cell / 2;
    const cy = cell / 2;
    const dx = lx - cx;
    const dy = ly - cy;
    const adx = Math.abs(dx);
    const ady = Math.abs(dy);
    let base;
    if (ady >= adx) {
      base = dy <= 0 ? top : bottom;
    } else {
      base = dx <= 0 ? left : right;
    }
    const dist = Math.max(adx, ady) / (cell / 2);
    const ridge = Math.abs(adx - ady) < 0.65 ? 5 : 0;
    const v = base - dist * 7 + ridge;
    const edge = lx < 0.7 || ly < 0.7 || lx > cell - 0.7 || ly > cell - 0.7;
    return gray(edge ? Math.min(v, 12) : v);
  };
}

/** 細い 45° ダイヤ格子（カーボンメッシュ） */
function meshPaint(cell, line, ink, halfW) {
  return (x, y) => {
    const s = ((x + y) % cell + cell) % cell;
    const d = ((x - y) % cell + cell) % cell;
    const a = Math.abs(s - cell / 2);
    const b = Math.abs(d - cell / 2);
    const on = a < halfW || b < halfW;
    if (!on) return gray(ink);
    const dist = Math.min(a, b);
    const v = line - (dist / halfW) * 18;
    return gray(v);
  };
}

/** 四弁の丸み X / クローバー */
function cloverPaint(cell, fill, ink) {
  return (x, y) => {
    const px = (((x % cell) + cell) % cell) + 0.5;
    const py = (((y % cell) + cell) % cell) + 0.5;
    const cx = cell / 2;
    const cy = cell / 2;
    const len = cell * 0.42;
    const rad = cell * 0.22;
    const dirs = [
      [1, 1],
      [1, -1],
      [-1, 1],
      [-1, -1],
    ];
    let minD = 99;
    for (const [dx, dy] of dirs) {
      const ax = cx;
      const ay = cy;
      const bx = cx + dx * len;
      const by = cy + dy * len;
      const vx = bx - ax;
      const vy = by - ay;
      const wx = px - ax;
      const wy = py - ay;
      const c2 = vx * vx + vy * vy;
      const t = Math.max(0, Math.min(1, c2 === 0 ? 0 : (wx * vx + wy * vy) / c2));
      const d = Math.hypot(px - (ax + t * vx), py - (ay + t * vy));
      if (d < minD) minD = d;
    }
    if (minD > rad) return gray(ink);
    const v = fill * (1 - (minD / rad) * 0.35);
    return gray(v);
  };
}

/** 参照画像に近い：黒地に 45° ダイヤ、細い黒格子 */
function diamondPaint(cell, fill, ink) {
  return (x, y) => {
    const cx = ((x % cell) + cell) % cell;
    const cy = ((y % cell) + cell) % cell;
    const dx = Math.abs(cx - cell / 2);
    const dy = Math.abs(cy - cell / 2);
    const inDiamond = dx + dy < cell / 2 - 0.9;
    return gray(inDiamond ? fill : ink);
  };
}

/** 正方グリッドの点 */
function dotsPaint(cell, radius, fill, ink) {
  return (x, y) => {
    const lx = (((x % cell) + cell) % cell) + 0.5;
    const ly = (((y % cell) + cell) % cell) + 0.5;
    const d = Math.hypot(lx - cell / 2, ly - cell / 2);
    if (d > radius) return gray(ink);
    const t = 1 - d / radius;
    return gray(ink + (fill - ink) * Math.min(1, t * 1.35));
  };
}

/** 細かい中空リング格子（明度にわずかなムラ） */
function ringGridPaint(cell, rOuter, rInner, base, ink) {
  return (x, y) => {
    const cx = Math.floor(x / cell);
    const cy = Math.floor(y / cell);
    const lx = x - cx * cell + 0.5 - cell / 2;
    const ly = y - cy * cell + 0.5 - cell / 2;
    const d = Math.hypot(lx, ly);
    if (d > rOuter || d < rInner) return gray(ink);
    const mottled = 0.72 + 0.28 * hash2(cx * 1.7 + 0.3, cy * 2.3 - 0.1);
    const edge = 1 - Math.abs((d - (rOuter + rInner) / 2) / ((rOuter - rInner) / 2));
    const v = ink + (base * mottled - ink) * Math.max(0.35, edge);
    return gray(v);
  };
}

const tiles = [
  {
    name: "pyramid-fine.png",
    size: 128,
    paint: pyramidPaint(16, { top: 92, left: 58, right: 28, bottom: 10 }),
  },
  {
    name: "pyramid-mid.png",
    size: 128,
    paint: pyramidPaint(32, { top: 98, left: 62, right: 30, bottom: 10 }),
  },
  {
    name: "mesh-fine.png",
    size: 128,
    paint: meshPaint(16, 118, 8, 1.45),
  },
  {
    name: "clover-fine.png",
    size: 128,
    paint: cloverPaint(32, 96, 8),
  },
  {
    name: "dot-grid.png",
    size: 32,
    paint: dotsPaint(32, 2.15, 210, 0),
  },
  {
    name: "ring-grid.png",
    size: 128,
    paint: ringGridPaint(8, 3.15, 1.55, 42, 4),
  },
  {
    name: "diamond-fine.png",
    size: 128,
    paint: diamondPaint(8, 46, 6),
  },
  {
    name: "diamond-mid.png",
    size: 128,
    paint: diamondPaint(16, 52, 7),
  },
  {
    name: "diamond-soft.png",
    size: 128,
    paint: diamondPaint(16, 34, 8),
  },
  {
    name: "carbon.png",
    size: 128,
    paint: (x, y) => {
      const a = (x + y * 2) % 8 < 4;
      const b = (x * 2 + y) % 8 < 4;
      const v = a ? (b ? 32 : 22) : b ? 18 : 12;
      return gray(v);
    },
  },
  {
    name: "grid-hud.png",
    size: 128,
    paint: (x, y) => {
      const line = x % 16 === 0 || y % 16 === 0;
      const fine = x % 4 === 0 || y % 4 === 0;
      if (line) return gray(38);
      if (fine) return gray(16);
      return gray(7);
    },
  },
  {
    name: "dots.png",
    size: 128,
    paint: (x, y) => {
      const cx = ((x % 10) + 10) % 10;
      const cy = ((y % 10) + 10) % 10;
      const d = Math.hypot(cx - 5, cy - 5);
      return gray(d < 1.35 ? 40 : 7);
    },
  },
  {
    name: "hex.png",
    size: 128,
    paint: (x, y) => {
      const colW = 14;
      const rowH = 12;
      const col = Math.floor(x / colW);
      const row = Math.floor(y / rowH);
      const ox = x - col * colW;
      const oy = y - row * rowH + (col % 2 === 0 ? 0 : rowH / 2);
      const dx = Math.abs(ox - colW / 2);
      const dy = Math.abs(oy - rowH / 2);
      const onEdge = Math.abs(dx * 0.866 + dy * 0.5 - 5.2) < 0.7;
      return gray(onEdge ? 36 : 7);
    },
  },
  {
    name: "hairline.png",
    size: 128,
    paint: (x, y) => {
      const v = 10 + ((x * 17 + y * 3) % 7) + (y % 3 === 0 ? 8 : 0);
      return gray(v);
    },
  },
  {
    name: "flat.png",
    size: 32,
    paint: () => gray(8),
  },
];

for (const tile of tiles) {
  await writeBoth(tile.name, rgbTile(tile.size, tile.paint));
}

async function writeRefPair(src, coverName, tileName) {
  const meta = await sharp(src).metadata();
  const w = meta.width ?? 1024;
  const h = meta.height ?? 1024;
  const cover = await sharp(src)
    .resize(1024, 1024, { fit: "cover" })
    .png()
    .toBuffer();
  writeFileSync(join(outWeb, coverName), cover);
  writeFileSync(join(outNative, coverName), cover);

  const crop = Math.min(w, h, 280);
  const left = Math.max(0, Math.round((w - crop) / 2));
  const top = Math.max(0, Math.round((h - crop) / 2));
  const tileRef = await sharp(src)
    .extract({ left, top, width: crop, height: crop })
    .resize(128, 128)
    .png()
    .toBuffer();
  writeFileSync(join(outWeb, tileName), tileRef);
  writeFileSync(join(outNative, tileName), tileRef);
}

/** クローバー写真: 中央の柄だけ抜き、縦長画面でも上端まで続くタイルにする */
async function writeCloverFillAssets(src) {
  const meta = await sharp(src).metadata();
  const w = meta.width ?? 850;
  const h = meta.height ?? 738;
  /** 端のビネットを避けて中央を抜く */
  const insetX = Math.round(w * 0.18);
  const insetY = Math.round(h * 0.16);
  const cropW = w - insetX * 2;
  const cropH = h - insetY * 2;
  const period = Math.min(cropW, cropH, 168);
  const left = insetX + Math.round((cropW - period) / 2);
  const top = insetY + Math.round((cropH - period) / 2);

  const tile128 = await sharp(src)
    .extract({ left, top, width: period, height: period })
    .resize(128, 128, { kernel: sharp.kernel.lanczos3 })
    .modulate({ brightness: 1.18 })
    .png()
    .toBuffer();
  writeFileSync(join(outWeb, "ref-clover-tile.png"), tile128);
  writeFileSync(join(outNative, "ref-clover-tile.png"), tile128);

  /** 縦長 cover 用: タイルを敷き詰めた画面サイズ相当（上端まで柄） */
  const fillW = 1170;
  const fillH = 2532;
  const cell = 96;
  const tile96 = await sharp(tile128).resize(cell, cell).png().toBuffer();
  const comps = [];
  for (let y = 0; y < fillH; y += cell) {
    for (let x = 0; x < fillW; x += cell) {
      comps.push({ input: tile96, left: x, top: y });
    }
  }
  const fill = await sharp({
    create: {
      width: fillW,
      height: fillH,
      channels: 3,
      background: { r: 0, g: 0, b: 0 },
    },
  })
    .composite(comps)
    .png()
    .toBuffer();
  writeFileSync(join(outWeb, "ref-clover.png"), fill);
  writeFileSync(join(outNative, "ref-clover.png"), fill);
}

try {
  await writeRefPair(pyramidRefSrc, "ref-pyramid.png", "ref-pyramid-tile.png");
} catch (err) {
  console.warn("pyramid ref copy skipped:", err instanceof Error ? err.message : err);
}

try {
  await writeRefPair(meshRefSrc, "ref-mesh.png", "ref-mesh-tile.png");
} catch (err) {
  console.warn("mesh ref copy skipped:", err instanceof Error ? err.message : err);
}

try {
  await writeCloverFillAssets(cloverRefSrc);
} catch (err) {
  console.warn("clover fill skipped:", err instanceof Error ? err.message : err);
}

try {
  await writeRefPair(dotsRefSrc, "ref-dots.png", "ref-dots-tile.png");
} catch (err) {
  console.warn("dots ref copy skipped:", err instanceof Error ? err.message : err);
}

try {
  await writeRefPair(diamondRefSrc, "ref-diamond.png", "ref-diamond-tile.png");
} catch (err) {
  console.warn("diamond ref copy skipped:", err instanceof Error ? err.message : err);
}

/** —— 写真ではなく生成する大気テクスチャ（縦長 cover） —— */
function valueNoise(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  const ux = fx * fx * (3 - 2 * fx);
  const uy = fy * fy * (3 - 2 * fy);
  const a = hash2(x0, y0);
  const b = hash2(x0 + 1, y0);
  const c = hash2(x0, y0 + 1);
  const d = hash2(x0 + 1, y0 + 1);
  return a + (b - a) * ux + (c - a) * uy + (a - b - c + d) * ux * uy;
}

function fbm(x, y, octaves) {
  let v = 0;
  let a = 0.5;
  let f = 1;
  for (let i = 0; i < octaves; i++) {
    v += a * valueNoise(x * f, y * f);
    f *= 2.03;
    a *= 0.5;
  }
  return v;
}

function vignette(nx, ny, strength) {
  const dx = (nx - 0.5) * 1.15;
  const dy = (ny - 0.42) * 1.05;
  const r = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0, 1 - Math.pow(r, 1.35) * strength);
}

async function writePortraitTexture(name, paint) {
  const w = 585;
  const h = 1266;
  const data = Buffer.alloc(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const [r, g, b] = paint(x, y, w, h);
      const i = (y * w + x) * 3;
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
  }
  const buf = await sharp(data, { raw: { width: w, height: h, channels: 3 } })
    .resize(1170, 2532, { kernel: sharp.kernel.lanczos3 })
    .png()
    .toBuffer();
  writeFileSync(join(outWeb, name), buf);
  writeFileSync(join(outNative, name), buf);
}

/** スモーク: 柔らかい雲、中央わずかに明るく、黒を強め */
await writePortraitTexture("gen-smoke.png", (x, y, w, h) => {
  const nx = x / w;
  const ny = y / h;
  const n =
    fbm(nx * 2.6 + 2.1, ny * 3.4 + 0.7, 6) * 0.78 +
    fbm(nx * 6.2 - 1.4, ny * 7.5 + 3.2, 3) * 0.22;
  const vig = vignette(nx, ny, 1.75);
  /** 写真より黒寄り。中央ピークも抑えめ */
  const peak = 58;
  const floor = 2;
  const v = floor + Math.max(0, (n - 0.22) * peak * vig);
  return gray(v);
});

/** グリット: ざらつき多め、下ほど暗い */
await writePortraitTexture("gen-grit.png", (x, y, w, h) => {
  const nx = x / w;
  const ny = y / h;
  const n =
    fbm(nx * 4.8, ny * 6.2, 4) * 0.42 +
    fbm(nx * 22 + 4, ny * 28 - 2, 3) * 0.38 +
    hash2(x * 0.91, y * 1.17) * 0.2;
  const vig = vignette(nx, ny, 1.5);
  const bottom = 1 - ny * 0.42;
  const peak = 64;
  const v = Math.max(0, (n - 0.12) * peak * vig * bottom);
  return gray(v);
});

/** ストーン: 多孔質・硬い粒、中央に薄い十字ハイライト */
await writePortraitTexture("gen-stone.png", (x, y, w, h) => {
  const nx = x / w;
  const ny = y / h;
  const base = fbm(nx * 7.2 + 1.1, ny * 9.0 - 0.6, 5);
  const pore = fbm(nx * 36 + 2, ny * 42 - 1, 3);
  const grain = hash2(x * 1.3, y * 1.7);
  const n = base * 0.45 + pore * 0.35 + grain * 0.2;
  const cross =
    Math.exp(-Math.abs(nx - 0.5) * 8) * 0.28 +
    Math.exp(-Math.abs(ny - 0.45) * 6.5) * 0.22;
  const vig = vignette(nx, ny, 1.6);
  const peak = 56;
  const v = Math.max(0, (n * 0.9 + cross * 0.55 - 0.08) * peak * vig);
  return gray(v);
});

const currentMesh = join(root, "public/bg/preview/ring-grid.png");
copyFileSync(currentMesh, join(root, "public/bg/app-mesh.png"));
copyFileSync(currentMesh, join(root, "apps/native/assets/bg/app-mesh.png"));
copyFileSync(currentMesh, join(outWeb, "current-mesh.png"));
copyFileSync(currentMesh, join(outNative, "current-mesh.png"));

console.log("wrote app bg preview tiles → public/bg/preview + apps/native/assets/bg/preview");
console.log("applied ring-grid → public/bg/app-mesh.png + apps/native/assets/bg/app-mesh.png");
