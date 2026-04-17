import type { RankingRowWithCountry }from "@/app/component/rankings/_data/mockRows";

/** COUNTRY_OPTIONS と同じ ISO コード。拡張子は実ファイルに合わせる */
export const FLAG_SRC: Record<string, string> = {
  US: "/flags/us.png",
  CN: "/flags/cn.png",
  JP: "/flags/jp.png",
  KR: "/flags/kr.png",
  TW: "/flags/tw.png",
  HK: "/flags/hk.png",
  SG: "/flags/sg.svg",
  TH: "/flags/th.svg",
  VN: "/flags/vn.png",
  ID: "/flags/id.svg",
  PH: "/flags/ph.svg",
  MY: "/flags/my.png",
  /** 取り込み元ファイル名が不定のため、インド以外なら in.png を差し替え */
  IN: "/flags/in.png",
  AU: "/flags/au.svg",
  NZ: "/flags/nz.png",
  GB: "/flags/gb.svg",
  DE: "/flags/de.png",
  FR: "/flags/fr.png",
  ES: "/flags/es.svg",
  IT: "/flags/it.png",
  NL: "/flags/nl.png",
  SE: "/flags/se.png",
  NO: "/flags/no.png",
  DK: "/flags/dk.png",
  PL: "/flags/pl.png",
  TR: "/flags/tr.svg",
  AE: "/flags/ae.webp",
  SA: "/flags/sa.svg",
  BR: "/flags/br.png",
  MX: "/flags/mx.svg",
};

export type CountryOption = {
  code: string;
  labelJa: string;
  labelEn: string;
};

export const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "US", labelJa: "アメリカ合衆国", labelEn: "United States" },
  { code: "JP", labelJa: "日本", labelEn: "Japan" },
  { code: "CN", labelJa: "中国", labelEn: "China" },
  { code: "KR", labelJa: "韓国", labelEn: "South Korea" },
  { code: "TW", labelJa: "台湾", labelEn: "Taiwan" },
  { code: "HK", labelJa: "香港", labelEn: "Hong Kong" },
  { code: "SG", labelJa: "シンガポール", labelEn: "Singapore" },
  { code: "TH", labelJa: "タイ", labelEn: "Thailand" },
  { code: "VN", labelJa: "ベトナム", labelEn: "Vietnam" },
  { code: "ID", labelJa: "インドネシア", labelEn: "Indonesia" },
  { code: "PH", labelJa: "フィリピン", labelEn: "Philippines" },
  { code: "MY", labelJa: "マレーシア", labelEn: "Malaysia" },
  { code: "IN", labelJa: "インド", labelEn: "India" },
  { code: "AU", labelJa: "オーストラリア", labelEn: "Australia" },
  { code: "NZ", labelJa: "ニュージーランド", labelEn: "New Zealand" },
  { code: "GB", labelJa: "イギリス", labelEn: "United Kingdom" },
  { code: "DE", labelJa: "ドイツ", labelEn: "Germany" },
  { code: "FR", labelJa: "フランス", labelEn: "France" },
  { code: "ES", labelJa: "スペイン", labelEn: "Spain" },
  { code: "IT", labelJa: "イタリア", labelEn: "Italy" },
  { code: "NL", labelJa: "オランダ", labelEn: "Netherlands" },
  { code: "SE", labelJa: "スウェーデン", labelEn: "Sweden" },
  { code: "NO", labelJa: "ノルウェー", labelEn: "Norway" },
  { code: "DK", labelJa: "デンマーク", labelEn: "Denmark" },
  { code: "PL", labelJa: "ポーランド", labelEn: "Poland" },
  { code: "TR", labelJa: "トルコ", labelEn: "Turkey" },
  { code: "AE", labelJa: "アラブ首長国連邦", labelEn: "United Arab Emirates" },
  { code: "SA", labelJa: "サウジアラビア", labelEn: "Saudi Arabia" },
  { code: "BR", labelJa: "ブラジル", labelEn: "Brazil" },
  { code: "MX", labelJa: "メキシコ", labelEn: "Mexico" },
];

export function getCountryCode(
  row: RankingRowWithCountry
): string | undefined {
  if (!row.countryCode) return undefined;
  const upper = row.countryCode.toUpperCase();
  return FLAG_SRC[upper] ? upper : undefined;
}