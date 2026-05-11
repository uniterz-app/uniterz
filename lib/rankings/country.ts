export type CountryOption = {
  code: string;
  labelJa: string;
  labelEn: string;
};

export const COUNTRY_OPTIONS: CountryOption[] = [
  // ── East Asia ──
  { code: "JP", labelJa: "日本", labelEn: "Japan" },
  { code: "CN", labelJa: "中国", labelEn: "China" },
  { code: "KR", labelJa: "韓国", labelEn: "South Korea" },
  { code: "TW", labelJa: "台湾", labelEn: "Taiwan" },
  { code: "HK", labelJa: "香港", labelEn: "Hong Kong" },
  { code: "MO", labelJa: "マカオ", labelEn: "Macau" },
  { code: "MN", labelJa: "モンゴル", labelEn: "Mongolia" },

  // ── Southeast Asia ──
  { code: "SG", labelJa: "シンガポール", labelEn: "Singapore" },
  { code: "TH", labelJa: "タイ", labelEn: "Thailand" },
  { code: "VN", labelJa: "ベトナム", labelEn: "Vietnam" },
  { code: "ID", labelJa: "インドネシア", labelEn: "Indonesia" },
  { code: "PH", labelJa: "フィリピン", labelEn: "Philippines" },
  { code: "MY", labelJa: "マレーシア", labelEn: "Malaysia" },
  { code: "MM", labelJa: "ミャンマー", labelEn: "Myanmar" },
  { code: "KH", labelJa: "カンボジア", labelEn: "Cambodia" },
  { code: "LA", labelJa: "ラオス", labelEn: "Laos" },
  { code: "BN", labelJa: "ブルネイ", labelEn: "Brunei" },
  { code: "TL", labelJa: "東ティモール", labelEn: "Timor-Leste" },

  // ── South Asia ──
  { code: "IN", labelJa: "インド", labelEn: "India" },
  { code: "PK", labelJa: "パキスタン", labelEn: "Pakistan" },
  { code: "BD", labelJa: "バングラデシュ", labelEn: "Bangladesh" },
  { code: "LK", labelJa: "スリランカ", labelEn: "Sri Lanka" },
  { code: "NP", labelJa: "ネパール", labelEn: "Nepal" },
  { code: "MV", labelJa: "モルディブ", labelEn: "Maldives" },
  { code: "BT", labelJa: "ブータン", labelEn: "Bhutan" },
  { code: "AF", labelJa: "アフガニスタン", labelEn: "Afghanistan" },

  // ── Central Asia ──
  { code: "KZ", labelJa: "カザフスタン", labelEn: "Kazakhstan" },
  { code: "UZ", labelJa: "ウズベキスタン", labelEn: "Uzbekistan" },
  { code: "KG", labelJa: "キルギス", labelEn: "Kyrgyzstan" },
  { code: "TJ", labelJa: "タジキスタン", labelEn: "Tajikistan" },
  { code: "TM", labelJa: "トルクメニスタン", labelEn: "Turkmenistan" },

  // ── Middle East ──
  { code: "AE", labelJa: "アラブ首長国連邦", labelEn: "United Arab Emirates" },
  { code: "SA", labelJa: "サウジアラビア", labelEn: "Saudi Arabia" },
  { code: "QA", labelJa: "カタール", labelEn: "Qatar" },
  { code: "KW", labelJa: "クウェート", labelEn: "Kuwait" },
  { code: "BH", labelJa: "バーレーン", labelEn: "Bahrain" },
  { code: "OM", labelJa: "オマーン", labelEn: "Oman" },
  { code: "IL", labelJa: "イスラエル", labelEn: "Israel" },
  { code: "JO", labelJa: "ヨルダン", labelEn: "Jordan" },
  { code: "LB", labelJa: "レバノン", labelEn: "Lebanon" },
  { code: "IQ", labelJa: "イラク", labelEn: "Iraq" },
  { code: "IR", labelJa: "イラン", labelEn: "Iran" },
  { code: "SY", labelJa: "シリア", labelEn: "Syria" },
  { code: "YE", labelJa: "イエメン", labelEn: "Yemen" },
  { code: "PS", labelJa: "パレスチナ", labelEn: "Palestine" },
  { code: "TR", labelJa: "トルコ", labelEn: "Turkey" },
  { code: "CY", labelJa: "キプロス", labelEn: "Cyprus" },
  { code: "GE", labelJa: "ジョージア", labelEn: "Georgia" },
  { code: "AM", labelJa: "アルメニア", labelEn: "Armenia" },
  { code: "AZ", labelJa: "アゼルバイジャン", labelEn: "Azerbaijan" },

  // ── Oceania ──
  { code: "AU", labelJa: "オーストラリア", labelEn: "Australia" },
  { code: "NZ", labelJa: "ニュージーランド", labelEn: "New Zealand" },
  { code: "FJ", labelJa: "フィジー", labelEn: "Fiji" },
  { code: "PG", labelJa: "パプアニューギニア", labelEn: "Papua New Guinea" },
  { code: "WS", labelJa: "サモア", labelEn: "Samoa" },
  { code: "TO", labelJa: "トンガ", labelEn: "Tonga" },
  { code: "VU", labelJa: "バヌアツ", labelEn: "Vanuatu" },
  { code: "GU", labelJa: "グアム", labelEn: "Guam" },

  // ── North America ──
  { code: "US", labelJa: "アメリカ合衆国", labelEn: "United States" },
  { code: "CA", labelJa: "カナダ", labelEn: "Canada" },
  { code: "MX", labelJa: "メキシコ", labelEn: "Mexico" },
  { code: "GT", labelJa: "グアテマラ", labelEn: "Guatemala" },
  { code: "CU", labelJa: "キューバ", labelEn: "Cuba" },
  { code: "HT", labelJa: "ハイチ", labelEn: "Haiti" },
  { code: "DO", labelJa: "ドミニカ共和国", labelEn: "Dominican Republic" },
  { code: "HN", labelJa: "ホンジュラス", labelEn: "Honduras" },
  { code: "SV", labelJa: "エルサルバドル", labelEn: "El Salvador" },
  { code: "NI", labelJa: "ニカラグア", labelEn: "Nicaragua" },
  { code: "CR", labelJa: "コスタリカ", labelEn: "Costa Rica" },
  { code: "PA", labelJa: "パナマ", labelEn: "Panama" },
  { code: "JM", labelJa: "ジャマイカ", labelEn: "Jamaica" },
  { code: "TT", labelJa: "トリニダード・トバゴ", labelEn: "Trinidad and Tobago" },
  { code: "BS", labelJa: "バハマ", labelEn: "Bahamas" },
  { code: "BB", labelJa: "バルバドス", labelEn: "Barbados" },
  { code: "BZ", labelJa: "ベリーズ", labelEn: "Belize" },
  { code: "PR", labelJa: "プエルトリコ", labelEn: "Puerto Rico" },

  // ── South America ──
  { code: "BR", labelJa: "ブラジル", labelEn: "Brazil" },
  { code: "AR", labelJa: "アルゼンチン", labelEn: "Argentina" },
  { code: "CO", labelJa: "コロンビア", labelEn: "Colombia" },
  { code: "PE", labelJa: "ペルー", labelEn: "Peru" },
  { code: "VE", labelJa: "ベネズエラ", labelEn: "Venezuela" },
  { code: "CL", labelJa: "チリ", labelEn: "Chile" },
  { code: "EC", labelJa: "エクアドル", labelEn: "Ecuador" },
  { code: "BO", labelJa: "ボリビア", labelEn: "Bolivia" },
  { code: "PY", labelJa: "パラグアイ", labelEn: "Paraguay" },
  { code: "UY", labelJa: "ウルグアイ", labelEn: "Uruguay" },
  { code: "GY", labelJa: "ガイアナ", labelEn: "Guyana" },
  { code: "SR", labelJa: "スリナム", labelEn: "Suriname" },

  // ── Western Europe ──
  { code: "GB", labelJa: "イギリス", labelEn: "United Kingdom" },
  { code: "DE", labelJa: "ドイツ", labelEn: "Germany" },
  { code: "FR", labelJa: "フランス", labelEn: "France" },
  { code: "ES", labelJa: "スペイン", labelEn: "Spain" },
  { code: "IT", labelJa: "イタリア", labelEn: "Italy" },
  { code: "NL", labelJa: "オランダ", labelEn: "Netherlands" },
  { code: "BE", labelJa: "ベルギー", labelEn: "Belgium" },
  { code: "PT", labelJa: "ポルトガル", labelEn: "Portugal" },
  { code: "CH", labelJa: "スイス", labelEn: "Switzerland" },
  { code: "AT", labelJa: "オーストリア", labelEn: "Austria" },
  { code: "IE", labelJa: "アイルランド", labelEn: "Ireland" },
  { code: "LU", labelJa: "ルクセンブルク", labelEn: "Luxembourg" },
  { code: "MC", labelJa: "モナコ", labelEn: "Monaco" },
  { code: "LI", labelJa: "リヒテンシュタイン", labelEn: "Liechtenstein" },
  { code: "AD", labelJa: "アンドラ", labelEn: "Andorra" },
  { code: "MT", labelJa: "マルタ", labelEn: "Malta" },

  // ── Northern Europe ──
  { code: "SE", labelJa: "スウェーデン", labelEn: "Sweden" },
  { code: "NO", labelJa: "ノルウェー", labelEn: "Norway" },
  { code: "DK", labelJa: "デンマーク", labelEn: "Denmark" },
  { code: "FI", labelJa: "フィンランド", labelEn: "Finland" },
  { code: "IS", labelJa: "アイスランド", labelEn: "Iceland" },
  { code: "EE", labelJa: "エストニア", labelEn: "Estonia" },
  { code: "LV", labelJa: "ラトビア", labelEn: "Latvia" },
  { code: "LT", labelJa: "リトアニア", labelEn: "Lithuania" },

  // ── Eastern Europe ──
  { code: "PL", labelJa: "ポーランド", labelEn: "Poland" },
  { code: "CZ", labelJa: "チェコ", labelEn: "Czech Republic" },
  { code: "SK", labelJa: "スロバキア", labelEn: "Slovakia" },
  { code: "HU", labelJa: "ハンガリー", labelEn: "Hungary" },
  { code: "RO", labelJa: "ルーマニア", labelEn: "Romania" },
  { code: "BG", labelJa: "ブルガリア", labelEn: "Bulgaria" },
  { code: "HR", labelJa: "クロアチア", labelEn: "Croatia" },
  { code: "RS", labelJa: "セルビア", labelEn: "Serbia" },
  { code: "SI", labelJa: "スロベニア", labelEn: "Slovenia" },
  { code: "BA", labelJa: "ボスニア・ヘルツェゴビナ", labelEn: "Bosnia and Herzegovina" },
  { code: "ME", labelJa: "モンテネグロ", labelEn: "Montenegro" },
  { code: "MK", labelJa: "北マケドニア", labelEn: "North Macedonia" },
  { code: "AL", labelJa: "アルバニア", labelEn: "Albania" },
  { code: "XK", labelJa: "コソボ", labelEn: "Kosovo" },
  { code: "MD", labelJa: "モルドバ", labelEn: "Moldova" },
  { code: "UA", labelJa: "ウクライナ", labelEn: "Ukraine" },
  { code: "BY", labelJa: "ベラルーシ", labelEn: "Belarus" },
  { code: "RU", labelJa: "ロシア", labelEn: "Russia" },
  { code: "GR", labelJa: "ギリシャ", labelEn: "Greece" },

  // ── North Africa ──
  { code: "EG", labelJa: "エジプト", labelEn: "Egypt" },
  { code: "MA", labelJa: "モロッコ", labelEn: "Morocco" },
  { code: "DZ", labelJa: "アルジェリア", labelEn: "Algeria" },
  { code: "TN", labelJa: "チュニジア", labelEn: "Tunisia" },
  { code: "LY", labelJa: "リビア", labelEn: "Libya" },
  { code: "SD", labelJa: "スーダン", labelEn: "Sudan" },

  // ── West Africa ──
  { code: "NG", labelJa: "ナイジェリア", labelEn: "Nigeria" },
  { code: "GH", labelJa: "ガーナ", labelEn: "Ghana" },
  { code: "SN", labelJa: "セネガル", labelEn: "Senegal" },
  { code: "CI", labelJa: "コートジボワール", labelEn: "Ivory Coast" },
  { code: "CM", labelJa: "カメルーン", labelEn: "Cameroon" },
  { code: "ML", labelJa: "マリ", labelEn: "Mali" },
  { code: "BF", labelJa: "ブルキナファソ", labelEn: "Burkina Faso" },
  { code: "NE", labelJa: "ニジェール", labelEn: "Niger" },
  { code: "GN", labelJa: "ギニア", labelEn: "Guinea" },
  { code: "BJ", labelJa: "ベナン", labelEn: "Benin" },
  { code: "TG", labelJa: "トーゴ", labelEn: "Togo" },
  { code: "SL", labelJa: "シエラレオネ", labelEn: "Sierra Leone" },
  { code: "LR", labelJa: "リベリア", labelEn: "Liberia" },
  { code: "MR", labelJa: "モーリタニア", labelEn: "Mauritania" },
  { code: "GM", labelJa: "ガンビア", labelEn: "Gambia" },
  { code: "GW", labelJa: "ギニアビサウ", labelEn: "Guinea-Bissau" },
  { code: "CV", labelJa: "カーボベルデ", labelEn: "Cape Verde" },

  // ── East Africa ──
  { code: "KE", labelJa: "ケニア", labelEn: "Kenya" },
  { code: "ET", labelJa: "エチオピア", labelEn: "Ethiopia" },
  { code: "TZ", labelJa: "タンザニア", labelEn: "Tanzania" },
  { code: "UG", labelJa: "ウガンダ", labelEn: "Uganda" },
  { code: "RW", labelJa: "ルワンダ", labelEn: "Rwanda" },
  { code: "SO", labelJa: "ソマリア", labelEn: "Somalia" },
  { code: "ER", labelJa: "エリトリア", labelEn: "Eritrea" },
  { code: "DJ", labelJa: "ジブチ", labelEn: "Djibouti" },
  { code: "MG", labelJa: "マダガスカル", labelEn: "Madagascar" },
  { code: "MU", labelJa: "モーリシャス", labelEn: "Mauritius" },
  { code: "SC", labelJa: "セーシェル", labelEn: "Seychelles" },

  // ── Central Africa ──
  { code: "CD", labelJa: "コンゴ民主共和国", labelEn: "DR Congo" },
  { code: "CG", labelJa: "コンゴ共和国", labelEn: "Republic of the Congo" },
  { code: "GA", labelJa: "ガボン", labelEn: "Gabon" },
  { code: "GQ", labelJa: "赤道ギニア", labelEn: "Equatorial Guinea" },
  { code: "CF", labelJa: "中央アフリカ", labelEn: "Central African Republic" },
  { code: "TD", labelJa: "チャド", labelEn: "Chad" },
  { code: "AO", labelJa: "アンゴラ", labelEn: "Angola" },

  // ── Southern Africa ──
  { code: "ZA", labelJa: "南アフリカ", labelEn: "South Africa" },
  { code: "ZW", labelJa: "ジンバブエ", labelEn: "Zimbabwe" },
  { code: "ZM", labelJa: "ザンビア", labelEn: "Zambia" },
  { code: "MW", labelJa: "マラウイ", labelEn: "Malawi" },
  { code: "MZ", labelJa: "モザンビーク", labelEn: "Mozambique" },
  { code: "BW", labelJa: "ボツワナ", labelEn: "Botswana" },
  { code: "NA", labelJa: "ナミビア", labelEn: "Namibia" },
  { code: "SZ", labelJa: "エスワティニ", labelEn: "Eswatini" },
  { code: "LS", labelJa: "レソト", labelEn: "Lesotho" },
  { code: "SS", labelJa: "南スーダン", labelEn: "South Sudan" },
  { code: "BI", labelJa: "ブルンジ", labelEn: "Burundi" },
];

/** All flag images live under /flags/4x3/<iso2>.svg */
const flagPath = (iso2: string) => `/flags/4x3/${iso2.toLowerCase()}.svg`;

export const FLAG_SRC: Record<string, string> = Object.fromEntries(
  COUNTRY_OPTIONS.map((c) => [c.code, flagPath(c.code)]),
);

export function getCountryCode(row: { countryCode?: string | null }): string | undefined {
  if (!row.countryCode) return undefined;
  const upper = row.countryCode.toUpperCase();
  return FLAG_SRC[upper] ? upper : undefined;
}
