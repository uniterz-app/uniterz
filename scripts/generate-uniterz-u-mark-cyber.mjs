/**
 * UNITERZ U マークのサイバー版。
 * 白本体 + 雷カットをシアン + 黒スキャン + きついリム光。
 * Usage: node scripts/generate-uniterz-u-mark-cyber.mjs
 */
import { writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const CANVAS = 1024;
const PNG_SIZE = 2048;

const PATHS = [
  "M306.35,845.48L306.35,506.94C306.35,506.94 496.26,622.16 496.26,622.16L496.8,718.5L636.52,667.51L636.71,138.97C636.71,134.81 648.33,129.74 651.5,129.16L709.37,122.88L814.28,190.79L814.38,740.8L716.51,808.75L654.39,849.14L410,901.12L366.76,879.2L306.32,845.48Z",
  "M307.21,370.44L305.69,273.02L210.06,204.99C209.62,197.14 217.84,188.98 225.26,187.95L352.99,170.04L493.95,151.82L495.88,182.68L496.58,477.71L307.21,370.44Z",
  "M496.11,525.79L496.42,594.28L421.68,519.63Z",
  "M360.98,449.46L306.16,446.07L306.54,393.95Z",
];

/** 左ステム雷カットの隙間（上ピース下辺 → 下ピース上辺） */
const SLASH =
  "M307.21,370.44L496.58,477.71L496.26,622.16L306.35,506.94Z";

const CYAN = "#00F5FF";
const RIM = "#8AF7FF";
const SOFT = "#00E8FF";

function svgDoc({ bg = "none" } = {}) {
  const bgRect =
    bg === "none"
      ? ""
      : `  <rect width="${CANVAS}" height="${CANVAS}" fill="${bg}"/>\n`;
  const letter = PATHS.map(
    (d, i) => `    <path id="u-${i}" d="${d}" fill="#fff"/>`
  ).join("\n");
  const clip = PATHS.map((d) => `      <path d="${d}"/>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" fill="none">
  <defs>
    <filter id="soft-glow" x="-35%" y="-35%" width="170%" height="170%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="18" result="blur"/>
      <feFlood flood-color="${SOFT}" flood-opacity="0.42"/>
      <feComposite in2="blur" operator="in"/>
    </filter>
    <filter id="rim-glow" x="-20%" y="-20%" width="140%" height="140%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="5" result="blur"/>
      <feFlood flood-color="${RIM}" flood-opacity="0.9"/>
      <feComposite in2="blur" operator="in"/>
    </filter>
    <filter id="slash-glow" x="-40%" y="-40%" width="180%" height="180%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="7" result="blur"/>
      <feFlood flood-color="${CYAN}" flood-opacity="1"/>
      <feComposite in2="blur" operator="in" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <pattern id="scan" width="${CANVAS}" height="3" patternUnits="userSpaceOnUse">
      <rect width="${CANVAS}" height="2" fill="none"/>
      <rect y="2" width="${CANVAS}" height="1" fill="#050508" opacity="0.26"/>
    </pattern>
    <clipPath id="letter">
${clip}
    </clipPath>
  </defs>
${bgRect}  <g filter="url(#soft-glow)" opacity="0.95">
${letter}
    <path d="${SLASH}" fill="#fff"/>
  </g>
  <g filter="url(#rim-glow)">
${letter}
    <path d="${SLASH}" fill="#fff"/>
  </g>
  <path d="${SLASH}" fill="${CYAN}" filter="url(#slash-glow)"/>
${letter}
  <rect width="${CANVAS}" height="${CANVAS}" fill="url(#scan)" clip-path="url(#letter)"/>
</svg>
`;
}

async function pngFromSvg(svg, outPath, size = PNG_SIZE) {
  await sharp(Buffer.from(svg))
    .resize(size, size, { fit: "fill" })
    .png()
    .toFile(outPath);
}

async function main() {
  const outDir = join(root, "public/brand");
  mkdirSync(outDir, { recursive: true });
  const nativeDir = join(root, "apps/native/assets/brand");
  mkdirSync(nativeDir, { recursive: true });

  const svg = svgDoc();
  const svgBlack = svgDoc({ bg: "#000000" });
  const svgPath = join(outDir, "uniterz-u-mark-cyber.svg");
  writeFileSync(svgPath, svg);

  const pngPath = join(outDir, "uniterz-u-mark-cyber.png");
  const pngBlackPath = join(outDir, "uniterz-u-mark-cyber-black.png");
  const pngCanvasPath = join(outDir, "uniterz-u-mark-cyber-1920x1080.png");

  await pngFromSvg(svg, pngPath);
  await pngFromSvg(svgBlack, pngBlackPath);
  await pngFromSvg(svg, join(nativeDir, "uniterz-u-mark-cyber.png"));

  const mark = await sharp(pngBlackPath)
    .resize(720, 720, { fit: "contain", background: "#000000" })
    .png()
    .toBuffer();
  await sharp({
    create: {
      width: 1920,
      height: 1080,
      channels: 3,
      background: "#000000",
    },
  })
    .composite([{ input: mark, gravity: "centre" }])
    .png()
    .toFile(pngCanvasPath);

  console.log("wrote", svgPath);
  console.log("wrote", pngPath);
  console.log("wrote", pngBlackPath);
  console.log("wrote", pngCanvasPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
