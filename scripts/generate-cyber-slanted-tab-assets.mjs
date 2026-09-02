/**
 * Web `CyberSlantedTab` 選択態の見た目を焼き込んだ 3 パーツ PNG を生成する。
 * Web CSS は変更しない。アプリ側はこの素材を表示するだけ。
 *
 * 仕様（Web 準拠）:
 * - 本体は矩形（skew なし）。RN 側で skewX(-14deg) を当てて非選択と隙間を揃える
 * - fill #00F5FF
 * - scan: 2px 透明 + 1px rgba(0,0,0,0.14) の 3px 周期
 * - box-shadow 相当の発光を焼き込み
 */
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const OUT_DIRS = [
  path.join(ROOT, "apps/native/assets/cyber-slanted-tab"),
];

const CYAN = "#00F5FF";
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

function buildSvg() {
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
      <feFlood flood-color="${CYAN}" flood-opacity="0.28" result="c1"/>
      <feComposite in="c1" in2="b1" operator="in" result="g1"/>
      <feGaussianBlur in="SourceAlpha" stdDeviation="${GLOW_INNER_STD_1X * SCALE}" result="b2"/>
      <feFlood flood-color="${CYAN}" flood-opacity="0.55" result="c2"/>
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
    <rect x="${x0}" y="${y0}" width="${bw}" height="${bh}" fill="${CYAN}"/>
  </g>
  <g clip-path="url(#bodyClip)">
    ${scanRects.join("\n    ")}
  </g>
</svg>`,
  };
}

async function main() {
  const { canvasW, canvasH, pad, bw, svg } = buildSvg();
  const full = await sharp(Buffer.from(svg)).png().toBuffer();
  const fullMeta = await sharp(full).metadata();

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

  const meta = {
    version: 3,
    scale: SCALE,
    skewDeg: SKEW_DEG,
    cyan: CYAN,
    bodyHeightPx1x: BODY_H_1X,
    /** Web 非 compact: py-2(8)×2 + font10 行高 */
    bodyHeightNormalPx1x: 32,
    glowPadPx1x: GLOW_PAD_1X,
    imageHeight: canvasH,
    imageHeightPt: canvasH / SCALE,
    leftWidth: leftEnd,
    leftWidthPt: leftEnd / SCALE,
    rightWidth: canvasW - rightStart,
    rightWidthPt: (canvasW - rightStart) / SCALE,
    centerWidth: centerW,
    centerWidthPt: centerW / SCALE,
    letterSpacingEm: 0.14,
    fontSizeCompact: 9,
    fontWeight: 700,
    assetShape: "rect",
    displayAsset: "active-stretch.png",
    note: "Web CyberSlantedTab active compact 焼き込み（矩形+発光+横線）。表示は active-stretch 1枚を横ストレッチし RN で skewX(-14deg)。3分割は継ぎ目用に残すが表示には使わない。Web CSS は未変更。",
  };

  for (const dir of OUT_DIRS) {
    fs.mkdirSync(dir, { recursive: true });
    /** 表示用は1枚。3分割は継ぎ目が縦線になるので使わない */
    fs.writeFileSync(path.join(dir, "active-stretch.png"), full);
    fs.writeFileSync(path.join(dir, "active-full-preview.png"), full);
    fs.writeFileSync(path.join(dir, "active-left.png"), leftBuf);
    fs.writeFileSync(path.join(dir, "active-center.png"), centerBuf);
    fs.writeFileSync(path.join(dir, "active-right.png"), rightBuf);
    fs.writeFileSync(path.join(dir, "meta.json"), JSON.stringify(meta, null, 2) + "\n");
  }

  console.log("generated", {
    canvasW,
    canvasH,
    fullMeta,
    left: leftEnd,
    center: centerW,
    right: canvasW - rightStart,
    outs: OUT_DIRS,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
