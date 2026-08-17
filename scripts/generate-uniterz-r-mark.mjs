/**
 * 確定版 UNITERZ ロゴの R を切り出し、ワードマークのアーチ（天面の傾き）を
 * 戻して直立マークにする。
 *
 * Usage: node scripts/generate-uniterz-r-mark.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(root, "public/brand/uniterz-logo.svg");

const CANVAS = 1024;
const PAD_RATIO = 0.14;
const PNG_SIZE = 2048;

function tokenize(d) {
  return d.match(/[MmLlHhVvCcSsQqTtAaZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
}

function parsePath(d) {
  const tokens = tokenize(d);
  let i = 0;
  let cmd = "";
  let cx = 0;
  let cy = 0;
  let sx = 0;
  let sy = 0;
  /** @type {{ cmd: string, pts: {x:number,y:number}[] }[]} */
  const segs = [];

  const num = () => parseFloat(tokens[i++]);

  while (i < tokens.length) {
    const t = tokens[i];
    if (/[A-Za-z]/.test(t)) {
      cmd = t;
      i++;
    }
    switch (cmd) {
      case "M": {
        cx = num();
        cy = num();
        sx = cx;
        sy = cy;
        segs.push({ cmd: "M", pts: [{ x: cx, y: cy }] });
        cmd = "L";
        break;
      }
      case "L": {
        cx = num();
        cy = num();
        segs.push({ cmd: "L", pts: [{ x: cx, y: cy }] });
        break;
      }
      case "l": {
        cx += num();
        cy += num();
        segs.push({ cmd: "L", pts: [{ x: cx, y: cy }] });
        break;
      }
      case "c": {
        const p1 = { x: cx + num(), y: cy + num() };
        const p2 = { x: cx + num(), y: cy + num() };
        const p3 = { x: cx + num(), y: cy + num() };
        segs.push({ cmd: "C", pts: [p1, p2, p3] });
        cx = p3.x;
        cy = p3.y;
        break;
      }
      case "C": {
        const p1 = { x: num(), y: num() };
        const p2 = { x: num(), y: num() };
        const p3 = { x: num(), y: num() };
        segs.push({ cmd: "C", pts: [p1, p2, p3] });
        cx = p3.x;
        cy = p3.y;
        break;
      }
      case "Z":
      case "z":
        segs.push({ cmd: "Z", pts: [] });
        cx = sx;
        cy = sy;
        break;
      default:
        throw new Error(`未対応のパスコマンド: ${cmd}`);
    }
  }
  return segs;
}

function extractLetterR(svg) {
  const match = svg.match(/<g id="letter-R">\s*<path d="([^"]+)"/);
  if (!match) throw new Error("letter-R が見つかりません");
  return match[1];
}

function allPoints(segs) {
  return segs.flatMap((s) => s.pts);
}

function bboxOf(pts) {
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  return {
    minX: Math.min(...xs),
    minY: Math.min(...ys),
    maxX: Math.max(...xs),
    maxY: Math.max(...ys),
  };
}

/** 垂直線を保ったまま天面を水平にするせん断 */
function flattenArch(segs) {
  const pts = allPoints(segs);
  const box = bboxOf(pts);
  const h = box.maxY - box.minY;
  const topPts = pts.filter((p) => p.y <= box.minY + h * 0.12);
  const topL = topPts.reduce((a, b) => (a.x < b.x ? a : b));
  const topR = topPts.reduce((a, b) => (a.x > b.x ? a : b));
  const k = (topR.y - topL.y) / (topR.x - topL.x);
  const x0 = topL.x;
  const map = (p) => ({ x: p.x, y: p.y - k * (p.x - x0) });
  return {
    k,
    deg: (Math.atan(k) * 180) / Math.PI,
    segs: segs.map((s) => ({ cmd: s.cmd, pts: s.pts.map(map) })),
  };
}

function fitToCanvas(segs) {
  const box = bboxOf(allPoints(segs));
  const w = box.maxX - box.minX;
  const h = box.maxY - box.minY;
  const inner = CANVAS * (1 - PAD_RATIO * 2);
  const scale = inner / Math.max(w, h);
  const ox = (CANVAS - w * scale) / 2 - box.minX * scale;
  const oy = (CANVAS - h * scale) / 2 - box.minY * scale;
  const map = (p) => ({ x: p.x * scale + ox, y: p.y * scale + oy });
  return segs.map((s) => ({ cmd: s.cmd, pts: s.pts.map(map) }));
}

function fmt(n) {
  return n.toFixed(2).replace(/\.?0+$/, (m) => (m === "." ? "" : ""));
}

function serialize(segs) {
  return segs
    .map((s) => {
      if (s.cmd === "Z") return "Z";
      const coords = s.pts.map((p) => `${fmt(p.x)},${fmt(p.y)}`).join(" ");
      return `${s.cmd}${coords}`;
    })
    .join("");
}

function svgDoc(d, { bg = "none" } = {}) {
  const bgRect =
    bg === "none"
      ? ""
      : `  <rect width="${CANVAS}" height="${CANVAS}" fill="${bg}"/>\n`;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" fill="none">
${bgRect}  <path id="letter-R" d="${d}" fill="#fff" />
</svg>
`;
}

async function pngFromSvg(svg, outPath) {
  await sharp(Buffer.from(svg))
    .resize(PNG_SIZE, PNG_SIZE, { fit: "fill" })
    .png()
    .toFile(outPath);
}

async function main() {
  const source = readFileSync(SOURCE, "utf8");
  const rawSegs = parsePath(extractLetterR(source));
  const { segs: flatSegs, deg } = flattenArch(rawSegs);
  const fitted = fitToCanvas(flatSegs);
  const d = serialize(fitted);

  const outDir = join(root, "public/brand");
  mkdirSync(outDir, { recursive: true });

  const svgPath = join(outDir, "uniterz-r-mark.svg");
  const pngPath = join(outDir, "uniterz-r-mark.png");
  const pngBlackPath = join(outDir, "uniterz-r-mark-black.png");
  const nativeDir = join(root, "apps/native/assets/brand");
  mkdirSync(nativeDir, { recursive: true });

  const svg = svgDoc(d);
  writeFileSync(svgPath, svg);
  await pngFromSvg(svg, pngPath);
  await pngFromSvg(svgDoc(d, { bg: "#000000" }), pngBlackPath);
  await pngFromSvg(svg, join(nativeDir, "uniterz-r-mark.png"));

  const tsPath = join(root, "lib/units/uniterzRMark.ts");
  writeFileSync(
    tsPath,
    `/**
 * 確定版 UNITERZ ロゴの R を、ワードマークのアーチを戻して直立させたマーク。
 * 原稿: \`public/brand/uniterz-logo.svg\` の letter-R。
 * 再生成: node scripts/generate-uniterz-r-mark.mjs
 */

export const UNITERZ_R_MARK_VIEWBOX = ${CANVAS} as const;

export const UNITERZ_R_MARK_PATH = "${d}";

export const UNITERZ_R_MARK_ASSET = {
  webSvgPath: "/brand/uniterz-r-mark.svg",
  webPngPath: "/brand/uniterz-r-mark.png",
  webPngBlackPath: "/brand/uniterz-r-mark-black.png",
  width: ${PNG_SIZE},
  height: ${PNG_SIZE},
} as const;
`
  );

  console.log(`arch flatten: ${deg.toFixed(3)}deg`);
  console.log("wrote", svgPath);
  console.log("wrote", pngPath);
  console.log("wrote", pngBlackPath);
  console.log("wrote", tsPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
