/**
 * 確定版アーチ・ワードマークを、文字ごとに天面の傾きを戻して
 * 水平ベースラインに並べたフラット版を作る。
 * Usage: node scripts/generate-uniterz-logo-flat.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = join(root, "public/brand/uniterz-logo.svg");
const LETTER_IDS = ["U", "N", "I", "T", "E", "R", "Z"];
const PNG_WIDTH = 3200;
const PAD_X = 40;
const PAD_Y = 36;

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
      case "s":
      case "S": {
        const rel = cmd === "s";
        const reflect =
          prev === "c" || prev === "C" || prev === "s" || prev === "S";
        const p1 = {
          x: reflect ? 2 * cx - c2x : cx,
          y: reflect ? 2 * cy - c2y : cy,
        };
        const p2 = rel
          ? { x: cx + num(), y: cy + num() }
          : { x: num(), y: num() };
        const p3 = rel
          ? { x: cx + num(), y: cy + num() }
          : { x: num(), y: num() };
        segs.push({ cmd: "C", pts: [p1, p2, p3] });
        c2x = p2.x;
        c2y = p2.y;
        cx = p3.x;
        cy = p3.y;
        prev = cmd;
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

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function cubicAt(p0, p1, p2, p3, t) {
  const mt = 1 - t;
  return {
    x:
      mt ** 3 * p0.x +
      3 * mt ** 2 * t * p1.x +
      3 * mt * t ** 2 * p2.x +
      t ** 3 * p3.x,
    y:
      mt ** 3 * p0.y +
      3 * mt ** 2 * t * p1.y +
      3 * mt * t ** 2 * p2.y +
      t ** 3 * p3.y,
  };
}

function samplePaths(paths) {
  const pts = [];
  for (const segs of paths) {
    let cur = { x: 0, y: 0 };
    for (const s of segs) {
      if (s.cmd === "Z" || s.pts.length === 0) continue;
      if (s.cmd === "M") {
        cur = s.pts[0];
        pts.push(cur);
        continue;
      }
      if (s.cmd === "L") {
        const n = 4;
        const next = s.pts[0];
        for (let i = 1; i <= n; i++) {
          pts.push({
            x: lerp(cur.x, next.x, i / n),
            y: lerp(cur.y, next.y, i / n),
          });
        }
        cur = next;
        continue;
      }
      if (s.cmd === "C") {
        const [p1, p2, p3] = s.pts;
        for (let i = 1; i <= 8; i++) {
          pts.push(cubicAt(cur, p1, p2, p3, i / 8));
        }
        cur = p3;
      }
    }
  }
  return pts;
}

function allControlPoints(paths) {
  return paths.flatMap((segs) => segs.flatMap((s) => s.pts));
}

function bboxOf(pts) {
  return {
    minX: Math.min(...pts.map((p) => p.x)),
    minY: Math.min(...pts.map((p) => p.y)),
    maxX: Math.max(...pts.map((p) => p.x)),
    maxY: Math.max(...pts.map((p) => p.y)),
  };
}

function mapPaths(paths, fn) {
  return paths.map((segs) =>
    segs.map((s) => ({ cmd: s.cmd, pts: s.pts.map(fn) }))
  );
}

function fitSlope(pts) {
  if (pts.length < 2) return 0;
  const n = pts.length;
  const mx = pts.reduce((s, p) => s + p.x, 0) / n;
  const my = pts.reduce((s, p) => s + p.y, 0) / n;
  let num = 0;
  let den = 0;
  for (const p of pts) {
    num += (p.x - mx) * (p.y - my);
    den += (p.x - mx) ** 2;
  }
  return den < 1e-6 ? 0 : num / den;
}

function upperEnvelope(pts, bins = 14) {
  const box = bboxOf(pts);
  const w = Math.max(1e-6, box.maxX - box.minX);
  const slots = Array.from({ length: bins }, () => []);
  for (const p of pts) {
    const i = Math.min(
      bins - 1,
      Math.max(0, Math.floor(((p.x - box.minX) / w) * bins))
    );
    slots[i].push(p);
  }
  return slots
    .filter((s) => s.length > 0)
    .map((s) => s.reduce((a, b) => (a.y < b.y ? a : b)));
}

/**
 * アフィンせん断だけ使う（直線とベジェを保つ）。
 * 天面の包絡線の傾きを戻す。U / R マークと同じ。
 */
function flattenLetter(paths) {
  const pts = samplePaths(paths);
  const box = bboxOf(pts);
  const h = Math.max(1e-6, box.maxY - box.minY);
  const capPts = pts.filter((p) => p.y <= box.minY + h * 0.12);
  const envelope = upperEnvelope(capPts.length >= 6 ? capPts : pts);
  const k = fitSlope(envelope);
  const x0 = box.minX;
  return {
    k,
    deg: (Math.atan(k) * 180) / Math.PI,
    paths: mapPaths(paths, (p) => ({
      x: p.x,
      y: p.y - k * (p.x - x0),
    })),
  };
}

function composeWord(letters) {
  const flattened = letters.map((letter) => {
    const { paths, deg, k } = flattenLetter(letter.paths);
    const box = bboxOf(samplePaths(paths));
    return { id: letter.id, paths, deg, k, box };
  });
  const heights = flattened.map((l) => l.box.maxY - l.box.minY);
  const targetH = [...heights].sort((a, b) => a - b)[
    Math.floor(heights.length / 2)
  ];

  let cursorX = 0;
  const placed = [];
  for (let i = 0; i < flattened.length; i++) {
    const letter = flattened[i];
    const h = Math.max(1e-6, letter.box.maxY - letter.box.minY);
    const s = targetH / h;
    if (i > 0) {
      const prev = flattened[i - 1];
      const origGap = letter.box.minX - prev.box.maxX;
      const sPrev = targetH / Math.max(1e-6, prev.box.maxY - prev.box.minY);
      cursorX += origGap * ((sPrev + s) / 2);
    }
    const left = letter.box.minX;
    const base = letter.box.maxY;
    const paths = mapPaths(letter.paths, (p) => ({
      x: cursorX + (p.x - left) * s,
      y: (p.y - base) * s + targetH,
    }));
    const box = bboxOf(samplePaths(paths));
    placed.push({ id: letter.id, deg: letter.deg, k: letter.k, paths, box });
    cursorX += (letter.box.maxX - letter.box.minX) * s;
  }
  return { placed, targetH };
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

function svgDoc(letters, vb, { bg = "none" } = {}) {
  const bgRect =
    bg === "none"
      ? ""
      : `  <rect width="${vb.width}" height="${vb.height}" fill="${bg}"/>\n`;
  const groups = letters
    .map(
      (letter) =>
        `  <g id="letter-${letter.id}">\n${letter.paths
          .map(
            (d, i) =>
              `    <path id="letter-${letter.id}-${i}" d="${d}" fill="#fff" />`
          )
          .join("\n")}\n  </g>`
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${vb.width} ${vb.height}" fill="none">
${bgRect}${groups}
</svg>
`;
}

async function pngFromSvg(svg, outPath, width, height) {
  await sharp(Buffer.from(svg))
    .resize(width, height, { fit: "fill" })
    .png()
    .toFile(outPath);
}

async function main() {
  const source = readFileSync(SOURCE, "utf8");
  const parsed = LETTER_IDS.map((id) => ({
    id,
    paths: extractLetterPaths(source, `letter-${id}`).map(parsePath),
  }));
  const { placed: composed, targetH } = composeWord(parsed);

  const union = bboxOf(composed.flatMap((l) => samplePaths(l.paths)));
  const vb = {
    width: Number((union.maxX - union.minX + PAD_X * 2).toFixed(2)),
    height: Number((union.maxY - union.minY + PAD_Y * 2).toFixed(2)),
  };
  const ox = PAD_X - union.minX;
  const oy = PAD_Y - union.minY;
  const placed = composed.map((letter) => ({
    id: letter.id,
    paths: mapPaths(letter.paths, (p) => ({
      x: p.x + ox,
      y: p.y + oy,
    })).map(serialize),
  }));

  const outDir = join(root, "public/brand");
  mkdirSync(outDir, { recursive: true });
  const nativeDir = join(root, "apps/native/assets/brand");
  mkdirSync(nativeDir, { recursive: true });

  const svgPath = join(outDir, "uniterz-logo-flat.svg");
  const pngPath = join(outDir, "uniterz-logo-flat.png");
  const pngBlackPath = join(outDir, "uniterz-logo-flat-black.png");
  const pngH = Math.max(1, Math.round(PNG_WIDTH * (vb.height / vb.width)));

  const svg = svgDoc(placed, vb);
  writeFileSync(svgPath, svg);
  await pngFromSvg(svg, pngPath, PNG_WIDTH, pngH);
  await pngFromSvg(svgDoc(placed, vb, { bg: "#000000" }), pngBlackPath, PNG_WIDTH, pngH);
  await pngFromSvg(svg, join(nativeDir, "uniterz-logo-flat.png"), PNG_WIDTH, pngH);

  const tsPath = join(root, "lib/units/uniterzLogoFlat.ts");
  const lettersTs = placed
    .map(
      (letter) => `  {
    id: "${letter.id}",
    paths: [
${letter.paths.map((d) => `      "${d}",`).join("\n")}
    ],
  }`
    )
    .join(",\n");

  writeFileSync(
    tsPath,
    `/**
 * 確定版 UNITERZ ワードマークのアーチなし版。
 * 原稿: \`public/brand/uniterz-logo.svg\` を文字ごとにアフィンせん断して直立化。
 * 再生成: node scripts/generate-uniterz-logo-flat.mjs
 */

export const UNITERZ_LOGO_FLAT_VIEWBOX = {
  width: ${vb.width},
  height: ${vb.height},
  aspectRatio: ${vb.width} / ${vb.height},
} as const;

export type UniterzLogoFlatLetterId = "U" | "N" | "I" | "T" | "E" | "R" | "Z";

export type UniterzLogoFlatLetter = {
  id: UniterzLogoFlatLetterId;
  paths: readonly string[];
};

export const UNITERZ_LOGO_FLAT_LETTERS: readonly UniterzLogoFlatLetter[] = [
${lettersTs},
];

export const UNITERZ_LOGO_FLAT_ASSET = {
  webSvgPath: "/brand/uniterz-logo-flat.svg",
  webPngPath: "/brand/uniterz-logo-flat.png",
  webPngBlackPath: "/brand/uniterz-logo-flat-black.png",
  width: ${PNG_WIDTH},
  height: ${pngH},
} as const;
`
  );

  for (const letter of composed) {
    console.log(
      `${letter.id}: flatten ${letter.deg.toFixed(2)}deg  box ${letter.box.minX.toFixed(1)}-${letter.box.maxX.toFixed(1)}`
    );
  }
  console.log("targetH", targetH.toFixed(2), "viewBox", vb);
  console.log("wrote", svgPath);
  console.log("wrote", pngPath);
  console.log("wrote", pngBlackPath);
  console.log("wrote", tsPath);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
