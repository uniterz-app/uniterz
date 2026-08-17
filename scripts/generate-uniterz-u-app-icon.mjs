/**
 * 稲妻 U をアプリアイコン用に書き出す。
 * 原稿: public/brand/uniterz-u-mark.svg
 *
 * Usage: node scripts/generate-uniterz-u-app-icon.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(root, "public/brand/uniterz-u-mark.svg");
const CANVAS = 1024;
const BG = "#041418";
const RIM = "#8AF7FF";
const SOFT = "#00E8FF";

function extractPaths(svg) {
  return [...svg.matchAll(/d="([^"]+)"/g)].map((m) => m[1]);
}

function svgIcon(paths, { pad, glow }) {
  const inner = 1 - pad * 2;
  // 元マークは 12% 余白。アイコン用にさらに縮小して角丸・アダプティブの欠けを避ける
  const s = inner / 0.76;
  const t = ((1 - s) / 2) * CANVAS;
  const letter = paths
    .map((d, i) => `      <path id="u-${i}" d="${d}" fill="#fff"/>`)
    .join("\n");

  const filters = glow
    ? `
    <filter id="soft" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="14" result="b"/>
      <feFlood flood-color="${SOFT}" flood-opacity="0.38"/>
      <feComposite in2="b" operator="in"/>
    </filter>
    <filter id="rim" x="-25%" y="-25%" width="150%" height="150%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="4" result="b"/>
      <feFlood flood-color="${RIM}" flood-opacity="0.85"/>
      <feComposite in2="b" operator="in"/>
    </filter>`
    : "";

  const glowLayers = glow
    ? `
    <g filter="url(#soft)" transform="translate(${t} ${t}) scale(${s})">
${letter}
    </g>
    <g filter="url(#rim)" transform="translate(${t} ${t}) scale(${s})">
${letter}
    </g>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}">
  <defs>${filters}
  </defs>
  <rect width="${CANVAS}" height="${CANVAS}" fill="${BG}"/>
${glowLayers}
  <g transform="translate(${t} ${t}) scale(${s})">
${letter}
  </g>
</svg>
`;
}

async function pngFromSvg(svg, size, outPath) {
  await sharp(Buffer.from(svg))
    .resize(size, size, { fit: "fill" })
    .png()
    .toFile(outPath);
}

async function main() {
  const source = readFileSync(SOURCE, "utf8");
  const paths = extractPaths(source);
  if (paths.length < 1) throw new Error("U パスが見つかりません");

  const iosSvg = svgIcon(paths, { pad: 0.2, glow: true });
  const adaptiveSvg = svgIcon(paths, { pad: 0.26, glow: true });
  const masterSvg = iosSvg;

  const brandDir = join(root, "public/brand");
  const iconNewDir = join(root, "public/icon-new");
  const nativeDir = join(root, "apps/native/assets");
  mkdirSync(brandDir, { recursive: true });
  mkdirSync(iconNewDir, { recursive: true });
  mkdirSync(nativeDir, { recursive: true });

  const masterSvgPath = join(brandDir, "uniterz-u-app-icon.svg");
  const masterPngPath = join(brandDir, "uniterz-u-app-icon.png");
  writeFileSync(masterSvgPath, masterSvg);
  await pngFromSvg(masterSvg, 1024, masterPngPath);

  const pwaSizes = [192, 256, 512, 1024];
  for (const size of pwaSizes) {
    await pngFromSvg(masterSvg, size, join(iconNewDir, `Icon-new${size}.png`));
  }

  await pngFromSvg(iosSvg, 1024, join(nativeDir, "icon.png"));
  await pngFromSvg(adaptiveSvg, 1024, join(nativeDir, "adaptive-icon.png"));
  await pngFromSvg(masterSvg, 48, join(nativeDir, "favicon.png"));
  await pngFromSvg(iosSvg, 1024, join(nativeDir, "splash-icon.png"));

  const nativeBrand = join(nativeDir, "brand");
  mkdirSync(nativeBrand, { recursive: true });
  copyFileSync(masterPngPath, join(nativeBrand, "uniterz-u-app-icon.png"));

  console.log("wrote", masterSvgPath);
  console.log("wrote", masterPngPath);
  console.log("wrote PWA", pwaSizes.map((s) => `Icon-new${s}.png`).join(", "));
  console.log("wrote native icon / adaptive-icon / favicon / splash-icon");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
