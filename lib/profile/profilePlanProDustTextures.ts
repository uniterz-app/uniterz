/**
 * Dust Pro Skin — 参照写真から切り出した素材テクスチャ
 * 他 beast と同じ canvas 比 300:430（出力 1080×1548）を artH stretch
 */

export type ProfilePlanProDustTextureId = "beast-dust" | "beast-dust-ash";

const DUST_PUBLIC_PATHS: Record<ProfilePlanProDustTextureId, string> = {
  "beast-dust": "/pro-skins/textures/dust-powder-v3.webp",
  "beast-dust-ash": "/pro-skins/textures/dust-film-v3.webp",
};

/** ランキング行用横長帯 */
const DUST_RANK_PUBLIC_PATHS: Record<ProfilePlanProDustTextureId, string> = {
  "beast-dust": "/pro-skins/textures/dust-powder-rank-v3.webp",
  "beast-dust-ash": "/pro-skins/textures/dust-film-rank-v3.webp",
};

export const DUST_CARD_TEXTURE_SIZE = { w: 1080, h: 1548 } as const;
export const DUST_RANK_TEXTURE_SIZE = { w: 1600, h: 320 } as const;

export function isProfilePlanProDustTextureVariant(
  id: string
): id is ProfilePlanProDustTextureId {
  return id in DUST_PUBLIC_PATHS;
}

export function getProfilePlanProDustTextureCssUrl(
  variant: ProfilePlanProDustTextureId
): string {
  return `url("${DUST_PUBLIC_PATHS[variant]}")`;
}

export function getProfilePlanProDustRankTextureCssUrl(
  variant: ProfilePlanProDustTextureId
): string {
  return `url("${DUST_RANK_PUBLIC_PATHS[variant]}")`;
}

export function getProfilePlanProDustTexturePublicPath(
  variant: ProfilePlanProDustTextureId
): string {
  return DUST_PUBLIC_PATHS[variant];
}
