/**
 * Web `CyberSlantedTab` 選択態の見た目を焼き込んだ PNG を生成する。
 * Web CSS は変更しない。アプリ側はこの素材を表示するだけ。
 *
 * 仕様（Web 準拠）:
 * - 本体は矩形（skew なし）。RN 側で skewX(-14deg) を当てて非選択と隙間を揃える
 * - fill + scan + box-shadow 相当の発光を焼き込み
 * - シアン / PRO LEAGUE 紫 / PRO LEAGUE 金を同一 glow 寸法で出力
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIRS = [
  path.join(ROOT, "apps/native/assets/cyber-slanted-tab"),
];

const SCALE = 3;
/**
 * Web compact: py-1.5(6)×2 + font9 の行高 ≈ 26px。
 * 22 は小さすぎ、非 compact（py-2）はコンポーネント側で 32 に伸ばす。
 */
const BODY_H_1X = 26;
const BODY_W_1X = 180;
const SKEW_DEG = -14;
/**
 * Web: `0 0 10px …, 0 0 22px …`。
 * pad / blur が大きすぎると光の塊に見えるので Web 寄りの小さめに。
 */
const GLOW_PAD_1X = 12;
/** 端だけ固定。中央を横ストレッチ */
const CAP_BODY_1X = 10;
/** Web 外側シャドウ ≈ 22px → stdDeviation 控えめ */
const GLOW_OUTER_STD_1X = 6;
/** Web 内側シャドウ ≈ 10px */
const GLOW_INNER_STD_1X = 3.2;

/** Pick Up 既定 / PRO LEAGUE 紫 / Season 行の金 — 光の幅は共通 */
const VARIANTS = [
  { key: "cyan", fill: "#00F5FF", file: "active-stretch.png" },
  { key: "violet", fill: "#C084FC", file: "active-stretch-violet.png" },
  { key: "gold", fill: "#F6C344", file: "active-stretch-gold.png" },
];

function buildSvg(fill) {
  const pad = GLOW_PAD_1X * SCALE;
  const bh = BODY_H_1X * SCALE;
  const bw = BODY_W_1X * SCALE;
  const x0 = pad;
  const y0 = pad;
  const canvasW = Math.ceil(pad + bw + pad);
  const canvasH = Math.ceil(pad + bh + pad);
  const scanStep = 3 * SCALE;
  const scanLine = 1 * SCALE;

  const scanRects = [];
  for (let y = y0; y < y0 + bh; y += scanStep) {
    const ly = y + 2 * SCALE;
    if (ly + scanLine > y0 + bh) break;
    scanRects.push(
      `<rect x="${x0}" y="${ly}" width="${bw}" height="${scanLine}" fill="rgba(0,0,0,0.14)"/>`
    );
  }

  return {
    canvasW,
    canvasH,
    pad,
    bh,
    bw,
    svg: `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${canvasW}" height="${canvasH}" viewBox="0 0 ${canvasW} ${canvasH}">
  <defs>
    <filter id="glowOuter" x="-60%" y="-60%" width="220%" height="220%" color-interpolation-filters="sRGB">
      <feGaussianBlur in="SourceAlpha" stdDeviation="${GLOW_OUTER_STD_1X * SCALE}" result="b1"/>
      <feFlood flood-color="${fill}" flood-opacity="0.28" result="c1"/>
      <feComposite in="c1" in2="b1" operator="in" result="g1"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="${GLOW_INNER_STD_1X * SCALE}" result="b2"/>
      <feFlood flood-color="${fill}" flood-opacity="0.55" result="c2"/>
      <feComposite in="c2" in2="b2" operator="in" result="g2"/>
      <feMerge>
        <feMergeNode in="g1"/>
        <feMergeNode in="g2"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
    <clipPath id="bodyClip">
      <rect x="${x0}" y="${y0}" width="${bw}" height="${bh}"/>
    </clipPath>
  </defs>
  <g filter="url(#glowOuter)">
    <rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" fill="${fill}"/>
  </g>
  <g clip-path="url(#bodyClip)">
    ${scanRects.join("\n    ")}
  </g>
</svg>`,
  };
}

async function writeVariant(dir, fill, fileName, alsoSplit) {
  const { canvasW, canvasH, pad, bw, svg } = buildSvg(fill);
  const full = await sharp(Buffer.from(svg)).png().toBuffer();

  fs.writeFileSync(path.join(dir, fileName), full);

  if (!alsoSplit) {
    return { canvasW, canvasH, pad, bw };
  }

  const leftEnd = Math.round(pad + CAP_BODY_1X * SCALE);
  const rightStart = Math.round(pad + bw - CAP_BODY_1X * SCALE);
  const centerW = Math.max(8 * SCALE, Math.round(12 * SCALE));
  const centerX = Math.round((leftEnd + rightStart) / 2 - centerW / 2);

  const leftBuf = await sharp(full)
    .extract({ left: 0, top: 0, width: leftEnd, height: canvasH })
    .png()
    .toBuffer();
  const centerBuf = await sharp(full)
    .extract({ left: centerX, top: 0, width: centerW, height: canvasH })
    .png()
    .toBuffer();
  const rightBuf = await sharp(full)
    .extract({
      left: rightStart,
      top: 0,
      width: canvasW - rightStart,
      height: canvasH,
    })
    .png()
    .toBuffer();

  fs.writeFileSync(path.join(dir, "active-full-preview.png"), full);
  fs.writeFileSync(path.join(dir, "active-left.png"), leftBuf);
  fs.writeFileSync(path.join(dir, "active-center.png"), centerBuf);
  fs.writeFileSync(path.join(dir, "active-right.png"), rightBuf);

  return {
    canvasW,
    canvasH,
    pad,
    bw,
    leftEnd,
    rightStart,
    centerW,
  };
}

async function main() {
  let geometry = null;

  for (const dir of OUT_DIRS) {
    fs.mkdirSync(dir, { recursive: true });
    for (const variant of VARIANTS) {
      const result = await writeVariant(
        dir,
        variant.fill,
        variant.file,
        variant.key === "cyan"
      );
      if (variant.key === "cyan") geometry = result;
    }

    if (!geometry) throw new Error("cyan geometry missing");

    const meta = {
      version: 4,
      scale: SCALE,
      skewDeg: SKEW_DEG,
      cyan: "#00F5FF",
      violet: "#C084FC",
      gold: "#F6C344",
      bodyHeightPx1x: BODY_H_1X,
      bodyHeightNormalPx1x: 32,
      glowPadPx1x: GLOW_PAD_1X,
      imageHeight: geometry.canvasH,
      imageHeightPt: geometry.canvasH / SCALE,
      leftWidth: geometry.leftEnd,
      leftWidthPt: geometry.leftEnd / SCALE,
      rightWidth: geometry.canvasW - geometry.rightStart,
      rightWidthPt: (geometry.canvasW - geometry.rightStart) / SCALE,
      centerWidth: geometry.centerW,
      centerWidthPt: geometry.centerW / SCALE,
      letterSpacingEm: 0.14,
      fontSizeCompact: 9,
      fontWeight: 700,
      assetShape: "rect",
      displayAsset: "active-stretch.png",
      themedAssets: {
        "#00F5FF": "active-stretch.png",
        "#C084FC": "active-stretch-violet.png",
        "#F6C344": "active-stretch-gold.png",
      },
      note: "選択態は色違いでも同一 glow 寸法の焼き込み。表示は stretch 1枚 + RN skewX(-14deg)。",
    };

    fs.writeFileSync(
      path.join(dir, "meta.json"),
      JSON.stringify(meta, null, 2) + "\n"
    );
  }

  console.log("generated", {
    variants: VARIANTS.map((v) => v.file),
    geometry,
    outs: OUT_DIRS,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
