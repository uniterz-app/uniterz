// lib/wc/rosters.ts
//
// World Cup ロスターも静的データ扱い（大会前に決まれば大会期間中はほぼ動かない）。
// 全 23–26 名は冗長なので「キープレイヤー数名」だけ。
// フル名簿が要るときはここを増やすだけで OK。

export type WcPosition = "GK" | "DF" | "MF" | "FW";

export type WcRosterPlayer = {
  /** 背番号 */
  no: number;
  name: string;
  pos: WcPosition;
  /** 所属クラブ（任意） */
  club?: string;
  /** キャプテンマーク */
  captain?: boolean;
};

const WC_ROSTERS: Record<string, WcRosterPlayer[]> = {
  jpn: [
    { no: 1, name: "Zion Suzuki", pos: "GK", club: "Parma" },
    { no: 4, name: "Wataru Endo", pos: "MF", club: "Liverpool", captain: true },
    { no: 8, name: "Takefusa Kubo", pos: "MF", club: "Real Sociedad" },
    { no: 10, name: "Kaoru Mitoma", pos: "FW", club: "Brighton" },
    { no: 14, name: "Junya Ito", pos: "MF", club: "Stade de Reims" },
    { no: 9, name: "Ayase Ueda", pos: "FW", club: "Feyenoord" },
  ],
  bra: [
    { no: 1, name: "Alisson", pos: "GK", club: "Liverpool" },
    {
      no: 5,
      name: "Casemiro",
      pos: "MF",
      club: "Manchester United",
      captain: true,
    },
    { no: 7, name: "Rodrygo", pos: "FW", club: "Real Madrid" },
    { no: 9, name: "Endrick", pos: "FW", club: "Real Madrid" },
    { no: 10, name: "Vinícius Jr", pos: "FW", club: "Real Madrid" },
    { no: 19, name: "Raphinha", pos: "FW", club: "Barcelona" },
  ],
  // esp / gha は後で追加
};

export function getWcRoster(teamId: string | null | undefined): WcRosterPlayer[] {
  if (!teamId || !teamId.startsWith("wc-")) return [];
  const iso3 = teamId.slice(3).toLowerCase();
  return WC_ROSTERS[iso3] ?? [];
}
