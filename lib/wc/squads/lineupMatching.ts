// lib/wc/squads/lineupMatching.ts
//
// 外部メディアの選手名 → FIFA名簿 playerId 突合

/** メディア表記 → 直接 playerId（曖昧マッチ回避） */
export const DIRECT_PLAYER_IDS: Record<string, Record<string, string>> = {
  aut: { Baumgartner: "aut-schmid" },
  aus: {
    Italiano: "aus-italiano",
    Burgess: "aus-burgess",
    Irvine: "aus-irvine",
    Irankunda: "aus-irankunda",
    Boyle: "aus-volpato",
    Beach: "aus-beach",
    Souttar: "aus-souttar",
    "Okon-Engstler": "aus-okon-engstler",
    Touré: "aus-toure",
  },
  bra: { Cunha: "bra-cunha", Gabriel: "bra-magalhaes", "Alex Sandro": "bra-santos", Martinelli: "bra-martinelli", Ibañez: "bra-ibanez", "Igor Thiago": "bra-thiago", Paquetá: "bra-paqueta", "Vinícius Júnior": "bra-junior" },
  civ: {
    Koussonou: "civ-kossounou",
    Doué: "civ-doue",
    Diomandé: "civ-diomande",
    "Seko Fofana": "civ-fofana-2",
    Touré: "civ-toure",
    Fofana: "civ-fofana",
    Konan: "civ-konan",
    Singo: "civ-singo",
    Agbadou: "civ-agbadou",
    Kessié: "civ-kessie",
    Wahi: "civ-wahi",
    Pépé: "civ-pepe",
    Diomande: "civ-diomande-2",
  },
  col: { Montero: "col-montero", Suarez: "col-suarez", Vargas: "col-montero", Lucumi: "col-lucumi" },
  cpv: { Lopes: "cpv-lopes", Pico: "cpv-pina-2" },
  gha: {
    Adjetei: "gha-adjetey",
    Oppong: "gha-oppong",
    Yirenkyi: "gha-yirenkyi",
    Sibo: "gha-sibo",
    Asare: "gha-asare",
    Djiku: "gha-seidu",
    Opoku: "gha-oppong",
    Williams: "gha-williams",
  },
  irn: { Beyranvand: "irn-beiranvand", Kanaani: "irn-kanaanizadegan" },
  jor: { Tamari: "jor-al-taamari" },
  mar: { Bono: "mar-bounou", Mazraoui: "mar-mazraoui", Abde: "mar-ezzalzouli", Diop: "mar-diop", Bounou: "mar-bounou", Riad: "mar-riad", Bouaddi: "mar-bouaddi", Saibari: "mar-saibari", Hakimi: "mar-hakimi", "El Aynaoui": "mar-aynaoui", "El Khannouss": "mar-khannouss", Ounahi: "mar-ounahi", "Brahim Díaz": "mar-diaz" },
  pry: {
    Gill: "pry-gill",
    Fernandez: "pry-fernandez",
    Sanabria: "pry-sanabria",
    Cubas: "pry-cubas",
    Alonso: "pry-alonso",
    "Diego Gómez": "pry-gomez",
    "Gómez": "pry-gomez-2",
    Alderete: "pry-alderete",
    Cáceres: "pry-caceres",
    Bobadilla: "pry-bobadilla",
    Almirón: "pry-almiron",
    Enciso: "pry-enciso",
  },
  tun: {
    Gharbi: "tun-gharbi",
    Tounekti: "tun-tounekti",
    Hannibal: "tun-mejbri",
    "Ben Slimane": "tun-slimane",
    Chamakh: "tun-chamakh",
    "Ben Hamida": "tun-hamida",
    Valery: "tun-valery",
    Rekik: "tun-rekik",
    Saad: "tun-saad",
    Skhiri: "tun-skhiri",
    Khedira: "tun-khedira",
  },
  tur: {
    Bardakci: "tur-bardakc",
    Bardakcı: "tur-bardakc",
    Cakir: "tur-cak-r",
    Çakır: "tur-cak-r",
    Kadioglu: "tur-kad-oglu",
    Kadıoğlu: "tur-kad-oglu",
    Celik: "tur-celik",
    Çelik: "tur-celik",
    Yuksek: "tur-yuksek",
    Yüksek: "tur-yuksek",
    Yilmaz: "tur-y-lmaz",
    Yılmaz: "tur-y-lmaz",
    Akturkoglu: "tur-akturkoglu",
    Aktürkoğlu: "tur-akturkoglu",
    Kokcu: "tur-kokcu",
    Kökçü: "tur-kokcu",
    Guler: "tur-guler",
    Güler: "tur-guler",
    Calhanoglu: "tur-calhanoglu",
    Çalhanoğlu: "tur-calhanoglu",
  },
  can: {
    Oluwaseyi: "can-oluwaseyi",
    "St. Clair": "can-clair",
    Crépeau: "can-crepeau",
    "de Fougerolles": "can-fougerolles",
    Cornelius: "can-cornelius",
    Johnston: "can-johnston",
    Millar: "can-millar",
    Eustáquio: "can-eustaquio",
    Koné: "can-kone",
    Buchanan: "can-buchanan",
    David: "can-david",
    Laryea: "can-laryea",
  },
  bih: {
    Vasilj: "bih-vasilj",
    Kolašinac: "bih-kolasinac",
    Katić: "bih-katic",
    Muharemović: "bih-muharemovic",
    Dedić: "bih-dedic",
    Memić: "bih-memic",
    Bašić: "bih-basic",
    Tahirović: "bih-tahirovic",
    Bajraktarević: "bih-bajraktarevic",
    Demirović: "bih-demirovic",
    Lukić: "bih-lukic",
  },
  eng: { Livramento: "eng-livramento" },
  esp: { Olmo: "esp-olmo", Ruiz: "esp-ruiz", Porro: "esp-llorente" },
  fra: { Konate: "fra-upamecano", Dembele: "fra-dembele", Doue: "fra-doue" },
  nld: {
    Ake: "nld-ake",
    "van de Ven": "nld-ven",
    "van Hecke": "nld-hecke",
    "van Dijk": "nld-dijk",
    Depay: "nld-depay",
    Verbruggen: "nld-verbruggen",
    Dumfries: "nld-dumfries",
    Summerville: "nld-summerville",
    Malen: "nld-malen",
    "de Jong": "nld-jong",
    Gravenberch: "nld-gravenberch",
    Reijnders: "nld-reijnders",
    Gakpo: "nld-gakpo",
  },
  por: { Dias: "prt-dias", Leao: "prt-leao", Silva: "prt-bernardo-silva", Neves: "prt-neves" },
  sen: { "I.Gueye": "sen-gueye", "P.Gueye": "sen-sarr", Diouf: "sen-jakobs", Diarra: "sen-diarra" },
  usa: { "A. Robinson": "usa-robinson", Tillman: "usa-tillman", Freese: "usa-freese", Freeman: "usa-freeman" },
  deu: {
    Pavlović: "deu-pavlovic",
    Sané: "deu-sane",
    Neuer: "deu-neuer",
    Nmecha: "deu-nmecha",
    Kimmich: "deu-kimmich",
    Tah: "deu-tah",
    Schlotterbeck: "deu-schlotterbeck",
    Brown: "deu-brown",
    Musiala: "deu-musiala",
    Wirtz: "deu-wirtz",
    Havertz: "deu-havertz",
  },
  jpn: {
    Sano: "jpn-sano",
    Machino: "jpn-machino",
    Itō: "jpn-ito-2",
    Dōan: "jpn-doan",
    Watanabe: "jpn-watanabe",
    Suzuki: "jpn-suzuki",
    Taniguchi: "jpn-taniguchi",
    Nakamura: "jpn-nakamura",
    Kamada: "jpn-kamada",
    Maeda: "jpn-maeda",
    Ueda: "jpn-ueda",
    Ueda: "jpn-ueda",
    Kubo: "jpn-kubo",
    Ogawa: "jpn-ogawa",
    "Kōki Ogawa": "jpn-ogawa",
  },
  qat: {
    Miguel: "qat-miguel",
    Mendes: "qat-mendes",
    "Al Mannai": "qat-fathy",
    Madibo: "qat-madibo",
    "Al Brake": "qat-al-brake",
    Abunada: "qat-abunada",
    Ahmed: "qat-ahmed",
    Abdurisag: "qat-abdurisag",
    "Edmilson Junior": "qat-junior",
    "Al-Oui": "qat-al-oui",
    Khoukhi: "qat-khoukhi",
    Gaber: "qat-gaber",
    Laye: "qat-laye",
    Afif: "qat-afif",
  },
  hti: {
    Ade: "hti-ade",
    Delcroix: "hti-delcroix",
    Lacroix: "hti-experience",
    Casimir: "hti-bellegarde",
    Placide: "hti-placide",
    Expérience: "hti-experience",
    "Jean Jacques": "hti-jacques",
    Pierrot: "hti-pierrot",
    Isidor: "hti-isidor",
    Providence: "hti-providence",
    Deedson: "hti-deedson",
    Arcus: "hti-arcus",
  },
  sct: {
    Gunn: "sct-gunn",
    Gordon: "sct-gordon",
    McTominay: "sct-mctominay",
    "Gannon Doak": "sct-gannon-doak",
    "Gannon-Doak": "sct-gannon-doak",
    Gilmour: "sct-ferguson",
    Shankland: "sct-shankland",
    Hanley: "sct-hanley",
    Hendry: "sct-hendry",
    Ferguson: "sct-ferguson",
    Adams: "sct-adams",
    McGinn: "sct-mcginn",
    Robertson: "sct-robertson",
    Hickey: "sct-hickey",
  },
  cuw: {
    Fonville: "cuw-fonville",
    Bazoer: "cuw-bazoer",
    Hansen: "cuw-hansen",
    "Leandro Bacuna": "cuw-bacuna-2",
    "Juninho Bacuna": "cuw-bacuna",
    Room: "cuw-room",
    Obispo: "cuw-obispo",
    Floranus: "cuw-floranus",
    Comenencia: "cuw-comenencia",
    Chong: "cuw-chong",
    Locadia: "cuw-locadia",
  },
  che: {
    Aebischer: "che-aebischer",
    Zakaria: "che-zakaria",
    Kobel: "che-kobel",
    Elvedi: "che-elvedi",
    Akanji: "che-akanji",
    Rodriguez: "che-rodriguez",
    Freuler: "che-freuler",
    Xhaka: "che-xhaka",
    Vargas: "che-vargas",
    Embolo: "che-embolo",
    Ndoye: "che-ndoye",
  },
  swe: {
    Isak: "swe-isak",
    Hien: "swe-hien",
    Gyokeres: "swe-gyokeres",
    Gudmundsson: "swe-gudmundsson",
    Gyökeres: "swe-gyokeres",
    Nordfeldt: "swe-nordfeldt",
    Lagerbielke: "swe-lagerbielke",
    Lindelöf: "swe-lindelof",
    Karlström: "swe-karlstrom",
    Ayari: "swe-ayari",
    Bernhardsson: "swe-bernhardsson",
    Nygren: "swe-nygren",
  },
  zaf: { "Okon": "zaf-sibisi", Mbokazi: "zaf-ndamane", Mbatha: "zaf-modiba", Moremi: "zaf-zwane" },
  kor: {
    "Kim Tae-Hyeon": "kor-tae-hyeon",
    "Kim Min-Jae": "kor-min-jae",
    "Kim Seung-Gyu": "kor-seung-gyu",
    "Kim Jin-Gyu": "kor-jin-gyu",
    "Son Heung-Min": "kor-heung-min",
    "Seol Young-Woo": "kor-young-woo",
    "Lee Tae-Seok": "kor-tae-seok",
    "Hwang Hee-Chan": "kor-hee-chan",
    "Hwang In-Beom": "kor-in-beom",
    "Lee Kang-In": "kor-kang-in",
    "Lee Han-Beom": "kor-han-beom",
  },
  ecu: {
    Yeboah: "ecu-yeboah",
    Angulo: "ecu-angulo",
    Plata: "ecu-plata",
    "Moisés Caicedo": "ecu-caicedo-2",
    "Enner Valencia": "ecu-valencia-2",
    Galíndez: "ecu-galindez",
    Hincapié: "ecu-hincapie",
    Pacho: "ecu-pacho",
    Ordóñez: "ecu-ordonez",
    Franco: "ecu-franco",
    Vite: "ecu-vite",
    Minda: "ecu-minda",
  },
  egy: {
    Abdelmaguif: "egy-abdelmonem",
    Ateya: "egy-attia",
    Ashour: "egy-ashour",
    Shobeir: "egy-shobeir",
    Trezeguet: "egy-trezeguet",
    Attia: "egy-attia",
    Salah: "egy-salah",
    Marmoush: "egy-marmoush",
  },
  nzl: { Garbett: "nzl-garbett", Singh: "nzl-singh", Samenic: "nzl-stamenic", Stamenic: "nzl-stamenic" },
  pan: {
    Murillo: "pan-murillo",
    Davis: "pan-davis",
    Harvey: "pan-harvey",
    Farina: "pan-farina",
    Andrade: "pan-andrade",
    Rodriguez: "pan-rodriguez",
  },
  arg: { "E. Martinez": "arg-martinez-3", "L. Martinez": "arg-martinez-2", MArtinez: "arg-martinez", Martinez: "arg-martinez-3" },
  cod: { "DR Congo": "cod-mpasi" },
  uzb: { Nematov: "uzb-nematov", Nasrullayev: "uzb-nasrullaev", Yusupov: "uzb-yusupov", Khamrobekov: "uzb-hamrobekov" },
  uru: { Arrascaeta: "ury-valverde" },
  dza: {
    Zidane: "dza-zidane",
    Mandi: "dza-mandi",
    Bensebaini: "dza-bensebaini",
    Amoura: "dza-amoura",
    "Ait Nouri": "dza-ait-nouri",
    "Ait-Nouri": "dza-ait-nouri",
    Belghali: "dza-belghali",
  },
};

export const MANUAL_ALIASES: Record<string, Record<string, string>> = {
  sau: { Mandash: "Saud Abdulhamid", "N. Al-Dawsari": "Nasser Al-Dawsari", "S. Al-Dawsari": "Salem Al-Dawsari" },
  aus: { Circati: "Alessandro Circati", "O'Neill": "Aiden O'Neill", Touré: "Mohamed Touré" },
  bel: { "De Cuyper": "Maxim De Cuyper", "De Ketelaere": "Charles De Ketelaere", Meunier: "Thomas Meunier", "De Winter": "Zeno Debast" },
  bih: { Katic: "Stjepan Katic", Muharemovic: "Adi Muharemovic", Dedic: "Amar Dedić" },
  bra: { "Douglas Santos": "Douglas Santos", "Bruno Guimaraes": "Bruno Guimarães", Vinicius: "Vinícius Júnior", Guimaraes: "Bruno Guimarães" },
  can: { Sigur: "Niko Sigur", Koné: "Ismaël Koné", Laryea: "Richie Laryea", Crepeau: "Maxime Crépeau", Jones: "Alfie Jones" },
  cpv: { Voziha: "Vozinha", Borges: "Diney", "Lopes Cabral": "Sidny Lopes Cabral", Lenini: "Kevin Pina", Livramento: "Dailon Livramento" },
  col: { Munoz: "Daniel Muñoz", Sanchez: "Davinson Sánchez", Rodriguez: "James Rodríguez" },
  kor: { Wang: "Hwang In-beom", "Seung-gyu Kim": "Kim Seung-gyu", "Min-jae Kim": "Kim Min-jae", "Han-beom Lee": "Lee Han-beom", "Tae-seok Lee": "Lee Tae-seok", "Kang-in Lee": "Lee Kang-in", "Jae-sung Lee": "Lee Jae-sung", Bae: "Bae Jun-ho", Son: "Son Heung-min", Seol: "Seol Young-woo" },
  civ: { Fofana: "Yahia Fofana", Konan: "Ghislain Konan", Oulai: "Christ Inao Oulaï", Guessand: "Evann Guessand", Diomandé: "Yan Diomande" },
  cuw: { "Van Ejma": "Van Eijma", Comenencia: "Comenencia", Gorré: "Gorre" },
  ecu: { Ordonez: "Ordóñez", HIncapié: "Piero Hincapié" },
  egy: { Abdelmaguif: "Abdelmonem", Hany: "Hamza Alaa", Lasheen: "Mohanad Lasheen", Fatouh: "Ahmed Fatouh", "El Hanafi": "Tarek Alaa", "El Fetouh": "Mohamed Abdelmonem" },
  deu: { Goreztka: "Leon Goretzka", Neves: "João Neves" },
  gha: { Mensah: "Gideon Mensah", Ayew: "Jordan Ayew", Sulemana: "Kamaldeen Sulemana", Semenyo: "Antoine Semenyo" },
  jor: { "Al-Rawahbdeh": "Noor Al-Rawabdeh", "Abu Taha": "Mohannad Abu Taha", Olwan: "Ali Olwan" },
  hti: { Expérience: "Derrick Etienne", Deedson: "Danley Jean Jacques", Pierre: "Derrick Etienne", Providence: "Duckens Nazon" },
  irn: { Ghayedi: "Mehdi Ghaedi", Yousefi: "Aria Yousefi" },
  irq: { "Hussein Ali": "Hussein Ali", Tahseen: "Zaid Tahseen", "Ali Jasim": "Ali Jasim", "Aymen Hussein": "Aymen Hussein" },
  mar: { "Salah-Eddine": "Anass Salah-Eddine", "El Aynaoui": "Neil El Aynaoui", "El Kaabi": "Ayoub El Kaabi", "Brahim Diaz": "Brahim Díaz" },
  mex: { Quinones: "Julián Quiñones", Jimenez: "Raúl Jiménez", Sanchez: "Jorge Sánchez", Vasquez: "Johan Vásquez", Lira: "Erik Lira", Alvarado: "Roberto Alvarado" },
  nor: { Ostigard: "Leo Østigård", Sorloth: "Alexander Sørloth", Nyland: "Ørjan Nyland" },
  nzl: { Payne: "Tommy Smith", Boxall: "Michael Boxall", McCowatt: "Callum McCowatt" },
  nld: { "Van Dijk": "Virgil van Dijk", "Aké": "Nathan Aké", "Van de Ven": "Micky van de Ven", Malen: "Brian Brobbey", Ake: "Nathan Aké" },
  pan: { Cordoba: "José Córdoba", Barcenas: "Yoel Bárcenas", Waterman: "Cecilio Waterman" },
  pry: { Gill: "Antony Silva", "G. Gomez": "Gustavo Gómez", "D. Gomez": "Diego Gómez", Avalos: "Gabriel Ávalos" },
  prt: { "Ruben Dias": "Rúben Dias", Inacio: "Gonçalo Inácio", "Joao Neves": "João Neves", "Bruno Fernandes": "Bruno Fernandes", "Bernardo Silva": "Bernardo Silva", "Cristiano Ronaldo": "Cristiano Ronaldo", "Joao Felix": "João Félix", Cancelo: "João Cancelo", Mendes: "Nuno Mendes" },
  qat: { "Al-Oui": "Ayoub Al-Oui", "Al-Amin": "Sultan Al-Brake", Laye: "Issa Laye", Barsham: "Meshaal Barsham", "Edmilson Junior": "Edmilson Junior", "Almoez Ali": "Almoez Ali" },
  cod: { Pickel: "Noah Sadiki", Moutoussamy: "Edo Kayembe", Bongonda: "Théo Bongonda", Kakuta: "Gaël Kakuta", "Wan-Bissaka": "Aaron Wan-Bissaka" },
  sen: { "Pape Gueye": "Pape Matar Sarr", "Idrissa Gueye": "Idrissa Gana Gueye", "Ismaila Sarr": "Ismaïla Sarr", Mané: "Sadio Mané", "I.Gueye": "Idrissa Gana Gueye", "P.Gueye": "Pape Matar Sarr" },
  esp: { Simon: "Unai Simón", "Cubarsì": "Pau Cubarsí", "Fabian Ruiz": "Fabián Ruiz", "N. Williams": "Nico Williams" },
  usa: { Berhalter: "Tyler Adams", Freeman: "Alex Freeman", McKenzie: "Mark McKenzie" },
  swe: { Nordfeldt: "Kristoffer Nordfeldt", Elanga: "Anthony Elanga" },
  che: { Rodriguez: "Ricardo Rodríguez" },
  tun: { Dahmen: "Aymen Dahmen", Valery: "Yan Valery", Mastouri: "Hazem Mastouri", "El Abdi": "Youssef Msakni" },
  tur: { Kokcu: "Orkun Kökçü", Ozer: "Salih Özcan", Guler: "Arda Güler", Yildiz: "Kenan Yıldız", Akturkoglu: "Kerem Aktüroğlu", Yilmaz: "İrfan Can Kahveci" },
  ury: { Valera: "Guillermo Varela", Gimenez: "José María Giménez", Nunez: "Darwin Núñez", Rodriguez: "Brian Rodríguez" },
  uzb: { Ganiev: "Azizjon Ganiev", Fayzullaev: "Abbosbek Fayzullaev", Shomurodov: "Eldor Shomurodov" },
  arg: { Martinez: "Emiliano Martínez", Fernandez: "Enzo Fernández", Almada: "Thiago Almada", "Mac Allister": "Alexis Mac Allister", "E. Martinez": "Emiliano Martínez", "L. Martinez": "Lautaro Martínez" },
  aut: { "A. Schlager": "Alexander Schlager", "X. Schlager": "Xaver Schlager", Schmid: "Romano Schmid" },
  eng: { "O'Reilly": "Nico O'Reilly", Guehi: "Marc Guéhi", Kane: "Harry Kane", Foden: "Eberechi Eze" },
  fra: { Dembelé: "Ousmane Dembélé", Doué: "Désiré Doué", Mbappé: "Kylian Mbappé", Hernandez: "Lucas Hernandez" },
  sct: { Hickey: "Ross McCausland", Hanley: "Grant Hanley", McKenna: "Scott McKenna", Ferguson: "Lewis Ferguson" },
  zaf: { Apollis: "Oswin Appollis", Mofokeng: "Relebohile Mofokeng", Moremi: "Themba Zwane" },
  cze: { Kovar: "Matěj Kovář", Jurasek: "Michal Jurásek" },
  hrv: { Vuskovic: "Luka Vušković", Kovacic: "Mateo Kovačić" },
};

function stripAccents(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ł/g, "l")
    .replace(/Ł/g, "L")
    .replace(/ø/g, "o")
    .replace(/Ø/g, "O")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .replace(/ß/g, "ss")
    .replace(/æ/g, "ae")
    .replace(/œ/g, "oe");
}

function norm(s: string): string {
  return stripAccents(s)
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s: string): string[] {
  return norm(s).split(" ").filter(Boolean);
}

const GK_SLOTS = new Set(["GK"]);
const DEF_SLOTS = new Set(["LB", "CB", "RB", "LWB", "RWB"]);
const FWD_SLOTS = new Set(["LW", "RW", "ST"]);
const MID_SLOTS = new Set(["CM", "DM", "LM", "RM", "AM"]);

function posFitForSlot(slot: string, pos: string): number {
  if (GK_SLOTS.has(slot)) return pos === "GK" ? 30 : 0;
  if (DEF_SLOTS.has(slot)) {
    if (pos === "DF") return 30;
    if (pos === "MF") return 8;
    return 0;
  }
  if (FWD_SLOTS.has(slot)) {
    if (pos === "FW") return 30;
    if (pos === "MF") return 12;
    return 0;
  }
  if (MID_SLOTS.has(slot)) {
    if (pos === "MF") return 30;
    if (pos === "FW") return 12;
    if (pos === "DF") return 8;
    return 0;
  }
  return 0;
}

export type MatchPlayerOptions = {
  slot?: string;
  usedIds?: Set<string>;
};

export function matchPlayer(
  iso3: string,
  squad: { id: string; name: string; pos?: string }[],
  rawName: string,
  options?: MatchPlayerOptions,
): string | null {
  const trimmed = rawName.trim();
  if (!trimmed) return null;
  const used = options?.usedIds ?? new Set<string>();

  const direct = DIRECT_PLAYER_IDS[iso3]?.[trimmed];
  if (direct && !used.has(direct) && squad.some((p) => p.id === direct)) return direct;

  const alias = MANUAL_ALIASES[iso3]?.[trimmed];
  let searchName = trimmed;
  if (alias) {
    const aliasPlayer = squad.find((p) => norm(p.name) === norm(alias));
    if (aliasPlayer && !used.has(aliasPlayer.id)) searchName = alias;
  }
  const gt = tokens(searchName);
  const gLast = gt[gt.length - 1] ?? "";

  const candidates: { id: string; score: number }[] = [];
  for (const p of squad) {
    if (used.has(p.id)) continue;
    const pt = tokens(p.name);
    const pLast = pt[pt.length - 1] ?? "";
    let score = 0;
    if (norm(p.name) === norm(searchName)) score = 100;
    else if (pLast && gLast && pLast === gLast) score = 80;
    else if (pt.some((t) => gt.includes(t))) score = 60;
    else if (norm(p.name).includes(norm(searchName)) || norm(searchName).includes(norm(p.name)))
      score = 40;
    if (score < 40) continue;
    if (options?.slot && p.pos) score += posFitForSlot(options.slot, p.pos);
    candidates.push({ id: p.id, score });
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates[0]?.id ?? null;
}

/** "Alisson; Wesley, Marquinhos" → 選手名配列 */
export function parseSemicolonLineup(line: string): string[] {
  const idx = line.indexOf(":");
  const body = idx >= 0 ? line.slice(idx + 1) : line;
  return body
    .split(";")
    .flatMap((part) => part.split(","))
    .map((s) => s.trim())
    .filter(Boolean);
}
