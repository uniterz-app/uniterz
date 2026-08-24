/**
 * ユーザー提供の賞ごとシーズン勝者 → プレイヤー詳細 AWARDS。
 * 取り込まれた賞（INGESTED）だけを上書き。未取込の賞は触らない。
 */
import {
  NBA_PLAYER_AWARD_CATALOG,
  NBA_PLAYER_AWARD_LABEL_BY_ID,
  type NbaPlayerAwardId,
} from "@/lib/nba/playerAwards/nbaPlayerAwardCatalog";
import type { NbaPlayerAward } from "@/lib/predict/nbaPlayerDetailPreviewMocks";

/** シーズンキー（例: 2024-25）とその賞の受賞者 */
export type NbaPlayerAwardSeasonWinner = {
  seasonKey: string;
  /** BDL player id */
  playerId: string;
  /** 突合用（英語） */
  playerName: string;
};

/**
 * 取り込み済みの賞。ここに入った id はシードの偽データを消し、
 * シーズン勝者集計で count を確定する。
 */
export const NBA_PLAYER_AWARDS_INGESTED: readonly NbaPlayerAwardId[] = [
  "mvp",
  "fmvp",
  "dpoy",
  "roy",
  "mip",
  "smoy",
  "clutch",
  "scoring_champ",
  "ast_champ",
  "reb_champ",
  "stl_champ",
  "blk_champ",
  "all_star",
  "all_nba_1st",
  "all_nba_2nd",
  "all_nba_3rd",
  "all_def_1st",
  "all_def_2nd",
  "all_rookie_1st",
  "all_rookie_2nd",
  "nba_cup_mvp",
  "conf_finals_mvp",
] as const;

/** MVP（2008-09〜2025-26・アクティブ勢カバー用） */
export const NBA_MVP_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] = [
  { seasonKey: "2008-09", playerId: "237", playerName: "LeBron James" },
  { seasonKey: "2009-10", playerId: "237", playerName: "LeBron James" },
  { seasonKey: "2010-11", playerId: "380", playerName: "Derrick Rose" },
  { seasonKey: "2011-12", playerId: "237", playerName: "LeBron James" },
  { seasonKey: "2012-13", playerId: "237", playerName: "LeBron James" },
  { seasonKey: "2013-14", playerId: "140", playerName: "Kevin Durant" },
  { seasonKey: "2014-15", playerId: "115", playerName: "Stephen Curry" },
  { seasonKey: "2015-16", playerId: "115", playerName: "Stephen Curry" },
  { seasonKey: "2016-17", playerId: "472", playerName: "Russell Westbrook" },
  { seasonKey: "2017-18", playerId: "192", playerName: "James Harden" },
  { seasonKey: "2018-19", playerId: "15", playerName: "Giannis Antetokounmpo" },
  { seasonKey: "2019-20", playerId: "15", playerName: "Giannis Antetokounmpo" },
  { seasonKey: "2020-21", playerId: "246", playerName: "Nikola Jokic" },
  { seasonKey: "2021-22", playerId: "246", playerName: "Nikola Jokic" },
  { seasonKey: "2022-23", playerId: "145", playerName: "Joel Embiid" },
  { seasonKey: "2023-24", playerId: "246", playerName: "Nikola Jokic" },
  { seasonKey: "2024-25", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
  { seasonKey: "2025-26", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
] as const;

/**
 * Finals MVP（現役のみ）。
 * Champion は別賞 — 優勝チーム全員ではなく FMVP 受賞者のみ。
 */
export const NBA_FMVP_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] = [
  { seasonKey: "2011-12", playerId: "237", playerName: "LeBron James" },
  { seasonKey: "2012-13", playerId: "237", playerName: "LeBron James" },
  { seasonKey: "2013-14", playerId: "274", playerName: "Kawhi Leonard" },
  { seasonKey: "2015-16", playerId: "237", playerName: "LeBron James" },
  { seasonKey: "2016-17", playerId: "140", playerName: "Kevin Durant" },
  { seasonKey: "2017-18", playerId: "140", playerName: "Kevin Durant" },
  { seasonKey: "2018-19", playerId: "274", playerName: "Kawhi Leonard" },
  { seasonKey: "2019-20", playerId: "237", playerName: "LeBron James" },
  { seasonKey: "2020-21", playerId: "15", playerName: "Giannis Antetokounmpo" },
  { seasonKey: "2021-22", playerId: "115", playerName: "Stephen Curry" },
  { seasonKey: "2022-23", playerId: "246", playerName: "Nikola Jokic" },
  { seasonKey: "2023-24", playerId: "70", playerName: "Jaylen Brown" },
  { seasonKey: "2024-25", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
  { seasonKey: "2025-26", playerId: "666581", playerName: "Jalen Brunson" },
] as const;

/** DPOY（現役のみ） */
export const NBA_DPOY_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] = [
  { seasonKey: "2014-15", playerId: "274", playerName: "Kawhi Leonard" },
  { seasonKey: "2015-16", playerId: "274", playerName: "Kawhi Leonard" },
  { seasonKey: "2016-17", playerId: "185", playerName: "Draymond Green" },
  { seasonKey: "2017-18", playerId: "177", playerName: "Rudy Gobert" },
  { seasonKey: "2018-19", playerId: "177", playerName: "Rudy Gobert" },
  { seasonKey: "2019-20", playerId: "15", playerName: "Giannis Antetokounmpo" },
  { seasonKey: "2020-21", playerId: "177", playerName: "Rudy Gobert" },
  { seasonKey: "2021-22", playerId: "401", playerName: "Marcus Smart" },
  { seasonKey: "2022-23", playerId: "666457", playerName: "Jaren Jackson Jr." },
  { seasonKey: "2023-24", playerId: "177", playerName: "Rudy Gobert" },
  { seasonKey: "2024-25", playerId: "666847", playerName: "Evan Mobley" },
  { seasonKey: "2025-26", playerId: "666861", playerName: "Victor Wembanyama" },
] as const;

/** ROY（現役のみ・各1回） */
export const NBA_ROY_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] = [
  { seasonKey: "2003-04", playerId: "237", playerName: "LeBron James" },
  { seasonKey: "2005-06", playerId: "293", playerName: "Chris Paul" },
  { seasonKey: "2007-08", playerId: "140", playerName: "Kevin Durant" },
  { seasonKey: "2011-12", playerId: "228", playerName: "Kyrie Irving" },
  { seasonKey: "2012-13", playerId: "278", playerName: "Damian Lillard" },
  { seasonKey: "2014-15", playerId: "475", playerName: "Andrew Wiggins" },
  { seasonKey: "2015-16", playerId: "447", playerName: "Karl-Anthony Towns" },
  { seasonKey: "2016-17", playerId: "55", playerName: "Malcolm Brogdon" },
  { seasonKey: "2018-19", playerId: "132", playerName: "Luka Doncic" },
  { seasonKey: "2019-20", playerId: "666458", playerName: "Ja Morant" },
  { seasonKey: "2020-21", playerId: "666860", playerName: "LaMelo Ball" },
  { seasonKey: "2021-22", playerId: "666859", playerName: "Scottie Barnes" },
  { seasonKey: "2022-23", playerId: "666858", playerName: "Paolo Banchero" },
  { seasonKey: "2023-24", playerId: "666861", playerName: "Victor Wembanyama" },
  { seasonKey: "2024-25", playerId: "17896080", playerName: "Stephon Castle" },
  { seasonKey: "2025-26", playerId: "17896081", playerName: "Cooper Flagg" },
] as const;

/** MIP（現役のみ・各1回） */
export const NBA_MIP_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] = [
  { seasonKey: "2010-11", playerId: "279", playerName: "Kevin Love" },
  { seasonKey: "2012-13", playerId: "172", playerName: "Paul George" },
  { seasonKey: "2014-15", playerId: "79", playerName: "Jimmy Butler" },
  { seasonKey: "2015-16", playerId: "308", playerName: "CJ McCollum" },
  { seasonKey: "2016-17", playerId: "15", playerName: "Giannis Antetokounmpo" },
  { seasonKey: "2018-19", playerId: "419", playerName: "Pascal Siakam" },
  { seasonKey: "2019-20", playerId: "222", playerName: "Brandon Ingram" },
  { seasonKey: "2020-21", playerId: "344", playerName: "Julius Randle" },
  { seasonKey: "2021-22", playerId: "666458", playerName: "Ja Morant" },
  { seasonKey: "2022-23", playerId: "290", playerName: "Lauri Markkanen" },
  { seasonKey: "2023-24", playerId: "666852", playerName: "Tyrese Maxey" },
  { seasonKey: "2024-25", playerId: "17896082", playerName: "Dyson Daniels" },
  { seasonKey: "2025-26", playerId: "666400", playerName: "Nickeil Alexander-Walker" },
] as const;

/** Sixth Man（現役のみ） */
export const NBA_SMOY_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] = [
  { seasonKey: "2011-12", playerId: "192", playerName: "James Harden" },
  { seasonKey: "2016-17", playerId: "178", playerName: "Eric Gordon" },
  { seasonKey: "2020-21", playerId: "100", playerName: "Jordan Clarkson" },
  { seasonKey: "2021-22", playerId: "666459", playerName: "Tyler Herro" },
  { seasonKey: "2022-23", playerId: "55", playerName: "Malcolm Brogdon" },
  { seasonKey: "2023-24", playerId: "354", playerName: "Naz Reid" },
  { seasonKey: "2024-25", playerId: "1626179", playerName: "Payton Pritchard" },
  { seasonKey: "2025-26", playerId: "1629647", playerName: "Keldon Johnson" },
] as const;

/** Clutch Player of the Year（2022-23 新設・現役） */
export const NBA_CLUTCH_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] = [
  { seasonKey: "2022-23", playerId: "161", playerName: "De'Aaron Fox" },
  { seasonKey: "2023-24", playerId: "115", playerName: "Stephen Curry" },
  { seasonKey: "2024-25", playerId: "666581", playerName: "Jalen Brunson" },
  { seasonKey: "2025-26", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
] as const;

/** Scoring Champ / 得点王（現役のみ） */
export const NBA_SCORING_CHAMP_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    { seasonKey: "2005-06", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2007-08", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2009-10", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2010-11", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2011-12", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2013-14", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2014-15", playerId: "472", playerName: "Russell Westbrook" },
    { seasonKey: "2015-16", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2016-17", playerId: "472", playerName: "Russell Westbrook" },
    { seasonKey: "2017-18", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2018-19", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2019-20", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2020-21", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2021-22", playerId: "666849", playerName: "Trae Young" },
    { seasonKey: "2022-23", playerId: "145", playerName: "Joel Embiid" },
    { seasonKey: "2023-24", playerId: "132", playerName: "Luka Doncic" },
    { seasonKey: "2024-25", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
    { seasonKey: "2025-26", playerId: "132", playerName: "Luka Doncic" },
  ] as const;

/**
 * Assist Champ / アシスト王（2003-04〜・現役のみ）。
 * 省略: Kidd / Nash / Rondo / Vasquez / Wall。
 */
export const NBA_AST_CHAMP_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    { seasonKey: "2007-08", playerId: "293", playerName: "Chris Paul" },
    { seasonKey: "2008-09", playerId: "293", playerName: "Chris Paul" },
    { seasonKey: "2014-15", playerId: "293", playerName: "Chris Paul" },
    { seasonKey: "2016-17", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2017-18", playerId: "472", playerName: "Russell Westbrook" },
    { seasonKey: "2018-19", playerId: "472", playerName: "Russell Westbrook" },
    { seasonKey: "2019-20", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2020-21", playerId: "472", playerName: "Russell Westbrook" },
    { seasonKey: "2021-22", playerId: "666849", playerName: "Trae Young" },
    { seasonKey: "2022-23", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2023-24", playerId: "666850", playerName: "Tyrese Haliburton" },
    { seasonKey: "2024-25", playerId: "666849", playerName: "Trae Young" },
    { seasonKey: "2025-26", playerId: "246", playerName: "Nikola Jokic" },
  ] as const;

/**
 * Rebound Champ / リバウンド王（2003-04〜・現役のみ）。
 * 省略: Garnett / Marion / Howard / Whiteside。
 * 2005-06 は Shawn Marion（Bob 表記は誤り）。
 */
export const NBA_REB_CHAMP_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    { seasonKey: "2010-11", playerId: "279", playerName: "Kevin Love" },
    { seasonKey: "2013-14", playerId: "250", playerName: "DeAndre Jordan" },
    { seasonKey: "2014-15", playerId: "250", playerName: "DeAndre Jordan" },
    { seasonKey: "2015-16", playerId: "135", playerName: "Andre Drummond" },
    { seasonKey: "2017-18", playerId: "135", playerName: "Andre Drummond" },
    { seasonKey: "2018-19", playerId: "135", playerName: "Andre Drummond" },
    { seasonKey: "2019-20", playerId: "135", playerName: "Andre Drummond" },
    { seasonKey: "2020-21", playerId: "83", playerName: "Clint Capela" },
    { seasonKey: "2021-22", playerId: "177", playerName: "Rudy Gobert" },
    { seasonKey: "2022-23", playerId: "382", playerName: "Domantas Sabonis" },
    { seasonKey: "2023-24", playerId: "382", playerName: "Domantas Sabonis" },
    { seasonKey: "2024-25", playerId: "382", playerName: "Domantas Sabonis" },
    { seasonKey: "2025-26", playerId: "1642269", playerName: "Donovan Clingan" },
  ] as const;

/**
 * Steal Champ / スティール王（2003-04〜・現役のみ）。
 * 省略: Baron Davis / Iverson / Wallace / Rondo / Rubio / Wall。
 * 2023-24 は Fox / SGA 同率。
 */
export const NBA_STL_CHAMP_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    { seasonKey: "2007-08", playerId: "293", playerName: "Chris Paul" },
    { seasonKey: "2008-09", playerId: "293", playerName: "Chris Paul" },
    { seasonKey: "2010-11", playerId: "293", playerName: "Chris Paul" },
    { seasonKey: "2011-12", playerId: "293", playerName: "Chris Paul" },
    { seasonKey: "2012-13", playerId: "293", playerName: "Chris Paul" },
    { seasonKey: "2014-15", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2015-16", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2017-18", playerId: "357", playerName: "Victor Oladipo" },
    { seasonKey: "2018-19", playerId: "172", playerName: "Paul George" },
    { seasonKey: "2019-20", playerId: "417", playerName: "Ben Simmons" },
    { seasonKey: "2020-21", playerId: "304", playerName: "T.J. McConnell" },
    { seasonKey: "2021-22", playerId: "17896093", playerName: "Dejounte Murray" },
    { seasonKey: "2022-23", playerId: "17896096", playerName: "OG Anunoby" },
    { seasonKey: "2023-24", playerId: "161", playerName: "De'Aaron Fox" },
    { seasonKey: "2023-24", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
    { seasonKey: "2024-25", playerId: "17896082", playerName: "Dyson Daniels" },
    { seasonKey: "2025-26", playerId: "17896092", playerName: "Ausar Thompson" },
  ] as const;

/**
 * Block Champ / ブロック王（2003-04〜・現役のみ）。
 * 省略: Ratliff / Camby / Kirilenko / Howard / Ibaka / Whiteside。
 */
export const NBA_BLK_CHAMP_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    { seasonKey: "2013-14", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2014-15", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2016-17", playerId: "177", playerName: "Rudy Gobert" },
    { seasonKey: "2017-18", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2018-19", playerId: "448", playerName: "Myles Turner" },
    { seasonKey: "2020-21", playerId: "448", playerName: "Myles Turner" },
    { seasonKey: "2021-22", playerId: "666457", playerName: "Jaren Jackson Jr." },
    { seasonKey: "2022-23", playerId: "284", playerName: "Brook Lopez" },
    { seasonKey: "2023-24", playerId: "666861", playerName: "Victor Wembanyama" },
    { seasonKey: "2024-25", playerId: "666861", playerName: "Victor Wembanyama" },
    { seasonKey: "2025-26", playerId: "666861", playerName: "Victor Wembanyama" },
  ] as const;

/**
 * All-NBA First Team（2005-06〜2025-26）。
 * 現役のみ格納（引退勢は省略）。1シーズン最大5人のうち現役分だけ行を持つ。
 */
export const NBA_ALL_NBA_1ST_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    // 2005-06
    { seasonKey: "2005-06", playerId: "237", playerName: "LeBron James" },
    // 2007-08
    { seasonKey: "2007-08", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2007-08", playerId: "293", playerName: "Chris Paul" },
    // 2008-09
    { seasonKey: "2008-09", playerId: "237", playerName: "LeBron James" },
    // 2009-10
    { seasonKey: "2009-10", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2009-10", playerId: "140", playerName: "Kevin Durant" },
    // 2010-11
    { seasonKey: "2010-11", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2010-11", playerId: "140", playerName: "Kevin Durant" },
    // 2011-12
    { seasonKey: "2011-12", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2011-12", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2011-12", playerId: "293", playerName: "Chris Paul" },
    // 2012-13
    { seasonKey: "2012-13", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2012-13", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2012-13", playerId: "293", playerName: "Chris Paul" },
    // 2013-14
    { seasonKey: "2013-14", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2013-14", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2013-14", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2013-14", playerId: "293", playerName: "Chris Paul" },
    // 2014-15
    { seasonKey: "2014-15", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2014-15", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2014-15", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2014-15", playerId: "192", playerName: "James Harden" },
    // 2015-16
    { seasonKey: "2015-16", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2015-16", playerId: "274", playerName: "Kawhi Leonard" },
    { seasonKey: "2015-16", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2015-16", playerId: "472", playerName: "Russell Westbrook" },
    // 2016-17
    { seasonKey: "2016-17", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2016-17", playerId: "274", playerName: "Kawhi Leonard" },
    { seasonKey: "2016-17", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2016-17", playerId: "472", playerName: "Russell Westbrook" },
    // 2017-18
    { seasonKey: "2017-18", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2017-18", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2017-18", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2017-18", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2017-18", playerId: "278", playerName: "Damian Lillard" },
    // 2018-19
    { seasonKey: "2018-19", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2018-19", playerId: "172", playerName: "Paul George" },
    { seasonKey: "2018-19", playerId: "246", playerName: "Nikola Jokic" },
    { seasonKey: "2018-19", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2018-19", playerId: "115", playerName: "Stephen Curry" },
    // 2019-20
    { seasonKey: "2019-20", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2019-20", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2019-20", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2019-20", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2019-20", playerId: "132", playerName: "Luka Doncic" },
    // 2020-21
    { seasonKey: "2020-21", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2020-21", playerId: "246", playerName: "Nikola Jokic" },
    { seasonKey: "2020-21", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2020-21", playerId: "132", playerName: "Luka Doncic" },
    { seasonKey: "2020-21", playerId: "274", playerName: "Kawhi Leonard" },
    // 2021-22
    { seasonKey: "2021-22", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2021-22", playerId: "246", playerName: "Nikola Jokic" },
    { seasonKey: "2021-22", playerId: "434", playerName: "Jayson Tatum" },
    { seasonKey: "2021-22", playerId: "57", playerName: "Devin Booker" },
    { seasonKey: "2021-22", playerId: "132", playerName: "Luka Doncic" },
    // 2022-23
    { seasonKey: "2022-23", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2022-23", playerId: "434", playerName: "Jayson Tatum" },
    { seasonKey: "2022-23", playerId: "246", playerName: "Nikola Jokic" },
    { seasonKey: "2022-23", playerId: "132", playerName: "Luka Doncic" },
    { seasonKey: "2022-23", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
    // 2023-24
    { seasonKey: "2023-24", playerId: "434", playerName: "Jayson Tatum" },
    { seasonKey: "2023-24", playerId: "70", playerName: "Jaylen Brown" },
    { seasonKey: "2023-24", playerId: "246", playerName: "Nikola Jokic" },
    { seasonKey: "2023-24", playerId: "132", playerName: "Luka Doncic" },
    { seasonKey: "2023-24", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
    // 2024-25
    { seasonKey: "2024-25", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
    { seasonKey: "2024-25", playerId: "246", playerName: "Nikola Jokic" },
    { seasonKey: "2024-25", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2024-25", playerId: "434", playerName: "Jayson Tatum" },
    { seasonKey: "2024-25", playerId: "322", playerName: "Donovan Mitchell" },
    // 2025-26
    { seasonKey: "2025-26", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
    { seasonKey: "2025-26", playerId: "246", playerName: "Nikola Jokic" },
    { seasonKey: "2025-26", playerId: "666861", playerName: "Victor Wembanyama" },
    { seasonKey: "2025-26", playerId: "132", playerName: "Luka Doncic" },
    { seasonKey: "2025-26", playerId: "666421", playerName: "Cade Cunningham" },
  ] as const;

/**
 * All-NBA Second Team（2004-05〜2025-26）。
 * 現役のみ格納。
 */
export const NBA_ALL_NBA_2ND_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    // 2004-05
    { seasonKey: "2004-05", playerId: "237", playerName: "LeBron James" },
    // 2006-07
    { seasonKey: "2006-07", playerId: "237", playerName: "LeBron James" },
    // 2009-10
    { seasonKey: "2009-10", playerId: "140", playerName: "Kevin Durant" },
    // 2011-12
    { seasonKey: "2011-12", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2011-12", playerId: "472", playerName: "Russell Westbrook" },
    // 2012-13
    { seasonKey: "2012-13", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2012-13", playerId: "472", playerName: "Russell Westbrook" },
    // 2013-14
    { seasonKey: "2013-14", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2013-14", playerId: "278", playerName: "Damian Lillard" },
    // 2014-15
    { seasonKey: "2014-15", playerId: "472", playerName: "Russell Westbrook" },
    { seasonKey: "2014-15", playerId: "228", playerName: "Kyrie Irving" },
    // 2015-16
    { seasonKey: "2015-16", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2015-16", playerId: "274", playerName: "Kawhi Leonard" },
    { seasonKey: "2015-16", playerId: "278", playerName: "Damian Lillard" },
    // 2016-17
    { seasonKey: "2016-17", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2016-17", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2016-17", playerId: "177", playerName: "Rudy Gobert" },
    { seasonKey: "2016-17", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2016-17", playerId: "125", playerName: "DeMar DeRozan" },
    // 2017-18
    { seasonKey: "2017-18", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2017-18", playerId: "145", playerName: "Joel Embiid" },
    { seasonKey: "2017-18", playerId: "125", playerName: "DeMar DeRozan" },
    // 2018-19
    { seasonKey: "2018-19", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2018-19", playerId: "145", playerName: "Joel Embiid" },
    { seasonKey: "2018-19", playerId: "228", playerName: "Kyrie Irving" },
    { seasonKey: "2018-19", playerId: "278", playerName: "Damian Lillard" },
    { seasonKey: "2018-19", playerId: "274", playerName: "Kawhi Leonard" },
    // 2019-20
    { seasonKey: "2019-20", playerId: "274", playerName: "Kawhi Leonard" },
    { seasonKey: "2019-20", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2019-20", playerId: "145", playerName: "Joel Embiid" },
    { seasonKey: "2019-20", playerId: "278", playerName: "Damian Lillard" },
    { seasonKey: "2019-20", playerId: "246", playerName: "Nikola Jokic" },
    // 2020-21
    { seasonKey: "2020-21", playerId: "145", playerName: "Joel Embiid" },
    { seasonKey: "2020-21", playerId: "344", playerName: "Julius Randle" },
    { seasonKey: "2020-21", playerId: "278", playerName: "Damian Lillard" },
    { seasonKey: "2020-21", playerId: "132", playerName: "Luka Doncic" },
    { seasonKey: "2020-21", playerId: "115", playerName: "Stephen Curry" },
    // 2021-22
    { seasonKey: "2021-22", playerId: "145", playerName: "Joel Embiid" },
    { seasonKey: "2021-22", playerId: "666458", playerName: "Ja Morant" },
    { seasonKey: "2021-22", playerId: "57", playerName: "Devin Booker" },
    { seasonKey: "2021-22", playerId: "125", playerName: "DeMar DeRozan" },
    { seasonKey: "2021-22", playerId: "115", playerName: "Stephen Curry" },
    // 2022-23
    { seasonKey: "2022-23", playerId: "434", playerName: "Jayson Tatum" },
    { seasonKey: "2022-23", playerId: "79", playerName: "Jimmy Butler" },
    { seasonKey: "2022-23", playerId: "145", playerName: "Joel Embiid" },
    { seasonKey: "2022-23", playerId: "70", playerName: "Jaylen Brown" },
    { seasonKey: "2022-23", playerId: "322", playerName: "Donovan Mitchell" },
    // 2023-24
    { seasonKey: "2023-24", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2023-24", playerId: "666848", playerName: "Anthony Edwards" },
    { seasonKey: "2023-24", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2023-24", playerId: "274", playerName: "Kawhi Leonard" },
    { seasonKey: "2023-24", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
    // 2024-25
    { seasonKey: "2024-25", playerId: "666581", playerName: "Jalen Brunson" },
    { seasonKey: "2024-25", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2024-25", playerId: "666848", playerName: "Anthony Edwards" },
    { seasonKey: "2024-25", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2024-25", playerId: "666847", playerName: "Evan Mobley" },
    // 2025-26
    { seasonKey: "2025-26", playerId: "70", playerName: "Jaylen Brown" },
    { seasonKey: "2025-26", playerId: "274", playerName: "Kawhi Leonard" },
    { seasonKey: "2025-26", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2025-26", playerId: "666581", playerName: "Jalen Brunson" },
    { seasonKey: "2025-26", playerId: "322", playerName: "Donovan Mitchell" },
  ] as const;

/**
 * All-NBA Third Team（2012-13〜2025-26）。
 * 現役のみ格納。
 */
export const NBA_ALL_NBA_3RD_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    // 2010-11（Horford 現役）
    { seasonKey: "2010-11", playerId: "200", playerName: "Al Horford" },
    // 2012-13
    { seasonKey: "2012-13", playerId: "278", playerName: "Damian Lillard" },
    { seasonKey: "2012-13", playerId: "192", playerName: "James Harden" },
    // 2013-14
    { seasonKey: "2013-14", playerId: "172", playerName: "Paul George" },
    { seasonKey: "2013-14", playerId: "278", playerName: "Damian Lillard" },
    // 2014-15
    { seasonKey: "2014-15", playerId: "472", playerName: "Russell Westbrook" },
    { seasonKey: "2014-15", playerId: "443", playerName: "Klay Thompson" },
    // 2015-16
    { seasonKey: "2015-16", playerId: "185", playerName: "Draymond Green" },
    { seasonKey: "2015-16", playerId: "125", playerName: "DeMar DeRozan" },
    { seasonKey: "2015-16", playerId: "443", playerName: "Klay Thompson" },
    { seasonKey: "2015-16", playerId: "228", playerName: "Kyrie Irving" },
    // 2016-17
    { seasonKey: "2016-17", playerId: "177", playerName: "Rudy Gobert" },
    { seasonKey: "2016-17", playerId: "125", playerName: "DeMar DeRozan" },
    { seasonKey: "2016-17", playerId: "278", playerName: "Damian Lillard" },
    { seasonKey: "2016-17", playerId: "228", playerName: "Kyrie Irving" },
    // 2017-18
    { seasonKey: "2017-18", playerId: "79", playerName: "Jimmy Butler" },
    { seasonKey: "2017-18", playerId: "172", playerName: "Paul George" },
    { seasonKey: "2017-18", playerId: "447", playerName: "Karl-Anthony Towns" },
    // 2018-19
    { seasonKey: "2018-19", playerId: "246", playerName: "Nikola Jokic" },
    { seasonKey: "2018-19", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2018-19", playerId: "145", playerName: "Joel Embiid" },
    { seasonKey: "2018-19", playerId: "472", playerName: "Russell Westbrook" },
    // 2019-20
    { seasonKey: "2019-20", playerId: "434", playerName: "Jayson Tatum" },
    { seasonKey: "2019-20", playerId: "177", playerName: "Rudy Gobert" },
    { seasonKey: "2019-20", playerId: "293", playerName: "Chris Paul" },
    { seasonKey: "2019-20", playerId: "472", playerName: "Russell Westbrook" },
    // 2020-21
    { seasonKey: "2020-21", playerId: "344", playerName: "Julius Randle" },
    { seasonKey: "2020-21", playerId: "172", playerName: "Paul George" },
    { seasonKey: "2020-21", playerId: "177", playerName: "Rudy Gobert" },
    { seasonKey: "2020-21", playerId: "79", playerName: "Jimmy Butler" },
    { seasonKey: "2020-21", playerId: "228", playerName: "Kyrie Irving" },
    // 2021-22
    { seasonKey: "2021-22", playerId: "419", playerName: "Pascal Siakam" },
    { seasonKey: "2021-22", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2021-22", playerId: "447", playerName: "Karl-Anthony Towns" },
    { seasonKey: "2021-22", playerId: "666849", playerName: "Trae Young" },
    { seasonKey: "2021-22", playerId: "293", playerName: "Chris Paul" },
    // 2022-23
    { seasonKey: "2022-23", playerId: "70", playerName: "Jaylen Brown" },
    { seasonKey: "2022-23", playerId: "344", playerName: "Julius Randle" },
    { seasonKey: "2022-23", playerId: "382", playerName: "Domantas Sabonis" },
    { seasonKey: "2022-23", playerId: "161", playerName: "De'Aaron Fox" },
    { seasonKey: "2022-23", playerId: "666458", playerName: "Ja Morant" },
    // 2023-24
    { seasonKey: "2023-24", playerId: "666581", playerName: "Jalen Brunson" },
    { seasonKey: "2023-24", playerId: "666848", playerName: "Anthony Edwards" },
    { seasonKey: "2023-24", playerId: "274", playerName: "Kawhi Leonard" },
    { seasonKey: "2023-24", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2023-24", playerId: "382", playerName: "Domantas Sabonis" },
    // 2024-25
    { seasonKey: "2024-25", playerId: "666421", playerName: "Cade Cunningham" },
    { seasonKey: "2024-25", playerId: "666850", playerName: "Tyrese Haliburton" },
    { seasonKey: "2024-25", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2024-25", playerId: "447", playerName: "Karl-Anthony Towns" },
    { seasonKey: "2024-25", playerId: "666903", playerName: "Jalen Williams" },
    // 2025-26
    { seasonKey: "2025-26", playerId: "335", playerName: "Jamal Murray" },
    { seasonKey: "2025-26", playerId: "666852", playerName: "Tyrese Maxey" },
    { seasonKey: "2025-26", playerId: "666862", playerName: "Chet Holmgren" },
    { seasonKey: "2025-26", playerId: "17896070", playerName: "Jalen Duren" },
    { seasonKey: "2025-26", playerId: "17896071", playerName: "Jalen Johnson" },
  ] as const;

/**
 * All-Defensive First Team（現役のみ）。
 */
export const NBA_ALL_DEF_1ST_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    // 2008-09
    { seasonKey: "2008-09", playerId: "237", playerName: "LeBron James" },
    // 2009-10
    { seasonKey: "2009-10", playerId: "237", playerName: "LeBron James" },
    // 2010-11
    { seasonKey: "2010-11", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2010-11", playerId: "293", playerName: "Chris Paul" },
    // 2011-12
    { seasonKey: "2011-12", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2011-12", playerId: "293", playerName: "Chris Paul" },
    // 2012-13
    { seasonKey: "2012-13", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2012-13", playerId: "293", playerName: "Chris Paul" },
    // 2013-14
    { seasonKey: "2013-14", playerId: "172", playerName: "Paul George" },
    { seasonKey: "2013-14", playerId: "293", playerName: "Chris Paul" },
    // 2014-15
    { seasonKey: "2014-15", playerId: "185", playerName: "Draymond Green" },
    { seasonKey: "2014-15", playerId: "274", playerName: "Kawhi Leonard" },
    { seasonKey: "2014-15", playerId: "79", playerName: "Jimmy Butler" },
    // 2015-16
    { seasonKey: "2015-16", playerId: "274", playerName: "Kawhi Leonard" },
    { seasonKey: "2015-16", playerId: "185", playerName: "Draymond Green" },
    // 2016-17
    { seasonKey: "2016-17", playerId: "185", playerName: "Draymond Green" },
    { seasonKey: "2016-17", playerId: "274", playerName: "Kawhi Leonard" },
    { seasonKey: "2016-17", playerId: "177", playerName: "Rudy Gobert" },
    { seasonKey: "2016-17", playerId: "293", playerName: "Chris Paul" },
    // 2017-18
    { seasonKey: "2017-18", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2017-18", playerId: "200", playerName: "Al Horford" },
    { seasonKey: "2017-18", playerId: "210", playerName: "Jrue Holiday" },
    // 2018-19
    { seasonKey: "2018-19", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2018-19", playerId: "172", playerName: "Paul George" },
    { seasonKey: "2018-19", playerId: "177", playerName: "Rudy Gobert" },
    { seasonKey: "2018-19", playerId: "401", playerName: "Marcus Smart" },
    { seasonKey: "2018-19", playerId: "210", playerName: "Jrue Holiday" },
    // 2019-20
    { seasonKey: "2019-20", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2019-20", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2019-20", playerId: "177", playerName: "Rudy Gobert" },
    // 2020-21
    { seasonKey: "2020-21", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2020-21", playerId: "177", playerName: "Rudy Gobert" },
    { seasonKey: "2020-21", playerId: "210", playerName: "Jrue Holiday" },
    { seasonKey: "2020-21", playerId: "79", playerName: "Jimmy Butler" },
    // 2021-22
    { seasonKey: "2021-22", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2021-22", playerId: "666457", playerName: "Jaren Jackson Jr." },
    { seasonKey: "2021-22", playerId: "401", playerName: "Marcus Smart" },
    { seasonKey: "2021-22", playerId: "17896089", playerName: "Mikal Bridges" },
    { seasonKey: "2021-22", playerId: "210", playerName: "Jrue Holiday" },
    // 2022-23
    { seasonKey: "2022-23", playerId: "666457", playerName: "Jaren Jackson Jr." },
    { seasonKey: "2022-23", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2022-23", playerId: "284", playerName: "Brook Lopez" },
    { seasonKey: "2022-23", playerId: "210", playerName: "Jrue Holiday" },
    { seasonKey: "2022-23", playerId: "101", playerName: "Alex Caruso" },
    // 2023-24
    { seasonKey: "2023-24", playerId: "177", playerName: "Rudy Gobert" },
    { seasonKey: "2023-24", playerId: "666861", playerName: "Victor Wembanyama" },
    { seasonKey: "2023-24", playerId: "8", playerName: "Bam Adebayo" },
    { seasonKey: "2023-24", playerId: "17896091", playerName: "Herbert Jones" },
    { seasonKey: "2023-24", playerId: "210", playerName: "Jrue Holiday" },
    // 2024-25
    { seasonKey: "2024-25", playerId: "666847", playerName: "Evan Mobley" },
    { seasonKey: "2024-25", playerId: "185", playerName: "Draymond Green" },
    { seasonKey: "2024-25", playerId: "17896082", playerName: "Dyson Daniels" },
    { seasonKey: "2024-25", playerId: "666903", playerName: "Jalen Williams" },
    { seasonKey: "2024-25", playerId: "101", playerName: "Alex Caruso" },
    // 2025-26
    { seasonKey: "2025-26", playerId: "666861", playerName: "Victor Wembanyama" },
    { seasonKey: "2025-26", playerId: "666862", playerName: "Chet Holmgren" },
    { seasonKey: "2025-26", playerId: "17896092", playerName: "Ausar Thompson" },
    { seasonKey: "2025-26", playerId: "177", playerName: "Rudy Gobert" },
    { seasonKey: "2025-26", playerId: "1628401", playerName: "Derrick White" },
  ] as const;

/**
 * All-Defensive Second Team（現役のみ）。
 * 2021-22 の Bridges 二重記載は1回分のみ。
 */
export const NBA_ALL_DEF_2ND_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    // 2007-08
    { seasonKey: "2007-08", playerId: "293", playerName: "Chris Paul" },
    // 2012-13
    { seasonKey: "2012-13", playerId: "104", playerName: "Mike Conley" },
    // 2013-14
    { seasonKey: "2013-14", playerId: "237", playerName: "LeBron James" },
    // 2014-15
    { seasonKey: "2014-15", playerId: "185", playerName: "Draymond Green" },
    { seasonKey: "2014-15", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2014-15", playerId: "293", playerName: "Chris Paul" },
    // 2015-16
    { seasonKey: "2015-16", playerId: "185", playerName: "Draymond Green" },
    { seasonKey: "2015-16", playerId: "172", playerName: "Paul George" },
    { seasonKey: "2015-16", playerId: "79", playerName: "Jimmy Butler" },
    // 2016-17
    { seasonKey: "2016-17", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2016-17", playerId: "177", playerName: "Rudy Gobert" },
    // 2017-18
    { seasonKey: "2017-18", playerId: "79", playerName: "Jimmy Butler" },
    { seasonKey: "2017-18", playerId: "185", playerName: "Draymond Green" },
    { seasonKey: "2017-18", playerId: "200", playerName: "Al Horford" },
    { seasonKey: "2017-18", playerId: "17896093", playerName: "Dejounte Murray" },
    // 2018-19
    { seasonKey: "2018-19", playerId: "145", playerName: "Joel Embiid" },
    { seasonKey: "2018-19", playerId: "185", playerName: "Draymond Green" },
    { seasonKey: "2018-19", playerId: "448", playerName: "Myles Turner" },
    { seasonKey: "2018-19", playerId: "443", playerName: "Klay Thompson" },
    // 2019-20
    { seasonKey: "2019-20", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2019-20", playerId: "284", playerName: "Brook Lopez" },
    // 2020-21
    { seasonKey: "2020-21", playerId: "8", playerName: "Bam Adebayo" },
    { seasonKey: "2020-21", playerId: "210", playerName: "Jrue Holiday" },
    { seasonKey: "2020-21", playerId: "17896094", playerName: "Matisse Thybulle" },
    { seasonKey: "2020-21", playerId: "17896095", playerName: "Robert Williams III" },
    { seasonKey: "2020-21", playerId: "185", playerName: "Draymond Green" },
    // 2021-22
    { seasonKey: "2021-22", playerId: "8", playerName: "Bam Adebayo" },
    { seasonKey: "2021-22", playerId: "185", playerName: "Draymond Green" },
    { seasonKey: "2021-22", playerId: "17896089", playerName: "Mikal Bridges" },
    { seasonKey: "2021-22", playerId: "401", playerName: "Marcus Smart" },
    // 2022-23
    { seasonKey: "2022-23", playerId: "666457", playerName: "Jaren Jackson Jr." },
    { seasonKey: "2022-23", playerId: "101", playerName: "Alex Caruso" },
    { seasonKey: "2022-23", playerId: "17896096", playerName: "OG Anunoby" },
    { seasonKey: "2022-23", playerId: "17896097", playerName: "Dillon Brooks" },
    { seasonKey: "2022-23", playerId: "185", playerName: "Draymond Green" },
    // 2023-24（提供リストどおり）
    { seasonKey: "2023-24", playerId: "8", playerName: "Bam Adebayo" },
    { seasonKey: "2023-24", playerId: "210", playerName: "Jrue Holiday" },
    { seasonKey: "2023-24", playerId: "17896094", playerName: "Matisse Thybulle" },
    { seasonKey: "2023-24", playerId: "17896095", playerName: "Robert Williams III" },
    { seasonKey: "2023-24", playerId: "185", playerName: "Draymond Green" },
    // 2024-25
    { seasonKey: "2024-25", playerId: "177", playerName: "Rudy Gobert" },
    { seasonKey: "2024-25", playerId: "17896082", playerName: "Dyson Daniels" },
    { seasonKey: "2024-25", playerId: "17896096", playerName: "OG Anunoby" },
    { seasonKey: "2024-25", playerId: "666859", playerName: "Scottie Barnes" },
    { seasonKey: "2024-25", playerId: "8", playerName: "Bam Adebayo" },
    // 2025-26
    { seasonKey: "2025-26", playerId: "8", playerName: "Bam Adebayo" },
    { seasonKey: "2025-26", playerId: "17896096", playerName: "OG Anunoby" },
    { seasonKey: "2025-26", playerId: "666859", playerName: "Scottie Barnes" },
    { seasonKey: "2025-26", playerId: "17896082", playerName: "Dyson Daniels" },
    { seasonKey: "2025-26", playerId: "17896098", playerName: "Cason Wallace" },
  ] as const;

/**
 * All-Rookie First Team（現役のみ・各1回）。
 */
export const NBA_ALL_ROOKIE_1ST_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    { seasonKey: "2003-04", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2005-06", playerId: "293", playerName: "Chris Paul" },
    { seasonKey: "2007-08", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2007-08", playerId: "200", playerName: "Al Horford" },
    { seasonKey: "2008-09", playerId: "472", playerName: "Russell Westbrook" },
    { seasonKey: "2008-09", playerId: "279", playerName: "Kevin Love" },
    { seasonKey: "2009-10", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2011-12", playerId: "228", playerName: "Kyrie Irving" },
    { seasonKey: "2011-12", playerId: "443", playerName: "Klay Thompson" },
    { seasonKey: "2011-12", playerId: "274", playerName: "Kawhi Leonard" },
    { seasonKey: "2012-13", playerId: "278", playerName: "Damian Lillard" },
    { seasonKey: "2012-13", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2012-13", playerId: "37", playerName: "Bradley Beal" },
    { seasonKey: "2012-13", playerId: "135", playerName: "Andre Drummond" },
    { seasonKey: "2013-14", playerId: "17896099", playerName: "Tim Hardaway Jr." },
    { seasonKey: "2014-15", playerId: "475", playerName: "Andrew Wiggins" },
    { seasonKey: "2014-15", playerId: "17896100", playerName: "Bojan Bogdanovic" },
    { seasonKey: "2015-16", playerId: "447", playerName: "Karl-Anthony Towns" },
    { seasonKey: "2015-16", playerId: "17896088", playerName: "Kristaps Porzingis" },
    { seasonKey: "2015-16", playerId: "17896101", playerName: "D'Angelo Russell" },
    { seasonKey: "2015-16", playerId: "57", playerName: "Devin Booker" },
    { seasonKey: "2016-17", playerId: "55", playerName: "Malcolm Brogdon" },
    { seasonKey: "2016-17", playerId: "145", playerName: "Joel Embiid" },
    { seasonKey: "2016-17", playerId: "17896102", playerName: "Buddy Hield" },
    { seasonKey: "2016-17", playerId: "335", playerName: "Jamal Murray" },
    { seasonKey: "2017-18", playerId: "434", playerName: "Jayson Tatum" },
    { seasonKey: "2017-18", playerId: "322", playerName: "Donovan Mitchell" },
    { seasonKey: "2017-18", playerId: "17896103", playerName: "Kyle Kuzma" },
    { seasonKey: "2017-18", playerId: "17896104", playerName: "John Collins" },
    { seasonKey: "2018-19", playerId: "132", playerName: "Luka Doncic" },
    { seasonKey: "2018-19", playerId: "666849", playerName: "Trae Young" },
    { seasonKey: "2018-19", playerId: "17896087", playerName: "Deandre Ayton" },
    { seasonKey: "2018-19", playerId: "666457", playerName: "Jaren Jackson Jr." },
    { seasonKey: "2019-20", playerId: "666458", playerName: "Ja Morant" },
    { seasonKey: "2019-20", playerId: "666863", playerName: "Zion Williamson" },
    { seasonKey: "2020-21", playerId: "666860", playerName: "LaMelo Ball" },
    { seasonKey: "2020-21", playerId: "666848", playerName: "Anthony Edwards" },
    { seasonKey: "2020-21", playerId: "17896105", playerName: "Patrick Williams" },
    { seasonKey: "2021-22", playerId: "666859", playerName: "Scottie Barnes" },
    { seasonKey: "2021-22", playerId: "666421", playerName: "Cade Cunningham" },
    { seasonKey: "2021-22", playerId: "666847", playerName: "Evan Mobley" },
    { seasonKey: "2021-22", playerId: "17896106", playerName: "Jalen Green" },
    { seasonKey: "2021-22", playerId: "17896107", playerName: "Franz Wagner" },
    { seasonKey: "2022-23", playerId: "666858", playerName: "Paolo Banchero" },
    { seasonKey: "2022-23", playerId: "666903", playerName: "Jalen Williams" },
    { seasonKey: "2022-23", playerId: "17896108", playerName: "Benedict Mathurin" },
    { seasonKey: "2022-23", playerId: "1631093", playerName: "Jaden Ivey" },
    { seasonKey: "2022-23", playerId: "17896109", playerName: "Walker Kessler" },
    { seasonKey: "2023-24", playerId: "666861", playerName: "Victor Wembanyama" },
    { seasonKey: "2023-24", playerId: "666862", playerName: "Chet Holmgren" },
    { seasonKey: "2023-24", playerId: "17896110", playerName: "Brandon Miller" },
    { seasonKey: "2023-24", playerId: "17896111", playerName: "Jaime Jaquez Jr." },
    { seasonKey: "2023-24", playerId: "17896112", playerName: "Amen Thompson" },
    { seasonKey: "2024-25", playerId: "17896080", playerName: "Stephon Castle" },
    { seasonKey: "2024-25", playerId: "17896113", playerName: "Alex Sarr" },
    { seasonKey: "2024-25", playerId: "17896114", playerName: "Zach Edey" },
    { seasonKey: "2024-25", playerId: "17896115", playerName: "Jaylen Wells" },
    { seasonKey: "2024-25", playerId: "17896116", playerName: "Yves Missi" },
    { seasonKey: "2025-26", playerId: "17896081", playerName: "Cooper Flagg" },
    { seasonKey: "2025-26", playerId: "17896117", playerName: "Kon Knueppel" },
    { seasonKey: "2025-26", playerId: "17896118", playerName: "VJ Edgecombe" },
    { seasonKey: "2025-26", playerId: "17896119", playerName: "Dylan Harper" },
    { seasonKey: "2025-26", playerId: "17896120", playerName: "Cedric Coward" },
  ] as const;

/**
 * All-Rookie Second Team（現役のみ）。
 * First と重複する記載・「ではなく」注記は整理済み。
 * 2016-17 Second は First と同じ並びだったためスキップ。
 */
export const NBA_ALL_ROOKIE_2ND_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    // 2008-09
    { seasonKey: "2008-09", playerId: "284", playerName: "Brook Lopez" },
    { seasonKey: "2008-09", playerId: "178", playerName: "Eric Gordon" },
    // 2009-10
    { seasonKey: "2009-10", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2009-10", playerId: "125", playerName: "DeMar DeRozan" },
    // 2010-11
    { seasonKey: "2010-11", playerId: "172", playerName: "Paul George" },
    // 2012-13
    { seasonKey: "2012-13", playerId: "185", playerName: "Draymond Green" },
    // 2013-14
    { seasonKey: "2013-14", playerId: "17896121", playerName: "Kelly Olynyk" },
    { seasonKey: "2013-14", playerId: "17896122", playerName: "Steven Adams" },
    // 2014-15
    { seasonKey: "2014-15", playerId: "246", playerName: "Nikola Jokic" },
    { seasonKey: "2014-15", playerId: "100", playerName: "Jordan Clarkson" },
    // 2017-18（Mitchell ではなく Lonzo 等）
    { seasonKey: "2017-18", playerId: "17896123", playerName: "Lonzo Ball" },
    // 2018-19（Ayton は First のため除外）
    { seasonKey: "2018-19", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
    { seasonKey: "2018-19", playerId: "17896124", playerName: "Jarrett Allen" },
    { seasonKey: "2018-19", playerId: "17896125", playerName: "Mitchell Robinson" },
    { seasonKey: "2018-19", playerId: "17896126", playerName: "Collin Sexton" },
    // 2019-20
    { seasonKey: "2019-20", playerId: "17896127", playerName: "Coby White" },
    { seasonKey: "2019-20", playerId: "17896128", playerName: "Rui Hachimura" },
    { seasonKey: "2019-20", playerId: "17896129", playerName: "P.J. Washington" },
    { seasonKey: "2019-20", playerId: "17896094", playerName: "Matisse Thybulle" },
    // 2020-21（Patrick Williams は First のため除外）
    { seasonKey: "2020-21", playerId: "1630191", playerName: "Isaiah Stewart" },
    { seasonKey: "2020-21", playerId: "1630217", playerName: "Desmond Bane" },
    { seasonKey: "2020-21", playerId: "1630180", playerName: "Saddiq Bey" },
    // 2021-22（Jalen Green は First のため除外）
    { seasonKey: "2021-22", playerId: "17896091", playerName: "Herbert Jones" },
    { seasonKey: "2021-22", playerId: "1630581", playerName: "Josh Giddey" },
    { seasonKey: "2021-22", playerId: "1630538", playerName: "Bones Hyland" },
    { seasonKey: "2021-22", playerId: "1630245", playerName: "Ayo Dosunmu" },
    // 2022-23（Ivey / Jalen Williams は First のため除外）
    { seasonKey: "2022-23", playerId: "1631110", playerName: "Jeremy Sochan" },
    { seasonKey: "2022-23", playerId: "1630549", playerName: "Shaedon Sharpe" },
    { seasonKey: "2022-23", playerId: "1631222", playerName: "Jake LaRavia" },
    // 2023-24（Miller / Amen / Jaquez は First のため除外）
    { seasonKey: "2023-24", playerId: "1631221", playerName: "Bilal Coulibaly" },
    { seasonKey: "2023-24", playerId: "1631244", playerName: "Keyonte George" },
    // 2024-25（Missi は First のため除外）
    { seasonKey: "2024-25", playerId: "1642272", playerName: "Kel'el Ware" },
    { seasonKey: "2024-25", playerId: "1641730", playerName: "Matas Buzelis" },
    { seasonKey: "2024-25", playerId: "1642269", playerName: "Donovan Clingan" },
    { seasonKey: "2024-25", playerId: "1642264", playerName: "Bub Carrington" },
    // 2025-26
    { seasonKey: "2025-26", playerId: "1642875", playerName: "Ace Bailey" },
    { seasonKey: "2025-26", playerId: "1642876", playerName: "Jeremiah Fears" },
    { seasonKey: "2025-26", playerId: "1642877", playerName: "Collin Murray-Boyles" },
    { seasonKey: "2025-26", playerId: "1642878", playerName: "Derik Queen" },
    { seasonKey: "2025-26", playerId: "1642879", playerName: "Maxime Raynaud" },
  ] as const;

/** NBA Cup MVP（現役） */
export const NBA_CUP_MVP_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] = [
  { seasonKey: "2023-24", playerId: "237", playerName: "LeBron James" },
  { seasonKey: "2024-25", playerId: "15", playerName: "Giannis Antetokounmpo" },
  { seasonKey: "2025-26", playerId: "666581", playerName: "Jalen Brunson" },
] as const;

/**
 * Conference Finals MVP（東西・現役）。
 * 年表記 2022 → シーズン 2021-22。
 */
export const NBA_CONF_FINALS_MVP_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    // 2021-22
    { seasonKey: "2021-22", playerId: "434", playerName: "Jayson Tatum" },
    { seasonKey: "2021-22", playerId: "115", playerName: "Stephen Curry" },
    // 2022-23
    { seasonKey: "2022-23", playerId: "79", playerName: "Jimmy Butler" },
    { seasonKey: "2022-23", playerId: "246", playerName: "Nikola Jokic" },
    // 2023-24
    { seasonKey: "2023-24", playerId: "70", playerName: "Jaylen Brown" },
    { seasonKey: "2023-24", playerId: "132", playerName: "Luka Doncic" },
    // 2024-25
    { seasonKey: "2024-25", playerId: "419", playerName: "Pascal Siakam" },
    { seasonKey: "2024-25", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
    // 2025-26
    { seasonKey: "2025-26", playerId: "666581", playerName: "Jalen Brunson" },
    { seasonKey: "2025-26", playerId: "666861", playerName: "Victor Wembanyama" },
  ] as const;

const SEASON_WINNERS_BY_AWARD: Partial<
  Record<NbaPlayerAwardId, readonly NbaPlayerAwardSeasonWinner[]>
> = {
  mvp: NBA_MVP_SEASON_WINNERS,
  fmvp: NBA_FMVP_SEASON_WINNERS,
  dpoy: NBA_DPOY_SEASON_WINNERS,
  roy: NBA_ROY_SEASON_WINNERS,
  mip: NBA_MIP_SEASON_WINNERS,
  smoy: NBA_SMOY_SEASON_WINNERS,
  clutch: NBA_CLUTCH_SEASON_WINNERS,
  scoring_champ: NBA_SCORING_CHAMP_SEASON_WINNERS,
  ast_champ: NBA_AST_CHAMP_SEASON_WINNERS,
  reb_champ: NBA_REB_CHAMP_SEASON_WINNERS,
  stl_champ: NBA_STL_CHAMP_SEASON_WINNERS,
  blk_champ: NBA_BLK_CHAMP_SEASON_WINNERS,
  all_nba_1st: NBA_ALL_NBA_1ST_SEASON_WINNERS,
  all_nba_2nd: NBA_ALL_NBA_2ND_SEASON_WINNERS,
  all_nba_3rd: NBA_ALL_NBA_3RD_SEASON_WINNERS,
  all_def_1st: NBA_ALL_DEF_1ST_SEASON_WINNERS,
  all_def_2nd: NBA_ALL_DEF_2ND_SEASON_WINNERS,
  all_rookie_1st: NBA_ALL_ROOKIE_1ST_SEASON_WINNERS,
  all_rookie_2nd: NBA_ALL_ROOKIE_2ND_SEASON_WINNERS,
  nba_cup_mvp: NBA_CUP_MVP_SEASON_WINNERS,
  conf_finals_mvp: NBA_CONF_FINALS_MVP_SEASON_WINNERS,
};

/**
 * All-Star は回数リストで受領（シーズン行ではない）。
 * 現役のみ。引退勢（Rose / Wall / Kemba / Hayward 等）は除外。
 */
export const NBA_ALL_STAR_COUNTS: readonly {
  playerId: string;
  playerName: string;
  count: number;
}[] = [
  { playerId: "237", playerName: "LeBron James", count: 22 },
  { playerId: "140", playerName: "Kevin Durant", count: 16 },
  { playerId: "115", playerName: "Stephen Curry", count: 12 },
  { playerId: "293", playerName: "Chris Paul", count: 12 },
  { playerId: "192", playerName: "James Harden", count: 11 },
  { playerId: "15", playerName: "Giannis Antetokounmpo", count: 10 },
  { playerId: "117", playerName: "Anthony Davis", count: 10 },
  { playerId: "228", playerName: "Kyrie Irving", count: 9 },
  { playerId: "472", playerName: "Russell Westbrook", count: 9 },
  { playerId: "246", playerName: "Nikola Jokic", count: 8 },
  { playerId: "145", playerName: "Joel Embiid", count: 8 },
  { playerId: "172", playerName: "Paul George", count: 8 },
  { playerId: "278", playerName: "Damian Lillard", count: 8 },
  { playerId: "274", playerName: "Kawhi Leonard", count: 7 },
  { playerId: "322", playerName: "Donovan Mitchell", count: 7 },
  { playerId: "125", playerName: "DeMar DeRozan", count: 6 },
  { playerId: "286", playerName: "Kyle Lowry", count: 6 },
  { playerId: "434", playerName: "Jayson Tatum", count: 6 },
  { playerId: "132", playerName: "Luka Doncic", count: 6 },
  { playerId: "447", playerName: "Karl-Anthony Towns", count: 6 },
  { playerId: "443", playerName: "Klay Thompson", count: 5 },
  { playerId: "200", playerName: "Al Horford", count: 5 },
  { playerId: "57", playerName: "Devin Booker", count: 5 },
  { playerId: "70", playerName: "Jaylen Brown", count: 5 },
  { playerId: "185", playerName: "Draymond Green", count: 4 },
  { playerId: "419", playerName: "Pascal Siakam", count: 4 },
  { playerId: "666848", playerName: "Anthony Edwards", count: 4 },
  { playerId: "175", playerName: "Shai Gilgeous-Alexander", count: 4 },
  { playerId: "37", playerName: "Bradley Beal", count: 3 },
  { playerId: "344", playerName: "Julius Randle", count: 3 },
  { playerId: "666458", playerName: "Ja Morant", count: 3 },
  { playerId: "666581", playerName: "Jalen Brunson", count: 3 },
  { playerId: "382", playerName: "Domantas Sabonis", count: 3 },
  { playerId: "315", playerName: "Khris Middleton", count: 3 },
  { playerId: "8", playerName: "Bam Adebayo", count: 3 },
  { playerId: "177", playerName: "Rudy Gobert", count: 3 },
  { playerId: "666863", playerName: "Zion Williamson", count: 2 },
  { playerId: "666849", playerName: "Trae Young", count: 2 },
  { playerId: "222", playerName: "Brandon Ingram", count: 2 },
  { playerId: "666457", playerName: "Jaren Jackson Jr.", count: 2 },
  { playerId: "666850", playerName: "Tyrese Haliburton", count: 2 },
  { playerId: "666852", playerName: "Tyrese Maxey", count: 2 },
  { playerId: "666859", playerName: "Scottie Barnes", count: 2 },
  { playerId: "666861", playerName: "Victor Wembanyama", count: 2 },
  { playerId: "17896083", playerName: "Alperen Sengun", count: 2 },
  { playerId: "666421", playerName: "Cade Cunningham", count: 2 },
  { playerId: "265", playerName: "Zach LaVine", count: 2 },
  { playerId: "460", playerName: "Nikola Vucevic", count: 2 },
  { playerId: "135", playerName: "Andre Drummond", count: 2 },
  { playerId: "210", playerName: "Jrue Holiday", count: 2 },
  { playerId: "161", playerName: "De'Aaron Fox", count: 2 },
  { playerId: "17896070", playerName: "Jalen Duren", count: 1 },
  { playerId: "17896071", playerName: "Jalen Johnson", count: 1 },
  { playerId: "666862", playerName: "Chet Holmgren", count: 1 },
  { playerId: "666903", playerName: "Jalen Williams", count: 1 },
  { playerId: "17896084", playerName: "Deni Avdija", count: 1 },
  { playerId: "335", playerName: "Jamal Murray", count: 1 },
  { playerId: "17896085", playerName: "Norman Powell", count: 1 },
  { playerId: "17896086", playerName: "Fred VanVleet", count: 1 },
  { playerId: "17896087", playerName: "Deandre Ayton", count: 1 },
  { playerId: "475", playerName: "Andrew Wiggins", count: 1 },
  { playerId: "17896088", playerName: "Kristaps Porzingis", count: 1 },
  { playerId: "290", playerName: "Lauri Markkanen", count: 1 },
  { playerId: "104", playerName: "Mike Conley", count: 1 },
  { playerId: "17896089", playerName: "Mikal Bridges", count: 1 },
  { playerId: "17896090", playerName: "Jerami Grant", count: 1 },
] as const;

const DIRECT_COUNTS_BY_AWARD: Partial<
  Record<NbaPlayerAwardId, readonly { playerId: string; count: number }[]>
> = {
  all_star: NBA_ALL_STAR_COUNTS,
};

function countByPlayerId(
  rows: readonly NbaPlayerAwardSeasonWinner[]
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const row of rows) {
    const id = String(row.playerId).trim();
    if (!id) continue;
    out[id] = (out[id] ?? 0) + 1;
  }
  return out;
}

/** playerId → awardId → count（取込済み賞のみ） */
export function buildNbaPlayerAwardCountsByPlayerId(): Record<
  string,
  Partial<Record<NbaPlayerAwardId, number>>
> {
  const byPlayer: Record<
    string,
    Partial<Record<NbaPlayerAwardId, number>>
  > = {};
  for (const awardId of NBA_PLAYER_AWARDS_INGESTED) {
    const rows = SEASON_WINNERS_BY_AWARD[awardId];
    if (rows) {
      const counts = countByPlayerId(rows);
      for (const [playerId, count] of Object.entries(counts)) {
        if (!byPlayer[playerId]) byPlayer[playerId] = {};
        byPlayer[playerId]![awardId] = count;
      }
    }
    const direct = DIRECT_COUNTS_BY_AWARD[awardId];
    if (direct) {
      for (const row of direct) {
        const playerId = String(row.playerId).trim();
        if (!playerId || !(row.count > 0)) continue;
        if (!byPlayer[playerId]) byPlayer[playerId] = {};
        byPlayer[playerId]![awardId] = row.count;
      }
    }
  }
  return byPlayer;
}

const COUNTS_BY_PLAYER = buildNbaPlayerAwardCountsByPlayerId();

/**
 * 取込済み賞を上書きして awards 配列を組み直す。
 * 未取込の賞は detail 側を残す。
 */
export function mergeCuratedPlayerAwards(
  existing: NbaPlayerAward[] | null | undefined,
  playerId: string
): NbaPlayerAward[] {
  const id = String(playerId).trim();
  const curated = COUNTS_BY_PLAYER[id] ?? {};
  const byId = new Map<string, NbaPlayerAward>();
  for (const a of existing ?? []) {
    if (!a?.id || !(a.count > 0)) continue;
    byId.set(a.id, { id: a.id, label: a.label, count: a.count });
  }
  for (const awardId of NBA_PLAYER_AWARDS_INGESTED) {
    const count = curated[awardId] ?? 0;
    if (count > 0) {
      byId.set(awardId, {
        id: awardId,
        label: NBA_PLAYER_AWARD_LABEL_BY_ID[awardId],
        count,
      });
    } else {
      byId.delete(awardId);
    }
  }
  const ordered: NbaPlayerAward[] = [];
  const seen = new Set<string>();
  for (const entry of NBA_PLAYER_AWARD_CATALOG) {
    const hit = byId.get(entry.id);
    if (!hit) continue;
    ordered.push(hit);
    seen.add(entry.id);
  }
  for (const [aid, award] of byId) {
    if (seen.has(aid)) continue;
    ordered.push(award);
  }
  return ordered;
}
