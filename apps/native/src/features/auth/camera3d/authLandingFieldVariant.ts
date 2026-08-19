/**
 * 認証ランディング 3D 背景の切替。
 * `"hexTunnel"` = 金銀の二重枠
 * `"court"` = 夜間コート（安定）
 *
 * 戻すときはこの1行だけ `"court"` にする。
 */
export type AuthLandingFieldVariant = "hexTunnel" | "court";

export const AUTH_LANDING_FIELD_VARIANT: AuthLandingFieldVariant = "hexTunnel";
