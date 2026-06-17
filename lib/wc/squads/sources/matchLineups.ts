// Source: FIFA confirmed starting XIs (2026 World Cup group stage, matchday 1)
// https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026

import type { RawSourceLineup } from "./goalLineups";

/** 試合終了チームの実際のスタメン（予想ではなく確定 XI） */
export const MATCH_LINEUPS: RawSourceLineup[] = [
  // Group A — Mexico 2–0 South Africa (Jun 11)
  {
    iso3: "mex",
    formation: "4-3-3",
    players: [
      "Rangel", "Reyes", "Montes", "Vásquez", "Gallardo",
      "Lira", "Fidalgo", "Gutiérrez", "Alvarado", "Jiménez", "Quiñones",
    ],
  },
  {
    iso3: "zaf",
    formation: "3-5-2",
    players: [
      "Williams", "Okon", "Sibisi", "Mbokazi", "Mudau",
      "Modiba", "Adams", "Sithole", "Mokoena", "Foster", "Rayners",
    ],
  },
  // Group A — South Korea 2–1 Czech Republic (Jun 11)
  {
    iso3: "kor",
    formation: "3-4-2-1",
    players: [
      "Kim Seung-gyu", "Lee Han-beom", "Kim Min-jae", "Lee Gi-hyuk", "Seol Young-woo",
      "Hwang In-beom", "Paik Seung-ho", "Lee Tae-seok", "Lee Kang-in", "Son Heung-min", "Lee Jae-sung",
    ],
  },
  {
    iso3: "cze",
    formation: "3-4-2-1",
    players: [
      "Kovář", "Chaloupek", "Hranáč", "Krejčí", "Coufal",
      "Zelený", "Souček", "Provod", "Sojka", "Schick", "Šulc",
    ],
  },
  // Group B — Canada 1–1 Bosnia (Jun 12)
  {
    iso3: "can",
    formation: "4-4-2",
    players: [
      "Crépeau", "Laryea", "Cornelius", "de Fougerolles", "Johnston",
      "Millar", "Eustáquio", "Koné", "Buchanan", "David", "Oluwaseyi",
    ],
  },
  {
    iso3: "bih",
    formation: "4-4-2",
    players: [
      "Vasilj", "Kolašinac", "Katić", "Muharemović", "Dedić",
      "Memić", "Bašić", "Tahirović", "Bajraktarević", "Demirović", "Lukić",
    ],
  },
  // Group B — Qatar 1–1 Switzerland (Jun 13)
  {
    iso3: "qat",
    formation: "4-2-3-1",
    players: [
      "Abunada", "Ahmed", "Pedro Miguel", "Khoukhi", "Al-Oui",
      "Gaber", "Laye", "Afif", "Madibo", "Edmilson Junior", "Abdurisag",
    ],
  },
  {
    iso3: "che",
    formation: "4-3-3",
    players: [
      "Kobel", "Rodriguez", "Akanji", "Elvedi", "Zakaria",
      "Freuler", "Xhaka", "Aebischer", "Vargas", "Embolo", "Ndoye",
    ],
  },
  // Group C — Brazil 1–1 Morocco (Jun 13)
  {
    iso3: "bra",
    formation: "4-4-2",
    players: [
      "Alisson", "Douglas Santos", "Marquinhos", "Gabriel", "Ibañez",
      "Vinícius Júnior", "Casemiro", "Bruno Guimarães", "Paquetá", "Igor Thiago", "Raphinha",
    ],
  },
  {
    iso3: "mar",
    formation: "4-2-3-1",
    players: [
      "Bounou", "Mazraoui", "Diop", "Riad", "Hakimi",
      "El Aynaoui", "Bouaddi", "El Khannouss", "Ounahi", "Brahim Díaz", "Saibari",
    ],
  },
  // Group C — Haiti 0–1 Scotland (Jun 13)
  {
    iso3: "hti",
    formation: "4-4-2",
    players: [
      "Placide", "Expérience", "Adé", "Delcroix", "Arcus",
      "Providence", "Jean Jacques", "Bellegarde", "Deedson", "Pierrot", "Isidor",
    ],
  },
  {
    iso3: "sct",
    formation: "4-4-2",
    players: [
      "Gunn", "Robertson", "Hanley", "Hendry", "Hickey",
      "McGinn", "McTominay", "Ferguson", "Gannon-Doak", "Shankland", "Adams",
    ],
  },
  // Group D — USA 4–1 Paraguay (Jun 12)
  {
    iso3: "usa",
    formation: "3-4-2-1",
    players: [
      "Freese", "Ream", "Richards", "Freeman", "Robinson",
      "Adams", "Tillman", "Dest", "McKennie", "Pulisic", "Balogun",
    ],
  },
  {
    iso3: "pry",
    formation: "4-3-3",
    players: [
      "Gill", "Alonso", "Alderete", "Gómez", "Cáceres",
      "Diego Gómez", "Cubas", "Bobadilla", "Almirón", "Sanabria", "Enciso",
    ],
  },
  // Group D — Australia 2–0 Turkey (Jun 13)
  {
    iso3: "aus",
    formation: "3-5-2",
    players: [
      "Beach", "Circati", "Souttar", "Burgess", "Bos",
      "Okon-Engstler", "Metcalfe", "O'Neill", "Italiano", "Irankunda", "Touré",
    ],
  },
  {
    iso3: "tur",
    formation: "4-2-3-1",
    players: [
      "Çakır", "Kadıoğlu", "Demiral", "Bardakcı", "Çelik",
      "Çalhanoğlu", "Yüksek", "Yılmaz", "Kökçü", "Güler", "Aktürkoğlu",
    ],
  },
  // Group E — Germany 7–1 Curaçao (Jun 14)
  {
    iso3: "deu",
    formation: "3-4-3",
    players: [
      "Neuer", "Kimmich", "Tah", "Schlotterbeck", "Brown",
      "Pavlović", "Musiala", "Nmecha", "Wirtz", "Havertz", "Sané",
    ],
  },
  {
    iso3: "cuw",
    formation: "4-3-3",
    players: [
      "Room", "Fonville", "Obispo", "Bazoer", "Floranus",
      "Leandro Bacuna", "Comenencia", "Chong", "Juninho Bacuna", "Locadia", "Hansen",
    ],
  },
  // Group E — Ivory Coast 1–0 Ecuador (Jun 14)
  {
    iso3: "civ",
    formation: "4-3-3",
    players: [
      "Fofana", "Konan", "Singo", "Agbadou", "Doué",
      "Seko Fofana", "Kessié", "Touré", "Wahi", "Pépé", "Diomande",
    ],
  },
  {
    iso3: "ecu",
    formation: "4-3-3",
    players: [
      "Galíndez", "Hincapié", "Pacho", "Ordóñez", "Franco",
      "Vite", "Moisés Caicedo", "Minda", "Plata", "Enner Valencia", "Yeboah",
    ],
  },
  // Group F — Netherlands 2–2 Japan (Jun 14)
  {
    iso3: "nld",
    formation: "4-3-3",
    players: [
      "Verbruggen", "van de Ven", "van Hecke", "van Dijk", "Dumfries",
      "de Jong", "Gravenberch", "Reijnders", "Gakpo", "Malen", "Summerville",
    ],
  },
  {
    iso3: "jpn",
    formation: "3-4-3",
    // 対オランダは久保が先発→75'に負傷交代で小川。以降の表示は小川をRWに
    players: [
      "Suzuki", "Watanabe", "Taniguchi", "Itō", "Nakamura",
      "Sano", "Kamada", "Dōan", "Maeda", "Ueda", "Ogawa",
    ],
  },
  // Group F — Sweden 5–1 Tunisia (Jun 14)
  {
    iso3: "swe",
    formation: "3-4-3",
    players: [
      "Nordfeldt", "Lagerbielke", "Hien", "Lindelöf", "Gudmundsson",
      "Karlström", "Ayari", "Bernhardsson", "Nygren", "Isak", "Gyökeres",
    ],
  },
  {
    iso3: "tun",
    formation: "5-3-2",
    players: [
      "Chamakh", "Abdi", "Rekik", "Talbi", "Ben Hamida", "Valery",
      "Khedira", "Skhiri", "Mejbri", "Saad", "Ben Slimane",
    ],
  },
  // Group G — Belgium 1–1 Egypt (Jun 15)
  {
    iso3: "bel",
    formation: "4-2-3-1",
    players: [
      "Courtois", "Meunier", "Ngoy", "Mechele", "Castagne",
      "Onana", "Tielemans", "Trossard", "De Bruyne", "Doku", "De Ketelaere",
    ],
  },
  {
    iso3: "egy",
    formation: "4-2-3-1",
    players: [
      "Shobeir", "Hany", "Ibrahim", "Fathy", "Fatouh",
      "Attia", "Lasheen", "Ziko", "Salah", "Ashour", "Marmoush",
    ],
  },
  // Group G — Iran 2–2 New Zealand (Jun 15)
  {
    iso3: "irn",
    formation: "4-3-3",
    players: [
      "Beiranvand", "Rezaeian", "Khalilzadeh", "Nemati", "Mohammadi",
      "Ghoddos", "Ezatolahi", "Taremi", "Mohebi", "Moghanlou", "Yousefi",
    ],
  },
  {
    iso3: "nzl",
    formation: "4-4-2",
    players: [
      "Crocombe", "Payne", "Surman", "Boxall", "Cacace",
      "Singh", "Bell", "Stamenić", "Just", "Wood", "McCowatt",
    ],
  },
  // Group H — Spain 0–0 Cape Verde (Jun 15)
  {
    iso3: "esp",
    formation: "4-3-3",
    players: [
      "Simón", "Llorente", "Cubarsí", "Laporte", "Cucurella",
      "Rodri", "Pedri", "Ruiz", "Torres", "Oyarzabal", "Gavi",
    ],
  },
  {
    iso3: "cpv",
    formation: "4-3-3",
    players: [
      "Vozinha", "Moreira", "Lopes", "Diney", "Lopes Cabral",
      "Pina", "Laros Duarte", "Monteiro", "Mendes", "Livramento", "Jovane Cabral",
    ],
  },
  // Group H — Saudi Arabia 1–1 Uruguay (Jun 15)
  {
    iso3: "sau",
    formation: "4-4-2",
    players: [
      "Al-Owais", "Abdulhamid", "Al-Tambakti", "Al-Amri", "Al-Harbi",
      "Abu Al-Shamat", "Kanno", "Al-Khaibari", "Al-Dawsari", "Al-Buraikan", "Al-Juwayr",
    ],
  },
  {
    iso3: "ury",
    formation: "4-4-2",
    players: [
      "Muslera", "Varela", "Cáceres", "Olivera", "Viña",
      "Valverde", "Ugarte", "Bentancur", "M. Araújo", "Viñas", "Núñez",
    ],
  },
  // Group I — France 3–1 Senegal (Jun 16)
  {
    iso3: "fra",
    formation: "4-2-3-1",
    players: [
      "Maignan", "Koundé", "Upamecano", "Saliba", "Théo Hernandez",
      "Tchouaméni", "Rabiot", "Olise", "Dembélé", "Doué", "Mbappé",
    ],
  },
  {
    iso3: "sen",
    formation: "4-3-3",
    players: [
      "Mendy", "Diatta", "Koulibaly", "Niakhaté", "El Hadji Malick Diouf",
      "Lamine Camara", "Idrissa Gueye", "Pape Gueye", "Ismaïla Sarr", "Nicolas Jackson", "Sadio Mané",
    ],
  },
  // Group I — Iraq 1–4 Norway (Jun 16)
  {
    iso3: "irq",
    formation: "4-4-2",
    players: [
      "Hassan", "Hussein Ali", "Tahseen", "Hashim", "Doski",
      "Bayesh", "Ismail", "Al-Ammari", "Jasim", "Hussein", "Al-Hamadi",
    ],
  },
  {
    iso3: "nor",
    formation: "4-3-3",
    players: [
      "Nyland", "Ryerson", "Ajer", "Heggem", "Wolfe",
      "Berge", "Ødegaard", "Aursnes", "Sørloth", "Haaland", "Nusa",
    ],
  },
  // Group J — Argentina 3–0 Algeria (Jun 16)
  {
    iso3: "arg",
    formation: "4-3-3",
    players: [
      "Emiliano Martínez", "Montiel", "Romero", "Lisandro Martínez", "Medina",
      "De Paul", "Mac Allister", "Fernández", "Almada", "Messi", "Lautaro Martínez",
    ],
  },
  {
    iso3: "dza",
    formation: "4-3-3",
    players: [
      "Zidane", "Belghali", "Mandi", "Bensebaini", "Ait-Nouri",
      "Boudaoui", "Maza", "Bentaleb", "Moussa", "Gouiri", "Chaibi",
    ],
  },
  // Group J — Austria vs Jordan (Jun 16)
  {
    iso3: "aut",
    formation: "4-2-3-1",
    players: [
      "Schlager", "Posch", "Lienhart", "Alaba", "Mwene",
      "Laimer", "Seiwald", "Schmid", "X. Schlager", "Sabitzer", "Kalajdžić",
    ],
  },
  {
    iso3: "jor",
    formation: "5-4-1",
    players: [
      "Abulaila", "Haddad", "Nasib", "Abualnadi", "Al-Arab",
      "Abu Taha", "Al-Rashdan", "Al-Rawabdeh", "Al-Taamari", "Olwan", "Al-Fakhouri",
    ],
  },
];

export const CONFIRMED_MATCH_LINEUP_ISO3 = new Set(
  MATCH_LINEUPS.map((l) => l.iso3),
);
