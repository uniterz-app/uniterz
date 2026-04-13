import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";
import {
  TOR_CLE_TEAM_IDS,
  torCleH2HAveragesForSides,
  torCleH2HGames,
} from "./tor-cle-regular-2526";

export type NbaH2HSeriesRecord = {
  leftTeamDisplay: string;
  rightTeamDisplay: string;
  leftWins: number;
  rightWins: number;
};

export type NbaH2HPack = {
  games: NbaH2HGameCard[];
  h2hAverages: NbaH2HAverages;
  /** H2Hカードと同じ並び（左–右）のシーズン対戦勝数 */
  seriesRecord: NbaH2HSeriesRecord | null;
};

export function computeH2hSeriesRecord(
  games: NbaH2HGameCard[]
): NbaH2HSeriesRecord | null {
  if (!games.length) return null;
  const { leftTeamDisplay, rightTeamDisplay } = games[0];
  let leftWins = 0;
  let rightWins = 0;
  for (const g of games) {
    if (g.scoreLeft == null || g.scoreRight == null) return null;
    if (g.scoreLeft > g.scoreRight) leftWins += 1;
    else if (g.scoreRight > g.scoreLeft) rightWins += 1;
  }
  return { leftTeamDisplay, rightTeamDisplay, leftWins, rightWins };
}

function idsAreTorCle(homeTeamId: string, awayTeamId: string): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return TOR_CLE_TEAM_IDS.every((id) => s.has(id));
}

function namesLookTorCle(homeName?: string, awayName?: string): boolean {
  const blob = `${(homeName ?? "").toLowerCase()} ${(awayName ?? "").toLowerCase()}`;
  return blob.includes("raptor") && blob.includes("cavalier");
}

function inferTorCleIdsFromNames(
  homeName?: string,
  awayName?: string
): { homeTeamId: string; awayTeamId: string } | null {
  if (!namesLookTorCle(homeName, awayName)) return null;
  const hn = (homeName ?? "").toLowerCase();
  const an = (awayName ?? "").toLowerCase();
  let hid = "";
  let aid = "";
  if (hn.includes("raptor")) hid = "nba-raptors";
  else if (hn.includes("cavalier")) hid = "nba-cavaliers";
  if (an.includes("raptor")) aid = "nba-raptors";
  else if (an.includes("cavalier")) aid = "nba-cavaliers";
  if (!hid || !aid || hid === aid) return null;
  return { homeTeamId: hid, awayTeamId: aid };
}

/** Playoffs H2H tab: games + averages when this NBA pair is supported. */
export function resolveNbaH2HPack(
  homeTeamId: string | null | undefined,
  awayTeamId: string | null | undefined,
  homeName: string | undefined,
  awayName: string | undefined
): NbaH2HPack | null {
  let hid = (homeTeamId ?? "").trim();
  let aid = (awayTeamId ?? "").trim();

  if (!hid || !aid) {
    const inferred = inferTorCleIdsFromNames(homeName, awayName);
    if (!inferred) return null;
    hid = inferred.homeTeamId;
    aid = inferred.awayTeamId;
  }

  if (!idsAreTorCle(hid, aid)) return null;

  const h2hAverages = torCleH2HAveragesForSides({
    homeTeamId: hid,
    awayTeamId: aid,
  });
  if (!h2hAverages) return null;
  return {
    games: torCleH2HGames,
    h2hAverages,
    seriesRecord: computeH2hSeriesRecord(torCleH2HGames),
  };
}
