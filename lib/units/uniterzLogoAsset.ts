/**
 * 確定版 UNITERZ ロゴ画像アセット（白塗りベクター由来）。
 * 原稿: Illustrator 書き出し SVG → PNG。
 * 3D: node scripts/generate-uniterz-logo-glb.mjs
 */
export const UNITERZ_LOGO_ASSET = {
  webPath: "/brand/uniterz-logo.png",
  webSvgPath: "/brand/uniterz-logo.svg",
  /** 文字グループ付き fill SVG（letter-U〜Z） */
  webLogoFillSvgPath: "/brand/logo-fill.svg",
  /** 確定版ワードマークの押し出し GLB（旧 public/logo/uniterz-logo.glb は差し替えない） */
  webGlb3dPath: "/logo/uniterz-logo-3d.glb",
  width: 2048,
  height: 514,
  aspectRatio: 2048 / 514,
} as const;
