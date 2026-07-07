// ベスト16（R16 / M89–M96）確定・予想スタメン
// 出典: FIFA / MLS / Sporting News / OneFootball / FOX Sports（2026-07-04〜07）
// M95/M96 はキックオフ前の有力メディア予想（試合後に確定XIへ差し替え可）

import type { RawSourceLineup } from "./goalLineups";

/** R16 進出16チームの予想 XI — QF 以降はこのスナップショットを固定参照 */
export const KNOCKOUT_R16_LINEUPS: RawSourceLineup[] = [
  // M89 — Paraguay 0–1 France (Jul 4, Philadelphia) — FIFA confirmed
  {
    iso3: "pry",
    formation: "5-3-2",
    players: [
      "Gill", "Cáceres", "Velázquez", "Gómez", "Alderete", "Alonso",
      "Cubas", "Galarza", "Diego Gómez", "Almirón", "Enciso",
    ],
  },
  {
    iso3: "fra",
    formation: "4-2-3-1",
    players: [
      "Maignan", "Koundé", "Upamecano", "Saliba", "Digne",
      "Koné", "Rabiot", "Dembélé", "Olise", "Barcola", "Mbappé",
    ],
  },
  // M90 — Canada 0–3 Morocco (Jul 4, Houston) — FIFA confirmed
  {
    iso3: "can",
    formation: "4-4-2",
    players: [
      "Crépeau", "Johnston", "Bombito", "de Fougerolles", "Laryea",
      "Buchanan", "Eustáquio", "Sigur", "Ahmed", "David", "Oluwaseyi",
    ],
  },
  {
    iso3: "mar",
    formation: "4-3-3",
    players: [
      "Bounou", "Hakimi", "Diop", "Halhal", "Mazraoui",
      "Bouaddi", "El Aynaoui", "Ounahi", "El Khannouss", "Saibari", "Brahim Díaz",
    ],
  },
  // M91 — Brazil 1–2 Norway (Jul 5, New York) — FIFA confirmed
  {
    iso3: "bra",
    formation: "4-2-3-1",
    players: [
      "Alisson", "Danilo", "Marquinhos", "Gabriel", "Douglas Santos",
      "Casemiro", "Guimarães", "Rayan", "Martinelli", "Vinícius", "Cunha",
    ],
  },
  {
    iso3: "nor",
    formation: "4-3-3",
    players: [
      "Nyland", "Ryerson", "Ajer", "Heggem", "Wolfe",
      "Berge", "Berg", "Ødegaard", "Nusa", "Sørloth", "Haaland",
    ],
  },
  // M92 — Mexico 2–3 England (Jul 5, Mexico City) — FIFA confirmed
  {
    iso3: "mex",
    formation: "4-3-3",
    players: [
      "Rangel", "Sánchez", "Montes", "Vásquez", "Gallardo",
      "Mora", "Lira", "Romo", "Alvarado", "Jiménez", "Quiñones",
    ],
  },
  {
    iso3: "eng",
    formation: "4-2-3-1",
    players: [
      "Pickford", "Quansah", "Konsa", "Guéhi", "O'Reilly",
      "Rice", "Anderson", "Saka", "Bellingham", "Gordon", "Kane",
    ],
  },
  // M93 — Portugal 0–2 Spain (Jul 6, Dallas) — FIFA confirmed
  {
    iso3: "prt",
    formation: "4-2-3-1",
    players: [
      "Diogo Costa", "Cancelo", "Rúben Dias", "Veiga", "Nuno Mendes",
      "Vitinha", "João Neves", "Neto", "Bruno Fernandes", "Felix", "Ronaldo",
    ],
  },
  {
    iso3: "esp",
    formation: "4-2-3-1",
    players: [
      "Unai Simón", "Porro", "Cubarsí", "Laporte", "Cucurella",
      "Rodri", "Pedri", "Yamal", "Olmo", "Baena", "Oyarzabal",
    ],
  },
  // M94 — USA 1–4 Belgium (Jul 6, Seattle) — FIFA confirmed
  {
    iso3: "usa",
    formation: "3-4-2-1",
    players: [
      "Freese", "Freeman", "Richards", "Ream", "Robinson",
      "Tillman", "Adams", "McKennie", "Dest", "Balogun", "Pulisic",
    ],
  },
  {
    iso3: "bel",
    formation: "4-2-3-1",
    players: [
      "Courtois", "Castagne", "Mechele", "Ngoy", "De Cuyper",
      "Onana", "Raskin", "Lukebakio", "Tielemans", "Trossard", "De Ketelaere",
    ],
  },
  // M95 — Argentina vs Egypt (Jul 7, Atlanta) — 有力メディア予想
  {
    iso3: "arg",
    formation: "4-4-2",
    players: [
      "E. Martínez", "Molina", "Romero", "L. Martínez", "Tagliafico",
      "De Paul", "Enzo", "Mac Allister", "Almada", "Messi", "Lautaro Martínez",
    ],
  },
  {
    iso3: "egy",
    formation: "4-2-3-1",
    players: [
      "Shobeir", "Alaa", "Fathi", "Ibrahim", "Hafez",
      "Lasheen", "Attia", "Ziko", "Salah", "Ashour", "Marmoush",
    ],
  },
  // M96 — Switzerland vs Colombia (Jul 7, Vancouver) — 有力メディア予想
  {
    iso3: "che",
    formation: "4-2-3-1",
    players: [
      "Kobel", "Zakaria", "Elvedi", "Akanji", "Rodriguez",
      "Xhaka", "Freuler", "Ndoye", "Manzambi", "Vargas", "Embolo",
    ],
  },
  {
    iso3: "col",
    formation: "4-3-3",
    players: [
      "Vargas", "Muñoz", "Sánchez", "Lucumí", "Mojica",
      "Puerta", "Lerma", "Arias", "James Rodríguez", "Luis Suárez", "Luis Díaz",
    ],
  },
];

export const KNOCKOUT_R16_LINEUP_ISO3 = new Set(
  KNOCKOUT_R16_LINEUPS.map((l) => l.iso3),
);

/** ベスト8進出が確定しているチーム（M95/M96 未確定分は含まない） */
export const KNOCKOUT_QF_ADVANCED_ISO3 = new Set([
  "fra",
  "mar",
  "nor",
  "eng",
  "esp",
  "bel",
]);
