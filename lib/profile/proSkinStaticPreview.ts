/**
 * Pro Skin 選択画面用 — サムネ／プレビュー静止画の解決。
 * 実ファイルは `npm run generate:pro-skin-previews` で生成。
 */
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";

/** Web public パス（`/pro-skins/thumbs/{id}.webp`） */
export function proSkinThumbPublicPath(id: string): string {
  return `/pro-skins/thumbs/${id}.webp`;
}

export function proSkinPreviewPublicPath(id: string): string {
  return `/pro-skins/previews/${id}.webp`;
}

export function isProSkinStaticId(
  id: string
): id is ProfilePlanProBgVariant {
  return typeof id === "string" && id.length > 0;
}
