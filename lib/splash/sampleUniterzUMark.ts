/**
 * UNITERZ U マーク path を点群にサンプリング（Void Corona formU 用）。
 * viewBox 1024 座標系。中心は (512, 512)。
 */
import {
  UNITERZ_U_MARK_PATHS,
  UNITERZ_U_MARK_VIEWBOX,
} from "../units/uniterzUMark";

export type UMarkSample = { x: number; y: number };

function mulberry32(seed: number) {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

type Pt = { x: number; y: number };

function cubic(
  p0: Pt,
  p1: Pt,
  p2: Pt,
  p3: Pt,
  t: number
): Pt {
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;
  return {
    x: uuu * p0.x + 3 * uu * t * p1.x + 3 * u * tt * p2.x + ttt * p3.x,
    y: uuu * p0.y + 3 * uu * t * p1.y + 3 * u * tt * p2.y + ttt * p3.y,
  };
}

/** SVG path（M/L/C/Z、カンマ/空白区切り）を折れ線サンプルへ */
function samplePathD(d: string, stepsPerCubic = 14): Pt[] {
  const tokens = d.match(/[MLCZ]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) ?? [];
  const out: Pt[] = [];
  let i = 0;
  let cmd = "";
  let cx = 0;
  let cy = 0;
  let startX = 0;
  let startY = 0;

  const readNum = () => {
    const n = Number(tokens[i++]);
    return Number.isFinite(n) ? n : 0;
  };

  while (i < tokens.length) {
    const t = tokens[i];
    if (/^[MLCZ]$/i.test(t)) {
      cmd = t.toUpperCase();
      i++;
      continue;
    }
    if (!cmd) {
      i++;
      continue;
    }

    if (cmd === "M") {
      cx = readNum();
      cy = readNum();
      startX = cx;
      startY = cy;
      out.push({ x: cx, y: cy });
      cmd = "L";
    } else if (cmd === "L") {
      const x = readNum();
      const y = readNum();
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.hypot(dx, dy);
      const steps = Math.max(2, Math.ceil(dist / 6));
      for (let s = 1; s <= steps; s++) {
        const u = s / steps;
        out.push({ x: cx + dx * u, y: cy + dy * u });
      }
      cx = x;
      cy = y;
    } else if (cmd === "C") {
      const p0 = { x: cx, y: cy };
      const p1 = { x: readNum(), y: readNum() };
      const p2 = { x: readNum(), y: readNum() };
      const p3 = { x: readNum(), y: readNum() };
      for (let s = 1; s <= stepsPerCubic; s++) {
        out.push(cubic(p0, p1, p2, p3, s / stepsPerCubic));
      }
      cx = p3.x;
      cy = p3.y;
    } else if (cmd === "Z") {
      const dx = startX - cx;
      const dy = startY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > 0.5) {
        const steps = Math.max(2, Math.ceil(dist / 6));
        for (let s = 1; s <= steps; s++) {
          const u = s / steps;
          out.push({ x: cx + dx * u, y: cy + dy * u });
        }
      }
      cx = startX;
      cy = startY;
      cmd = "";
    } else {
      i++;
    }
  }
  return out;
}

/**
 * U シルエット用の点群。
 * 輪郭 + 法線方向の厚みジッタで「粒子の塊としての U」になる。
 */
export function sampleUniterzUMarkPoints(count: number, seed = 0x55aa11): UMarkSample[] {
  const raw: Pt[] = [];
  for (const d of UNITERZ_U_MARK_PATHS) {
    raw.push(...samplePathD(d, 18));
  }
  if (raw.length === 0) return [];

  const rand = mulberry32(seed ^ count);
  const half = UNITERZ_U_MARK_VIEWBOX * 0.5;
  const out: UMarkSample[] = new Array(count);

  // 輪郭に沿った接線も近似するため、隣接点から法線を取る
  for (let i = 0; i < count; i++) {
    const idx = Math.floor(rand() * raw.length) % raw.length;
    const p = raw[idx];
    const prev = raw[(idx - 1 + raw.length) % raw.length];
    const next = raw[(idx + 1) % raw.length];
    let tx = next.x - prev.x;
    let ty = next.y - prev.y;
    const tl = Math.hypot(tx, ty) || 1;
    tx /= tl;
    ty /= tl;
    // 法線
    const nx = -ty;
    const ny = tx;
    // ストローク厚み（内側寄り多め）
    const thick = (rand() - 0.35) * 38;
    const along = (rand() - 0.5) * 4;
    out[i] = {
      x: (p.x + nx * thick + tx * along - half) / UNITERZ_U_MARK_VIEWBOX,
      y: (p.y + ny * thick + ty * along - half) / UNITERZ_U_MARK_VIEWBOX,
    };
  }
  return out;
}
