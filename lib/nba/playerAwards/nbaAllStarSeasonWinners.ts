/**
 * All-Star 選出（シーズンキー単位・現役中心）。
 * キャリア表チップ用。回数は行数から集計可能。
 *
 * seasonKey "2019-20" = 2020 年 2 月の All-Star Game。
 */

type AllStarSeasonRow = {
  seasonKey: string;
  playerId: string;
  playerName: string;
};

type AllStarPlayerSeasons = {
  playerName: string;
  seasons: readonly string[];
};

const NBA_ALL_STAR_BY_PLAYER: Readonly<Record<string, AllStarPlayerSeasons>> = {
  "237": {
    playerName: "LeBron James",
    seasons: [
      "2004-05",
      "2005-06",
      "2006-07",
      "2007-08",
      "2008-09",
      "2009-10",
      "2010-11",
      "2011-12",
      "2012-13",
      "2013-14",
      "2014-15",
      "2015-16",
      "2016-17",
      "2017-18",
      "2018-19",
      "2019-20",
      "2020-21",
      "2021-22",
      "2022-23",
      "2023-24",
      "2024-25",
      "2025-26",
    ],
  },
  "140": {
    playerName: "Kevin Durant",
    seasons: [
      "2009-10",
      "2010-11",
      "2011-12",
      "2012-13",
      "2013-14",
      "2014-15",
      "2015-16",
      "2016-17",
      "2017-18",
      "2018-19",
      "2020-21",
      "2021-22",
      "2022-23",
      "2023-24",
      "2024-25",
      "2025-26",
    ],
  },
  "115": {
    playerName: "Stephen Curry",
    seasons: [
      "2013-14",
      "2014-15",
      "2015-16",
      "2016-17",
      "2017-18",
      "2018-19",
      "2020-21",
      "2021-22",
      "2022-23",
      "2023-24",
      "2024-25",
      "2025-26",
    ],
  },
  "367": {
    playerName: "Chris Paul",
    seasons: [
      "2007-08",
      "2008-09",
      "2009-10",
      "2010-11",
      "2011-12",
      "2012-13",
      "2013-14",
      "2014-15",
      "2015-16",
      "2019-20",
      "2020-21",
      "2021-22",
    ],
  },
  "192": {
    playerName: "James Harden",
    seasons: [
      "2012-13",
      "2013-14",
      "2014-15",
      "2015-16",
      "2016-17",
      "2017-18",
      "2018-19",
      "2019-20",
      "2020-21",
      "2021-22",
      "2024-25",
    ],
  },
  "15": {
    playerName: "Giannis Antetokounmpo",
    seasons: [
      "2016-17",
      "2017-18",
      "2018-19",
      "2019-20",
      "2020-21",
      "2021-22",
      "2022-23",
      "2023-24",
      "2024-25",
      "2025-26",
    ],
  },
  "117": {
    playerName: "Anthony Davis",
    seasons: [
      "2013-14",
      "2014-15",
      "2015-16",
      "2016-17",
      "2017-18",
      "2018-19",
      "2019-20",
      "2020-21",
      "2023-24",
      "2024-25",
    ],
  },
  "228": {
    playerName: "Kyrie Irving",
    seasons: [
      "2012-13",
      "2013-14",
      "2014-15",
      "2016-17",
      "2017-18",
      "2018-19",
      "2020-21",
      "2022-23",
      "2024-25",
    ],
  },
  "472": {
    playerName: "Russell Westbrook",
    seasons: [
      "2010-11",
      "2011-12",
      "2012-13",
      "2014-15",
      "2015-16",
      "2016-17",
      "2017-18",
      "2018-19",
      "2019-20",
    ],
  },
  "246": {
    playerName: "Nikola Jokic",
    seasons: [
      "2018-19",
      "2019-20",
      "2020-21",
      "2021-22",
      "2022-23",
      "2023-24",
      "2024-25",
      "2025-26",
    ],
  },
  "145": {
    playerName: "Joel Embiid",
    seasons: [
      "2017-18",
      "2018-19",
      "2019-20",
      "2020-21",
      "2021-22",
      "2022-23",
      "2023-24",
    ],
  },
  "172": {
    playerName: "Paul George",
    seasons: [
      "2012-13",
      "2013-14",
      "2015-16",
      "2016-17",
      "2017-18",
      "2018-19",
      "2020-21",
      "2022-23",
      "2023-24",
    ],
  },
  "278": {
    playerName: "Damian Lillard",
    seasons: [
      "2013-14",
      "2014-15",
      "2017-18",
      "2018-19",
      "2019-20",
      "2020-21",
      "2022-23",
      "2023-24",
      "2024-25",
    ],
  },
  "274": {
    playerName: "Kawhi Leonard",
    seasons: [
      "2015-16",
      "2016-17",
      "2018-19",
      "2019-20",
      "2020-21",
      "2023-24",
      "2025-26",
    ],
  },
  "322": {
    playerName: "Donovan Mitchell",
    seasons: [
      "2019-20",
      "2020-21",
      "2021-22",
      "2022-23",
      "2023-24",
      "2024-25",
      "2025-26",
    ],
  },
  "125": {
    playerName: "DeMar DeRozan",
    seasons: [
      "2013-14",
      "2015-16",
      "2016-17",
      "2017-18",
      "2021-22",
      "2022-23",
    ],
  },
  "286": {
    playerName: "Kyle Lowry",
    seasons: [
      "2014-15",
      "2015-16",
      "2016-17",
      "2017-18",
      "2018-19",
      "2019-20",
    ],
  },
  "434": {
    playerName: "Jayson Tatum",
    seasons: [
      "2019-20",
      "2020-21",
      "2021-22",
      "2022-23",
      "2023-24",
      "2024-25",
    ],
  },
  "132": {
    playerName: "Luka Doncic",
    seasons: [
      "2019-20",
      "2020-21",
      "2021-22",
      "2022-23",
      "2023-24",
      "2025-26",
    ],
  },
  "447": {
    playerName: "Karl-Anthony Towns",
    seasons: [
      "2017-18",
      "2018-19",
      "2021-22",
      "2023-24",
      "2024-25",
      "2025-26",
    ],
  },
  "443": {
    playerName: "Klay Thompson",
    seasons: ["2014-15", "2015-16", "2016-17", "2017-18", "2018-19"],
  },
  "219": {
    playerName: "Al Horford",
    seasons: ["2009-10", "2010-11", "2014-15", "2015-16", "2017-18"],
  },
  "57": {
    playerName: "Devin Booker",
    seasons: ["2019-20", "2020-21", "2021-22", "2023-24", "2025-26"],
  },
  "70": {
    playerName: "Jaylen Brown",
    seasons: ["2020-21", "2022-23", "2023-24", "2024-25", "2025-26"],
  },
  "185": {
    playerName: "Draymond Green",
    seasons: ["2015-16", "2016-17", "2017-18", "2021-22"],
  },
  "416": {
    playerName: "Pascal Siakam",
    seasons: ["2019-20", "2022-23", "2024-25", "2025-26"],
  },
  "3547238": {
    playerName: "Anthony Edwards",
    seasons: ["2022-23", "2023-24", "2024-25", "2025-26"],
  },
  "175": {
    playerName: "Shai Gilgeous-Alexander",
    seasons: ["2022-23", "2023-24", "2024-25", "2025-26"],
  },
  "37": {
    playerName: "Bradley Beal",
    seasons: ["2017-18", "2018-19", "2020-21"],
  },
  "387": {
    playerName: "Julius Randle",
    seasons: ["2020-21", "2022-23", "2023-24"],
  },
  "666786": {
    playerName: "Ja Morant",
    seasons: ["2021-22", "2022-23"],
  },
  "73": {
    playerName: "Jalen Brunson",
    seasons: ["2023-24", "2024-25", "2025-26"],
  },
  "406": {
    playerName: "Domantas Sabonis",
    seasons: ["2019-20", "2020-21", "2022-23"],
  },
  "315": {
    playerName: "Khris Middleton",
    seasons: ["2018-19", "2019-20", "2021-22"],
  },
  "4": {
    playerName: "Bam Adebayo",
    seasons: ["2019-20", "2022-23", "2023-24"],
  },
  "176": {
    playerName: "Rudy Gobert",
    seasons: ["2019-20", "2020-21", "2021-22"],
  },
  "666969": {
    playerName: "Zion Williamson",
    seasons: ["2020-21", "2022-23"],
  },
  "490": {
    playerName: "Trae Young",
    seasons: ["2019-20", "2021-22", "2023-24", "2024-25"],
  },
  "227": {
    playerName: "Brandon Ingram",
    seasons: ["2019-20", "2025-26"],
  },
  "231": {
    playerName: "Jaren Jackson Jr.",
    seasons: ["2022-23", "2024-25"],
  },
  "3547245": {
    playerName: "Tyrese Haliburton",
    seasons: ["2022-23", "2023-24"],
  },
  "3547254": {
    playerName: "Tyrese Maxey",
    seasons: ["2023-24", "2025-26"],
  },
  "17896055": {
    playerName: "Scottie Barnes",
    seasons: ["2023-24", "2025-26"],
  },
  "56677822": {
    playerName: "Victor Wembanyama",
    seasons: ["2024-25", "2025-26"],
  },
  "17896062": {
    playerName: "Alperen Sengun",
    seasons: ["2024-25", "2025-26"],
  },
  "17896075": {
    playerName: "Cade Cunningham",
    seasons: ["2024-25", "2025-26"],
  },
  "268": {
    playerName: "Zach LaVine",
    seasons: ["2020-21", "2021-22"],
  },
  "460": {
    playerName: "Nikola Vucevic",
    seasons: ["2018-19", "2020-21"],
  },
  "137": {
    playerName: "Andre Drummond",
    seasons: ["2015-16", "2017-18"],
  },
  "214": {
    playerName: "Jrue Holiday",
    seasons: ["2012-13", "2022-23"],
  },
  "161": {
    playerName: "De'Aaron Fox",
    seasons: ["2022-23", "2025-26"],
  },
  "335": {
    playerName: "Jamal Murray",
    seasons: ["2025-26"],
  },
  "380": {
    playerName: "Norman Powell",
    seasons: ["2025-26"],
  },
  "475": {
    playerName: "Andrew Wiggins",
    seasons: ["2021-22"],
  },
  "378": {
    playerName: "Kristaps Porzingis",
    seasons: ["2017-18"],
  },
  "297": {
    playerName: "Lauri Markkanen",
    seasons: ["2022-23"],
  },
};

function flattenAllStarSeasons(): AllStarSeasonRow[] {
  const out: AllStarSeasonRow[] = [];
  for (const [playerId, row] of Object.entries(NBA_ALL_STAR_BY_PLAYER)) {
    for (const seasonKey of row.seasons) {
      out.push({
        seasonKey,
        playerId,
        playerName: row.playerName,
      });
    }
  }
  return out;
}

export const NBA_ALL_STAR_SEASON_WINNERS: readonly AllStarSeasonRow[] =
  flattenAllStarSeasons();
