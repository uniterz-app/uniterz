/**
 * 法務表記共通の事業者情報（利用規約・PP・特商法の正）。
 * 日本語が登記・法令表記の正。英語は UI 表示用のローマ字／英訳。
 */
export const COMPANY_LEGAL_NAME = "株式会社UNITERZ";
/** 英語 UI 用（登記名の通称英訳） */
export const COMPANY_LEGAL_NAME_EN = "UNITERZ Inc.";

export const COMPANY_REPRESENTATIVE = "神谷陸登";
export const COMPANY_REPRESENTATIVE_EN = "Rikuto Kamiya";
/** 日本語表示用（姓名の間に全角スペース） */
export const COMPANY_REPRESENTATIVE_DISPLAY = "神谷　陸登";

export const COMPANY_POSTAL_CODE = "220-0073";
export const COMPANY_ADDRESS =
  "神奈川県横浜市西区浅間町1-4-3 ウィザードビル402";
export const COMPANY_ADDRESS_FULL = `〒${COMPANY_POSTAL_CODE} ${COMPANY_ADDRESS}`;

export const COMPANY_ADDRESS_EN =
  "Wizard Bldg. 402, 1-4-3 Asama-cho, Nishi-ku, Yokohama-shi, Kanagawa 220-0073, Japan";
export const COMPANY_ADDRESS_FULL_EN = COMPANY_ADDRESS_EN;

export const COMPANY_WEB_URL = "https://uniterz.app";
/** 公開ページ（モバイル Web が正） */
export const PRIVACY_POLICY_URL = "https://uniterz.app/mobile/privacy";
export const TERMS_URL = "https://uniterz.app/mobile/terms";
export const TOKUSHOHO_URL = "https://uniterz.app/mobile/law";

/** 住所誤り等による再配達・再送料（税込・全国一律） */
export const REDELIVERY_SHIPPING_FEE_JPY = 770;

/** Season Pass の運用上の終了日（購入画面表示を優先） */
export const SEASON_PASS_END_MONTH_DAY = "7月31日";
export const SEASON_PASS_END_MONTH_DAY_EN = "July 31";

export type CompanyLang = "ja" | "en";

export function companyLegalName(lang: CompanyLang): string {
  return lang === "en" ? COMPANY_LEGAL_NAME_EN : COMPANY_LEGAL_NAME;
}

export function companyRepresentative(lang: CompanyLang): string {
  return lang === "en" ? COMPANY_REPRESENTATIVE_EN : COMPANY_REPRESENTATIVE_DISPLAY;
}

export function companyAddress(lang: CompanyLang): string {
  return lang === "en" ? COMPANY_ADDRESS_EN : COMPANY_ADDRESS;
}

export function companyAddressFull(lang: CompanyLang): string {
  return lang === "en" ? COMPANY_ADDRESS_FULL_EN : COMPANY_ADDRESS_FULL;
}
