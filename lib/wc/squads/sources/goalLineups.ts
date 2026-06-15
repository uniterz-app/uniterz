// Source: Goal.com probable lineups (2026-06-02)
// https://www.goal.com/en-us/lists/probable-line-ups-world-cup-2026-starters-and-expected-starting-xi-of-the-48-national-teams/blt0d21c342d47a4cc2

import type { WcFormationCode } from "../../squadTypes";

export type RawSourceLineup = {
  iso3: string;
  formation: WcFormationCode;
  players: string[];
};

export const GOAL_LINEUPS: RawSourceLineup[] = [
  { iso3: "dza", formation: "4-2-3-1", players: ["Zidane", "Belghali", "Belaid", "Bensebaini", "Ait-Nouri", "Zerrouki", "Boudaoui", "Mahrez", "Aouar", "Chaibi", "Gouiri"] },
  { iso3: "sau", formation: "4-3-3", players: ["Al-Aqidi", "Boushal", "Tambakti", "Al-Amri", "Al-Harbi", "Kanno", "Al-Khaibari", "N. Al-Dawsari", "Mandash", "Al-Buraikan", "S. Al-Dawsari"] },
  { iso3: "arg", formation: "4-3-3", players: ["Martinez", "Molina", "Otamendi", "Romero", "Tagliafico", "Mac Allister", "Paredes", "Fernandez", "Messi", "Alvarez", "Almada"] },
  { iso3: "aus", formation: "5-4-1", players: ["Ryan", "Italiano", "Degenek", "Souttar", "Circati", "Bos", "Metcalfe", "Devlin", "O'Neill", "Irankunda", "Touré"] },
  { iso3: "aut", formation: "4-2-3-1", players: ["A. Schlager", "Laimer", "Lienhart", "Alaba", "Mwene", "X. Schlager", "Seiwald", "Wimmer", "Baumgartner", "Sabitzer", "Arnautovic"] },
  { iso3: "bel", formation: "4-2-3-1", players: ["Courtois", "Castagne", "Debast", "Theate", "De Cuyper", "Tielemans", "Onana", "Doku", "De Bruyne", "Trossard", "De Ketelaere"] },
  { iso3: "bih", formation: "4-4-2", players: ["Vasilj", "Dedic", "Katic", "Muharemovic", "Kolasinac", "Bajraktarevic", "Sunjic", "Tahirovic", "Memic", "Demirovic", "Dzeko"] },
  { iso3: "bra", formation: "4-4-2", players: ["Alisson", "Wesley", "Marquinhos", "Gabriel", "Douglas Santos", "Luis Henrique", "Casemiro", "Bruno Guimaraes", "Raphinha", "Vinicius", "Cunha"] },
  { iso3: "can", formation: "4-4-2", players: ["Crepeau", "Sigur", "Bombito", "Jones", "Laryea", "Buchanan", "Koné", "Eustaquio", "Davies", "Oluwaseyi", "David"] },
  { iso3: "cpv", formation: "4-2-3-1", players: ["Voziha", "Moreira", "Lopes", "Borges", "Lopes Cabral", "Lenini", "Duarte", "Rodrigues", "Monteiro", "Cabral", "Livramento"] },
  { iso3: "col", formation: "4-2-3-1", players: ["Montero", "Munoz", "Sanchez", "Mina", "Mojica", "Lerma", "Rios", "Arias", "James", "Diaz", "Suarez"] },
  { iso3: "kor", formation: "4-2-3-1", players: ["Seung-gyu Kim", "Seol", "Min-jae Kim", "Han-beom Lee", "Tae-seok Lee", "Wang", "Castrop", "Kang-in Lee", "Jae-sung Lee", "Bae", "Son"] },
  { iso3: "civ", formation: "4-3-3", players: ["Fofana", "Doué", "Koussonou", "Ndicka", "Konan", "Kessié", "Sangaré", "Oulai", "Pepé", "Guessand", "Diomandé"] },
  { iso3: "cuw", formation: "4-3-3", players: ["Room", "Sambo", "Van Ejma", "Obispo", "Floranus", "J. Bacuna", "Comenencia", "L. Bacuna", "Chong", "Locadia", "Gorré"] },
  { iso3: "hrv", formation: "4-2-3-1", players: ["Livakovic", "Stanisic", "Sutalo", "Caleta-Car", "Gvardiol", "Sucic", "Modric", "Pasalic", "Kramaric", "Perisic", "Budimir"] },
  { iso3: "ecu", formation: "4-3-3", players: ["Galindez", "Preciado", "Ordonez", "Pacho", "HIncapié", "Vite", "Caicedo", "Castillo", "Yeboah", "Valencia", "Angulo"] },
  { iso3: "egy", formation: "3-4-1-2", players: ["El Shenawy", "Ibrahim", "Abdelmaguif", "Rabia", "Hany", "Ateya", "Lasheen", "Fatouh", "Ashour", "Salah", "Marmoush"] },
  { iso3: "fra", formation: "4-2-3-1", players: ["Maignan", "Koundé", "Saliba", "Upamecano", "Hernandez", "Rabiot", "Tchouameni", "Dembelé", "Olise", "Doué", "Mbappé"] },
  { iso3: "deu", formation: "4-2-3-1", players: ["Neuer", "Kimmich", "Tah", "Schlotterbeck", "Raum", "Pavlovic", "Goreztka", "Sané", "Musiala", "Wirtz", "Havertz"] },
  { iso3: "gha", formation: "3-4-3", players: ["Asare", "Adjetei", "Seidu", "Oppong", "Yirenkyi", "Sibo", "Partey", "Mensah", "Sulemana", "Semenyo", "Ayew"] },
  { iso3: "jpn", formation: "3-4-2-1", players: ["Suzuki", "Tomiyasu", "Taniguchi", "Itakura", "Doan", "Sano", "Tanaka", "Nakamura", "Kubo", "Ito", "Ueda"] },
  { iso3: "jor", formation: "3-4-3", players: ["Abulaila", "Abu Dahab", "Nasib", "Al-Arab", "Haddad", "Al-Rawahbdeh", "Al-Rashdan", "Abu Taha", "Tamari", "Olwan", "Al-Mardi"] },
  { iso3: "hti", formation: "4-3-3", players: ["Placide", "Arcus", "Adé", "Duverne", "Expérience", "Deedson", "Bellegarde", "Pierre", "Isidor", "Nazon", "Providence"] },
  { iso3: "eng", formation: "4-2-3-1", players: ["Pickford", "James", "Guehi", "Konsa", "O'Reilly", "Anderson", "Rice", "Saka", "Bellingham", "Eze", "Kane"] },
  { iso3: "irn", formation: "4-2-3-1", players: ["Beyranvand", "Yousefi", "Kanaani", "Khalilzadeh", "Mohammadi", "Ezatolahi", "Ghoddos", "Jahanbakhsh", "Ghayedi", "Mohebi", "Taremi"] },
  { iso3: "irq", formation: "4-2-3-1", players: ["Hassan", "Hussein Ali", "Sulaka", "Tahseen", "Doski", "Al-Ammari", "Bayesh", "Ali Jasim", "Iqbal", "Amyn", "Aymen Hussein"] },
  { iso3: "mar", formation: "4-2-3-1", players: ["Bono", "Hakimi", "Diop", "Aguerd", "Salah-Eddine", "Ounahi", "El Aynaoui", "Brahim Diaz", "Saibari", "Talbi", "El Kaabi"] },
  { iso3: "mex", formation: "4-3-3", players: ["Rangel", "Sanchez", "Montes", "Vasquez", "Gallardo", "Pineda", "Alvarez", "Fidalgo", "Vega", "Jimenez", "Quinones"] },
  { iso3: "nor", formation: "4-3-3", players: ["Nyland", "Ryerson", "Heggem", "Ostigard", "Wolfe", "Thorstvedt", "Berg", "Berge", "Sorloth", "Haaland", "Nusa"] },
  { iso3: "nzl", formation: "4-2-3-1", players: ["Crocombe", "Payne", "Bindon", "Boxall", "Cacace", "Samenic", "Bell", "McCowatt", "Singh", "Garbett", "Wood"] },
  { iso3: "nld", formation: "4-2-3-1", players: ["Verbruggen", "Dumfries", "Van Dijk", "Aké", "Van de Ven", "De Jong", "Gravenberch", "Malen", "Reijnders", "Gakpo", "Depay"] },
  { iso3: "pan", formation: "3-4-2-1", players: ["Mosquera", "Farina", "Andrade", "Cordoba", "Murillo", "Carrasquilla", "Godoy", "Davis", "Barcenas", "Diaz", "Fajardo"] },
  { iso3: "pry", formation: "4-4-2", players: ["Gill", "Caceres", "G. Gomez", "Alderete", "Alonso", "D. Gomez", "Ojeda", "Bobadilla", "Almiron", "Enciso", "Avalos"] },
  { iso3: "prt", formation: "4-3-3", players: ["Costa", "Cancelo", "Ruben Dias", "Inacio", "Nuno Mendes", "Joao Neves", "Vitinha", "Bruno Fernandes", "Bernardo Silva", "Cristiano Ronaldo", "Joao Felix"] },
  { iso3: "qat", formation: "4-3-3", players: ["Barsham", "Al-Oui", "Khoukhi", "Pedro Miguel", "Al-Amin", "Boudiaf", "Fathy", "Laye", "Edmilson Junior", "Almoez Ali", "Afif"] },
  { iso3: "cze", formation: "3-4-2-1", players: ["Hornicek", "Chaloupek", "Hranac", "Krejci", "Zeleny", "Soucek", "Darida", "Coufal", "Provod", "Sulc", "Schick"] },
  { iso3: "cod", formation: "4-2-3-1", players: ["Mpasi", "Wan-Bissaka", "Mbemba", "Tuanzebe", "Masuaku", "Pickel", "Moutoussamy", "Bongonda", "Kakuta", "Wissa", "Bakambu"] },
  { iso3: "sct", formation: "4-1-4-1", players: ["Gordon", "Hickey", "Hanley", "McKenna", "Robertson", "Ferguson", "Gannon-Doak", "Christie", "McTominay", "McGinn", "Adams"] },
  { iso3: "sen", formation: "4-2-3-1", players: ["Mendy", "Diatta", "Koulibaly", "Niakhaté", "Jakobs", "Idrissa Gueye", "Pape Gueye", "Ismaila Sarr", "Iliman Ndiaye", "Mané", "Jackson"] },
  { iso3: "esp", formation: "4-3-3", players: ["Simon", "Llorente", "Cubarsì", "Laporte", "Cucurella", "Pedri", "Rodri", "Fabian Ruiz", "N. Williams", "Oyarzabal", "Yamal"] },
  { iso3: "usa", formation: "4-3-3", players: ["Freese", "Freeman", "Richards", "Trusty", "Antonee Robinson", "McKennie", "Berhalter", "Adams", "Weah", "Balogun", "Pulisic"] },
  { iso3: "zaf", formation: "4-2-3-1", players: ["Williams", "Mudau", "Sibisi", "Ndamane", "Modiba", "Sithole", "Mokoena", "Apollis", "Zwane", "Mofokeng", "Foster"] },
  { iso3: "swe", formation: "3-4-2-1", players: ["Nordfeldt", "Starfelt", "Lagerbielke", "Lindelof", "Svensson", "Karlstrom", "Ayari", "Gudmundsson", "Nygren", "Elanga", "Gyokeres"] },
  { iso3: "che", formation: "4-3-3", players: ["Kobel", "Widmer", "Akanji", "Elvedi", "Rodriguez", "Freuler", "Xhaka", "Rieder", "Ndoye", "Embolo", "Vargas"] },
  { iso3: "tun", formation: "4-3-3", players: ["Dahmen", "Valery", "Bronn", "Talbi", "Abdi", "Gharbi", "Skhiri", "Hannibal", "Achouri", "Mastouri", "Tounekti"] },
  { iso3: "tur", formation: "3-4-2-1", players: ["Cakir", "Demiral", "Kabak", "Bardakci", "Celik", "Calhanoglu", "Kokcu", "Ozer", "Guler", "Yildiz", "Akturkoglu"] },
  { iso3: "ury", formation: "4-3-3", players: ["Rochet", "Valera", "Gimenez", "Araujo", "Olivera", "Valverde", "Ugarte", "Bentancur", "Canobbio", "Nunez", "Rodriguez"] },
  { iso3: "uzb", formation: "3-4-2-1", players: ["Nematov", "Abdullaev", "Ashurmatov", "Khusanov", "Sayfiev", "Shukurov", "Khamrobekov", "Nasrullaev", "Ganiev", "Urunov", "Shomurodov"] },
];
