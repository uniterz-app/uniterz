/** Native 互換 — 本体は lib/profile/futuristicBgTheme */
export {
  FUTURISTIC_BG_THEME,
  FUTURISTIC_BG_PREVIEW_CARD,
  FUTURISTIC_BG_VARIANT_META,
  type FuturisticBgVariantId,
} from "@/lib/profile/futuristicBgTheme";

import { FUTURISTIC_BG_THEME } from "@/lib/profile/futuristicBgTheme";

export const PROFILE_BG = {
  void: FUTURISTIC_BG_THEME.background,
  navy: FUTURISTIC_BG_THEME.navy,
  deep: FUTURISTIC_BG_THEME.deepNavy,
  cyan: FUTURISTIC_BG_THEME.cyan,
  blue: FUTURISTIC_BG_THEME.blue,
  purple: FUTURISTIC_BG_THEME.purple,
  magenta: FUTURISTIC_BG_THEME.magenta,
  whiteSoft: FUTURISTIC_BG_THEME.white.soft,
} as const;

export const PROFILE_BG_ALPHA = {
  cyanSoft: FUTURISTIC_BG_THEME.cyanAlpha.soft,
  cyanDim: FUTURISTIC_BG_THEME.cyanAlpha.dim,
  blueSoft: FUTURISTIC_BG_THEME.blueAlpha.soft,
  purpleSoft: FUTURISTIC_BG_THEME.purpleAlpha.soft,
  magentaSoft: FUTURISTIC_BG_THEME.magentaAlpha.soft,
  line: FUTURISTIC_BG_THEME.cyanAlpha.mid,
} as const;
