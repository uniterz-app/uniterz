// Source: ESPN projected starting XIs (2026-05-13)
// https://www.espn.com/soccer/story/_/id/47964079/2026-world-cup-rosters-predictions-starting-xis-usa-france-mexico-england-spain-germany-brazil-argentina

import type { RawSourceLineup } from "./goalLineups";

/** ESPN は主要国＋3ホストのみ。他国は Goal / RotoWire に委ねる */
export const ESPN_LINEUPS: RawSourceLineup[] = [
  {
    iso3: "arg",
    formation: "4-3-3",
    players: ["Martinez", "Molina", "Romero", "Otamendi", "Tagliafico", "Mac Allister", "Enzo Fernandez", "De Paul", "Messi", "Alvarez", "Lautaro Martinez"],
  },
  {
    iso3: "bel",
    formation: "4-2-3-1",
    players: ["Courtois", "Castagne", "Debast", "Theate", "De Cuyper", "Tielemans", "Onana", "Doku", "De Bruyne", "Trossard", "De Ketelaere"],
  },
  {
    iso3: "bra",
    formation: "4-4-2",
    players: ["Alisson", "Wesley", "Marquinhos", "Gabriel", "Douglas Santos", "Casemiro", "Bruno Guimaraes", "Raphinha", "Vinicius", "Luis Henrique", "Cunha"],
  },
  {
    iso3: "can",
    formation: "4-4-2",
    players: ["St. Clair", "Johnston", "Bombito", "Cornelius", "Davies", "Buchanan", "Kone", "Eustaquio", "Ahmed", "Larin", "David"],
  },
  {
    iso3: "eng",
    formation: "4-2-3-1",
    players: ["Pickford", "O'Reilly", "Guehi", "Konsa", "Livramento", "Anderson", "Rice", "Saka", "Bellingham", "Foden", "Kane"],
  },
  {
    iso3: "fra",
    formation: "4-2-3-1",
    players: ["Maignan", "Koundé", "Saliba", "Upamecano", "Hernandez", "Tchouameni", "Rabiot", "Dembelé", "Olise", "Doué", "Mbappé"],
  },
  {
    iso3: "deu",
    formation: "4-2-3-1",
    players: ["Neuer", "Kimmich", "Tah", "Schlotterbeck", "Raum", "Pavlovic", "Goretzka", "Musiala", "Wirtz", "Sané", "Havertz"],
  },
  {
    iso3: "mex",
    formation: "4-3-3",
    players: ["Rangel", "Sanchez", "Montes", "Vasquez", "Gallardo", "Alvarez", "Fidalgo", "Pineda", "Vega", "Jimenez", "Quinones"],
  },
  {
    iso3: "mar",
    formation: "4-2-3-1",
    players: ["Bounou", "Hakimi", "Aguerd", "Saiss", "Mazraoui", "Amrabat", "Ounahi", "Brahim Diaz", "Saibari", "Ziyech", "El Kaabi"],
  },
  {
    iso3: "nld",
    formation: "4-2-3-1",
    players: ["Verbruggen", "Dumfries", "Van Dijk", "Aké", "Van de Ven", "De Jong", "Gravenberch", "Reijnders", "Gakpo", "Malen", "Depay"],
  },
  {
    iso3: "prt",
    formation: "4-3-3",
    players: ["Costa", "Nuno Mendes", "Ruben Dias", "Inacio", "Cancelo", "Joao Neves", "Vitinha", "Bruno Fernandes", "Bernardo Silva", "Rafael Leao", "Cristiano Ronaldo"],
  },
  {
    iso3: "sen",
    formation: "4-2-3-1",
    players: ["Mendy", "Diatta", "Koulibaly", "Niakhaté", "Jakobs", "Idrissa Gueye", "Pape Gueye", "Ismaila Sarr", "Iliman Ndiaye", "Mané", "Jackson"],
  },
  {
    iso3: "esp",
    formation: "4-3-3",
    players: ["Simon", "Porro", "Le Normand", "Laporte", "Cucurella", "Rodri", "Pedri", "Fabian Ruiz", "Yamal", "Oyarzabal", "N. Williams"],
  },
  {
    iso3: "usa",
    formation: "4-3-3",
    players: ["Freese", "Antonee Robinson", "Richards", "Trusty", "Dest", "Adams", "McKennie", "Tillman", "Pulisic", "Balogun", "Weah"],
  },
];
