/**
 * ユーザー提供の賞ごとシーズン勝者 → プレイヤー詳細 AWARDS。
 * 取り込まれた賞（INGESTED）だけを上書き。未取込の賞は触らない。
 *
 * playerId はロスター／詳細と同じ BallDontLie id 必須。
 * 仮 id（666xxx / 17896xxx の手付け等）だと突合に失敗し AWARDS が欠ける。
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
  { seasonKey: "2010-11", playerId: "401", playerName: "Derrick Rose" },
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
  { seasonKey: "2025-26", playerId: "73", playerName: "Jalen Brunson" },
] as const;

/** DPOY（現役のみ） */
export const NBA_DPOY_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] = [
  { seasonKey: "2014-15", playerId: "274", playerName: "Kawhi Leonard" },
  { seasonKey: "2015-16", playerId: "274", playerName: "Kawhi Leonard" },
  { seasonKey: "2016-17", playerId: "185", playerName: "Draymond Green" },
  { seasonKey: "2017-18", playerId: "176", playerName: "Rudy Gobert" },
  { seasonKey: "2018-19", playerId: "176", playerName: "Rudy Gobert" },
  { seasonKey: "2019-20", playerId: "15", playerName: "Giannis Antetokounmpo" },
  { seasonKey: "2020-21", playerId: "176", playerName: "Rudy Gobert" },
  { seasonKey: "2021-22", playerId: "420", playerName: "Marcus Smart" },
  { seasonKey: "2022-23", playerId: "231", playerName: "Jaren Jackson Jr." },
  { seasonKey: "2023-24", playerId: "176", playerName: "Rudy Gobert" },
  { seasonKey: "2024-25", playerId: "17896076", playerName: "Evan Mobley" },
  { seasonKey: "2025-26", playerId: "56677822", playerName: "Victor Wembanyama" },
] as const;

/** ROY（現役のみ・各1回） */
export const NBA_ROY_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] = [
  { seasonKey: "2003-04", playerId: "237", playerName: "LeBron James" },
  { seasonKey: "2005-06", playerId: "367", playerName: "Chris Paul" },
  { seasonKey: "2007-08", playerId: "140", playerName: "Kevin Durant" },
  { seasonKey: "2011-12", playerId: "228", playerName: "Kyrie Irving" },
  { seasonKey: "2012-13", playerId: "278", playerName: "Damian Lillard" },
  { seasonKey: "2014-15", playerId: "475", playerName: "Andrew Wiggins" },
  { seasonKey: "2015-16", playerId: "447", playerName: "Karl-Anthony Towns" },
  { seasonKey: "2016-17", playerId: "65", playerName: "Malcolm Brogdon" },
  { seasonKey: "2018-19", playerId: "132", playerName: "Luka Doncic" },
  { seasonKey: "2019-20", playerId: "666786", playerName: "Ja Morant" },
  { seasonKey: "2020-21", playerId: "3547239", playerName: "LaMelo Ball" },
  { seasonKey: "2021-22", playerId: "17896055", playerName: "Scottie Barnes" },
  { seasonKey: "2022-23", playerId: "38017683", playerName: "Paolo Banchero" },
  { seasonKey: "2023-24", playerId: "56677822", playerName: "Victor Wembanyama" },
  { seasonKey: "2024-25", playerId: "1028025261", playerName: "Stephon Castle" },
  { seasonKey: "2025-26", playerId: "1057262088", playerName: "Cooper Flagg" },
] as const;

/** MIP（現役のみ・各1回） */
export const NBA_MIP_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] = [
  { seasonKey: "2010-11", playerId: "285", playerName: "Kevin Love" },
  { seasonKey: "2012-13", playerId: "172", playerName: "Paul George" },
  { seasonKey: "2014-15", playerId: "79", playerName: "Jimmy Butler" },
  { seasonKey: "2015-16", playerId: "303", playerName: "CJ McCollum" },
  { seasonKey: "2016-17", playerId: "15", playerName: "Giannis Antetokounmpo" },
  { seasonKey: "2018-19", playerId: "416", playerName: "Pascal Siakam" },
  { seasonKey: "2019-20", playerId: "227", playerName: "Brandon Ingram" },
  { seasonKey: "2020-21", playerId: "387", playerName: "Julius Randle" },
  { seasonKey: "2021-22", playerId: "666786", playerName: "Ja Morant" },
  { seasonKey: "2022-23", playerId: "297", playerName: "Lauri Markkanen" },
  { seasonKey: "2023-24", playerId: "3547254", playerName: "Tyrese Maxey" },
  { seasonKey: "2024-25", playerId: "38017677", playerName: "Dyson Daniels" },
  { seasonKey: "2025-26", playerId: "666400", playerName: "Nickeil Alexander-Walker" },
] as const;

/** Sixth Man（現役のみ） */
export const NBA_SMOY_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] = [
  { seasonKey: "2011-12", playerId: "192", playerName: "James Harden" },
  { seasonKey: "2016-17", playerId: "178", playerName: "Eric Gordon" },
  { seasonKey: "2020-21", playerId: "100", playerName: "Jordan Clarkson" },
  { seasonKey: "2021-22", playerId: "666633", playerName: "Tyler Herro" },
  { seasonKey: "2022-23", playerId: "65", playerName: "Malcolm Brogdon" },
  { seasonKey: "2023-24", playerId: "667378", playerName: "Naz Reid" },
  { seasonKey: "2024-25", playerId: "3547276", playerName: "Payton Pritchard" },
  { seasonKey: "2025-26", playerId: "666682", playerName: "Keldon Johnson" },
] as const;

/** Clutch Player of the Year（2022-23 新設・現役） */
export const NBA_CLUTCH_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] = [
  { seasonKey: "2022-23", playerId: "161", playerName: "De'Aaron Fox" },
  { seasonKey: "2023-24", playerId: "115", playerName: "Stephen Curry" },
  { seasonKey: "2024-25", playerId: "73", playerName: "Jalen Brunson" },
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
    { seasonKey: "2021-22", playerId: "490", playerName: "Trae Young" },
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
    { seasonKey: "2007-08", playerId: "367", playerName: "Chris Paul" },
    { seasonKey: "2008-09", playerId: "367", playerName: "Chris Paul" },
    { seasonKey: "2014-15", playerId: "367", playerName: "Chris Paul" },
    { seasonKey: "2016-17", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2017-18", playerId: "472", playerName: "Russell Westbrook" },
    { seasonKey: "2018-19", playerId: "472", playerName: "Russell Westbrook" },
    { seasonKey: "2019-20", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2020-21", playerId: "472", playerName: "Russell Westbrook" },
    { seasonKey: "2021-22", playerId: "490", playerName: "Trae Young" },
    { seasonKey: "2022-23", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2023-24", playerId: "3547245", playerName: "Tyrese Haliburton" },
    { seasonKey: "2024-25", playerId: "490", playerName: "Trae Young" },
    { seasonKey: "2025-26", playerId: "246", playerName: "Nikola Jokic" },
  ] as const;

/**
 * Rebound Champ / リバウンド王（2003-04〜・現役のみ）。
 * 省略: Garnett / Marion / Howard / Whiteside。
 * 2005-06 は Shawn Marion（Bob 表記は誤り）。
 */
export const NBA_REB_CHAMP_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    { seasonKey: "2010-11", playerId: "285", playerName: "Kevin Love" },
    { seasonKey: "2013-14", playerId: "250", playerName: "DeAndre Jordan" },
    { seasonKey: "2014-15", playerId: "250", playerName: "DeAndre Jordan" },
    { seasonKey: "2015-16", playerId: "137", playerName: "Andre Drummond" },
    { seasonKey: "2017-18", playerId: "137", playerName: "Andre Drummond" },
    { seasonKey: "2018-19", playerId: "137", playerName: "Andre Drummond" },
    { seasonKey: "2019-20", playerId: "137", playerName: "Andre Drummond" },
    { seasonKey: "2020-21", playerId: "83", playerName: "Clint Capela" },
    { seasonKey: "2021-22", playerId: "176", playerName: "Rudy Gobert" },
    { seasonKey: "2022-23", playerId: "406", playerName: "Domantas Sabonis" },
    { seasonKey: "2023-24", playerId: "406", playerName: "Domantas Sabonis" },
    { seasonKey: "2024-25", playerId: "406", playerName: "Domantas Sabonis" },
    { seasonKey: "2025-26", playerId: "1028025344", playerName: "Donovan Clingan" },
  ] as const;

/**
 * Steal Champ / スティール王（2003-04〜・現役のみ）。
 * 省略: Baron Davis / Iverson / Wallace / Rondo / Rubio / Wall。
 * 2023-24 は Fox / SGA 同率。
 */
export const NBA_STL_CHAMP_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    { seasonKey: "2007-08", playerId: "367", playerName: "Chris Paul" },
    { seasonKey: "2008-09", playerId: "367", playerName: "Chris Paul" },
    { seasonKey: "2010-11", playerId: "367", playerName: "Chris Paul" },
    { seasonKey: "2011-12", playerId: "367", playerName: "Chris Paul" },
    { seasonKey: "2012-13", playerId: "367", playerName: "Chris Paul" },
    { seasonKey: "2014-15", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2015-16", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2017-18", playerId: "357", playerName: "Victor Oladipo" },
    { seasonKey: "2018-19", playerId: "172", playerName: "Paul George" },
    { seasonKey: "2019-20", playerId: "417", playerName: "Ben Simmons" },
    { seasonKey: "2020-21", playerId: "304", playerName: "T.J. McConnell" },
    { seasonKey: "2021-22", playerId: "334", playerName: "Dejounte Murray" },
    { seasonKey: "2022-23", playerId: "18", playerName: "OG Anunoby" },
    { seasonKey: "2023-24", playerId: "161", playerName: "De'Aaron Fox" },
    { seasonKey: "2023-24", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
    { seasonKey: "2024-25", playerId: "38017677", playerName: "Dyson Daniels" },
    { seasonKey: "2025-26", playerId: "56677826", playerName: "Ausar Thompson" },
  ] as const;

/**
 * Block Champ / ブロック王（2003-04〜・現役のみ）。
 * 省略: Ratliff / Camby / Kirilenko / Howard / Ibaka / Whiteside。
 */
export const NBA_BLK_CHAMP_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    { seasonKey: "2013-14", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2014-15", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2016-17", playerId: "176", playerName: "Rudy Gobert" },
    { seasonKey: "2017-18", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2018-19", playerId: "452", playerName: "Myles Turner" },
    { seasonKey: "2020-21", playerId: "452", playerName: "Myles Turner" },
    { seasonKey: "2021-22", playerId: "231", playerName: "Jaren Jackson Jr." },
    { seasonKey: "2022-23", playerId: "283", playerName: "Brook Lopez" },
    { seasonKey: "2023-24", playerId: "56677822", playerName: "Victor Wembanyama" },
    { seasonKey: "2024-25", playerId: "56677822", playerName: "Victor Wembanyama" },
    { seasonKey: "2025-26", playerId: "56677822", playerName: "Victor Wembanyama" },
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
    { seasonKey: "2007-08", playerId: "367", playerName: "Chris Paul" },
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
    { seasonKey: "2011-12", playerId: "367", playerName: "Chris Paul" },
    // 2012-13
    { seasonKey: "2012-13", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2012-13", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2012-13", playerId: "367", playerName: "Chris Paul" },
    // 2013-14
    { seasonKey: "2013-14", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2013-14", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2013-14", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2013-14", playerId: "367", playerName: "Chris Paul" },
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
    { seasonKey: "2025-26", playerId: "56677822", playerName: "Victor Wembanyama" },
    { seasonKey: "2025-26", playerId: "132", playerName: "Luka Doncic" },
    { seasonKey: "2025-26", playerId: "17896075", playerName: "Cade Cunningham" },
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
    { seasonKey: "2016-17", playerId: "176", playerName: "Rudy Gobert" },
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
    { seasonKey: "2020-21", playerId: "387", playerName: "Julius Randle" },
    { seasonKey: "2020-21", playerId: "278", playerName: "Damian Lillard" },
    { seasonKey: "2020-21", playerId: "132", playerName: "Luka Doncic" },
    { seasonKey: "2020-21", playerId: "115", playerName: "Stephen Curry" },
    // 2021-22
    { seasonKey: "2021-22", playerId: "145", playerName: "Joel Embiid" },
    { seasonKey: "2021-22", playerId: "666786", playerName: "Ja Morant" },
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
    { seasonKey: "2023-24", playerId: "3547238", playerName: "Anthony Edwards" },
    { seasonKey: "2023-24", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2023-24", playerId: "274", playerName: "Kawhi Leonard" },
    { seasonKey: "2023-24", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
    // 2024-25
    { seasonKey: "2024-25", playerId: "73", playerName: "Jalen Brunson" },
    { seasonKey: "2024-25", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2024-25", playerId: "3547238", playerName: "Anthony Edwards" },
    { seasonKey: "2024-25", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2024-25", playerId: "17896076", playerName: "Evan Mobley" },
    // 2025-26
    { seasonKey: "2025-26", playerId: "70", playerName: "Jaylen Brown" },
    { seasonKey: "2025-26", playerId: "274", playerName: "Kawhi Leonard" },
    { seasonKey: "2025-26", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2025-26", playerId: "73", playerName: "Jalen Brunson" },
    { seasonKey: "2025-26", playerId: "322", playerName: "Donovan Mitchell" },
  ] as const;

/**
 * All-NBA Third Team（2012-13〜2025-26）。
 * 現役のみ格納。
 */
export const NBA_ALL_NBA_3RD_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    // 2010-11（Horford 現役）
    { seasonKey: "2010-11", playerId: "219", playerName: "Al Horford" },
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
    { seasonKey: "2016-17", playerId: "176", playerName: "Rudy Gobert" },
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
    { seasonKey: "2019-20", playerId: "176", playerName: "Rudy Gobert" },
    { seasonKey: "2019-20", playerId: "367", playerName: "Chris Paul" },
    { seasonKey: "2019-20", playerId: "472", playerName: "Russell Westbrook" },
    // 2020-21
    { seasonKey: "2020-21", playerId: "387", playerName: "Julius Randle" },
    { seasonKey: "2020-21", playerId: "172", playerName: "Paul George" },
    { seasonKey: "2020-21", playerId: "176", playerName: "Rudy Gobert" },
    { seasonKey: "2020-21", playerId: "79", playerName: "Jimmy Butler" },
    { seasonKey: "2020-21", playerId: "228", playerName: "Kyrie Irving" },
    // 2021-22
    { seasonKey: "2021-22", playerId: "416", playerName: "Pascal Siakam" },
    { seasonKey: "2021-22", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2021-22", playerId: "447", playerName: "Karl-Anthony Towns" },
    { seasonKey: "2021-22", playerId: "490", playerName: "Trae Young" },
    { seasonKey: "2021-22", playerId: "367", playerName: "Chris Paul" },
    // 2022-23
    { seasonKey: "2022-23", playerId: "70", playerName: "Jaylen Brown" },
    { seasonKey: "2022-23", playerId: "387", playerName: "Julius Randle" },
    { seasonKey: "2022-23", playerId: "406", playerName: "Domantas Sabonis" },
    { seasonKey: "2022-23", playerId: "161", playerName: "De'Aaron Fox" },
    { seasonKey: "2022-23", playerId: "666786", playerName: "Ja Morant" },
    // 2023-24
    { seasonKey: "2023-24", playerId: "73", playerName: "Jalen Brunson" },
    { seasonKey: "2023-24", playerId: "3547238", playerName: "Anthony Edwards" },
    { seasonKey: "2023-24", playerId: "274", playerName: "Kawhi Leonard" },
    { seasonKey: "2023-24", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2023-24", playerId: "406", playerName: "Domantas Sabonis" },
    // 2024-25
    { seasonKey: "2024-25", playerId: "17896075", playerName: "Cade Cunningham" },
    { seasonKey: "2024-25", playerId: "3547245", playerName: "Tyrese Haliburton" },
    { seasonKey: "2024-25", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2024-25", playerId: "447", playerName: "Karl-Anthony Towns" },
    { seasonKey: "2024-25", playerId: "38017703", playerName: "Jalen Williams" },
    // 2025-26
    { seasonKey: "2025-26", playerId: "335", playerName: "Jamal Murray" },
    { seasonKey: "2025-26", playerId: "3547254", playerName: "Tyrese Maxey" },
    { seasonKey: "2025-26", playerId: "38017685", playerName: "Chet Holmgren" },
    { seasonKey: "2025-26", playerId: "38017694", playerName: "Jalen Duren" },
    { seasonKey: "2025-26", playerId: "17896040", playerName: "Jalen Johnson" },
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
    { seasonKey: "2010-11", playerId: "367", playerName: "Chris Paul" },
    // 2011-12
    { seasonKey: "2011-12", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2011-12", playerId: "367", playerName: "Chris Paul" },
    // 2012-13
    { seasonKey: "2012-13", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2012-13", playerId: "367", playerName: "Chris Paul" },
    // 2013-14
    { seasonKey: "2013-14", playerId: "172", playerName: "Paul George" },
    { seasonKey: "2013-14", playerId: "367", playerName: "Chris Paul" },
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
    { seasonKey: "2016-17", playerId: "176", playerName: "Rudy Gobert" },
    { seasonKey: "2016-17", playerId: "367", playerName: "Chris Paul" },
    // 2017-18
    { seasonKey: "2017-18", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2017-18", playerId: "219", playerName: "Al Horford" },
    { seasonKey: "2017-18", playerId: "214", playerName: "Jrue Holiday" },
    // 2018-19
    { seasonKey: "2018-19", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2018-19", playerId: "172", playerName: "Paul George" },
    { seasonKey: "2018-19", playerId: "176", playerName: "Rudy Gobert" },
    { seasonKey: "2018-19", playerId: "420", playerName: "Marcus Smart" },
    { seasonKey: "2018-19", playerId: "214", playerName: "Jrue Holiday" },
    // 2019-20
    { seasonKey: "2019-20", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2019-20", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2019-20", playerId: "176", playerName: "Rudy Gobert" },
    // 2020-21
    { seasonKey: "2020-21", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2020-21", playerId: "176", playerName: "Rudy Gobert" },
    { seasonKey: "2020-21", playerId: "214", playerName: "Jrue Holiday" },
    { seasonKey: "2020-21", playerId: "79", playerName: "Jimmy Butler" },
    // 2021-22
    { seasonKey: "2021-22", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2021-22", playerId: "231", playerName: "Jaren Jackson Jr." },
    { seasonKey: "2021-22", playerId: "420", playerName: "Marcus Smart" },
    { seasonKey: "2021-22", playerId: "61", playerName: "Mikal Bridges" },
    { seasonKey: "2021-22", playerId: "214", playerName: "Jrue Holiday" },
    // 2022-23
    { seasonKey: "2022-23", playerId: "231", playerName: "Jaren Jackson Jr." },
    { seasonKey: "2022-23", playerId: "15", playerName: "Giannis Antetokounmpo" },
    { seasonKey: "2022-23", playerId: "283", playerName: "Brook Lopez" },
    { seasonKey: "2022-23", playerId: "214", playerName: "Jrue Holiday" },
    { seasonKey: "2022-23", playerId: "89", playerName: "Alex Caruso" },
    // 2023-24
    { seasonKey: "2023-24", playerId: "176", playerName: "Rudy Gobert" },
    { seasonKey: "2023-24", playerId: "56677822", playerName: "Victor Wembanyama" },
    { seasonKey: "2023-24", playerId: "4", playerName: "Bam Adebayo" },
    { seasonKey: "2023-24", playerId: "17896024", playerName: "Herbert Jones" },
    { seasonKey: "2023-24", playerId: "214", playerName: "Jrue Holiday" },
    // 2024-25
    { seasonKey: "2024-25", playerId: "17896076", playerName: "Evan Mobley" },
    { seasonKey: "2024-25", playerId: "185", playerName: "Draymond Green" },
    { seasonKey: "2024-25", playerId: "38017677", playerName: "Dyson Daniels" },
    { seasonKey: "2024-25", playerId: "38017703", playerName: "Jalen Williams" },
    { seasonKey: "2024-25", playerId: "89", playerName: "Alex Caruso" },
    // 2025-26
    { seasonKey: "2025-26", playerId: "56677822", playerName: "Victor Wembanyama" },
    { seasonKey: "2025-26", playerId: "38017685", playerName: "Chet Holmgren" },
    { seasonKey: "2025-26", playerId: "56677826", playerName: "Ausar Thompson" },
    { seasonKey: "2025-26", playerId: "176", playerName: "Rudy Gobert" },
    { seasonKey: "2025-26", playerId: "473", playerName: "Derrick White" },
  ] as const;

/**
 * All-Defensive Second Team（現役のみ）。
 * 2021-22 の Bridges 二重記載は1回分のみ。
 */
export const NBA_ALL_DEF_2ND_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    // 2007-08
    { seasonKey: "2007-08", playerId: "367", playerName: "Chris Paul" },
    // 2012-13
    { seasonKey: "2012-13", playerId: "104", playerName: "Mike Conley" },
    // 2013-14
    { seasonKey: "2013-14", playerId: "237", playerName: "LeBron James" },
    // 2014-15
    { seasonKey: "2014-15", playerId: "185", playerName: "Draymond Green" },
    { seasonKey: "2014-15", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2014-15", playerId: "367", playerName: "Chris Paul" },
    // 2015-16
    { seasonKey: "2015-16", playerId: "185", playerName: "Draymond Green" },
    { seasonKey: "2015-16", playerId: "172", playerName: "Paul George" },
    { seasonKey: "2015-16", playerId: "79", playerName: "Jimmy Butler" },
    // 2016-17
    { seasonKey: "2016-17", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2016-17", playerId: "176", playerName: "Rudy Gobert" },
    // 2017-18
    { seasonKey: "2017-18", playerId: "79", playerName: "Jimmy Butler" },
    { seasonKey: "2017-18", playerId: "185", playerName: "Draymond Green" },
    { seasonKey: "2017-18", playerId: "219", playerName: "Al Horford" },
    { seasonKey: "2017-18", playerId: "334", playerName: "Dejounte Murray" },
    // 2018-19
    { seasonKey: "2018-19", playerId: "145", playerName: "Joel Embiid" },
    { seasonKey: "2018-19", playerId: "185", playerName: "Draymond Green" },
    { seasonKey: "2018-19", playerId: "452", playerName: "Myles Turner" },
    { seasonKey: "2018-19", playerId: "443", playerName: "Klay Thompson" },
    // 2019-20
    { seasonKey: "2019-20", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2019-20", playerId: "283", playerName: "Brook Lopez" },
    // 2020-21
    { seasonKey: "2020-21", playerId: "4", playerName: "Bam Adebayo" },
    { seasonKey: "2020-21", playerId: "214", playerName: "Jrue Holiday" },
    { seasonKey: "2020-21", playerId: "666923", playerName: "Matisse Thybulle" },
    { seasonKey: "2020-21", playerId: "476", playerName: "Robert Williams III" },
    { seasonKey: "2020-21", playerId: "185", playerName: "Draymond Green" },
    // 2021-22
    { seasonKey: "2021-22", playerId: "4", playerName: "Bam Adebayo" },
    { seasonKey: "2021-22", playerId: "185", playerName: "Draymond Green" },
    { seasonKey: "2021-22", playerId: "61", playerName: "Mikal Bridges" },
    { seasonKey: "2021-22", playerId: "420", playerName: "Marcus Smart" },
    // 2022-23
    { seasonKey: "2022-23", playerId: "231", playerName: "Jaren Jackson Jr." },
    { seasonKey: "2022-23", playerId: "89", playerName: "Alex Caruso" },
    { seasonKey: "2022-23", playerId: "18", playerName: "OG Anunoby" },
    { seasonKey: "2022-23", playerId: "66", playerName: "Dillon Brooks" },
    { seasonKey: "2022-23", playerId: "185", playerName: "Draymond Green" },
    // 2023-24（提供リストどおり）
    { seasonKey: "2023-24", playerId: "4", playerName: "Bam Adebayo" },
    { seasonKey: "2023-24", playerId: "214", playerName: "Jrue Holiday" },
    { seasonKey: "2023-24", playerId: "666923", playerName: "Matisse Thybulle" },
    { seasonKey: "2023-24", playerId: "476", playerName: "Robert Williams III" },
    { seasonKey: "2023-24", playerId: "185", playerName: "Draymond Green" },
    // 2024-25
    { seasonKey: "2024-25", playerId: "176", playerName: "Rudy Gobert" },
    { seasonKey: "2024-25", playerId: "38017677", playerName: "Dyson Daniels" },
    { seasonKey: "2024-25", playerId: "18", playerName: "OG Anunoby" },
    { seasonKey: "2024-25", playerId: "17896055", playerName: "Scottie Barnes" },
    { seasonKey: "2024-25", playerId: "4", playerName: "Bam Adebayo" },
    // 2025-26
    { seasonKey: "2025-26", playerId: "4", playerName: "Bam Adebayo" },
    { seasonKey: "2025-26", playerId: "18", playerName: "OG Anunoby" },
    { seasonKey: "2025-26", playerId: "17896055", playerName: "Scottie Barnes" },
    { seasonKey: "2025-26", playerId: "38017677", playerName: "Dyson Daniels" },
    { seasonKey: "2025-26", playerId: "56677833", playerName: "Cason Wallace" },
  ] as const;

/**
 * All-Rookie First Team（現役のみ・各1回）。
 */
export const NBA_ALL_ROOKIE_1ST_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    { seasonKey: "2003-04", playerId: "237", playerName: "LeBron James" },
    { seasonKey: "2005-06", playerId: "367", playerName: "Chris Paul" },
    { seasonKey: "2007-08", playerId: "140", playerName: "Kevin Durant" },
    { seasonKey: "2007-08", playerId: "219", playerName: "Al Horford" },
    { seasonKey: "2008-09", playerId: "472", playerName: "Russell Westbrook" },
    { seasonKey: "2008-09", playerId: "285", playerName: "Kevin Love" },
    { seasonKey: "2009-10", playerId: "115", playerName: "Stephen Curry" },
    { seasonKey: "2011-12", playerId: "228", playerName: "Kyrie Irving" },
    { seasonKey: "2011-12", playerId: "443", playerName: "Klay Thompson" },
    { seasonKey: "2011-12", playerId: "274", playerName: "Kawhi Leonard" },
    { seasonKey: "2012-13", playerId: "278", playerName: "Damian Lillard" },
    { seasonKey: "2012-13", playerId: "117", playerName: "Anthony Davis" },
    { seasonKey: "2012-13", playerId: "37", playerName: "Bradley Beal" },
    { seasonKey: "2012-13", playerId: "137", playerName: "Andre Drummond" },
    { seasonKey: "2013-14", playerId: "191", playerName: "Tim Hardaway Jr." },
    { seasonKey: "2014-15", playerId: "475", playerName: "Andrew Wiggins" },
    { seasonKey: "2014-15", playerId: "54", playerName: "Bojan Bogdanovic" },
    { seasonKey: "2015-16", playerId: "447", playerName: "Karl-Anthony Towns" },
    { seasonKey: "2015-16", playerId: "378", playerName: "Kristaps Porzingis" },
    { seasonKey: "2015-16", playerId: "405", playerName: "D'Angelo Russell" },
    { seasonKey: "2015-16", playerId: "57", playerName: "Devin Booker" },
    { seasonKey: "2016-17", playerId: "65", playerName: "Malcolm Brogdon" },
    { seasonKey: "2016-17", playerId: "145", playerName: "Joel Embiid" },
    { seasonKey: "2016-17", playerId: "210", playerName: "Buddy Hield" },
    { seasonKey: "2016-17", playerId: "335", playerName: "Jamal Murray" },
    { seasonKey: "2017-18", playerId: "434", playerName: "Jayson Tatum" },
    { seasonKey: "2017-18", playerId: "322", playerName: "Donovan Mitchell" },
    { seasonKey: "2017-18", playerId: "265", playerName: "Kyle Kuzma" },
    { seasonKey: "2017-18", playerId: "101", playerName: "John Collins" },
    { seasonKey: "2018-19", playerId: "132", playerName: "Luka Doncic" },
    { seasonKey: "2018-19", playerId: "490", playerName: "Trae Young" },
    { seasonKey: "2018-19", playerId: "22", playerName: "Deandre Ayton" },
    { seasonKey: "2018-19", playerId: "231", playerName: "Jaren Jackson Jr." },
    { seasonKey: "2019-20", playerId: "666786", playerName: "Ja Morant" },
    { seasonKey: "2019-20", playerId: "666969", playerName: "Zion Williamson" },
    { seasonKey: "2020-21", playerId: "3547239", playerName: "LaMelo Ball" },
    { seasonKey: "2020-21", playerId: "3547238", playerName: "Anthony Edwards" },
    { seasonKey: "2020-21", playerId: "3547248", playerName: "Patrick Williams" },
    { seasonKey: "2021-22", playerId: "17896055", playerName: "Scottie Barnes" },
    { seasonKey: "2021-22", playerId: "17896075", playerName: "Cade Cunningham" },
    { seasonKey: "2021-22", playerId: "17896076", playerName: "Evan Mobley" },
    { seasonKey: "2021-22", playerId: "17895966", playerName: "Jalen Green" },
    { seasonKey: "2021-22", playerId: "17896026", playerName: "Franz Wagner" },
    { seasonKey: "2022-23", playerId: "38017683", playerName: "Paolo Banchero" },
    { seasonKey: "2022-23", playerId: "38017703", playerName: "Jalen Williams" },
    { seasonKey: "2022-23", playerId: "38017686", playerName: "Benedict Mathurin" },
    { seasonKey: "2022-23", playerId: "38017682", playerName: "Jaden Ivey" },
    { seasonKey: "2022-23", playerId: "38017705", playerName: "Walker Kessler" },
    { seasonKey: "2023-24", playerId: "56677822", playerName: "Victor Wembanyama" },
    { seasonKey: "2023-24", playerId: "38017685", playerName: "Chet Holmgren" },
    { seasonKey: "2023-24", playerId: "56677823", playerName: "Brandon Miller" },
    { seasonKey: "2023-24", playerId: "56677785", playerName: "Jaime Jaquez Jr." },
    { seasonKey: "2023-24", playerId: "56677825", playerName: "Amen Thompson" },
    { seasonKey: "2024-25", playerId: "1028025261", playerName: "Stephon Castle" },
    { seasonKey: "2024-25", playerId: "1028028405", playerName: "Alex Sarr" },
    { seasonKey: "2024-25", playerId: "1028025754", playerName: "Zach Edey" },
    { seasonKey: "2024-25", playerId: "1028039105", playerName: "Jaylen Wells" },
    { seasonKey: "2024-25", playerId: "1028027567", playerName: "Yves Missi" },
    { seasonKey: "2025-26", playerId: "1057262088", playerName: "Cooper Flagg" },
    { seasonKey: "2025-26", playerId: "1057263194", playerName: "Kon Knueppel" },
    { seasonKey: "2025-26", playerId: "1057261935", playerName: "VJ Edgecombe" },
    { seasonKey: "2025-26", playerId: "1057262518", playerName: "Dylan Harper" },
    { seasonKey: "2025-26", playerId: "1057266649", playerName: "Cedric Coward" },
  ] as const;

/**
 * All-Rookie Second Team（現役のみ）。
 * First と重複する記載・「ではなく」注記は整理済み。
 * 2016-17 Second は First と同じ並びだったためスキップ。
 */
export const NBA_ALL_ROOKIE_2ND_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] =
  [
    // 2008-09
    { seasonKey: "2008-09", playerId: "283", playerName: "Brook Lopez" },
    { seasonKey: "2008-09", playerId: "178", playerName: "Eric Gordon" },
    // 2009-10
    { seasonKey: "2009-10", playerId: "192", playerName: "James Harden" },
    { seasonKey: "2009-10", playerId: "125", playerName: "DeMar DeRozan" },
    // 2010-11
    { seasonKey: "2010-11", playerId: "172", playerName: "Paul George" },
    // 2012-13
    { seasonKey: "2012-13", playerId: "185", playerName: "Draymond Green" },
    // 2013-14
    { seasonKey: "2013-14", playerId: "358", playerName: "Kelly Olynyk" },
    { seasonKey: "2013-14", playerId: "3", playerName: "Steven Adams" },
    // 2014-15
    { seasonKey: "2014-15", playerId: "246", playerName: "Nikola Jokic" },
    { seasonKey: "2014-15", playerId: "100", playerName: "Jordan Clarkson" },
    // 2017-18（Mitchell ではなく Lonzo 等）
    { seasonKey: "2017-18", playerId: "27", playerName: "Lonzo Ball" },
    // 2018-19（Ayton は First のため除外）
    { seasonKey: "2018-19", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
    { seasonKey: "2018-19", playerId: "9", playerName: "Jarrett Allen" },
    { seasonKey: "2018-19", playerId: "399", playerName: "Mitchell Robinson" },
    { seasonKey: "2018-19", playerId: "413", playerName: "Collin Sexton" },
    // 2019-20
    { seasonKey: "2019-20", playerId: "666956", playerName: "Coby White" },
    { seasonKey: "2019-20", playerId: "666609", playerName: "Rui Hachimura" },
    { seasonKey: "2019-20", playerId: "666950", playerName: "P.J. Washington" },
    { seasonKey: "2019-20", playerId: "666923", playerName: "Matisse Thybulle" },
    // 2020-21（Patrick Williams は First のため除外）
    { seasonKey: "2020-21", playerId: "3547267", playerName: "Isaiah Stewart" },
    { seasonKey: "2020-21", playerId: "3547287", playerName: "Desmond Bane" },
    { seasonKey: "2020-21", playerId: "3547256", playerName: "Saddiq Bey" },
    // 2021-22（Jalen Green は First のため除外）
    { seasonKey: "2021-22", playerId: "17896024", playerName: "Herbert Jones" },
    { seasonKey: "2021-22", playerId: "17896065", playerName: "Josh Giddey" },
    { seasonKey: "2021-22", playerId: "1630538", playerName: "Bones Hyland" },
    { seasonKey: "2021-22", playerId: "17895983", playerName: "Ayo Dosunmu" },
    // 2022-23（Ivey / Jalen Williams は First のため除外）
    { seasonKey: "2022-23", playerId: "38017699", playerName: "Jeremy Sochan" },
    { seasonKey: "2022-23", playerId: "38017690", playerName: "Shaedon Sharpe" },
    { seasonKey: "2022-23", playerId: "38017728", playerName: "Jake LaRavia" },
    // 2023-24（Miller / Amen / Jaquez は First のため除外）
    { seasonKey: "2023-24", playerId: "56677844", playerName: "Bilal Coulibaly" },
    { seasonKey: "2023-24", playerId: "56677834", playerName: "Keyonte George" },
    // 2024-25（Missi は First のため除外）
    { seasonKey: "2024-25", playerId: "1028029127", playerName: "Kel'el Ware" },
    { seasonKey: "2024-25", playerId: "1028025177", playerName: "Matas Buzelis" },
    { seasonKey: "2024-25", playerId: "1028025344", playerName: "Donovan Clingan" },
    { seasonKey: "2024-25", playerId: "1642264", playerName: "Bub Carrington" },
    // 2025-26
    { seasonKey: "2025-26", playerId: "1642875", playerName: "Ace Bailey" },
    { seasonKey: "2025-26", playerId: "1057267077", playerName: "Jeremiah Fears" },
    { seasonKey: "2025-26", playerId: "1057268940", playerName: "Collin Murray-Boyles" },
    { seasonKey: "2025-26", playerId: "1057274415", playerName: "Derik Queen" },
    { seasonKey: "2025-26", playerId: "1057390745", playerName: "Maxime Raynaud" },
  ] as const;

/** NBA Cup MVP（現役） */
export const NBA_CUP_MVP_SEASON_WINNERS: readonly NbaPlayerAwardSeasonWinner[] = [
  { seasonKey: "2023-24", playerId: "237", playerName: "LeBron James" },
  { seasonKey: "2024-25", playerId: "15", playerName: "Giannis Antetokounmpo" },
  { seasonKey: "2025-26", playerId: "73", playerName: "Jalen Brunson" },
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
    { seasonKey: "2024-25", playerId: "416", playerName: "Pascal Siakam" },
    { seasonKey: "2024-25", playerId: "175", playerName: "Shai Gilgeous-Alexander" },
    // 2025-26
    { seasonKey: "2025-26", playerId: "73", playerName: "Jalen Brunson" },
    { seasonKey: "2025-26", playerId: "56677822", playerName: "Victor Wembanyama" },
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
  { playerId: "367", playerName: "Chris Paul", count: 12 },
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
  { playerId: "219", playerName: "Al Horford", count: 5 },
  { playerId: "57", playerName: "Devin Booker", count: 5 },
  { playerId: "70", playerName: "Jaylen Brown", count: 5 },
  { playerId: "185", playerName: "Draymond Green", count: 4 },
  { playerId: "416", playerName: "Pascal Siakam", count: 4 },
  { playerId: "3547238", playerName: "Anthony Edwards", count: 4 },
  { playerId: "175", playerName: "Shai Gilgeous-Alexander", count: 4 },
  { playerId: "37", playerName: "Bradley Beal", count: 3 },
  { playerId: "387", playerName: "Julius Randle", count: 3 },
  { playerId: "666786", playerName: "Ja Morant", count: 3 },
  { playerId: "73", playerName: "Jalen Brunson", count: 3 },
  { playerId: "406", playerName: "Domantas Sabonis", count: 3 },
  { playerId: "315", playerName: "Khris Middleton", count: 3 },
  { playerId: "4", playerName: "Bam Adebayo", count: 3 },
  { playerId: "176", playerName: "Rudy Gobert", count: 3 },
  { playerId: "666969", playerName: "Zion Williamson", count: 2 },
  { playerId: "490", playerName: "Trae Young", count: 2 },
  { playerId: "227", playerName: "Brandon Ingram", count: 2 },
  { playerId: "231", playerName: "Jaren Jackson Jr.", count: 2 },
  { playerId: "3547245", playerName: "Tyrese Haliburton", count: 2 },
  { playerId: "3547254", playerName: "Tyrese Maxey", count: 2 },
  { playerId: "17896055", playerName: "Scottie Barnes", count: 2 },
  { playerId: "56677822", playerName: "Victor Wembanyama", count: 2 },
  { playerId: "17896062", playerName: "Alperen Sengun", count: 2 },
  { playerId: "17896075", playerName: "Cade Cunningham", count: 2 },
  { playerId: "268", playerName: "Zach LaVine", count: 2 },
  { playerId: "460", playerName: "Nikola Vucevic", count: 2 },
  { playerId: "137", playerName: "Andre Drummond", count: 2 },
  { playerId: "214", playerName: "Jrue Holiday", count: 2 },
  { playerId: "161", playerName: "De'Aaron Fox", count: 2 },
  { playerId: "38017694", playerName: "Jalen Duren", count: 1 },
  { playerId: "17896040", playerName: "Jalen Johnson", count: 1 },
  { playerId: "38017685", playerName: "Chet Holmgren", count: 1 },
  { playerId: "38017703", playerName: "Jalen Williams", count: 1 },
  { playerId: "3547242", playerName: "Deni Avdija", count: 1 },
  { playerId: "335", playerName: "Jamal Murray", count: 1 },
  { playerId: "380", playerName: "Norman Powell", count: 1 },
  { playerId: "458", playerName: "Fred VanVleet", count: 1 },
  { playerId: "22", playerName: "Deandre Ayton", count: 1 },
  { playerId: "475", playerName: "Andrew Wiggins", count: 1 },
  { playerId: "378", playerName: "Kristaps Porzingis", count: 1 },
  { playerId: "297", playerName: "Lauri Markkanen", count: 1 },
  { playerId: "104", playerName: "Mike Conley", count: 1 },
  { playerId: "61", playerName: "Mikal Bridges", count: 1 },
  { playerId: "182", playerName: "Jerami Grant", count: 1 },
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
