/**
 * 選んだ生成画像から黒を抜いて PRO タグ PNG を書き出す。
 * 原稿: public/dev/uniterz-pro-badge-tag-ref.png
 * Usage: node scripts/generate-uniterz-pro-badge.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "public/dev/uniterz-pro-badge-tag-ref.png");
const outDir = join(root, "public/brand");
const nativeDir = join(root, "apps/native/assets/brand");

const { data, info } = await sharp(src)
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
for (let i = 0; i < data.length; i += channels) {
  const lum = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  data[i] = 255;
  data[i + 1] = 255;
  data[i + 2] = 255;
  data[i + 3] = lum < 40 ? 0 : Math.min(255, Math.round(lum));
}

const transparent = await sharp(data, {
  raw: { width, height, channels },
})
  .trim({ threshold: 8 })
  .png()
  .toBuffer();

const trimmed = await sharp(transparent).metadata();
const pad = Math.round(Math.max(trimmed.width, trimmed.height) * 0.06);
const fw = trimmed.width + pad * 2;
const fh = trimmed.height + pad * 2;

const padded = await sharp({
  create: {
    width: fw,
    height: fh,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 0 },
  },
})
  .composite([{ input: transparent, left: pad, top: pad }])
  .png()
  .toBuffer();

const outH = Math.round(2048 * (fh / fw));
const hi = await sharp(padded)
  .resize(2048, outH, { fit: "fill" })
  .png()
  .toBuffer();

const black = await sharp({
  create: {
    width: 2048,
    height: outH,
    channels: 4,
    background: { r: 0, g: 0, b: 0, alpha: 255 },
  },
})
  .composite([{ input: hi, gravity: "center" }])
  .png()
  .toBuffer();

mkdirSync(outDir, { recursive: true });
mkdirSync(nativeDir, { recursive: true });
writeFileSync(join(outDir, "uniterz-pro-badge.png"), hi);
writeFileSync(join(outDir, "uniterz-pro-badge-black.png"), black);
writeFileSync(join(nativeDir, "uniterz-pro-badge.png"), hi);

console.log(`wrote ${2048}x${outH} public/brand/uniterz-pro-badge.png`);
