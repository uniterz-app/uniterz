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
  return flagImageUriFromIso2(country.flag);
}

export function flagImageUriFromIso2(iso2: string | null | undefined): string | undefined {
  const flagKey = iso2?.trim().toLowerCase();
  if (!flagKey) return undefined;
  return `https://flagcdn.com/w160/${flagKey}.png`;
}
