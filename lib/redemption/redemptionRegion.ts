/**
 * 商品交換の対象外地域。
 * BR: Lei 5.768/1971（景品付き販促は SPA の事前認可が必要・申請はブラジル法人のみ）のため対象外。
 */

export const REDEMPTION_BLOCKED_COUNTRY_CODES = ["BR"] as const;

const BLOCKED_COUNTRY_ALIASES: Record<string, string> = {
  BR: "BR",
  BRA: "BR",
  BRASIL: "BR",
  BRAZIL: "BR",
  BRESIL: "BR",
  BRASILIEN: "BR",
  BRASILE: "BR",
  ブラジル: "BR",
  巴西: "BR",
  브라질: "BR",
};

/** 自由入力の国名を対象外コードへ（該当しなければ null） */
export function blockedRedemptionCountryCode(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const key = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .normalize("NFKC")
    .replace(/[\s.\-_]/g, "")
    .toUpperCase();
  if (!key) return null;
  return BLOCKED_COUNTRY_ALIASES[key] ?? null;
}

/** +55 / 0055 始まり（国内 055 市外局番は対象外にしない） */
function isBrazilPhone(raw: unknown): boolean {
  if (typeof raw !== "string") return false;
  const digits = raw.replace(/[\s()\-.]/g, "");
  return digits.startsWith("+55") || digits.startsWith("0055");
}

export function isRedemptionRegionBlocked(input: {
  shippingCountry?: unknown;
  shippingPhone?: unknown;
  requestCountryCode?: unknown;
}): boolean {
  return (
    blockedRedemptionCountryCode(input.shippingCountry) != null ||
    blockedRedemptionCountryCode(input.requestCountryCode) != null ||
    isBrazilPhone(input.shippingPhone)
  );
}

export const REDEMPTION_REGION_UNAVAILABLE_ERROR = "region_unavailable";
