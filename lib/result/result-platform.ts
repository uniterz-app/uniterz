/**
 * リザルト UI のプラットフォーム（ルートで決め打ち。pathname 推測にしない）
 */
export type ResultPlatform = "mobile" | "web";

/** 3D テーブル・カメラ・カード縮小で使う「狭い縦相当」フラグ（現状は mobile のみ true） */
export type ResultTableProfile = {
  platform: ResultPlatform;
  /** フルスクリーン時に compact 段組・カメラ寄り・スケールをモバイル向けにする */
  compact3dFullscreen: boolean;
};

export function getResultTableProfile(
  platform: ResultPlatform
): ResultTableProfile {
  return {
    platform,
    compact3dFullscreen: platform === "mobile",
  };
}
