import type { RankingRowWithCountry }from "@/app/component/rankings/_data/mockRows";

export const FLAG_SRC: Record<string, string> = {
  US: "/flags/us.png",
  CN: "/flags/cn.png",
  JP: "/flags/jp.png",
};

export function getCountryCode(
  row: RankingRowWithCountry
): string | undefined {
  if (!row.countryCode) return undefined;
  return FLAG_SRC[row.countryCode] ? row.countryCode : undefined;
}