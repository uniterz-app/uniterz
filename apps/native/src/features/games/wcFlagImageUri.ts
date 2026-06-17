import { teamIdToWcCountry } from "../../../../../lib/wc/wcCountry";

/**
 * WC 国旗 PNG URI（RN はローカル SVG が描画されない環境があるため flagcdn を使用）
 * Web の `/flags/4x3/<iso2>.svg` と同等の国コードセット
 */
export function wcFlagImageUri(
  teamId: string | null | undefined
): string | undefined {
  const country = teamId ? teamIdToWcCountry(teamId) : null;
  if (!country?.flag) return undefined;
  const flagKey = country.flag.toLowerCase();
  return `https://flagcdn.com/w160/${flagKey}.png`;
}
