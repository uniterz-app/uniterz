/**
 * 確定版 UNITERZ ロゴの U を切り出し、ワードマークのアーチを戻して直立マークにする。
 * Usage: node scripts/generate-uniterz-u-mark.mjs
 */
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(root, "public/brand/uniterz-logo.svg");

const CANVAS = 1024;
const PAD_RATIO = 0.12;
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
  let prev = "";
  let c2x = 0;
  let c2y = 0;
  const segs = [];
  const num = () => parseFloat(tokens[i++]);

  while (i < tokens.length) {
    const t = tokens[i];
    if (/[A-Za-z]/.test(t)) {
      cmd = t;
      i++;
    }
    switch (cmd) {
      case "M":
        cx = num();
        cy = num();
        sx = cx;
        sy = cy;
        segs.push({ cmd: "M", pts: [{ x: cx, y: cy }] });
        cmd = "L";
        prev = "M";
        break;
      case "L":
        cx = num();
        cy = num();
        segs.push({ cmd: "L", pts: [{ x: cx, y: cy }] });
        prev = "L";
        break;
      case "l":
        cx += num();
        cy += num();
        segs.push({ cmd: "L", pts: [{ x: cx, y: cy }] });
        prev = "l";
        break;
      case "V":
        cy = num();
        segs.push({ cmd: "L", pts: [{ x: cx, y: cy }] });
        prev = "V";
        break;
      case "v":
        cy += num();
        segs.push({ cmd: "L", pts: [{ x: cx, y: cy }] });
        prev = "v";
        break;
      case "H":
        cx = num();
        segs.push({ cmd: "L", pts: [{ x: cx, y: cy }] });
        prev = "H";
        break;
      case "h":
        cx += num();
        segs.push({ cmd: "L", pts: [{ x: cx, y: cy }] });
        prev = "h";
        break;
      case "c": {
        const p1 = { x: cx + num(), y: cy + num() };
        const p2 = { x: cx + num(), y: cy + num() };
        const p3 = { x: cx + num(), y: cy + num() };
        segs.push({ cmd: "C", pts: [p1, p2, p3] });
        c2x = p2.x;
        c2y = p2.y;
        cx = p3.x;
        cy = p3.y;
        prev = "c";
        break;
      }
      case "C": {
        const p1 = { x: num(), y: num() };
        const p2 = { x: num(), y: num() };
        const p3 = { x: num(), y: num() };
        segs.push({ cmd: "C", pts: [p1, p2, p3] });
        c2x = p2.x;
        c2y = p2.y;
        cx = p3.x;
        cy = p3.y;
        prev = "C";
        break;
      }
      case "s": {
        const rel = prev === "c" || prev === "C" || prev === "s" || prev === "S";
        const p1 = {
          x: rel ? 2 * cx - c2x : cx,
          y: rel ? 2 * cy - c2y : cy,
        };
        const p2 = { x: cx + num(), y: cy + num() };
        const p3 = { x: cx + num(), y: cy + num() };
        segs.push({ cmd: "C", pts: [p1, p2, p3] });
        c2x = p2.x;
        c2y = p2.y;
        cx = p3.x;
        cy = p3.y;
        prev = "s";
        break;
      }
      case "Z":
      case "z":
        segs.push({ cmd: "Z", pts: [] });
        cx = sx;
        cy = sy;
        prev = "Z";
        break;
      default:
        throw new Error(`未対応のパスコマンド: ${cmd}`);
    }
  }
  return segs;
}

function extractLetterPaths(svg, id) {
  const block = svg.match(new RegExp(`<g id="${id}">([\\s\\S]*?)</g>`));
  if (!block) throw new Error(`${id} が見つかりません`);
  return [...block[1].matchAll(/d="([^"]+)"/g)].map((m) => m[1]);
}

function allPoints(paths) {
  return paths.flatMap((segs) => segs.flatMap((s) => s.pts));
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

function mapPaths(paths, fn) {
  return paths.map((segs) =>
    segs.map((s) => ({ cmd: s.cmd, pts: s.pts.map(fn) }))
  );
}

/** 垂直ステムを保ったまま、天面のアーチ傾きだけ戻す（初版） */
function flattenArch(paths) {
  const pts = allPoints(paths);
  const box = bboxOf(pts);
  const h = box.maxY - box.minY;
  const w = box.maxX - box.minX;
  const topPts = pts.filter((p) => p.y <= box.minY + h * 0.18);
  const botPts = pts.filter((p) => p.y >= box.maxY - h * 0.12);
  const topL = topPts.reduce((a, b) => (a.x < b.x ? a : b));
  const topR = topPts.reduce((a, b) => (a.x > b.x ? a : b));
  const botL = botPts.reduce((a, b) => (a.x < b.x ? a : b));
  const botR = botPts.reduce((a, b) => (a.x > b.x ? a : b));
  const kTop = (topR.y - topL.y) / Math.max(1e-6, topR.x - topL.x);
  const kBot = (botR.y - botL.y) / Math.max(1e-6, botR.x - botL.x);
  const k = (kTop + kBot) / 2;
  const x0 = box.minX + w * 0.15;
  return {
    k,
    deg: (Math.atan(k) * 180) / Math.PI,
    paths: mapPaths(paths, (p) => ({
      x: p.x,
      y: p.y - k * (p.x - x0),
    })),
  };
}

function fitToCanvas(paths) {
  const box = bboxOf(allPoints(paths));
  const w = box.maxX - box.minX;
  const h = box.maxY - box.minY;
  const inner = CANVAS * (1 - PAD_RATIO * 2);
  const scale = inner / Math.max(w, h);
  const ox = (CANVAS - w * scale) / 2 - box.minX * scale;
  const oy = (CANVAS - h * scale) / 2 - box.minY * scale;
  return mapPaths(paths, (p) => ({
    x: p.x * scale + ox,
    y: p.y * scale + oy,
  }));
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

function svgDoc(pathDs, { bg = "none" } = {}) {
  const bgRect =
    bg === "none"
      ? ""
      : `  <rect width="${CANVAS}" height="${CANVAS}" fill="${bg}"/>\n`;
  const paths = pathDs
    .map(
      (d, i) =>
        `  <path id="letter-U-${i}" d="${d}" fill="#fff" />`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${CANVAS} ${CANVAS}" fill="none">
${bgRect}${paths}
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
  const raw = extractLetterPaths(source, "letter-U").map(parsePath);
  const { paths: flat, deg } = flattenArch(raw);
  const fitted = fitToCanvas(flat);
  const ds = fitted.map(serialize);

  const outDir = join(root, "public/brand");
  mkdirSync(outDir, { recursive: true });
  const nativeDir = join(root, "apps/native/assets/brand");
  mkdirSync(nativeDir, { recursive: true });

  const svgPath = join(outDir, "uniterz-u-mark.svg");
  const pngPath = join(outDir, "uniterz-u-mark.png");
  const pngBlackPath = join(outDir, "uniterz-u-mark-black.png");
  const pngCanvasPath = join(outDir, "uniterz-u-mark-1920x1080.png");

  const svg = svgDoc(ds);
  writeFileSync(svgPath, svg);
  await pngFromSvg(svg, pngPath);
  await pngFromSvg(svgDoc(ds, { bg: "#000000" }), pngBlackPath);
  await pngFromSvg(svg, join(nativeDir, "uniterz-u-mark.png"));

  // Photoshop のキャンバスにそのまま置ける 1920x1080 黒地
  const markPng = await sharp(pngBlackPath)
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
    .composite([{ input: markPng, gravity: "centre" }])
    .png()
    .toFile(pngCanvasPath);

  const tsPath = join(root, "lib/units/uniterzUMark.ts");
  writeFileSync(
    tsPath,
    `/**
 * 確定版 UNITERZ ロゴの U を、ワードマークのアーチを戻して直立させたマーク。
 * 原稿: \`public/brand/uniterz-logo.svg\` の letter-U。
 * 再生成: node scripts/generate-uniterz-u-mark.mjs
 */

export const UNITERZ_U_MARK_VIEWBOX = ${CANVAS} as const;

export const UNITERZ_U_MARK_PATHS = [
${ds.map((d) => `  "${d}",`).join("\n")}
] as const;

export const UNITERZ_U_MARK_ASSET = {
  webSvgPath: "/brand/uniterz-u-mark.svg",
  webPngPath: "/brand/uniterz-u-mark.png",
  webPngBlackPath: "/brand/uniterz-u-mark-black.png",
  webPngCanvasPath: "/brand/uniterz-u-mark-1920x1080.png",
  webCyberSvgPath: "/brand/uniterz-u-mark-cyber.svg",
  webCyberPngPath: "/brand/uniterz-u-mark-cyber.png",
  webCyberPngBlackPath: "/brand/uniterz-u-mark-cyber-black.png",
  webCyberPngCanvasPath: "/brand/uniterz-u-mark-cyber-1920x1080.png",
  webAppIconSvgPath: "/brand/uniterz-u-app-icon.svg",
  webAppIconPngPath: "/brand/uniterz-u-app-icon.png",
  width: ${PNG_SIZE},
  height: ${PNG_SIZE},
} as const;
`
  );

  console.log(`arch flatten: ${deg.toFixed(3)}deg`);
  console.log("wrote", svgPath);
  console.log("wrote", pngPath);
  console.log("wrote", pngBlackPath);
  console.log("wrote", pngCanvasPath);
  console.log("wrote", tsPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
