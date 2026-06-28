/**
 * WC 2026 チーム表示名（seed / knockout 用）
 */

export type WcTeamDisplayNames = { en: string; ja: string };

export const WC_TEAM_DISPLAY_NAMES: Record<string, WcTeamDisplayNames> = {
  mex: { en: "Mexico", ja: "メキシコ" },
  zaf: { en: "South Africa", ja: "南アフリカ" },
  kor: { en: "South Korea", ja: "韓国" },
  cze: { en: "Czechia", ja: "チェコ" },
  can: { en: "Canada", ja: "カナダ" },
  bih: { en: "Bosnia & Herzegovina", ja: "ボスニア・ヘルツェゴビナ" },
  qat: { en: "Qatar", ja: "カタール" },
  che: { en: "Switzerland", ja: "スイス" },
  bra: { en: "Brazil", ja: "ブラジル" },
  mar: { en: "Morocco", ja: "モロッコ" },
  hti: { en: "Haiti", ja: "ハイチ" },
  sct: { en: "Scotland", ja: "スコットランド" },
  usa: { en: "USA", ja: "アメリカ" },
  pry: { en: "Paraguay", ja: "パラグアイ" },
  aus: { en: "Australia", ja: "オーストラリア" },
  tur: { en: "Türkiye", ja: "トルコ" },
  deu: { en: "Germany", ja: "ドイツ" },
  civ: { en: "Côte d'Ivoire", ja: "コートジボワール" },
  ecu: { en: "Ecuador", ja: "エクアドル" },
  cuw: { en: "Curaçao", ja: "キュラソー" },
  nld: { en: "Netherlands", ja: "オランダ" },
  jpn: { en: "Japan", ja: "日本" },
  swe: { en: "Sweden", ja: "スウェーデン" },
  tun: { en: "Tunisia", ja: "チュニジア" },
  bel: { en: "Belgium", ja: "ベルギー" },
  egy: { en: "Egypt", ja: "エジプト" },
  irn: { en: "Iran", ja: "イラン" },
  nzl: { en: "New Zealand", ja: "ニュージーランド" },
  esp: { en: "Spain", ja: "スペイン" },
  cpv: { en: "Cabo Verde", ja: "カーボベルデ" },
  sau: { en: "Saudi Arabia", ja: "サウジアラビア" },
  ury: { en: "Uruguay", ja: "ウルグアイ" },
  fra: { en: "France", ja: "フランス" },
  sen: { en: "Senegal", ja: "セネガル" },
  irq: { en: "Iraq", ja: "イラク" },
  nor: { en: "Norway", ja: "ノルウェー" },
  arg: { en: "Argentina", ja: "アルゼンチン" },
  dza: { en: "Algeria", ja: "アルジェリア" },
  aut: { en: "Austria", ja: "オーストリア" },
  jor: { en: "Jordan", ja: "ヨルダン" },
  prt: { en: "Portugal", ja: "ポルトガル" },
  cod: { en: "DR Congo", ja: "DRコンゴ" },
  uzb: { en: "Uzbekistan", ja: "ウズベキスタン" },
  col: { en: "Colombia", ja: "コロンビア" },
  eng: { en: "England", ja: "イングランド" },
  hrv: { en: "Croatia", ja: "クロアチア" },
  gha: { en: "Ghana", ja: "ガーナ" },
  pan: { en: "Panama", ja: "パナマ" },
};

export function wcTeamIdFromIso3(iso3: string): string {
  return `wc-${iso3}`;
}

export function wcIso3FromTeamId(teamId: string): string {
  return teamId.replace(/^wc-/, "");
}

export function lookupWcTeamDisplay(iso3: string): WcTeamDisplayNames | null {
  return WC_TEAM_DISPLAY_NAMES[iso3] ?? null;
}
