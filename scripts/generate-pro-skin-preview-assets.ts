/**
 * Pro Skin カタログのサムネ／プレビューを WebP に焼く。
 * 確認オーバーレイはライブ Kinetik カード。カタログ一覧だけ静止画。
 *
 *   npx tsx scripts/generate-pro-skin-preview-assets.ts
 *   npm run generate:pro-skin-previews
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import { PRO_SKIN_UNLOCK_CATALOG } from "../lib/profile/proSkinUnlock.ts";
import { profilePlanProAdoptedSkinSwatch } from "../lib/profile/profilePlanProAdoptedSkinSwatch.ts";
import { parseCssLinearGradientColors } from "../lib/profile/parseCssLinearGradientColors.ts";
import { getProfilePlanProBeastSkinSvg } from "../lib/profile/profilePlanProBeastPattern.ts";
import { getProfilePlanProBeastHudSvg } from "../lib/profile/profilePlanProBeastPattern.ts";
import { getProfilePlanProScaleSkinSvg } from "../lib/profile/profilePlanProScalePattern.ts";
import { getProfilePlanProScaleHudSvg } from "../lib/profile/profilePlanProScalePattern.ts";
import { getProfilePlanProWaveSkinSvg } from "../lib/profile/profilePlanProWavePattern.ts";
import { getProfilePlanProWaveHudSvg } from "../lib/profile/profilePlanProWavePattern.ts";
import { getProfilePlanProFormSkinSvg } from "../lib/profile/profilePlanProFormPattern.ts";
import { getProfilePlanProFormHudSvg } from "../lib/profile/profilePlanProFormPattern.ts";
import {
  getProfilePlanProAtmosHexSvg,
  getProfilePlanProAtmosHudSvg,
} from "../lib/profile/profilePlanProAtmosBg.ts";
import { PROFILE_UNITERZ_LOGO_SCATTER } from "../lib/profile/profilePlanProUniterzLogoScatter.ts";
import { UNITERZ_LOGO_ASSET } from "../lib/units/uniterzLogoAsset.ts";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const LOGO_PNG = path.join(ROOT, "public/brand/uniterz-logo.png");

/** Retina 想定（一覧セル ~200px 幅 ×3） */
const THUMB = { w: 720, h: 400 };
/** フォールバック用（オーバーレイはライブカード） */
const PREVIEW = { w: 720, h: 1032 };
const WEBP_QUALITY = 88;

const OUT_DIRS = [
  path.join(ROOT, "apps/native/assets/pro-skins"),
  path.join(ROOT, "public/pro-skins"),
];

type LayerSvgs = { skin?: string; hud?: string };

function layersForEntry(entry: (typeof PRO_SKIN_UNLOCK_CATALOG)[number]): LayerSvgs {
  const { id, family } = entry;
  try {
    if (family === "beast") {
      return {
        skin: getProfilePlanProBeastSkinSvg(id as never),
        hud: getProfilePlanProBeastHudSvg(id as never),
      };
    }
    if (family === "scale") {
      return {
        skin: getProfilePlanProScaleSkinSvg(id as never),
        hud: getProfilePlanProScaleHudSvg(id as never),
      };
    }
    if (family === "wave") {
      // uniterz-logo は PNG 散らし（下で composite）。SVG skin は空。
      const skin =
        id === "wave-uniterz-logo"
          ? undefined
          : getProfilePlanProWaveSkinSvg(id as never);
      return {
        skin: skin && skin.length > 40 ? skin : undefined,
        hud: getProfilePlanProWaveHudSvg(id as never),
      };
    }
    if (family === "form") {
      return {
        skin: getProfilePlanProFormSkinSvg(id as never),
        hud: getProfilePlanProFormHudSvg(id as never),
      };
    }
    if (family === "atmos" && id === "atmos") {
      return {
        skin: getProfilePlanProAtmosHexSvg("cyan" as never),
        hud: getProfilePlanProAtmosHudSvg("cyan" as never),
      };
    }
  } catch (e) {
    console.warn(`[pro-skin] layers failed for ${id}`, e);
  }
  return {};
}

function gradientSvg(colors: string[], w: number, h: number): string {
  const stops = colors
    .map((c, i) => {
      const offset =
        colors.length === 1 ? 0 : Math.round((i / (colors.length - 1)) * 100);
      return `<stop offset="${offset}%" stop-color="${c}"/>`;
    })
    .join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="g" x1="8%" y1="0%" x2="92%" y2="100%">
      ${stops}
    </linearGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#g)"/>
</svg>`;
}

function wrapLayerSvg(raw: string, w: number, h: number): Buffer {
  // 既存 SVG は 300×430 想定。viewBox を保ったまま外枠にフィット
  const inner = raw.trim().startsWith("<svg")
    ? raw.replace(/<svg([^>]*)>/, (_m, attrs: string) => {
        let a = String(attrs)
          .replace(/\swidth="[^"]*"/g, "")
          .replace(/\sheight="[^"]*"/g, "")
          .replace(/\spreserveAspectRatio="[^"]*"/g, "");
        if (!/viewBox=/.test(a)) {
          a += ` viewBox="0 0 300 430"`;
        }
        return `<svg${a} width="${w}" height="${h}" preserveAspectRatio="xMidYMid slice">`;
      })
    : `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 300 430" preserveAspectRatio="xMidYMid slice">${raw}</svg>`;
  return Buffer.from(inner);
}

async function logoMarkPng(
  markW: number,
  markH: number,
  opacity: number,
  blurPx: number,
  rotateDeg: number
): Promise<Buffer> {
  let pipeline = sharp(LOGO_PNG)
    .resize(Math.max(1, markW), Math.max(1, markH), {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .ensureAlpha();

  if (rotateDeg !== 0) {
    pipeline = pipeline.rotate(rotateDeg, {
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    });
  }

  if (blurPx > 0.3) {
    pipeline = pipeline.blur(Math.min(100, Math.max(0.3, blurPx)));
  }

  const { data, info } = await pipeline
    .raw()
    .toBuffer({ resolveWithObject: true });

  const a = Math.max(0, Math.min(1, opacity));
  for (let i = 3; i < data.length; i += 4) {
    data[i] = Math.round(data[i] * a);
  }

  return sharp(data, {
    raw: {
      width: info.width,
      height: info.height,
      channels: 4,
    },
  })
    .png()
    .toBuffer();
}

async function uniterzLogoScatterLayer(w: number, h: number): Promise<Buffer | null> {
  // blurPx はプロフィールカード基準。焼きサイズにスケール
  const blurScale = w / 300;
  const composites: sharp.OverlayOptions[] = [];

  for (const mark of PROFILE_UNITERZ_LOGO_SCATTER) {
    const markW = Math.round(w * mark.widthPct);
    const markH = Math.round(markW / UNITERZ_LOGO_ASSET.aspectRatio);
    try {
      const input = await logoMarkPng(
        markW,
        markH,
        mark.opacity,
        mark.blurPx * blurScale,
        mark.rotateDeg
      );
      const meta = await sharp(input).metadata();
      const iw = meta.width ?? markW;
      const ih = meta.height ?? markH;
      let left = Math.round(w * mark.cxPct - iw / 2);
      let top = Math.round(h * mark.cyPct - ih / 2);

      if (left + iw <= 0 || top + ih <= 0 || left >= w || top >= h) continue;

      let extractLeft = 0;
      let extractTop = 0;
      let extractW = iw;
      let extractH = ih;
      if (left < 0) {
        extractLeft = -left;
        extractW += left;
        left = 0;
      }
      if (top < 0) {
        extractTop = -top;
        extractH += top;
        top = 0;
      }
      if (left + extractW > w) extractW = w - left;
      if (top + extractH > h) extractH = h - top;
      if (extractW <= 0 || extractH <= 0) continue;

      const cropped =
        extractLeft === 0 &&
        extractTop === 0 &&
        extractW === iw &&
        extractH === ih
          ? input
          : await sharp(input)
              .extract({
                left: extractLeft,
                top: extractTop,
                width: extractW,
                height: extractH,
              })
              .png()
              .toBuffer();

      composites.push({
        input: cropped,
        left,
        top,
        blend: "over",
      });
    } catch (e) {
      console.warn(`[pro-skin] logo mark skip ${mark.id}`, e);
    }
  }

  if (composites.length === 0) return null;

  return sharp({
    create: {
      width: w,
      height: h,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite(composites)
    .png()
    .toBuffer();
}

async function renderVariant(
  entry: (typeof PRO_SKIN_UNLOCK_CATALOG)[number],
  w: number,
  h: number
): Promise<Buffer> {
  const swatch = profilePlanProAdoptedSkinSwatch(entry);
  const colors = parseCssLinearGradientColors(swatch);
  const base = sharp(Buffer.from(gradientSvg([...colors], w, h))).png();

  const layers = layersForEntry(entry);
  const composites: sharp.OverlayOptions[] = [];

  if (entry.id === "wave-uniterz-logo") {
    const scatter = await uniterzLogoScatterLayer(w, h);
    if (scatter) composites.push({ input: scatter, blend: "over" });
  }

  for (const svg of [layers.skin, layers.hud]) {
    if (!svg) continue;
    try {
      const buf = await sharp(wrapLayerSvg(svg, w, h))
        .resize(w, h, { fit: "cover" })
        .png()
        .toBuffer();
      composites.push({ input: buf, blend: "over" });
    } catch (e) {
      console.warn(`[pro-skin] svg composite skip ${entry.id}`, e);
    }
  }

  let pipeline = base;
  if (composites.length > 0) {
    pipeline = sharp(await base.toBuffer()).composite(composites);
  }

  return pipeline.webp({ quality: WEBP_QUALITY }).toBuffer();
}

function writeNativeRequireMap(ids: string[]) {
  const lines = [
    "/** AUTO-GENERATED by scripts/generate-pro-skin-preview-assets.ts — do not edit */",
    "/* eslint-disable @typescript-eslint/no-require-imports */",
    "",
    "export const PRO_SKIN_THUMB_SOURCES: Record<string, number> = {",
    ...ids.map(
      (id) =>
        `  ${JSON.stringify(id)}: require("../../../assets/pro-skins/thumbs/${id}.webp"),`
    ),
    "};",
    "",
    "export const PRO_SKIN_PREVIEW_SOURCES: Record<string, number> = {",
    ...ids.map(
      (id) =>
        `  ${JSON.stringify(id)}: require("../../../assets/pro-skins/previews/${id}.webp"),`
    ),
    "};",
    "",
  ];
  const out = path.join(
    ROOT,
    "apps/native/src/features/profile/proSkinStaticAssets.generated.ts"
  );
  fs.writeFileSync(out, lines.join("\n"), "utf8");
  console.log("wrote", path.relative(ROOT, out));
}

async function main() {
  if (!fs.existsSync(LOGO_PNG)) {
    throw new Error(`missing logo: ${LOGO_PNG}`);
  }

  for (const root of OUT_DIRS) {
    fs.mkdirSync(path.join(root, "thumbs"), { recursive: true });
    fs.mkdirSync(path.join(root, "previews"), { recursive: true });
  }

  const ids: string[] = [];
  for (const entry of PRO_SKIN_UNLOCK_CATALOG) {
    ids.push(entry.id);
    process.stdout.write(`bake ${entry.id} … `);
    const thumb = await renderVariant(entry, THUMB.w, THUMB.h);
    const preview = await renderVariant(entry, PREVIEW.w, PREVIEW.h);
    for (const root of OUT_DIRS) {
      fs.writeFileSync(
        path.join(root, "thumbs", `${entry.id}.webp`),
        thumb
      );
      fs.writeFileSync(
        path.join(root, "previews", `${entry.id}.webp`),
        preview
      );
    }
    console.log("ok");
  }

  writeNativeRequireMap(ids);
  console.log(`done ${ids.length} skins`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
