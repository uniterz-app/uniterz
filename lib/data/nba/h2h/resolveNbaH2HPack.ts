import type {
  NbaH2HGameCard,
  NbaH2HAverages,
} from "@/app/component/predict/NbaPostseasonMatchupPanel";
import {
  CLIPPERS_WARRIORS_TEAM_IDS,
  clippersWarriorsH2HAveragesForSides,
  clippersWarriorsH2HGames,
} from "./clippers-warriors-regular-2526";
import {
  HEAT_HORNETS_TEAM_IDS,
  heatHornetsH2HAveragesForSides,
  heatHornetsH2HGames,
} from "./heat-hornets-regular-2526";
import {
  HAWKS_KNICKS_TEAM_IDS,
  hawksKnicksH2HAveragesForSides,
  hawksKnicksH2HGames,
} from "./hawks-knicks-regular-2526";
import {
  LAKERS_ROCKETS_TEAM_IDS,
  lakersRocketsH2HAveragesForSides,
  lakersRocketsH2HGames,
} from "./lakers-rockets-regular-2526";
import {
  MIN_DEN_TEAM_IDS,
  minDenH2HAveragesForSides,
  minDenH2HGames,
} from "./min-den-regular-2526";
import {
  SIXERS_MAGIC_TEAM_IDS,
  sixersMagicH2HAveragesForSides,
  sixersMagicH2HGames,
} from "./sixers-magic-regular-2526";
import {
  SUNS_BLAZERS_TEAM_IDS,
  sunsBlazersH2HAveragesForSides,
  sunsBlazersH2HGames,
} from "./suns-blazers-regular-2526";
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

function idsAreMinDen(homeTeamId: string, awayTeamId: string): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return MIN_DEN_TEAM_IDS.every((id) => s.has(id));
}

function idsAreHeatHornets(homeTeamId: string, awayTeamId: string): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return HEAT_HORNETS_TEAM_IDS.every((id) => s.has(id));
}

function idsAreHawksKnicks(homeTeamId: string, awayTeamId: string): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return HAWKS_KNICKS_TEAM_IDS.every((id) => s.has(id));
}

function idsAreLakersRockets(homeTeamId: string, awayTeamId: string): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return LAKERS_ROCKETS_TEAM_IDS.every((id) => s.has(id));
}

function idsAreSunsBlazers(homeTeamId: string, awayTeamId: string): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return SUNS_BLAZERS_TEAM_IDS.every((id) => s.has(id));
}

function idsAreSixersMagic(homeTeamId: string, awayTeamId: string): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return SIXERS_MAGIC_TEAM_IDS.every((id) => s.has(id));
}

function idsAreClippersWarriors(homeTeamId: string, awayTeamId: string): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return CLIPPERS_WARRIORS_TEAM_IDS.every((id) => s.has(id));
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

function namesLookMinDen(homeName?: string, awayName?: string): boolean {
  const blob = `${(homeName ?? "").toLowerCase()} ${(awayName ?? "").toLowerCase()}`;
  return blob.includes("nugget") && blob.includes("timberwolf");
}

function inferMinDenIdsFromNames(
  homeName?: string,
  awayName?: string
): { homeTeamId: string; awayTeamId: string } | null {
  if (!namesLookMinDen(homeName, awayName)) return null;
  const hn = (homeName ?? "").toLowerCase();
  const an = (awayName ?? "").toLowerCase();
  let hid = "";
  let aid = "";
  if (hn.includes("nugget")) hid = "nba-nuggets";
  else if (hn.includes("timberwolf")) hid = "nba-timberwolves";
  if (an.includes("nugget")) aid = "nba-nuggets";
  else if (an.includes("timberwolf")) aid = "nba-timberwolves";
  if (!hid || !aid || hid === aid) return null;
  return { homeTeamId: hid, awayTeamId: aid };
}

function namesLookHeatHornets(homeName?: string, awayName?: string): boolean {
  const blob = `${(homeName ?? "").toLowerCase()} ${(awayName ?? "").toLowerCase()}`;
  return blob.includes("heat") && blob.includes("hornet");
}

function inferHeatHornetsIdsFromNames(
  homeName?: string,
  awayName?: string
): { homeTeamId: string; awayTeamId: string } | null {
  if (!namesLookHeatHornets(homeName, awayName)) return null;
  const hn = (homeName ?? "").toLowerCase();
  const an = (awayName ?? "").toLowerCase();
  let hid = "";
  let aid = "";
  if (hn.includes("heat")) hid = "nba-heat";
  else if (hn.includes("hornet")) hid = "nba-hornets";
  if (an.includes("heat")) aid = "nba-heat";
  else if (an.includes("hornet")) aid = "nba-hornets";
  if (!hid || !aid || hid === aid) return null;
  return { homeTeamId: hid, awayTeamId: aid };
}

function namesLookHawksKnicks(homeName?: string, awayName?: string): boolean {
  const blob = `${(homeName ?? "").toLowerCase()} ${(awayName ?? "").toLowerCase()}`;
  return blob.includes("hawk") && blob.includes("knick");
}

function inferHawksKnicksIdsFromNames(
  homeName?: string,
  awayName?: string
): { homeTeamId: string; awayTeamId: string } | null {
  if (!namesLookHawksKnicks(homeName, awayName)) return null;
  const hn = (homeName ?? "").toLowerCase();
  const an = (awayName ?? "").toLowerCase();
  let hid = "";
  let aid = "";
  if (hn.includes("hawk")) hid = "nba-hawks";
  else if (hn.includes("knick")) hid = "nba-knicks";
  if (an.includes("hawk")) aid = "nba-hawks";
  else if (an.includes("knick")) aid = "nba-knicks";
  if (!hid || !aid || hid === aid) return null;
  return { homeTeamId: hid, awayTeamId: aid };
}

function namesLookClippersWarriors(
  homeName?: string,
  awayName?: string
): boolean {
  const blob = `${(homeName ?? "").toLowerCase()} ${(awayName ?? "").toLowerCase()}`;
  const hasClipper = blob.includes("clipper");
  const hasWarrior =
    blob.includes("warrior") || blob.includes("golden state");
  return hasClipper && hasWarrior;
}

function inferClippersWarriorsIdsFromNames(
  homeName?: string,
  awayName?: string
): { homeTeamId: string; awayTeamId: string } | null {
  if (!namesLookClippersWarriors(homeName, awayName)) return null;
  const hn = (homeName ?? "").toLowerCase();
  const an = (awayName ?? "").toLowerCase();
  let hid = "";
  let aid = "";
  if (hn.includes("clipper")) hid = "nba-clippers";
  else if (hn.includes("warrior") || hn.includes("golden state"))
    hid = "nba-warriors";
  if (an.includes("clipper")) aid = "nba-clippers";
  else if (an.includes("warrior") || an.includes("golden state"))
    aid = "nba-warriors";
  if (!hid || !aid || hid === aid) return null;
  return { homeTeamId: hid, awayTeamId: aid };
}

function namesLookSixersMagic(homeName?: string, awayName?: string): boolean {
  const blob = `${(homeName ?? "").toLowerCase()} ${(awayName ?? "").toLowerCase()}`;
  const hasSixers =
    blob.includes("76er") ||
    blob.includes("sixer") ||
    blob.includes("philadelphia");
  const hasMagic = blob.includes("magic") || blob.includes("orlando");
  return hasSixers && hasMagic;
}

function inferSixersMagicIdsFromNames(
  homeName?: string,
  awayName?: string
): { homeTeamId: string; awayTeamId: string } | null {
  if (!namesLookSixersMagic(homeName, awayName)) return null;
  const hn = (homeName ?? "").toLowerCase();
  const an = (awayName ?? "").toLowerCase();
  let hid = "";
  let aid = "";
  if (hn.includes("76er") || hn.includes("sixer") || hn.includes("philadelphia"))
    hid = "nba-76ers";
  else if (hn.includes("magic") || hn.includes("orlando")) hid = "nba-magic";
  if (an.includes("76er") || an.includes("sixer") || an.includes("philadelphia"))
    aid = "nba-76ers";
  else if (an.includes("magic") || an.includes("orlando")) aid = "nba-magic";
  if (!hid || !aid || hid === aid) return null;
  return { homeTeamId: hid, awayTeamId: aid };
}

function namesLookSunsBlazers(homeName?: string, awayName?: string): boolean {
  const blob = `${(homeName ?? "").toLowerCase()} ${(awayName ?? "").toLowerCase()}`;
  return (
    (blob.includes("suns") || blob.includes("phoenix")) &&
    blob.includes("blazer")
  );
}

function inferSunsBlazersIdsFromNames(
  homeName?: string,
  awayName?: string
): { homeTeamId: string; awayTeamId: string } | null {
  if (!namesLookSunsBlazers(homeName, awayName)) return null;
  const hn = (homeName ?? "").toLowerCase();
  const an = (awayName ?? "").toLowerCase();
  let hid = "";
  let aid = "";
  if (hn.includes("suns") || hn.includes("phoenix")) hid = "nba-suns";
  else if (hn.includes("blazer")) hid = "nba-blazers";
  if (an.includes("suns") || an.includes("phoenix")) aid = "nba-suns";
  else if (an.includes("blazer")) aid = "nba-blazers";
  if (!hid || !aid || hid === aid) return null;
  return { homeTeamId: hid, awayTeamId: aid };
}

function namesLookLakersRockets(homeName?: string, awayName?: string): boolean {
  const blob = `${(homeName ?? "").toLowerCase()} ${(awayName ?? "").toLowerCase()}`;
  return blob.includes("laker") && blob.includes("rocket");
}

function inferLakersRocketsIdsFromNames(
  homeName?: string,
  awayName?: string
): { homeTeamId: string; awayTeamId: string } | null {
  if (!namesLookLakersRockets(homeName, awayName)) return null;
  const hn = (homeName ?? "").toLowerCase();
  const an = (awayName ?? "").toLowerCase();
  let hid = "";
  let aid = "";
  if (hn.includes("laker")) hid = "nba-lakers";
  else if (hn.includes("rocket")) hid = "nba-rockets";
  if (an.includes("laker")) aid = "nba-lakers";
  else if (an.includes("rocket")) aid = "nba-rockets";
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
    const inferredTorCle = inferTorCleIdsFromNames(homeName, awayName);
    const inferredMinDen = inferMinDenIdsFromNames(homeName, awayName);
    const inferredHawksKnicks = inferHawksKnicksIdsFromNames(
      homeName,
      awayName
    );
    const inferredHeatHornets = inferHeatHornetsIdsFromNames(
      homeName,
      awayName
    );
    const inferredSunsBlazers = inferSunsBlazersIdsFromNames(
      homeName,
      awayName
    );
    const inferredSixersMagic = inferSixersMagicIdsFromNames(
      homeName,
      awayName
    );
    const inferredClippersWarriors = inferClippersWarriorsIdsFromNames(
      homeName,
      awayName
    );
    const inferredLakersRockets = inferLakersRocketsIdsFromNames(
      homeName,
      awayName
    );
    const inferred =
      inferredTorCle ??
      inferredMinDen ??
      inferredHawksKnicks ??
      inferredHeatHornets ??
      inferredSunsBlazers ??
      inferredSixersMagic ??
      inferredClippersWarriors ??
      inferredLakersRockets;
    if (!inferred) return null;
    hid = inferred.homeTeamId;
    aid = inferred.awayTeamId;
  }

  if (idsAreTorCle(hid, aid)) {
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

  if (idsAreMinDen(hid, aid)) {
    const h2hAverages = minDenH2HAveragesForSides({
      homeTeamId: hid,
      awayTeamId: aid,
    });
    if (!h2hAverages) return null;
    return {
      games: minDenH2HGames,
      h2hAverages,
      seriesRecord: computeH2hSeriesRecord(minDenH2HGames),
    };
  }

  if (idsAreHawksKnicks(hid, aid)) {
    const h2hAverages = hawksKnicksH2HAveragesForSides({
      homeTeamId: hid,
      awayTeamId: aid,
    });
    if (!h2hAverages) return null;
    return {
      games: hawksKnicksH2HGames,
      h2hAverages,
      seriesRecord: computeH2hSeriesRecord(hawksKnicksH2HGames),
    };
  }

  if (idsAreHeatHornets(hid, aid)) {
    const h2hAverages = heatHornetsH2HAveragesForSides({
      homeTeamId: hid,
      awayTeamId: aid,
    });
    if (!h2hAverages) return null;
    return {
      games: heatHornetsH2HGames,
      h2hAverages,
      seriesRecord: computeH2hSeriesRecord(heatHornetsH2HGames),
    };
  }

  if (idsAreSunsBlazers(hid, aid)) {
    const h2hAverages = sunsBlazersH2HAveragesForSides({
      homeTeamId: hid,
      awayTeamId: aid,
    });
    if (!h2hAverages) return null;
    return {
      games: sunsBlazersH2HGames,
      h2hAverages,
      seriesRecord: computeH2hSeriesRecord(sunsBlazersH2HGames),
    };
  }

  if (idsAreSixersMagic(hid, aid)) {
    const h2hAverages = sixersMagicH2HAveragesForSides({
      homeTeamId: hid,
      awayTeamId: aid,
    });
    if (!h2hAverages) return null;
    return {
      games: sixersMagicH2HGames,
      h2hAverages,
      seriesRecord: computeH2hSeriesRecord(sixersMagicH2HGames),
    };
  }

  if (idsAreClippersWarriors(hid, aid)) {
    const h2hAverages = clippersWarriorsH2HAveragesForSides({
      homeTeamId: hid,
      awayTeamId: aid,
    });
    if (!h2hAverages) return null;
    return {
      games: clippersWarriorsH2HGames,
      h2hAverages,
      seriesRecord: computeH2hSeriesRecord(clippersWarriorsH2HGames),
    };
  }

  if (idsAreLakersRockets(hid, aid)) {
    const h2hAverages = lakersRocketsH2HAveragesForSides({
      homeTeamId: hid,
      awayTeamId: aid,
    });
    if (!h2hAverages) return null;
    return {
      games: lakersRocketsH2HGames,
      h2hAverages,
      seriesRecord: computeH2hSeriesRecord(lakersRocketsH2HGames),
    };
  }

  return null;
}
