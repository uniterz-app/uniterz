// lib/wc/rosters.ts
//
// World Cup チームデータ「キープレイヤー」用の静的データ。
// 表示: ポジション / 名前 / キャプテン / 所属クラブ（背番号は使わない）。
// チームごとに数名ずつ追記・更新していく。

export type WcPosition = "GK" | "DF" | "MF" | "FW";

export type WcKeyPlayer = {
  name: string;
  pos: WcPosition;
  /** 所属クラブ */
  club?: string;
  /** リーグ所在国（ISO2）。未指定時は club 名から自動推定 */
  leagueIso2?: string;
  /** キャプテン */
  captain?: boolean;
};

/** @deprecated WcKeyPlayer を使用 */
export type WcRosterPlayer = WcKeyPlayer;

const KEY_PLAYER_LIMIT = 6;

/**
 * 主将が Reuters 等で未確定の国（キープレイヤー行に C バッジを付けない）
 * @see ユーザー提供の Group D / H / I ほか
 */
export const WC_CAPTAIN_UNCONFIRMED_ISO3 = new Set([
  "usa",
  "tun",
  "esp",
  "irq",
]);

export function isWcCaptainUnconfirmed(
  teamId: string | null | undefined,
): boolean {
  if (!teamId?.startsWith("wc-")) return false;
  return WC_CAPTAIN_UNCONFIRMED_ISO3.has(teamId.slice(3).toLowerCase());
}

/** フル名簿が残っているチームはキャプテン＋各ポジションから代表選手を選ぶ */
function selectKeyPlayers(players: WcKeyPlayer[]): WcKeyPlayer[] {
  if (players.length <= 8) return players;

  const picked: WcKeyPlayer[] = [];
  const used = new Set<WcKeyPlayer>();

  const push = (p: WcKeyPlayer) => {
    if (used.has(p) || picked.length >= KEY_PLAYER_LIMIT) return;
    used.add(p);
    picked.push(p);
  };

  const captain = players.find((p) => p.captain);
  if (captain) push(captain);

  for (const pos of ["FW", "MF", "DF", "GK"] as const) {
    for (const p of players) {
      if (p.pos !== pos) continue;
      push(p);
      if (picked.length >= KEY_PLAYER_LIMIT) return picked;
    }
  }

  return picked;
}

const WC_KEY_PLAYERS: Record<string, WcKeyPlayer[]> = {
  // Group A
  mex: [
    { name: "Edson Álvarez", pos: "MF", club: "Fenerbahçe", captain: true },
    { name: "Santiago Giménez", pos: "FW", club: "AC Milan" },
    { name: "Raúl Jiménez", pos: "FW", club: "Fulham" },
    { name: "Guillermo Ochoa", pos: "GK", club: "AEL Limassol" },
    { name: "Luis Chávez", pos: "MF", club: "Dynamo Moscow" },
    { name: "Álvaro Fidalgo", pos: "MF", club: "Real Betis" },
    { name: "Gilberto Mora", pos: "MF", club: "Club Tijuana" },
  ],
  zaf: [
    { name: "Ronwen Williams", pos: "GK", club: "Mamelodi Sundowns", captain: true },
    { name: "Teboho Mokoena", pos: "MF", club: "Mamelodi Sundowns" },
    { name: "Lyle Foster", pos: "FW", club: "Burnley" },
    { name: "Themba Zwane", pos: "FW", club: "Mamelodi Sundowns" },
    { name: "Relebohile Mofokeng", pos: "FW", club: "Orlando Pirates" },
    { name: "Khuliso Mudau", pos: "DF", club: "Mamelodi Sundowns" },
  ],
  kor: [
    { name: "Son Heung-min", pos: "FW", club: "LAFC", captain: true },
    { name: "Kim Min-jae", pos: "DF", club: "Bayern Munich" },
    { name: "Lee Kang-in", pos: "MF", club: "PSG" },
    { name: "Lee Jae-sung", pos: "MF", club: "Mainz" },
    { name: "Hwang Hee-chan", pos: "FW", club: "Wolves" },
    { name: "Cho Gue-sung", pos: "FW", club: "Midtjylland" },
  ],
  cze: [
    { name: "Ladislav Krejčí", pos: "DF", club: "Wolves", captain: true },
    { name: "Patrik Schick", pos: "FW", club: "Bayer Leverkusen" },
    { name: "Tomáš Souček", pos: "MF", club: "West Ham" },
    { name: "Pavel Šulc", pos: "MF", club: "Lyon" },
    { name: "Adam Hložek", pos: "FW", club: "Hoffenheim" },
    { name: "Matěj Kovář", pos: "GK", club: "PSV" },
  ],
  // Group B
  can: [
    { name: "Alphonso Davies", pos: "DF", club: "Bayern Munich", captain: true },
    { name: "Jonathan David", pos: "FW", club: "Juventus" },
    { name: "Stephen Eustáquio", pos: "MF", club: "LAFC" },
    { name: "Tajon Buchanan", pos: "MF", club: "Villarreal" },
    { name: "Cyle Larin", pos: "FW", club: "Southampton" },
    { name: "Moïse Bombito", pos: "DF", club: "OGC Nice" },
    { name: "Alistair Johnston", pos: "DF", club: "Celtic" },
  ],
  bih: [
    { name: "Edin Džeko", pos: "FW", club: "Schalke 04", captain: true },
    { name: "Ermedin Demirović", pos: "FW", club: "VfB Stuttgart" },
    { name: "Sead Kolašinac", pos: "DF", club: "Atalanta" },
    { name: "Amar Dedić", pos: "DF", club: "Benfica" },
    { name: "Esmir Bajraktarević", pos: "MF", club: "PSV Eindhoven" },
    { name: "Benjamin Tahirović", pos: "MF", club: "Brøndby" },
    { name: "Nikola Vasilj", pos: "GK", club: "St Pauli" },
  ],
  qat: [
    { name: "Hassan Al-Haydos", pos: "FW", club: "Al Sadd", captain: true },
    { name: "Akram Afif", pos: "FW", club: "Al Sadd" },
    { name: "Almoez Ali", pos: "FW", club: "Al-Duhail" },
    { name: "Meshaal Barsham", pos: "GK", club: "Al Sadd" },
    { name: "Boualem Khoukhi", pos: "DF", club: "Al Sadd" },
    { name: "Abdulaziz Hatem", pos: "MF", club: "Al Rayyan" },
    { name: "Karim Boudiaf", pos: "MF", club: "Al-Duhail" },
  ],
  che: [
    { name: "Granit Xhaka", pos: "MF", club: "Sunderland", captain: true },
    { name: "Manuel Akanji", pos: "DF", club: "Inter Milan" },
    { name: "Gregor Kobel", pos: "GK", club: "Borussia Dortmund" },
    { name: "Breel Embolo", pos: "FW", club: "Stade Rennais" },
    { name: "Dan Ndoye", pos: "FW", club: "Nottingham Forest" },
    { name: "Denis Zakaria", pos: "MF", club: "Monaco" },
    { name: "Ricardo Rodríguez", pos: "DF", club: "Real Betis" },
  ],
  // Group C
  bra: [
    { name: "Marquinhos", pos: "DF", club: "Paris Saint-Germain", captain: true },
    { name: "Vinícius Júnior", pos: "FW", club: "Real Madrid" },
    { name: "Neymar", pos: "FW", club: "Santos" },
    { name: "Raphinha", pos: "FW", club: "Barcelona" },
    { name: "Alisson", pos: "GK", club: "Liverpool" },
    { name: "Gabriel Magalhães", pos: "DF", club: "Arsenal" },
    { name: "Bruno Guimarães", pos: "MF", club: "Newcastle United" },
    { name: "Casemiro", pos: "MF", club: "Manchester United" },
  ],
  mar: [
    { name: "Achraf Hakimi", pos: "DF", club: "Paris Saint-Germain", captain: true },
    { name: "Yassine Bounou", pos: "GK", club: "Al Hilal" },
    { name: "Noussair Mazraoui", pos: "DF", club: "Manchester United" },
    { name: "Nayef Aguerd", pos: "DF", club: "Marseille" },
    { name: "Sofyan Amrabat", pos: "MF", club: "Real Betis" },
    { name: "Azzedine Ounahi", pos: "MF", club: "Girona" },
    { name: "Ismael Saibari", pos: "MF", club: "PSV Eindhoven" },
    { name: "Brahim Díaz", pos: "FW", club: "Real Madrid" },
  ],
  hti: [
    { name: "Johny Placide", pos: "GK", club: "Bastia", captain: true },
    { name: "Jean-Kévin Duverne", pos: "DF", club: "Gent" },
    { name: "Ricardo Adé", pos: "DF", club: "LDU Quito" },
    { name: "Carlens Arcus", pos: "DF", club: "Angers" },
    { name: "Danley Jean Jacques", pos: "MF", club: "Philadelphia Union" },
    { name: "Jean-Ricner Bellegarde", pos: "MF", club: "Wolverhampton Wanderers" },
    { name: "Duckens Nazon", pos: "FW", club: "Esteghlal" },
    { name: "Frantzdy Pierrot", pos: "FW", club: "Çaykur Rizespor" },
    { name: "Wilson Isidor", pos: "FW", club: "Sunderland" },
  ],
  sct: [
    { name: "Andy Robertson", pos: "DF", club: "Liverpool", captain: true },
    { name: "Kieran Tierney", pos: "DF", club: "Celtic" },
    { name: "Scott McTominay", pos: "MF", club: "Napoli" },
    { name: "John McGinn", pos: "MF", club: "Aston Villa" },
    { name: "Lewis Ferguson", pos: "MF", club: "Bologna" },
    { name: "Ben Gannon-Doak", pos: "MF", club: "Bournemouth" },
    { name: "Ché Adams", pos: "FW", club: "Torino" },
    { name: "Angus Gunn", pos: "GK", club: "Nottingham Forest" },
  ],
  // Group D
  usa: [
    { name: "Tim Ream", pos: "DF", club: "Charlotte FC" },
    { name: "Christian Pulisic", pos: "FW", club: "AC Milan" },
    { name: "Tyler Adams", pos: "MF", club: "AFC Bournemouth" },
    { name: "Weston McKennie", pos: "MF", club: "Juventus" },
    { name: "Antonee Robinson", pos: "DF", club: "Fulham" },
    { name: "Sergiño Dest", pos: "DF", club: "PSV" },
    { name: "Gio Reyna", pos: "FW", club: "Borussia Mönchengladbach" },
    { name: "Folarin Balogun", pos: "FW", club: "AS Monaco" },
  ],
  pry: [
    { name: "Gustavo Gómez", pos: "DF", club: "Palmeiras", captain: true },
    { name: "Miguel Almirón", pos: "MF", club: "Atlanta United" },
    { name: "Diego Gómez", pos: "MF", club: "Brighton & Hove Albion" },
    { name: "Julio Enciso", pos: "FW", club: "Strasbourg" },
    { name: "Antonio Sanabria", pos: "FW", club: "Cremonese" },
    { name: "Omar Alderete", pos: "DF", club: "Sunderland" },
    { name: "Andrés Cubas", pos: "MF", club: "Vancouver Whitecaps" },
    { name: "Gabriel Ávalos", pos: "FW", club: "Independiente" },
  ],
  aus: [
    { name: "Mathew Ryan", pos: "GK", club: "Levante", captain: true },
    { name: "Jackson Irvine", pos: "MF", club: "St. Pauli" },
    { name: "Harry Souttar", pos: "DF", club: "Leicester City" },
    { name: "Jordan Bos", pos: "DF", club: "Feyenoord" },
    { name: "Nestory Irankunda", pos: "FW", club: "Watford" },
    { name: "Mathew Leckie", pos: "FW", club: "Melbourne City" },
    { name: "Ajdin Hrustic", pos: "MF", club: "Heracles Almelo" },
    { name: "Cristian Volpato", pos: "FW", club: "Sassuolo" },
  ],
  tur: [
    { name: "Hakan Çalhanoğlu", pos: "MF", club: "Inter Milan", captain: true },
    { name: "Arda Güler", pos: "MF", club: "Real Madrid" },
    { name: "Kenan Yıldız", pos: "FW", club: "Juventus" },
    { name: "Orkun Kökçü", pos: "MF", club: "Benfica" },
    { name: "Barış Alper Yılmaz", pos: "FW", club: "Galatasaray" },
    { name: "Ferdi Kadıoğlu", pos: "DF", club: "Brighton & Hove Albion" },
    { name: "Merih Demiral", pos: "DF", club: "Al-Ahli" },
    { name: "Altay Bayındır", pos: "GK", club: "Manchester United" },
  ],
  // Group E
  deu: [
    { name: "Joshua Kimmich", pos: "MF", club: "Bayern Munich", captain: true },
    { name: "Jamal Musiala", pos: "FW", club: "Bayern Munich" },
    { name: "Florian Wirtz", pos: "MF", club: "Liverpool" },
    { name: "Manuel Neuer", pos: "GK", club: "Bayern Munich" },
    { name: "Antonio Rüdiger", pos: "DF", club: "Real Madrid" },
    { name: "Jonathan Tah", pos: "DF", club: "Bayern Munich" },
    { name: "Kai Havertz", pos: "FW", club: "Arsenal" },
    { name: "Leroy Sané", pos: "FW", club: "Galatasaray" },
  ],
  civ: [
    { name: "Franck Kessié", pos: "MF", club: "Al Ahli", captain: true },
    { name: "Amad Diallo", pos: "FW", club: "Manchester United" },
    { name: "Simon Adingra", pos: "FW", club: "AS Monaco" },
    { name: "Evan Ndicka", pos: "DF", club: "AS Roma" },
    { name: "Odilon Kossounou", pos: "DF", club: "Atalanta" },
    { name: "Wilfried Singo", pos: "DF", club: "Galatasaray" },
    { name: "Seko Fofana", pos: "MF", club: "Porto" },
    { name: "Ibrahim Sangaré", pos: "MF", club: "Nottingham Forest" },
    { name: "Nicolas Pépé", pos: "FW", club: "Villarreal" },
  ],
  ecu: [
    { name: "Enner Valencia", pos: "FW", club: "Pachuca", captain: true },
    { name: "Moisés Caicedo", pos: "MF", club: "Chelsea" },
    { name: "Willian Pacho", pos: "DF", club: "Paris Saint-Germain" },
    { name: "Piero Hincapié", pos: "DF", club: "Arsenal" },
    { name: "Pervis Estupiñán", pos: "DF", club: "AC Milan" },
    { name: "Kendry Páez", pos: "MF", club: "River Plate" },
    { name: "Gonzalo Plata", pos: "MF", club: "Flamengo" },
    { name: "Hernán Galíndez", pos: "GK", club: "Huracán" },
  ],
  cuw: [
    { name: "Leandro Bacuna", pos: "MF", club: "Iğdır", captain: true },
    { name: "Eloy Room", pos: "GK", club: "Miami FC" },
    { name: "Riechedly Bazoer", pos: "DF", club: "Konyaspor" },
    { name: "Joshua Brenet", pos: "DF", club: "Kayserispor" },
    { name: "Tahith Chong", pos: "FW", club: "Sheffield United" },
    { name: "Sontje Hansen", pos: "FW", club: "Middlesbrough" },
    { name: "Jürgen Locadia", pos: "FW", club: "Miami FC" },
    { name: "Brandley Kuwas", pos: "FW", club: "Volendam" },
  ],
  // Group F
  nld: [
    { name: "Virgil van Dijk", pos: "DF", club: "Liverpool", captain: true },
    { name: "Memphis Depay", pos: "FW", club: "Corinthians" },
    { name: "Frenkie de Jong", pos: "MF", club: "Barcelona" },
    { name: "Cody Gakpo", pos: "FW", club: "Liverpool" },
    { name: "Tijjani Reijnders", pos: "MF", club: "Manchester City" },
    { name: "Denzel Dumfries", pos: "DF", club: "Inter Milan" },
    { name: "Jurrien Timber", pos: "DF", club: "Arsenal" },
    { name: "Bart Verbruggen", pos: "GK", club: "Brighton & Hove Albion" },
  ],
  jpn: [
    { name: "Wataru Endo", pos: "MF", club: "Liverpool", captain: true },
    { name: "Takefusa Kubo", pos: "MF", club: "Real Sociedad" },
    { name: "Daichi Kamada", pos: "MF", club: "Crystal Palace" },
    { name: "Zion Suzuki", pos: "GK", club: "Parma" },
    { name: "Ritsu Doan", pos: "MF", club: "Eintracht Frankfurt" },
    { name: "Kaishu Sano", pos: "MF", club: "Mainz 05" },
    { name: "Hiroki Ito", pos: "DF", club: "Bayern Munich" },
    { name: "Ayase Ueda", pos: "FW", club: "Feyenoord" },
  ],
  swe: [
    { name: "Victor Lindelöf", pos: "DF", club: "Aston Villa", captain: true },
    { name: "Alexander Isak", pos: "FW", club: "Liverpool" },
    { name: "Viktor Gyökeres", pos: "FW", club: "Arsenal" },
    { name: "Anthony Elanga", pos: "FW", club: "Newcastle United" },
    { name: "Lucas Bergvall", pos: "MF", club: "Tottenham Hotspur" },
    { name: "Isak Hien", pos: "DF", club: "Atalanta" },
    { name: "Yasin Ayari", pos: "MF", club: "Brighton & Hove Albion" },
    { name: "Benjamin Nygren", pos: "MF", club: "Celtic" },
  ],
  tun: [
    { name: "Ellyes Skhiri", pos: "MF", club: "Eintracht Frankfurt" },
    { name: "Hannibal Mejbri", pos: "MF", club: "Burnley" },
    { name: "Montassar Talbi", pos: "DF", club: "Lorient" },
    { name: "Ali Abdi", pos: "DF", club: "Nice" },
    { name: "Dylan Bronn", pos: "DF", club: "Servette Geneva" },
    { name: "Anis Ben Slimane", pos: "MF", club: "Norwich City" },
    { name: "Elias Achouri", pos: "FW", club: "FC Copenhagen" },
    { name: "Yan Valery", pos: "DF", club: "Young Boys" },
  ],
  // Group G
  bel: [
    { name: "Youri Tielemans", pos: "MF", club: "Aston Villa", captain: true },
    { name: "Kevin De Bruyne", pos: "MF", club: "Napoli" },
    { name: "Thibaut Courtois", pos: "GK", club: "Real Madrid" },
    { name: "Romelu Lukaku", pos: "FW", club: "Napoli" },
    { name: "Jérémy Doku", pos: "FW", club: "Manchester City" },
    { name: "Amadou Onana", pos: "MF", club: "Aston Villa" },
    { name: "Leandro Trossard", pos: "FW", club: "Arsenal" },
    { name: "Arthur Theate", pos: "DF", club: "Eintracht Frankfurt" },
  ],
  egy: [
    { name: "Mohamed Salah", pos: "FW", club: "Liverpool", captain: true },
    { name: "Omar Marmoush", pos: "FW", club: "Manchester City" },
    { name: "Mahmoud Trezeguet", pos: "MF", club: "Al Ahly" },
    { name: "Mohamed El-Shenawy", pos: "GK", club: "Al Ahly" },
    { name: "Mohamed Abdelmonem", pos: "DF", club: "Nice" },
    { name: "Ahmed Zizo", pos: "MF", club: "Al Ahly" },
    { name: "Emam Ashour", pos: "MF", club: "Al Ahly" },
    { name: "Hamza Abdelkarim", pos: "FW", club: "Barcelona Atlètic" },
  ],
  irn: [
    { name: "Alireza Jahanbakhsh", pos: "MF", club: "Dender", captain: true },
    { name: "Mehdi Taremi", pos: "FW", club: "Olympiacos" },
    { name: "Ehsan Hajsafi", pos: "DF", club: "Sepahan" },
    { name: "Saman Ghoddos", pos: "MF", club: "Kalba" },
    { name: "Saeid Ezatolahi", pos: "MF", club: "Shabab Al-Ahli" },
    { name: "Alireza Beiranvand", pos: "GK", club: "Tractor" },
    { name: "Ramin Rezaeian", pos: "DF", club: "Foolad" },
    { name: "Mohammad Mohebi", pos: "MF", club: "Rostov" },
  ],
  nzl: [
    { name: "Chris Wood", pos: "FW", club: "Nottingham Forest", captain: true },
    { name: "Marko Stamenic", pos: "MF", club: "Swansea City" },
    { name: "Liberato Cacace", pos: "DF", club: "Wrexham AFC" },
    { name: "Tyler Bindon", pos: "DF", club: "Nottingham Forest" },
    { name: "Max Crocombe", pos: "GK", club: "Millwall" },
    { name: "Joe Bell", pos: "MF", club: "Viking FK" },
    { name: "Sarpreet Singh", pos: "MF", club: "Wellington Phoenix" },
    { name: "Tommy Smith", pos: "DF", club: "Braintree Town" },
  ],
  // Group H
  esp: [
    { name: "Rodri", pos: "MF", club: "Manchester City" },
    { name: "Lamine Yamal", pos: "FW", club: "Barcelona" },
    { name: "Pedri", pos: "MF", club: "Barcelona" },
    { name: "Nico Williams", pos: "FW", club: "Athletic Club" },
    { name: "Gavi", pos: "MF", club: "Barcelona" },
    { name: "David Raya", pos: "GK", club: "Arsenal" },
    { name: "Marc Cucurella", pos: "DF", club: "Chelsea" },
    { name: "Mikel Merino", pos: "MF", club: "Arsenal" },
  ],
  cpv: [
    { name: "Ryan Mendes", pos: "FW", club: "Iğdır", captain: true },
    { name: "Logan Costa", pos: "DF", club: "Villarreal" },
    { name: "Vozinha", pos: "GK", club: "Chaves" },
    { name: "Steven Moreira", pos: "DF", club: "Columbus Crew" },
    { name: "Jamiro Monteiro", pos: "MF", club: "PEC Zwolle" },
    { name: "Jovane Cabral", pos: "FW", club: "Estrela Amadora" },
    { name: "Nuno da Costa", pos: "FW", club: "İstanbul Başakşehir" },
    { name: "Hélio Varela", pos: "FW", club: "Maccabi Tel Aviv" },
  ],
  sau: [
    { name: "Salem Al-Dawsari", pos: "FW", club: "Al Hilal", captain: true },
    { name: "Saud Abdulhamid", pos: "DF", club: "Lens" },
    { name: "Nawaf Al-Aqidi", pos: "GK", club: "Al Nassr" },
    { name: "Mohammed Kanno", pos: "MF", club: "Al Hilal" },
    { name: "Hassan Tambakti", pos: "DF", club: "Al Hilal" },
    { name: "Firas Al-Buraikan", pos: "FW", club: "Al Ahli" },
    { name: "Saleh Al-Shehri", pos: "FW", club: "Al Ittihad" },
    { name: "Abdullah Al-Hamdan", pos: "FW", club: "Al Nassr" },
  ],
  ury: [
    { name: "Federico Valverde", pos: "MF", club: "Real Madrid" },
    { name: "Ronald Araújo", pos: "DF", club: "Barcelona" },
    { name: "Darwin Núñez", pos: "FW", club: "Al Hilal" },
    { name: "Rodrigo Bentancur", pos: "MF", club: "Tottenham Hotspur" },
    { name: "Manuel Ugarte", pos: "MF", club: "Manchester United" },
    { name: "José María Giménez", pos: "DF", club: "Atlético Madrid" },
    { name: "Mathías Olivera", pos: "DF", club: "Napoli" },
    { name: "Giorgian De Arrascaeta", pos: "MF", club: "Flamengo" },
  ],
  // Group I
  fra: [
    { name: "Kylian Mbappé", pos: "FW", club: "Real Madrid", captain: true },
    { name: "Ousmane Dembélé", pos: "FW", club: "Paris Saint-Germain" },
    { name: "Michael Olise", pos: "FW", club: "Bayern Munich" },
    { name: "Bradley Barcola", pos: "FW", club: "Paris Saint-Germain" },
    { name: "Aurélien Tchouaméni", pos: "MF", club: "Real Madrid" },
    { name: "N'Golo Kanté", pos: "MF", club: "Fenerbahçe" },
    { name: "William Saliba", pos: "DF", club: "Arsenal" },
    { name: "Mike Maignan", pos: "GK", club: "AC Milan" },
  ],
  sen: [
    { name: "Sadio Mané", pos: "FW", club: "Al Nassr", captain: true },
    { name: "Kalidou Koulibaly", pos: "DF", club: "Al Hilal" },
    { name: "Nicolas Jackson", pos: "FW", club: "Bayern Munich" },
    { name: "Iliman Ndiaye", pos: "FW", club: "Everton" },
    { name: "Ismaïla Sarr", pos: "FW", club: "Crystal Palace" },
    { name: "Pape Matar Sarr", pos: "MF", club: "Tottenham" },
    { name: "Idrissa Gana Gueye", pos: "MF", club: "Everton" },
    { name: "Édouard Mendy", pos: "GK", club: "Al Ahly" },
  ],
  irq: [
    { name: "Aymen Hussein", pos: "FW", club: "Al-Karma" },
    { name: "Ali Al-Hamadi", pos: "FW", club: "Ipswich Town" },
    { name: "Zidane Iqbal", pos: "MF", club: "Utrecht" },
    { name: "Aimar Sher", pos: "MF", club: "Sarpsborg 08" },
    { name: "Ali Jassim", pos: "FW", club: "Al-Najma" },
    { name: "Youssef Amyn", pos: "MF", club: "AEK Larnaca" },
    { name: "Kevin Yakob", pos: "MF", club: "AGF" },
    { name: "Ibrahim Bayesh", pos: "MF", club: "Al-Dhafra" },
  ],
  nor: [
    { name: "Martin Ødegaard", pos: "MF", club: "Arsenal", captain: true },
    { name: "Erling Haaland", pos: "FW", club: "Manchester City" },
    { name: "Alexander Sørloth", pos: "FW", club: "Atlético Madrid" },
    { name: "Antonio Nusa", pos: "FW", club: "RB Leipzig" },
    { name: "Oscar Bobb", pos: "FW", club: "Fulham" },
    { name: "Jørgen Strand Larsen", pos: "FW", club: "Crystal Palace" },
    { name: "Sander Berge", pos: "MF", club: "Fulham" },
    { name: "Julian Ryerson", pos: "DF", club: "Borussia Dortmund" },
  ],
  // Group J
  arg: [
    { name: "Lionel Messi", pos: "FW", club: "Inter Miami", captain: true },
    { name: "Lautaro Martínez", pos: "FW", club: "Inter Milan" },
    { name: "Julián Álvarez", pos: "FW", club: "Atlético Madrid" },
    { name: "Enzo Fernández", pos: "MF", club: "Chelsea" },
    { name: "Alexis Mac Allister", pos: "MF", club: "Liverpool" },
    { name: "Rodrigo De Paul", pos: "MF", club: "Inter Miami" },
    { name: "Cristian Romero", pos: "DF", club: "Tottenham Hotspur" },
    { name: "Emiliano Martínez", pos: "GK", club: "Aston Villa" },
  ],
  dza: [
    { name: "Riyad Mahrez", pos: "FW", club: "Al-Ahli", captain: true },
    { name: "Mohamed Amine Amoura", pos: "FW", club: "VfL Wolfsburg" },
    { name: "Amine Gouiri", pos: "FW", club: "Marseille" },
    { name: "Rayan Aït-Nouri", pos: "DF", club: "Manchester City" },
    { name: "Ramy Bensebaini", pos: "DF", club: "Borussia Dortmund" },
    { name: "Aïssa Mandi", pos: "DF", club: "Lille" },
    { name: "Ibrahim Maza", pos: "MF", club: "Bayer Leverkusen" },
    { name: "Luca Zidane", pos: "GK", club: "Granada" },
  ],
  aut: [
    { name: "David Alaba", pos: "DF", club: "Real Madrid", captain: true },
    { name: "Marko Arnautović", pos: "FW", club: "Crvena Zvezda" },
    { name: "Marcel Sabitzer", pos: "MF", club: "Borussia Dortmund" },
    { name: "Konrad Laimer", pos: "MF", club: "Bayern Munich" },
    { name: "Xaver Schlager", pos: "MF", club: "RB Leipzig" },
    { name: "Kevin Danso", pos: "DF", club: "Tottenham Hotspur" },
    { name: "Paul Wanner", pos: "MF", club: "PSV Eindhoven" },
    { name: "Patrick Pentz", pos: "GK", club: "Brøndby" },
  ],
  jor: [
    { name: "Ehsan Haddad", pos: "DF", club: "Al-Hussein" },
    { name: "Mousa Al-Tamari", pos: "FW", club: "Rennes" },
    { name: "Ali Olwan", pos: "FW", club: "Al-Sailiya" },
    { name: "Nizar Al-Rashdan", pos: "MF", club: "Qatar SC" },
    { name: "Noor Al-Rawabdeh", pos: "MF", club: "Selangor" },
    { name: "Yazan Al-Arab", pos: "DF", club: "FC Seoul" },
    { name: "Mohammad Abu Zrayq", pos: "FW", club: "Raja Casablanca" },
    { name: "Yazeed Abulaila", pos: "GK", club: "Al-Hussein" },
  ],
  // Group K
  prt: [
    { name: "Cristiano Ronaldo", pos: "FW", club: "Al Nassr", captain: true },
    { name: "Bruno Fernandes", pos: "MF", club: "Manchester United" },
    { name: "Bernardo Silva", pos: "MF", club: "Manchester City" },
    { name: "Vitinha", pos: "MF", club: "Paris Saint-Germain" },
    { name: "Rafael Leão", pos: "FW", club: "AC Milan" },
    { name: "Rúben Dias", pos: "DF", club: "Manchester City" },
    { name: "Nuno Mendes", pos: "DF", club: "Paris Saint-Germain" },
    { name: "Diogo Costa", pos: "GK", club: "Porto" },
  ],
  cod: [
    { name: "Cédric Bakambu", pos: "FW", club: "Real Betis", captain: true },
    { name: "Chancel Mbemba", pos: "DF", club: "Lille" },
    { name: "Yoane Wissa", pos: "FW", club: "Newcastle United" },
    { name: "Simon Banza", pos: "FW", club: "Al Jazira" },
    { name: "Fiston Mayele", pos: "FW", club: "Pyramids FC" },
    { name: "Aaron Wan-Bissaka", pos: "DF", club: "West Ham United" },
    { name: "Noah Sadiki", pos: "MF", club: "Sunderland" },
    { name: "Arthur Masuaku", pos: "DF", club: "Lens" },
  ],
  uzb: [
    { name: "Eldor Shomurodov", pos: "FW", club: "Istanbul Başakşehir", captain: true },
    { name: "Abdukodir Khusanov", pos: "DF", club: "Manchester City" },
    { name: "Abbosbek Fayzullaev", pos: "MF", club: "Istanbul Başakşehir" },
    { name: "Jaloliddin Masharipov", pos: "MF", club: "Esteghlal" },
    { name: "Otabek Shukurov", pos: "MF", club: "Baniyas" },
    { name: "Igor Sergeev", pos: "FW", club: "Persepolis" },
    { name: "Utkir Yusupov", pos: "GK", club: "Navbahor" },
    { name: "Rustamjon Ashurmatov", pos: "DF", club: "Esteghlal" },
  ],
  col: [
    { name: "James Rodríguez", pos: "MF", club: "Minnesota United", captain: true },
    { name: "Luis Díaz", pos: "FW", club: "Bayern Munich" },
    { name: "Daniel Muñoz", pos: "DF", club: "Crystal Palace" },
    { name: "Davinson Sánchez", pos: "DF", club: "Galatasaray" },
    { name: "Jefferson Lerma", pos: "MF", club: "Crystal Palace" },
    { name: "Richard Ríos", pos: "MF", club: "Benfica" },
    { name: "Jhon Arias", pos: "MF", club: "Palmeiras" },
    { name: "Cucho Hernández", pos: "FW", club: "Real Betis" },
  ],
  // Group L
  eng: [
    { name: "Harry Kane", pos: "FW", club: "Bayern Munich", captain: true },
    { name: "Jude Bellingham", pos: "MF", club: "Real Madrid" },
    { name: "Bukayo Saka", pos: "FW", club: "Arsenal" },
    { name: "Declan Rice", pos: "MF", club: "Arsenal" },
    { name: "John Stones", pos: "DF", club: "Manchester City" },
    { name: "Marc Guéhi", pos: "DF", club: "Manchester City" },
    { name: "Eberechi Eze", pos: "MF", club: "Arsenal" },
    { name: "Jordan Pickford", pos: "GK", club: "Everton" },
  ],
  hrv: [
    { name: "Luka Modrić", pos: "MF", club: "AC Milan", captain: true },
    { name: "Joško Gvardiol", pos: "DF", club: "Manchester City" },
    { name: "Mateo Kovačić", pos: "MF", club: "Manchester City" },
    { name: "Ivan Perišić", pos: "FW", club: "PSV" },
    { name: "Andrej Kramarić", pos: "FW", club: "Hoffenheim" },
    { name: "Mario Pašalić", pos: "MF", club: "Atalanta" },
    { name: "Luka Vušković", pos: "DF", club: "Hamburg" },
    { name: "Dominik Livaković", pos: "GK", club: "Fenerbahçe" },
  ],
  gha: [
    { name: "Jordan Ayew", pos: "FW", club: "Leicester City", captain: true },
    { name: "Thomas Partey", pos: "MF", club: "Villarreal" },
    { name: "Antoine Semenyo", pos: "FW", club: "Manchester City" },
    { name: "Iñaki Williams", pos: "FW", club: "Athletic Club" },
    { name: "Kamaldeen Sulemana", pos: "FW", club: "Atalanta" },
    { name: "Alidu Seidu", pos: "DF", club: "Rennes" },
    { name: "Baba Rahman", pos: "DF", club: "PAOK" },
    { name: "Lawrence Ati-Zigi", pos: "GK", club: "St. Gallen" },
  ],
  pan: [
    { name: "Aníbal Godoy", pos: "MF", club: "San Diego FC", captain: true },
    { name: "Adalberto Carrasquilla", pos: "MF", club: "Pumas UNAM" },
    { name: "Ismael Díaz", pos: "FW", club: "Club León" },
    { name: "José Fajardo", pos: "FW", club: "Universidad Católica" },
    { name: "Cecilio Waterman", pos: "FW", club: "Universidad de Concepción" },
    { name: "José Luis Rodríguez", pos: "MF", club: "FC Juárez" },
    { name: "Michael Amir Murillo", pos: "DF", club: "Marseille" },
    { name: "Orlando Mosquera", pos: "GK", club: "Al-Fayha" },
  ],

};

export function getWcKeyPlayers(
  teamId: string | null | undefined
): WcKeyPlayer[] {
  if (!teamId || !teamId.startsWith("wc-")) return [];
  const iso3 = teamId.slice(3).toLowerCase();
  const raw = WC_KEY_PLAYERS[iso3] ?? [];
  const players = isWcCaptainUnconfirmed(teamId)
    ? raw.map(({ captain: _c, ...p }) => p)
    : raw;
  return selectKeyPlayers(players);
}

/** @deprecated getWcKeyPlayers を使用 */
export function getWcRoster(teamId: string | null | undefined): WcKeyPlayer[] {
  return getWcKeyPlayers(teamId);
}
