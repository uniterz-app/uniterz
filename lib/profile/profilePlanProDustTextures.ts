/**
 * 写真素材マップ系 Pro Skin（Dust / Ash + マイルストーン候補）
 * 他 beast と同じ canvas 比 300:430（出力 1080×1548）を artH stretch
 */

export type ProfilePlanProDustTextureId =
  | "beast-dust"
  | "beast-dust-ash"
  | "beast-startrail"
  | "beast-nova"
  | "beast-lavaflow"
  | "beast-marscrust"
  | "beast-lunar"
  | "beast-nebula"
  | "beast-galaxy"
  | "beast-solar"
  | "beast-jovian"
  | "beast-rings"
  | "beast-europa"
  | "beast-dunes"
  | "beast-aurora"
  | "beast-flame"
  | "beast-pluto"
  | "beast-saturn"
  | "beast-nightearth"
  | "beast-corona"
  | "beast-crab"
  | "beast-helix"
  | "beast-pillars"
  | "beast-neptune"
  | "beast-io"
  | "beast-lena"
  | "beast-hurricane"
  | "beast-andromeda"
  | "beast-southernring"
  | "beast-deepfield"
  | "beast-milkyway"
  | "beast-shoals"
  | "beast-uranus";

const DUST_PUBLIC_PATHS: Record<ProfilePlanProDustTextureId, string> = {
  "beast-dust": "/pro-skins/textures/dust-powder-v4.webp",
  "beast-dust-ash": "/pro-skins/textures/dust-film-v4.webp",
  "beast-startrail": "/pro-skins/textures/startrail-v3.webp",
  "beast-nova": "/pro-skins/textures/nova-v3.webp",
  "beast-lavaflow": "/pro-skins/textures/lavaflow-v3.webp",
  "beast-marscrust": "/pro-skins/textures/marscrust-v3.webp",
  "beast-lunar": "/pro-skins/textures/lunar-v3.webp",
  "beast-nebula": "/pro-skins/textures/nebula-v3.webp",
  "beast-galaxy": "/pro-skins/textures/galaxy-v3.webp",
  "beast-solar": "/pro-skins/textures/solar-v3.webp",
  "beast-jovian": "/pro-skins/textures/jovian-v3.webp",
  "beast-rings": "/pro-skins/textures/rings-v3.webp",
  "beast-europa": "/pro-skins/textures/europa-v3.webp",
  "beast-dunes": "/pro-skins/textures/dunes-v3.webp",
  "beast-aurora": "/pro-skins/textures/aurora-v3.webp",
  "beast-flame": "/pro-skins/textures/flame-v3.webp",
  "beast-pluto": "/pro-skins/textures/pluto-v3.webp",
  "beast-saturn": "/pro-skins/textures/saturn-v3.webp",
  "beast-nightearth": "/pro-skins/textures/nightearth-v3.webp",
  "beast-corona": "/pro-skins/textures/corona-v3.webp",
  "beast-crab": "/pro-skins/textures/crab-v3.webp",
  "beast-helix": "/pro-skins/textures/helix-v3.webp",
  "beast-pillars": "/pro-skins/textures/pillars-v3.webp",
  "beast-neptune": "/pro-skins/textures/neptune-v3.webp",
  "beast-io": "/pro-skins/textures/io-v3.webp",
  "beast-lena": "/pro-skins/textures/lena-v3.webp",
  "beast-hurricane": "/pro-skins/textures/hurricane-v3.webp",
  "beast-andromeda": "/pro-skins/textures/andromeda-v3.webp",
  "beast-southernring": "/pro-skins/textures/southernring-v3.webp",
  "beast-deepfield": "/pro-skins/textures/deepfield-v3.webp",
  "beast-milkyway": "/pro-skins/textures/milkyway-v3.webp",
  "beast-shoals": "/pro-skins/textures/shoals-v3.webp",
  "beast-uranus": "/pro-skins/textures/uranus-v3.webp",
};

/** ランキング行用横長帯 */
const DUST_RANK_PUBLIC_PATHS: Record<ProfilePlanProDustTextureId, string> = {
  "beast-dust": "/pro-skins/textures/dust-powder-rank-v4.webp",
  "beast-dust-ash": "/pro-skins/textures/dust-film-rank-v4.webp",
  "beast-startrail": "/pro-skins/textures/startrail-rank-v3.webp",
  "beast-nova": "/pro-skins/textures/nova-rank-v3.webp",
  "beast-lavaflow": "/pro-skins/textures/lavaflow-rank-v3.webp",
  "beast-marscrust": "/pro-skins/textures/marscrust-rank-v3.webp",
  "beast-lunar": "/pro-skins/textures/lunar-rank-v3.webp",
  "beast-nebula": "/pro-skins/textures/nebula-rank-v3.webp",
  "beast-galaxy": "/pro-skins/textures/galaxy-rank-v3.webp",
  "beast-solar": "/pro-skins/textures/solar-rank-v3.webp",
  "beast-jovian": "/pro-skins/textures/jovian-rank-v3.webp",
  "beast-rings": "/pro-skins/textures/rings-rank-v3.webp",
  "beast-europa": "/pro-skins/textures/europa-rank-v3.webp",
  "beast-dunes": "/pro-skins/textures/dunes-rank-v3.webp",
  "beast-aurora": "/pro-skins/textures/aurora-rank-v3.webp",
  "beast-flame": "/pro-skins/textures/flame-rank-v3.webp",
  "beast-pluto": "/pro-skins/textures/pluto-rank-v3.webp",
  "beast-saturn": "/pro-skins/textures/saturn-rank-v3.webp",
  "beast-nightearth": "/pro-skins/textures/nightearth-rank-v3.webp",
  "beast-corona": "/pro-skins/textures/corona-rank-v3.webp",
  "beast-crab": "/pro-skins/textures/crab-rank-v3.webp",
  "beast-helix": "/pro-skins/textures/helix-rank-v3.webp",
  "beast-pillars": "/pro-skins/textures/pillars-rank-v3.webp",
  "beast-neptune": "/pro-skins/textures/neptune-rank-v3.webp",
  "beast-io": "/pro-skins/textures/io-rank-v3.webp",
  "beast-lena": "/pro-skins/textures/lena-rank-v3.webp",
  "beast-hurricane": "/pro-skins/textures/hurricane-rank-v3.webp",
  "beast-andromeda": "/pro-skins/textures/andromeda-rank-v3.webp",
  "beast-southernring": "/pro-skins/textures/southernring-rank-v3.webp",
  "beast-deepfield": "/pro-skins/textures/deepfield-rank-v3.webp",
  "beast-milkyway": "/pro-skins/textures/milkyway-rank-v3.webp",
  "beast-shoals": "/pro-skins/textures/shoals-rank-v3.webp",
  "beast-uranus": "/pro-skins/textures/uranus-rank-v3.webp",
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
