/**
 * 認証ランディング背景の切替。
 * `"grainWave"` = 粒子のうねる帯（現行）
 * `"hexTunnel"` = 金銀の二重枠
 * `"court"` = 夜間コート
 *
 * 金銀枠に戻すときはこの1行だけ `"hexTunnel"` にする。
 */
export type AuthLandingFieldVariant = "grainWave" | "hexTunnel" | "court";

export const AUTH_LANDING_FIELD_VARIANT: AuthLandingFieldVariant = "grainWave";
