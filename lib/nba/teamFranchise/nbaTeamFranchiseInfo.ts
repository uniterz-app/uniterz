/**
 * チーム詳細 TEAM INFORMATION — 静的フランチャイズ情報。
 *
 * 正（2026-09 照合）:
 * - HC: Basketball-Reference `NBA_2027_coaches` + 各 coach Transactions
 * - フロント（generalManager 欄）: BBR Executives Directory の
 *   「player personnel decisions」担当（多くは POBO / President。肩書き GM とは限らない）
 * - 優勝: BBR NBA & ABA Champions
 *
 * HC / フロント / オーナーは人事で変わるので asOf を更新する。
 */
import { nbaConferenceForTeam, type NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";
import {
  getNbaTeamGeo,
  NBA_DIVISION_LABEL,
  type NbaDivisionId,
} from "@/lib/nba/nbaTeamUsGeo";
import { teamColorsNBA } from "@/lib/teams-nba";

export type NbaTeamFranchiseInfo = {
  teamId: string;
  /** 本拠地シティ（表示用英語名） */
  city: string;
  arena: string;
  headCoach: string;
  /** HC 就任年（カレンダー年 · BBR Transactions） */
  headCoachSinceYear: number;
  /**
   * BBR Executives Directory の人事責任者（POBO / President / GM）。
   * 肩書きが GM でない場合もある。
   */
  generalManager: string;
  /** 上記就任年（BBR の在籍レンジ先頭年） */
  generalManagerSinceYear: number;
  owner: string;
  /** フランチャイズ創設年（NBA 加盟前の歴史含む） */
  foundedYear: number;
  /** 旧名。無ければ空 */
  formerNames: readonly string[];
  /** NBA 優勝回数（フランチャイズ通算） */
  championships: number;
  /** 直近優勝シーズンキー。未優勝は null */
  lastChampionshipSeasonKey: string | null;
  mascot: string | null;
};

export type NbaTeamFranchiseResolved = NbaTeamFranchiseInfo & {
  conference: NbaConferenceId;
  division: NbaDivisionId;
  divisionLabel: { ja: string; en: string };
  colors: { primary: string; secondary: string | null };
};

/** スナップショット時点（フロント更新の目安） */
export const NBA_TEAM_FRANCHISE_INFO_AS_OF = "2026-27";

const BY_ID: Record<string, NbaTeamFranchiseInfo> = {
  "nba-hawks": {
    teamId: "nba-hawks",
    city: "Atlanta",
    arena: "State Farm Arena",
    headCoach: "Quin Snyder",
    headCoachSinceYear: 2023,
    generalManager: "Onsi Saleh",
    generalManagerSinceYear: 2025,
    owner: "Tony Ressler",
    foundedYear: 1946,
    formerNames: ["Tri-Cities Blackhawks", "Milwaukee Hawks", "St. Louis Hawks"],
    championships: 1,
    lastChampionshipSeasonKey: "1957-58",
    mascot: "Harry the Hawk",
  },
  "nba-celtics": {
    teamId: "nba-celtics",
    city: "Boston",
    arena: "TD Garden",
    headCoach: "Joe Mazzulla",
    headCoachSinceYear: 2023,
    generalManager: "Brad Stevens",
    generalManagerSinceYear: 2021,
    owner: "Wyc Grousbeck (Boston Basketball Partners)",
    foundedYear: 1946,
    formerNames: [],
    championships: 18,
    lastChampionshipSeasonKey: "2023-24",
    mascot: "Lucky the Leprechaun",
  },
  "nba-nets": {
    teamId: "nba-nets",
    city: "Brooklyn",
    arena: "Barclays Center",
    headCoach: "Jordi Fernández",
    headCoachSinceYear: 2024,
    generalManager: "Sean Marks",
    generalManagerSinceYear: 2016,
    owner: "Joe Tsai",
    foundedYear: 1967,
    formerNames: ["New Jersey Nets", "New York Nets"],
    championships: 0,
    lastChampionshipSeasonKey: null,
    mascot: "BrooklyKnight",
  },
  "nba-hornets": {
    teamId: "nba-hornets",
    city: "Charlotte",
    arena: "Spectrum Center",
    headCoach: "Charles Lee",
    headCoachSinceYear: 2024,
    generalManager: "Jeff Peterson",
    generalManagerSinceYear: 2024,
    owner: "Gabe Plotkin & Rick Schnall",
    foundedYear: 1988,
    formerNames: ["Charlotte Bobcats"],
    championships: 0,
    lastChampionshipSeasonKey: null,
    mascot: "Hugo the Hornet",
  },
  "nba-bulls": {
    teamId: "nba-bulls",
    city: "Chicago",
    arena: "United Center",
    headCoach: "Tiago Splitter",
    headCoachSinceYear: 2026,
    generalManager: "Bryson Graham",
    generalManagerSinceYear: 2026,
    owner: "Jerry Reinsdorf",
    foundedYear: 1966,
    formerNames: [],
    championships: 6,
    lastChampionshipSeasonKey: "1997-98",
    mascot: "Benny the Bull",
  },
  "nba-cavaliers": {
    teamId: "nba-cavaliers",
    city: "Cleveland",
    arena: "Rocket Mortgage FieldHouse",
    headCoach: "Kenny Atkinson",
    headCoachSinceYear: 2024,
    generalManager: "Koby Altman",
    generalManagerSinceYear: 2017,
    owner: "Dan Gilbert",
    foundedYear: 1970,
    formerNames: [],
    championships: 1,
    lastChampionshipSeasonKey: "2015-16",
    mascot: "Moondog",
  },
  "nba-mavericks": {
    teamId: "nba-mavericks",
    city: "Dallas",
    arena: "American Airlines Center",
    headCoach: "Dusty May",
    headCoachSinceYear: 2026,
    generalManager: "Masai Ujiri",
    generalManagerSinceYear: 2026,
    owner: "Miriam Adelson / Patrick Dumont",
    foundedYear: 1980,
    formerNames: [],
    championships: 1,
    lastChampionshipSeasonKey: "2010-11",
    mascot: "Champ",
  },
  "nba-nuggets": {
    teamId: "nba-nuggets",
    city: "Denver",
    arena: "Ball Arena",
    headCoach: "David Adelman",
    headCoachSinceYear: 2025,
    generalManager: "Ben Tenzer",
    generalManagerSinceYear: 2025,
    owner: "Ann Walton Kroenke",
    foundedYear: 1967,
    formerNames: ["Denver Rockets"],
    championships: 1,
    lastChampionshipSeasonKey: "2022-23",
    mascot: "Rocky the Mountain Lion",
  },
  "nba-pistons": {
    teamId: "nba-pistons",
    city: "Detroit",
    arena: "Little Caesars Arena",
    headCoach: "J.B. Bickerstaff",
    headCoachSinceYear: 2024,
    generalManager: "Trajan Langdon",
    generalManagerSinceYear: 2024,
    owner: "Tom Gores",
    foundedYear: 1941,
    formerNames: ["Fort Wayne Pistons"],
    championships: 3,
    lastChampionshipSeasonKey: "2003-04",
    mascot: "Hooper",
  },
  "nba-warriors": {
    teamId: "nba-warriors",
    city: "San Francisco",
    arena: "Chase Center",
    headCoach: "Steve Kerr",
    headCoachSinceYear: 2014,
    generalManager: "Mike Dunleavy Jr.",
    generalManagerSinceYear: 2023,
    owner: "Joe Lacob & Peter Guber",
    foundedYear: 1946,
    formerNames: ["Philadelphia Warriors", "San Francisco Warriors"],
    championships: 7,
    lastChampionshipSeasonKey: "2021-22",
    mascot: null,
  },
  "nba-rockets": {
    teamId: "nba-rockets",
    city: "Houston",
    arena: "Toyota Center",
    headCoach: "Ime Udoka",
    headCoachSinceYear: 2023,
    generalManager: "Rafael Stone",
    generalManagerSinceYear: 2020,
    owner: "Tilman Fertitta",
    foundedYear: 1967,
    formerNames: ["San Diego Rockets"],
    championships: 2,
    lastChampionshipSeasonKey: "1994-95",
    mascot: "Clutch the Bear",
  },
  "nba-pacers": {
    teamId: "nba-pacers",
    city: "Indianapolis",
    arena: "Gainbridge Fieldhouse",
    headCoach: "Rick Carlisle",
    headCoachSinceYear: 2021,
    generalManager: "Kevin Pritchard",
    generalManagerSinceYear: 2017,
    owner: "Herbert Simon",
    foundedYear: 1967,
    formerNames: [],
    championships: 0,
    lastChampionshipSeasonKey: null,
    mascot: "Boomer",
  },
  "nba-clippers": {
    teamId: "nba-clippers",
    city: "Los Angeles",
    arena: "Intuit Dome",
    headCoach: "Tyronn Lue",
    headCoachSinceYear: 2020,
    generalManager: "Lawrence Frank",
    generalManagerSinceYear: 2017,
    owner: "Steve Ballmer",
    foundedYear: 1970,
    formerNames: ["Buffalo Braves", "San Diego Clippers"],
    championships: 0,
    lastChampionshipSeasonKey: null,
    mascot: null,
  },
  "nba-lakers": {
    teamId: "nba-lakers",
    city: "Los Angeles",
    arena: "Crypto.com Arena",
    headCoach: "JJ Redick",
    headCoachSinceYear: 2024,
    generalManager: "Rob Pelinka",
    generalManagerSinceYear: 2019,
    owner: "Jeanie Buss (Buss Family Trusts)",
    foundedYear: 1947,
    formerNames: ["Minneapolis Lakers"],
    championships: 17,
    lastChampionshipSeasonKey: "2019-20",
    mascot: null,
  },
  "nba-grizzlies": {
    teamId: "nba-grizzlies",
    city: "Memphis",
    arena: "FedExForum",
    headCoach: "Tuomas Iisalo",
    headCoachSinceYear: 2025,
    generalManager: "Zach Kleiman",
    generalManagerSinceYear: 2019,
    owner: "Robert Pera",
    foundedYear: 1995,
    formerNames: ["Vancouver Grizzlies"],
    championships: 0,
    lastChampionshipSeasonKey: null,
    mascot: "Grizz",
  },
  "nba-heat": {
    teamId: "nba-heat",
    city: "Miami",
    arena: "Kaseya Center",
    headCoach: "Erik Spoelstra",
    headCoachSinceYear: 2008,
    generalManager: "Pat Riley",
    generalManagerSinceYear: 2008,
    owner: "Micky Arison",
    foundedYear: 1988,
    formerNames: [],
    championships: 3,
    lastChampionshipSeasonKey: "2012-13",
    mascot: "Burnie",
  },
  "nba-bucks": {
    teamId: "nba-bucks",
    city: "Milwaukee",
    arena: "Fiserv Forum",
    headCoach: "Taylor Jenkins",
    headCoachSinceYear: 2026,
    generalManager: "Jon Horst",
    generalManagerSinceYear: 2017,
    owner: "Wes Edens / Jamie Dinan",
    foundedYear: 1968,
    formerNames: [],
    championships: 2,
    lastChampionshipSeasonKey: "2020-21",
    mascot: "Bango",
  },
  "nba-timberwolves": {
    teamId: "nba-timberwolves",
    city: "Minneapolis",
    arena: "Target Center",
    headCoach: "Chris Finch",
    headCoachSinceYear: 2021,
    generalManager: "Tim Connelly",
    generalManagerSinceYear: 2022,
    owner: "Marc Lore & Alex Rodriguez",
    foundedYear: 1989,
    formerNames: [],
    championships: 0,
    lastChampionshipSeasonKey: null,
    mascot: "Crunch the Wolf",
  },
  "nba-pelicans": {
    teamId: "nba-pelicans",
    city: "New Orleans",
    arena: "Smoothie King Center",
    headCoach: "Jamahl Mosley",
    headCoachSinceYear: 2026,
    generalManager: "Joe Dumars",
    generalManagerSinceYear: 2025,
    owner: "Gayle Benson",
    foundedYear: 1988,
    formerNames: ["Charlotte Hornets", "New Orleans Hornets"],
    championships: 0,
    lastChampionshipSeasonKey: null,
    mascot: "Pierre the Pelican",
  },
  "nba-knicks": {
    teamId: "nba-knicks",
    city: "New York",
    arena: "Madison Square Garden",
    headCoach: "Mike Brown",
    headCoachSinceYear: 2025,
    generalManager: "Leon Rose",
    generalManagerSinceYear: 2020,
    owner: "James Dolan (Madison Square Garden Sports)",
    foundedYear: 1946,
    formerNames: [],
    championships: 3,
    lastChampionshipSeasonKey: "2025-26",
    mascot: null,
  },
  "nba-thunder": {
    teamId: "nba-thunder",
    city: "Oklahoma City",
    arena: "Paycom Center",
    headCoach: "Mark Daigneault",
    headCoachSinceYear: 2020,
    generalManager: "Sam Presti",
    generalManagerSinceYear: 2007,
    owner: "Clay Bennett (Professional Basketball Club LLC)",
    foundedYear: 1967,
    formerNames: ["Seattle SuperSonics"],
    championships: 2,
    lastChampionshipSeasonKey: "2024-25",
    mascot: "Rumble the Bison",
  },
  "nba-magic": {
    teamId: "nba-magic",
    city: "Orlando",
    arena: "Kia Center",
    headCoach: "Sean Sweeney",
    headCoachSinceYear: 2026,
    generalManager: "Jeff Weltman",
    generalManagerSinceYear: 2017,
    owner: "RDV Sports (DeVos family)",
    foundedYear: 1989,
    formerNames: [],
    championships: 0,
    lastChampionshipSeasonKey: null,
    mascot: "Stuff the Magic Dragon",
  },
  "nba-76ers": {
    teamId: "nba-76ers",
    city: "Philadelphia",
    arena: "Wells Fargo Center",
    headCoach: "Nick Nurse",
    headCoachSinceYear: 2023,
    generalManager: "Mike Gansey",
    generalManagerSinceYear: 2026,
    owner: "Josh Harris & David Blitzer",
    foundedYear: 1946,
    formerNames: ["Syracuse Nationals"],
    championships: 3,
    lastChampionshipSeasonKey: "1982-83",
    mascot: "Franklin the Dog",
  },
  "nba-suns": {
    teamId: "nba-suns",
    city: "Phoenix",
    arena: "Mortgage Matchup Center",
    headCoach: "Jordan Ott",
    headCoachSinceYear: 2025,
    generalManager: "Brian Gregory",
    generalManagerSinceYear: 2025,
    owner: "Mat Ishbia",
    foundedYear: 1968,
    formerNames: [],
    championships: 0,
    lastChampionshipSeasonKey: null,
    mascot: "The Suns Gorilla",
  },
  "nba-blazers": {
    teamId: "nba-blazers",
    city: "Portland",
    arena: "Moda Center",
    headCoach: "Micah Nori",
    headCoachSinceYear: 2026,
    generalManager: "Joe Cronin",
    generalManagerSinceYear: 2021,
    owner: "Jody Allen (Vulcan Inc.)",
    foundedYear: 1970,
    formerNames: [],
    championships: 1,
    lastChampionshipSeasonKey: "1976-77",
    mascot: "Blaze the Trail Cat",
  },
  "nba-kings": {
    teamId: "nba-kings",
    city: "Sacramento",
    arena: "Golden 1 Center",
    headCoach: "Doug Christie",
    headCoachSinceYear: 2024,
    generalManager: "Scott Perry",
    generalManagerSinceYear: 2025,
    owner: "Vivek Ranadivé",
    foundedYear: 1923,
    formerNames: [
      "Rochester Royals",
      "Cincinnati Royals",
      "Kansas City-Omaha Kings",
      "Kansas City Kings",
    ],
    championships: 1,
    lastChampionshipSeasonKey: "1950-51",
    mascot: "Slamson the Lion",
  },
  "nba-spurs": {
    teamId: "nba-spurs",
    city: "San Antonio",
    arena: "Frost Bank Center",
    headCoach: "Mitch Johnson",
    headCoachSinceYear: 2025,
    generalManager: "Brian Wright",
    generalManagerSinceYear: 2019,
    owner: "Peter Holt (Spurs Sports & Entertainment)",
    foundedYear: 1967,
    formerNames: ["Dallas Chaparrals", "Texas Chaparrals"],
    championships: 5,
    lastChampionshipSeasonKey: "2013-14",
    mascot: "The Coyote",
  },
  "nba-raptors": {
    teamId: "nba-raptors",
    city: "Toronto",
    arena: "Scotiabank Arena",
    headCoach: "Darko Rajaković",
    headCoachSinceYear: 2023,
    generalManager: "Bobby Webster",
    generalManagerSinceYear: 2025,
    owner: "Maple Leaf Sports & Entertainment",
    foundedYear: 1995,
    formerNames: [],
    championships: 1,
    lastChampionshipSeasonKey: "2018-19",
    mascot: "The Raptor",
  },
  "nba-jazz": {
    teamId: "nba-jazz",
    city: "Salt Lake City",
    arena: "Delta Center",
    headCoach: "Will Hardy",
    headCoachSinceYear: 2022,
    generalManager: "Danny Ainge",
    generalManagerSinceYear: 2021,
    owner: "Ryan Smith",
    foundedYear: 1974,
    formerNames: ["New Orleans Jazz"],
    championships: 0,
    lastChampionshipSeasonKey: null,
    mascot: "Jazz Bear",
  },
  "nba-wizards": {
    teamId: "nba-wizards",
    city: "Washington",
    arena: "Capital One Arena",
    headCoach: "Brian Keefe",
    headCoachSinceYear: 2024,
    generalManager: "Michael Winger",
    generalManagerSinceYear: 2023,
    owner: "Ted Leonsis (Monumental Sports & Entertainment)",
    foundedYear: 1961,
    formerNames: [
      "Chicago Packers",
      "Chicago Zephyrs",
      "Baltimore Bullets",
      "Washington Bullets",
    ],
    championships: 1,
    lastChampionshipSeasonKey: "1977-78",
    mascot: "G-Wiz",
  },
};

function normalizeTeamId(raw: string): string {
  const id = String(raw ?? "").trim().toLowerCase();
  if (!id) return "";
  return id.startsWith("nba-") ? id : `nba-${id}`;
}

export function getNbaTeamFranchiseInfo(
  rawTeamId: string
): NbaTeamFranchiseResolved | null {
  const teamId = normalizeTeamId(rawTeamId);
  const base = BY_ID[teamId];
  if (!base) return null;
  const geo = getNbaTeamGeo(teamId);
  const conference = nbaConferenceForTeam(teamId);
  if (!geo || !conference) return null;
  const colors = teamColorsNBA[teamId];
  return {
    ...base,
    conference,
    division: geo.division,
    divisionLabel: NBA_DIVISION_LABEL[geo.division],
    colors: {
      primary: colors?.primary ?? "#888888",
      secondary: colors?.secondary ?? null,
    },
  };
}

/** 優勝シーズンキー → 表示用（例: 2023-24 → 2024） */
export function formatChampionshipSeasonLabel(
  seasonKey: string | null | undefined
): string | null {
  if (!seasonKey) return null;
  const m = /^(\d{4})-(\d{2})$/.exec(seasonKey.trim());
  if (!m) return seasonKey;
  const end = Number(m[1]) + 1;
  return String(end);
}
