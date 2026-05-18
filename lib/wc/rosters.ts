// lib/wc/rosters.ts
//
// World Cup ロスターも静的データ扱い（大会前に決まれば大会期間中はほぼ動かない）。
// 全 23–26 名は冗長なので「キープレイヤー数名」だけ。
// フル名簿が要るときはここを増やすだけで OK。
//
// 最終更新: 2026-05-15 頃 — 各国の最終発表に追随（Wikipedia / JFA 等）

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
  // --- Group A ---
  kor: [
    { no: 1, name: "Kim Seung-gyu", pos: "GK", club: "FC Tokyo" },
    { no: 4, name: "Kim Min-jae", pos: "DF", club: "Bayern Munich" },
    { no: 7, name: "Son Heung-min", pos: "FW", club: "LAFC", captain: true },
    { no: 11, name: "Hwang Hee-chan", pos: "MF", club: "Wolves" },
    { no: 18, name: "Lee Kang-in", pos: "MF", club: "Paris Saint-Germain" },
    { no: 9, name: "Cho Gue-sung", pos: "FW", club: "Midtjylland" },
  ],

  // --- Group B ---
  bih: [
    { no: 1, name: "Nikola Vasilj", pos: "GK", club: "St. Pauli" },
    { no: 18, name: "Sead Kolašinac", pos: "DF", club: "Atalanta" },
    { no: 10, name: "Edin Džeko", pos: "FW", club: "Schalke 04", captain: true },
    { no: 9, name: "Ermedin Demirović", pos: "FW", club: "Stuttgart" },
    { no: 17, name: "Esmir Bajraktarević", pos: "MF", club: "PSV" },
    { no: 2, name: "Amar Dedić", pos: "DF", club: "Benfica" },
  ],

  // --- Group C ---
  bra: [
    { no: 1, name: "Alisson", pos: "GK", club: "Liverpool" },
    { no: 5, name: "Casemiro", pos: "MF", club: "Manchester United", captain: true },
    { no: 10, name: "Neymar", pos: "FW", club: "Santos" },
    { no: 7, name: "Vinícius Jr", pos: "FW", club: "Real Madrid" },
    { no: 11, name: "Raphinha", pos: "FW", club: "Barcelona" },
    { no: 9, name: "Endrick", pos: "FW", club: "Lyon" },
  ],
  hti: [
    { no: 1, name: "Johny Placide", pos: "GK", club: "Bastia", captain: true },
    { no: 7, name: "Jean-Ricner Bellegarde", pos: "MF", club: "Wolves" },
    { no: 9, name: "Duckens Nazon", pos: "FW", club: "Esteghlal" },
    { no: 10, name: "Frantzdy Pierrot", pos: "FW", club: "Rizespor" },
    { no: 11, name: "Wilson Isidor", pos: "FW", club: "Sunderland" },
    { no: 6, name: "Carlens Arcus", pos: "DF", club: "Angers" },
  ],

  // --- Group E ---
  civ: [
    { no: 1, name: "Yahia Fofana", pos: "GK", club: "Rizespor" },
    { no: 4, name: "Odilon Kossounou", pos: "DF", club: "Atalanta" },
    { no: 8, name: "Franck Kessié", pos: "MF", club: "Al-Ahli", captain: true },
    { no: 19, name: "Nicolas Pépé", pos: "FW", club: "Villarreal" },
    { no: 11, name: "Simon Adingra", pos: "FW", club: "Monaco" },
    { no: 16, name: "Amad Diallo", pos: "FW", club: "Manchester United" },
  ],

  // --- Group F ---
  jpn: [
    { no: 1, name: "Zion Suzuki", pos: "GK", club: "Parma" },
    { no: 22, name: "Yuto Nagatomo", pos: "DF", club: "FC Tokyo" },
    { no: 4, name: "Wataru Endo", pos: "MF", club: "Liverpool", captain: true },
    { no: 8, name: "Daichi Kamada", pos: "MF", club: "Crystal Palace" },
    { no: 7, name: "Takefusa Kubo", pos: "MF", club: "Real Sociedad" },
    { no: 9, name: "Ayase Ueda", pos: "FW", club: "Feyenoord" },
  ],
  swe: [
    { no: 1, name: "Kristoffer Nordfeldt", pos: "GK", club: "AIK" },
    { no: 3, name: "Victor Lindelöf", pos: "DF", club: "Aston Villa", captain: true },
    { no: 20, name: "Lucas Bergvall", pos: "MF", club: "Tottenham" },
    { no: 9, name: "Alexander Isak", pos: "FW", club: "Liverpool" },
    { no: 11, name: "Viktor Gyökeres", pos: "FW", club: "Arsenal" },
    { no: 21, name: "Anthony Elanga", pos: "FW", club: "Newcastle" },
  ],
  tun: [
    { no: 1, name: "Aymen Dahmen", pos: "GK", club: "CS Sfaxien" },
    { no: 4, name: "Montassar Talbi", pos: "DF", club: "Lorient" },
    { no: 14, name: "Ellyes Skhiri", pos: "MF", club: "Eintracht Frankfurt", captain: true },
    { no: 8, name: "Hannibal Mejbri", pos: "MF", club: "Burnley" },
    { no: 7, name: "Elias Achouri", pos: "FW", club: "Copenhagen" },
    { no: 10, name: "Sebastian Tounekti", pos: "FW", club: "Celtic" },
  ],

  // --- Group G ---
  bel: [
    { no: 1, name: "Thibaut Courtois", pos: "GK", club: "Real Madrid" },
    { no: 7, name: "Kevin De Bruyne", pos: "MF", club: "Napoli" },
    { no: 8, name: "Youri Tielemans", pos: "MF", club: "Aston Villa", captain: true },
    { no: 11, name: "Jeremy Doku", pos: "FW", club: "Manchester City" },
    { no: 9, name: "Romelu Lukaku", pos: "FW", club: "Napoli" },
    { no: 14, name: "Charles De Ketelaere", pos: "FW", club: "Atalanta" },
  ],
  nzl: [
    { no: 1, name: "Max Crocombe", pos: "GK", club: "Millwall" },
    { no: 4, name: "Tyler Bindon", pos: "DF", club: "Sheffield United" },
    { no: 8, name: "Marko Stamenić", pos: "MF", club: "Swansea City" },
    { no: 9, name: "Chris Wood", pos: "FW", club: "Nottingham Forest", captain: true },
    { no: 11, name: "Elijah Just", pos: "MF", club: "Motherwell" },
    { no: 17, name: "Kosta Barbarouses", pos: "FW", club: "Western Sydney" },
  ],

  // --- Group I ---
  fra: [
    { no: 1, name: "Mike Maignan", pos: "GK", club: "AC Milan" },
    { no: 5, name: "Jules Koundé", pos: "DF", club: "Barcelona" },
    { no: 13, name: "N'Golo Kanté", pos: "MF", club: "Fenerbahçe" },
    { no: 10, name: "Kylian Mbappé", pos: "FW", club: "Real Madrid", captain: true },
    { no: 11, name: "Ousmane Dembélé", pos: "FW", club: "Paris Saint-Germain" },
    { no: 7, name: "Michael Olise", pos: "FW", club: "Bayern Munich" },
  ],

  // --- Group J (予選リスト / 最終発表待ち) ---
  arg: [
    { no: 23, name: "Emiliano Martínez", pos: "GK", club: "Aston Villa" },
    { no: 13, name: "Cristian Romero", pos: "DF", club: "Tottenham" },
    { no: 20, name: "Alexis Mac Allister", pos: "MF", club: "Liverpool" },
    { no: 10, name: "Lionel Messi", pos: "FW", club: "Inter Miami", captain: true },
    { no: 22, name: "Lautaro Martínez", pos: "FW", club: "Inter Milan" },
    { no: 9, name: "Julián Alvarez", pos: "FW", club: "Atlético Madrid" },
  ],
};

export function getWcRoster(teamId: string | null | undefined): WcRosterPlayer[] {
  if (!teamId || !teamId.startsWith("wc-")) return [];
  const iso3 = teamId.slice(3).toLowerCase();
  return WC_ROSTERS[iso3] ?? [];
}
