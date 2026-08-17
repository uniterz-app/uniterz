/**
 * 塗りつぶし UNITERZ ロゴ → 角の崩れない白アウトライン PNG。
 *
 * 1) 硬二値マスク
 * 2) morphological close で AA の欠け・微小ノッチを埋める
 * 3) 高解像度で dilate−erode リング（線）
 * 4) lanczos 縮小
 *
 * Usage: npx tsx scripts/generate-uniterz-logo-outline-png.ts
 */
import { mkdirSync, readFileSync, writeFileSync, unlinkSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(fileURLToPath(new URL(".", import.meta.url)), "..");
const SOURCE = join(root, "apps/native/assets/brand/uniterz-logo.png");

const OUT_W = 1024;
const OUT_H = 682;
const FILL_LUMA = 228;
const HI = 5;
/** close 半径（HI 座標）— 欠け埋め */
const CLOSE_R = 2;
/** 線の片側太さ（HI 座標） */
const STROKE_R = 6;
const PAD = 40;

function luma(r: number, g: number, b: number) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function dilate(
  mask: Uint8Array,
  w: number,
  h: number,
  radius: number
): Uint8Array {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let on = 0;
      for (let dy = -radius; dy <= radius && !on; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
          if (mask[ny * w + nx]) on = 1;
        }
      }
      out[y * w + x] = on;
    }
  }
  return out;
}

function erode(
  mask: Uint8Array,
  w: number,
  h: number,
  radius: number
): Uint8Array {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let on = 1;
      for (let dy = -radius; dy <= radius && on; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) {
            on = 0;
            break;
          }
          if (!mask[ny * w + nx]) {
            on = 0;
            break;
          }
        }
      }
      out[y * w + x] = on;
    }
  }
  return out;
}

async function main() {
  const srcBuf = readFileSync(SOURCE);
  const { data, info } = await sharp(srcBuf)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const sw = info.width;
  const sh = info.height;
  const mw = sw + PAD * 2;
  const mh = sh + PAD * 2;

  const fill0 = new Uint8Array(mw * mh);
  for (let y = 0; y < mh; y++) {
    for (let x = 0; x < mw; x++) {
      const sx = x - PAD;
      const sy = y - PAD;
      if (sx < 0 || sy < 0 || sx >= sw || sy >= sh) continue;
      const i = (sy * sw + sx) * 4;
      if (data[i + 3]! < 40) continue;
      if (luma(data[i]!, data[i + 1]!, data[i + 2]!) >= FILL_LUMA) {
        fill0[y * mw + x] = 1;
      }
    }
  }

  const hiW = mw * HI;
  const hiH = mh * HI;
  const fillHi = new Uint8Array(hiW * hiH);
  for (let y = 0; y < hiH; y++) {
    for (let x = 0; x < hiW; x++) {
      fillHi[y * hiW + x] =
        fill0[Math.floor(y / HI) * mw + Math.floor(x / HI)]!;
    }
  }

  // 欠け・微小ノッチを埋めてから輪郭（角のスパイク防止）
  const closed = erode(dilate(fillHi, hiW, hiH, CLOSE_R), hiW, hiH, CLOSE_R);
  const outer = dilate(closed, hiW, hiH, STROKE_R);
  const inner = erode(closed, hiW, hiH, STROKE_R);
  const ring = new Uint8Array(hiW * hiH);
  for (let i = 0; i < ring.length; i++) {
    ring[i] = outer[i]! && !inner[i]! ? 1 : 0;
  }

  const ringRgba = Buffer.alloc(hiW * hiH * 4);
  for (let i = 0; i < hiW * hiH; i++) {
    const o = i * 4;
    ringRgba[o + 3] = 255;
    if (ring[i]) {
      ringRgba[o] = ringRgba[o + 1] = ringRgba[o + 2] = 255;
    }
  }

  const cropped = await sharp(ringRgba, {
    raw: { width: hiW, height: hiH, channels: 4 },
  })
    .extract({
      left: PAD * HI,
      top: PAD * HI,
      width: sw * HI,
      height: sh * HI,
    })
    .resize(OUT_W, OUT_H, {
      fit: "fill",
      kernel: sharp.kernel.lanczos3,
    })
    .png()
    .toBuffer();

  const pngOut = await sharp({
    create: {
      width: OUT_W,
      height: OUT_H,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 1 },
    },
  })
    .composite([{ input: cropped, blend: "over" }])
    .png()
    .toBuffer();

  for (const target of [
    join(root, "public/brand/uniterz-logo.png"),
    join(root, "apps/native/assets/brand/uniterz-logo.png"),
  ]) {
    mkdirSync(dirname(target), { recursive: true });
    await sharp(pngOut).toFile(target);
    console.log("wrote", target);
  }

  // Web 用: PNG を参照する簡易 SVG（パス崩れを避ける）
  const svgOut = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${OUT_W}" height="${OUT_H}" viewBox="0 0 ${OUT_W} ${OUT_H}">
  <rect width="100%" height="100%" fill="#000000"/>
  <image width="${OUT_W}" height="${OUT_H}" href="/brand/uniterz-logo.png" xlink:href="/brand/uniterz-logo.png"/>
</svg>
`;
  writeFileSync(join(root, "public/brand/uniterz-logo.svg"), svgOut);
  console.log("wrote public/brand/uniterz-logo.svg (png wrapper)");

  // Native は PNG を正とする（パス自動生成は角崩れしやすいので停止）
  const ts = `/**
 * UNITERZ アウトラインは PNG 焼き込みを正とする。
 * 再生成: npx tsx scripts/generate-uniterz-logo-outline-png.ts
 */
export const UNITERZ_OUTLINE_VIEWBOX = "0 0 ${OUT_W} ${OUT_H}" as const;
export const UNITERZ_OUTLINE_PATHS = [] as const;
export const UNITERZ_OUTLINE_STROKE_WIDTH = 0;
export const UNITERZ_OUTLINE_FILLED = true;
export const UNITERZ_OUTLINE_USE_PNG = true;
`;
  writeFileSync(join(root, "lib/units/uniterzLogoOutlinePaths.ts"), ts);
  console.log("wrote lib/units/uniterzLogoOutlinePaths.ts");

  for (const f of [
    "public/brand/_debug-t.png",
    "public/brand/_debug-ut.png",
    "public/brand/_debug-t-zoom.png",
    "public/brand/_debug-src-t-zoom.png",
  ]) {
    try {
      unlinkSync(join(root, f));
    } catch {
      /* ignore */
    }
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
