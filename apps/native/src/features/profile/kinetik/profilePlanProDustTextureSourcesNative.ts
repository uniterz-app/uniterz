/**
 * Dust 素材テクスチャ — Native require
 * 他 beast と同じ 300:430 を artH stretch（card 1080×1548 / rank 1600×320）
 */
import type { ImageSourcePropType } from "react-native";
import type { ProfilePlanProDustTextureId } from "../../../../../../lib/profile/profilePlanProDustTextures";
import {
  DUST_CARD_TEXTURE_SIZE,
  DUST_RANK_TEXTURE_SIZE,
} from "../../../../../../lib/profile/profilePlanProDustTextures";

export const PROFILE_PLAN_PRO_DUST_TEXTURE_SOURCES: Record<
  ProfilePlanProDustTextureId,
  ImageSourcePropType
> = {
  "beast-dust": require("../../../../assets/pro-skins/textures/dust-powder-v3.webp"),
  "beast-dust-ash": require("../../../../assets/pro-skins/textures/dust-film-v3.webp"),
};

export const PROFILE_PLAN_PRO_DUST_RANK_TEXTURE_SOURCES: Record<
  ProfilePlanProDustTextureId,
  ImageSourcePropType
> = {
  "beast-dust": require("../../../../assets/pro-skins/textures/dust-powder-rank-v3.webp"),
  "beast-dust-ash": require("../../../../assets/pro-skins/textures/dust-film-rank-v3.webp"),
};

export { DUST_CARD_TEXTURE_SIZE, DUST_RANK_TEXTURE_SIZE };
