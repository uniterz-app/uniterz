import { FLAG_SRC } from "../../../../../lib/rankings/country";

/**
 * ランキングカード用の国旗画像 URI（RN の Image はリモート SVG が描画されない環境があるため PNG を使用）
 * Web の `/flags/4x3/*.svg` と同等の国コードセットに限定する
 */
export function rankingFlagImageUri(countryCode: string | undefined): string | undefined {
  if (!countryCode) return undefined;
  const upper = countryCode.toUpperCase();
  if (!FLAG_SRC[upper]) return undefined;
  const lc = upper.toLowerCase();
  return `https://flagcdn.com/w80/${lc}.png`;
}
