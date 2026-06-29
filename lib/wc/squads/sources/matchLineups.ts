// Source: FIFA confirmed starting XIs (group stage) + R32 predicted XIs (Jun 2026)
// https://www.fifa.com/en/tournaments/mens/worldcup/canadamexicousa2026

import type { RawSourceLineup } from "./goalLineups";

/** 試合予想・確定スタメン（MATCH_LINEUPS が synthesis より優先） */
export const MATCH_LINEUPS: RawSourceLineup[] = [
  // Group A — Mexico (R32 predicted vs Ecuador)
  {
    iso3: "mex",
    formation: "4-3-3",
    players: [
      "Rangel", "Reyes", "Montes", "Vásquez", "Gallardo",
      "Fidalgo", "Lira", "Gutiérrez", "Alvarado", "Jiménez", "Quiñones",
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
  // Group B — Bosnia (R32 predicted vs USA)
  {
    iso3: "bih",
    formation: "4-4-2",
    players: [
      "Vasilj", "Dedić", "Katić", "Muharemović", "Kolašinac",
      "Bajraktarević", "Bašić", "Tahirović", "Memić", "Demirović", "Džeko",
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
      "Kobel", "Zakaria", "Elvedi", "Akanji", "Rodriguez",
      "Aebischer", "Xhaka", "Freuler", "Vargas", "Embolo", "Ndoye",
    ],
  },
  // Group C — Brazil (R32 predicted vs Japan)
  {
    iso3: "bra",
    formation: "4-2-3-1",
    players: [
      "Alisson", "Danilo", "Marquinhos", "Gabriel", "Douglas Santos",
      "Casemiro", "Guimarães", "Rayan", "Paquetá", "Vinícius", "Cunha",
    ],
  },
  {
    iso3: "mar",
    formation: "4-2-3-1",
    players: [
      "Bounou", "Hakimi", "Aguerd", "Saïss", "Mazraoui",
      "Amrabat", "Ounahi", "Brahim Díaz", "El Khannouss", "Rahimi", "En-Nesyri",
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
  // Group D — USA (R32 predicted vs Bosnia)
  {
    iso3: "usa",
    formation: "3-4-2-1",
    players: [
      "Freese", "Freeman", "Richards", "Ream", "Robinson",
      "Tillman", "Adams", "McKennie", "Dest", "Balogun", "Pulisic",
    ],
  },
  {
    iso3: "pry",
    formation: "4-4-2",
    players: [
      "Gill", "Cáceres", "Gustavo Gómez", "Alderete", "Alonso",
      "Diego Gómez", "Cubas", "Bobadilla", "Almirón", "Enciso", "Sanabria",
    ],
  },
  // Group D — Australia (R32 predicted vs Egypt)
  {
    iso3: "aus",
    formation: "5-4-1",
    players: [
      "Beach", "Italiano", "Circati", "Souttar", "Burgess", "Bos",
      "Irankunda", "O'Neill", "Metcalfe", "Okon-Engstler", "Touré",
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
  // Group E — Germany (R32 predicted vs Paraguay)
  {
    iso3: "deu",
    formation: "4-2-3-1",
    players: [
      "Neuer", "Kimmich", "Tah", "Rüdiger", "Brown",
      "Nmecha", "Pavlović", "Sané", "Musiala", "Wirtz", "Havertz",
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
  // Group E — Ivory Coast (R32 predicted vs Norway)
  {
    iso3: "civ",
    formation: "4-3-3",
    players: [
      "Fofana", "Doué", "Kossounou", "Agbadou", "Konan",
      "Kessié", "Sangaré", "Oulaï", "Amad", "Bonny", "Diomandé",
    ],
  },
  {
    iso3: "ecu",
    formation: "4-3-3",
    players: [
      "Galíndez", "Franco", "Ordóñez", "Pacho", "Hincapié",
      "Vite", "Caicedo", "Castillo", "Yeboah", "Valencia", "Angulo",
    ],
  },
  // Group F — Netherlands (R32 predicted vs Morocco)
  {
    iso3: "nld",
    formation: "4-3-3",
    players: [
      "Verbruggen", "Dumfries", "Van Hecke", "Van Dijk", "Aké",
      "Gravenberch", "De Jong", "Reijnders", "Malen", "Brobbey", "Gakpo",
    ],
  },
  {
    iso3: "jpn",
    formation: "3-4-2-1",
    players: [
      "Suzuki", "Tomiyasu", "Taniguchi", "Itō", "Dōan",
      "Sano", "Tanaka", "Nakamura", "Maeda", "Kamada", "Ueda",
    ],
  },
  // Group F — Sweden (R32 predicted vs France)
  {
    iso3: "swe",
    formation: "3-4-2-1",
    players: [
      "Nordfeldt", "Hien", "Lindelöf", "Lagerbielke", "Bernhardsson",
      "Karlström", "Ayari", "Gudmundsson", "Nygren", "Isak", "Gyökeres",
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
  // Group G — Belgium (R32 predicted vs Senegal)
  {
    iso3: "bel",
    formation: "4-2-3-1",
    players: [
      "Courtois", "Meunier", "Ngoy", "Mechele", "Castagne",
      "Onana", "Tielemans", "Doku", "De Bruyne", "Trossard", "Lukaku",
    ],
  },
  {
    iso3: "egy",
    formation: "3-4-1-2",
    players: [
      "Shobeir", "Hany", "Ibrahim", "Fathi", "Fatouh",
      "Zizo", "Lasheen", "Attia", "Ashour", "Salah", "Marmoush",
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
  // Group H — Spain (R32 predicted vs Austria)
  {
    iso3: "esp",
    formation: "4-3-3",
    players: [
      "Unai Simón", "Llorente", "Cubarsí", "Laporte", "Cucurella",
      "Fabián Ruiz", "Rodri", "Pedri", "Ferran Torres", "Oyarzabal", "Nico Williams",
    ],
  },
  {
    iso3: "sau",
    formation: "4-4-2",
    players: [
      "Al-Owais", "Lajami", "Al-Amri", "Al-Tambakti", "Abdulhamid",
      "Al-Harbi", "Nasser Al-Dawsari", "Al-Juwayr", "Al-Khaibari", "Al-Buraikan", "Salem Al-Dawsari",
    ],
  },
  // Group H — Cape Verde (R32 predicted vs Argentina)
  {
    iso3: "cpv",
    formation: "4-2-3-1",
    players: [
      "Vozinha", "Moreira", "Pico", "Diney", "Lopes Cabral",
      "Monteiro", "Pina", "Jovane Cabral", "Duarte", "Mendes", "Livramento",
    ],
  },
  // Group H — Uruguay (Jun 15 vs Saudi Arabia, MD1 — ury-cpv 待ち)
  {
    iso3: "ury",
    formation: "4-4-2",
    players: [
      "Muslera", "Varela", "Cáceres", "Olivera", "Viña",
      "Valverde", "Ugarte", "Bentancur", "M. Araújo", "Viñas", "Núñez",
    ],
  },
  // Group I — France (R32 predicted vs Sweden)
  {
    iso3: "fra",
    formation: "4-2-3-1",
    players: [
      "Maignan", "Koundé", "Upamecano", "Lacroix", "T. Hernández",
      "Tchouaméni", "Rabiot", "Dembélé", "Olise", "Doué", "Mbappé",
    ],
  },
  {
    iso3: "sen",
    formation: "4-2-3-1",
    players: [
      "Diaw", "Diatta", "Koulibaly", "Niakhaté", "Diouf",
      "Camara", "I. Gueye", "Sarr", "P. Gueye", "Mané", "Jackson",
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
  // Group I — Norway (R32 predicted vs Ivory Coast)
  {
    iso3: "nor",
    formation: "4-3-3",
    players: [
      "Nyland", "Ryerson", "Ajer", "Heggem", "Wolfe",
      "Ødegaard", "Berge", "Berg", "Sørloth", "Haaland", "Nusa",
    ],
  },
  // Group J — Argentina (R32 predicted vs Cape Verde)
  {
    iso3: "arg",
    formation: "4-3-3",
    players: [
      "E. Martínez", "Molina", "Romero", "L. Martínez", "Medina",
      "De Paul", "Mac Allister", "Enzo", "Almada", "Messi", "Lautaro Martínez",
    ],
  },
  {
    iso3: "dza",
    formation: "4-2-3-1",
    players: [
      "Zidane", "Belghali", "Mandi", "Bensebaini", "Aït-Nouri",
      "Boudaoui", "Aouar", "Mahrez", "Maza", "Chaibi", "Gouiri",
    ],
  },
  // Group J — Austria (R32 predicted vs Spain)
  {
    iso3: "aut",
    formation: "4-2-3-1",
    players: [
      "Schlager", "Posch", "Lienhart", "Alaba", "Mwene",
      "Seiwald", "X. Schlager", "Schmid", "Sabitzer", "Laimer", "Kalajdžić",
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
  // Group K — Portugal (R32 predicted vs Croatia)
  {
    iso3: "prt",
    formation: "4-3-3",
    players: [
      "Diogo Costa", "Cancelo", "Inácio", "Rúben Dias", "Nuno Mendes",
      "Vitinha", "João Neves", "Bruno Fernandes", "Neto", "Ronaldo", "Leão",
    ],
  },
  {
    iso3: "cod",
    formation: "4-2-3-1",
    players: [
      "Mpasi", "Wan-Bissaka", "Mbemba", "Tuanzebe", "Masuaku",
      "Mukau", "Moutoussamy", "Wissa", "Kakuta", "Mbuku", "Bakambu",
    ],
  },
  // Group K — England (R32 predicted vs DR Congo)
  {
    iso3: "eng",
    formation: "4-2-3-1",
    players: [
      "Pickford", "James", "Guéhi", "Konsa", "O'Reilly",
      "Anderson", "Rice", "Saka", "Rogers", "Gordon", "Kane",
    ],
  },
  {
    iso3: "hrv",
    formation: "4-2-3-1",
    players: [
      "Livaković", "Stanišić", "Vušković", "Šutalo", "Gvardiol",
      "Modrić", "Kovačić", "Baturina", "Kramarić", "Perišić", "Budimir",
    ],
  },
  // Group L — Uzbekistan 1–3 Colombia (Jun 17)
  {
    iso3: "uzb",
    formation: "3-4-2-1",
    players: [
      "Yusupov", "Abdullaev", "Khusanov", "Ashurmatov", "Karimov",
      "Mozgovoy", "Shukurov", "Nasrullaev", "Urunov", "Fayzullaev", "Shomurodov",
    ],
  },
  // Group L — Colombia (R32 predicted vs Ghana)
  {
    iso3: "col",
    formation: "4-2-3-1",
    players: [
      "Vargas", "Muñoz", "Sánchez", "Lucumí", "Mojica",
      "Lerma", "Ríos", "Arias", "James Rodríguez", "Luis Díaz", "Luis Suárez",
    ],
  },
  {
    iso3: "gha",
    formation: "3-4-3",
    players: [
      "Asare", "Seidu", "Oppong", "Adjetey", "Yirenkyi",
      "Partey", "Sibo", "Mensah", "Fatawu", "Semenyo", "Iñaki Williams",
    ],
  },
  {
    iso3: "pan",
    formation: "5-3-2",
    players: [
      "Mosquera", "Blackman", "Ramos", "Cordoba", "Andrade", "Murillo",
      "Harvey", "Martinez", "Rodriguez", "Barcenas", "Waterman",
    ],
  },
];

export const CONFIRMED_MATCH_LINEUP_ISO3 = new Set(
  MATCH_LINEUPS.map((l) => l.iso3),
);
