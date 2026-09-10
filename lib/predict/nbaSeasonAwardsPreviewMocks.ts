/**
 * /dev/season-awards-preview 用モック選手・コーチ
 * 選手の本番名簿は team-rosters。候補5人は `seasonAwardsCuratedPopular`。
 */

import type {
  NbaAwardCandidate,
  NbaAwardId,
} from "@/lib/predict/nbaSeasonAwardsPredict";
import { SEASON_AWARDS_CURATED_POPULAR } from "@/lib/predict/seasonAwardsCuratedPopular";

/** @deprecated オフライン / フェッチ失敗時のフォールバックのみ */
export const AWARDS_PREVIEW_PLAYERS: readonly NbaAwardCandidate[] = [
  { id: "56677822", firstName: "Victor", lastName: "Wembanyama", teamAbbr: "SAS" },
  { id: "175", firstName: "Shai", lastName: "Gilgeous-Alexander", teamAbbr: "OKC" },
  { id: "246", firstName: "Nikola", lastName: "Jokic", teamAbbr: "DEN" },
  { id: "132", firstName: "Luka", lastName: "Doncic", teamAbbr: "LAL" },
  { id: "15", firstName: "Giannis", lastName: "Antetokounmpo", teamAbbr: "MIL" },
  { id: "38017685", firstName: "Chet", lastName: "Holmgren", teamAbbr: "OKC" },
  { id: "56677826", firstName: "Ausar", lastName: "Thompson", teamAbbr: "DET" },
  { id: "176", firstName: "Rudy", lastName: "Gobert", teamAbbr: "MIN" },
  { id: "17896076", firstName: "Evan", lastName: "Mobley", teamAbbr: "CLE" },
  { id: "56677823", firstName: "Brandon", lastName: "Miller", teamAbbr: "CHA" },
  { id: "1057262518", firstName: "Dylan", lastName: "Harper", teamAbbr: "SAS" },
  { id: "3547276", firstName: "Payton", lastName: "Pritchard", teamAbbr: "BOS" },
  { id: "1028029127", firstName: "Kel'el", lastName: "Ware", teamAbbr: "MIA" },
  { id: "1028037477", firstName: "Ajay", lastName: "Mitchell", teamAbbr: "OKC" },
  { id: "419", firstName: "Anfernee", lastName: "Simons", teamAbbr: "BOS" },
  { id: "1028028519", firstName: "Reed", lastName: "Sheppard", teamAbbr: "HOU" },
  { id: "666682", firstName: "Keldon", lastName: "Johnson", teamAbbr: "SAS" },
  { id: "73", firstName: "Jalen", lastName: "Brunson", teamAbbr: "NYK" },
  { id: "115", firstName: "Stephen", lastName: "Curry", teamAbbr: "GSW" },
];

/** BDL にコーチ endpoint が無いため手動名簿（2026-27 HC・運営提供） */
export const AWARDS_PREVIEW_COACHES: readonly NbaAwardCandidate[] = [
  // East
  { id: "c-mazzulla", firstName: "Joe", lastName: "Mazzulla", teamAbbr: "BOS" },
  { id: "c-fernandez", firstName: "Jordi", lastName: "Fernández", teamAbbr: "BKN" },
  { id: "c-brown", firstName: "Mike", lastName: "Brown", teamAbbr: "NYK" },
  { id: "c-nurse", firstName: "Nick", lastName: "Nurse", teamAbbr: "PHI" },
  { id: "c-rajakovic", firstName: "Darko", lastName: "Rajaković", teamAbbr: "TOR" },
  { id: "c-splitter", firstName: "Tiago", lastName: "Splitter", teamAbbr: "CHI" },
  { id: "c-atkinson", firstName: "Kenny", lastName: "Atkinson", teamAbbr: "CLE" },
  { id: "c-bickerstaff", firstName: "J.B.", lastName: "Bickerstaff", teamAbbr: "DET" },
  { id: "c-carlisle", firstName: "Rick", lastName: "Carlisle", teamAbbr: "IND" },
  { id: "c-jenkins", firstName: "Taylor", lastName: "Jenkins", teamAbbr: "MIL" },
  { id: "c-snyder", firstName: "Quin", lastName: "Snyder", teamAbbr: "ATL" },
  { id: "c-lee", firstName: "Charles", lastName: "Lee", teamAbbr: "CHA" },
  { id: "c-spoelstra", firstName: "Erik", lastName: "Spoelstra", teamAbbr: "MIA" },
  { id: "c-sweeney", firstName: "Sean", lastName: "Sweeney", teamAbbr: "ORL" },
  { id: "c-keefe", firstName: "Brian", lastName: "Keefe", teamAbbr: "WAS" },
  // West
  { id: "c-adelman", firstName: "David", lastName: "Adelman", teamAbbr: "DEN" },
  { id: "c-finch", firstName: "Chris", lastName: "Finch", teamAbbr: "MIN" },
  { id: "c-daigneault", firstName: "Mark", lastName: "Daigneault", teamAbbr: "OKC" },
  { id: "c-nori", firstName: "Micah", lastName: "Nori", teamAbbr: "POR" },
  { id: "c-hardy", firstName: "Will", lastName: "Hardy", teamAbbr: "UTA" },
  { id: "c-kerr", firstName: "Steve", lastName: "Kerr", teamAbbr: "GSW" },
  { id: "c-lue", firstName: "Tyronn", lastName: "Lue", teamAbbr: "LAC" },
  { id: "c-redick", firstName: "JJ", lastName: "Redick", teamAbbr: "LAL" },
  { id: "c-ott", firstName: "Jordan", lastName: "Ott", teamAbbr: "PHX" },
  { id: "c-christie", firstName: "Doug", lastName: "Christie", teamAbbr: "SAC" },
  { id: "c-may", firstName: "Dusty", lastName: "May", teamAbbr: "DAL" },
  { id: "c-udoka", firstName: "Ime", lastName: "Udoka", teamAbbr: "HOU" },
  { id: "c-iisalo", firstName: "Tuomas", lastName: "Iisalo", teamAbbr: "MEM" },
  { id: "c-mosley", firstName: "Jamahl", lastName: "Mosley", teamAbbr: "NOP" },
  { id: "c-johnson", firstName: "Mitch", lastName: "Johnson", teamAbbr: "SAS" },
];

/** @deprecated ロスター draftYear フィルタを使う。オフライン用 */
export const AWARDS_PREVIEW_ROOKIES: readonly NbaAwardCandidate[] = [
  { id: "1091339280", firstName: "Cameron", lastName: "Boozer", teamAbbr: "MEM" },
  { id: "1091343852", firstName: "Caleb", lastName: "Wilson", teamAbbr: "CHI" },
  { id: "1091342427", firstName: "Darryn", lastName: "Peterson", teamAbbr: "UTA" },
  { id: "1091340077", firstName: "AJ", lastName: "Dybantsa", teamAbbr: "WAS" },
  { id: "1091338860", firstName: "Darius", lastName: "Acuff Jr.", teamAbbr: "SAC" },
];

/** @deprecated → `SEASON_AWARDS_CURATED_POPULAR` */
export const AWARDS_PREVIEW_POPULAR: Record<NbaAwardId, readonly string[]> =
  SEASON_AWARDS_CURATED_POPULAR;

export type AwardsPreviewCatalogKind = "player" | "coach" | "rookie";

export function awardsPreviewCatalog(
  kind: AwardsPreviewCatalogKind
): readonly NbaAwardCandidate[] {
  if (kind === "coach") return AWARDS_PREVIEW_COACHES;
  if (kind === "rookie") return AWARDS_PREVIEW_ROOKIES;
  return AWARDS_PREVIEW_PLAYERS;
}

/** オフライン用。本番 UI は `seasonAwardsCatalogForAward` + ロスター */
export function awardsPreviewCatalogForAward(
  awardId: NbaAwardId
): readonly NbaAwardCandidate[] {
  if (awardId === "coty") return AWARDS_PREVIEW_COACHES;
  if (awardId === "roy") return AWARDS_PREVIEW_ROOKIES;
  return AWARDS_PREVIEW_PLAYERS;
}
