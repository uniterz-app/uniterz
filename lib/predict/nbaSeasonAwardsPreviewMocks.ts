/**
 * /dev/season-awards-preview 用モック選手・コーチ・人気ピック
 * 本番は API 名簿 + 他ユーザー選択集計に差し替え
 */

import type {
  NbaAwardCandidate,
  NbaAwardId,
} from "@/lib/predict/nbaSeasonAwardsPredict";

export const AWARDS_PREVIEW_PLAYERS: readonly NbaAwardCandidate[] = [
  { id: "p-jokic", firstName: "Nikola", lastName: "Jokic", teamAbbr: "DEN" },
  { id: "p-shai", firstName: "Shai", lastName: "Gilgeous-Alexander", teamAbbr: "OKC" },
  { id: "p-luka", firstName: "Luka", lastName: "Doncic", teamAbbr: "LAL" },
  { id: "p-giannis", firstName: "Giannis", lastName: "Antetokounmpo", teamAbbr: "MIL" },
  { id: "p-tatum", firstName: "Jayson", lastName: "Tatum", teamAbbr: "BOS" },
  { id: "p-edwards", firstName: "Anthony", lastName: "Edwards", teamAbbr: "MIN" },
  { id: "p-brunson", firstName: "Jalen", lastName: "Brunson", teamAbbr: "NYK" },
  { id: "p-wembanyama", firstName: "Victor", lastName: "Wembanyama", teamAbbr: "SAS" },
  { id: "p-cade", firstName: "Cade", lastName: "Cunningham", teamAbbr: "DET" },
  { id: "p-mitchell", firstName: "Donovan", lastName: "Mitchell", teamAbbr: "CLE" },
  { id: "p-haliburton", firstName: "Tyrese", lastName: "Haliburton", teamAbbr: "IND" },
  { id: "p-maxey", firstName: "Tyrese", lastName: "Maxey", teamAbbr: "PHI" },
  { id: "p-booker", firstName: "Devin", lastName: "Booker", teamAbbr: "PHX" },
  { id: "p-curry", firstName: "Stephen", lastName: "Curry", teamAbbr: "GSW" },
  { id: "p-lebron", firstName: "LeBron", lastName: "James", teamAbbr: "LAL" },
  { id: "p-embiid", firstName: "Joel", lastName: "Embiid", teamAbbr: "PHI" },
  { id: "p-davis", firstName: "Anthony", lastName: "Davis", teamAbbr: "DAL" },
  { id: "p-gobert", firstName: "Rudy", lastName: "Gobert", teamAbbr: "MIN" },
  { id: "p-holmgren", firstName: "Chet", lastName: "Holmgren", teamAbbr: "OKC" },
  { id: "p-amen", firstName: "Amen", lastName: "Thompson", teamAbbr: "HOU" },
  { id: "p-harper", firstName: "Dylan", lastName: "Harper", teamAbbr: "SAS" },
  { id: "p-flage", firstName: "Cooper", lastName: "Flagg", teamAbbr: "DAL" },
  { id: "p-reed", firstName: "Naz", lastName: "Reid", teamAbbr: "MIN" },
  { id: "p-quickley", firstName: "Immanuel", lastName: "Quickley", teamAbbr: "TOR" },
  { id: "p-norman", firstName: "Norman", lastName: "Powell", teamAbbr: "MIA" },
  { id: "p-nid", firstName: "Nickeil", lastName: "Alexander-Walker", teamAbbr: "ATL" },
];

export const AWARDS_PREVIEW_COACHES: readonly NbaAwardCandidate[] = [
  { id: "c-daigneault", firstName: "Mark", lastName: "Daigneault", teamAbbr: "OKC" },
  { id: "c-mazzulla", firstName: "Joe", lastName: "Mazzulla", teamAbbr: "BOS" },
  { id: "c-jenkins", firstName: "Ime", lastName: "Udoka", teamAbbr: "HOU" },
  { id: "c-finch", firstName: "Chris", lastName: "Finch", teamAbbr: "MIN" },
  { id: "c-thibodeau", firstName: "Tom", lastName: "Thibodeau", teamAbbr: "NYK" },
  { id: "c-nurse", firstName: "Nick", lastName: "Nurse", teamAbbr: "PHI" },
];

/** 他ユーザー選択のモック人気順（アワードごと最大 5） */
export const AWARDS_PREVIEW_POPULAR: Record<NbaAwardId, readonly string[]> = {
  mvp: ["p-jokic", "p-shai", "p-luka", "p-giannis", "p-edwards"],
  dpoy: ["p-wembanyama", "p-gobert", "p-holmgren", "p-amen", "p-davis"],
  roy: ["p-flage", "p-harper", "p-wembanyama", "p-cade", "p-amen"],
  mip: ["p-cade", "p-maxey", "p-quickley", "p-reed", "p-brunson"],
  sixth: ["p-reed", "p-norman", "p-quickley", "p-nid", "p-haliburton"],
  coy: ["p-shai", "p-jokic", "p-brunson", "p-luka", "p-edwards"],
  coty: ["c-daigneault", "c-mazzulla", "c-jenkins", "c-finch", "c-nurse"],
};

export function awardsPreviewCatalog(kind: "player" | "coach"): readonly NbaAwardCandidate[] {
  return kind === "coach" ? AWARDS_PREVIEW_COACHES : AWARDS_PREVIEW_PLAYERS;
}
