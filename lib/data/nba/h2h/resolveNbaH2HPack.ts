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
  MAGIC_HORNETS_TEAM_IDS,
  magicHornetsH2HAveragesForSides,
  magicHornetsH2HGames,
} from "./magic-hornets-regular-2526";
import {
  MAGIC_PISTONS_TEAM_IDS,
  magicPistonsH2HAveragesForSides,
  magicPistonsH2HGames,
} from "./magic-pistons-regular-2526";
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
  SIXERS_CELTICS_TEAM_IDS,
  sixersCelticsH2HAveragesForSides,
  sixersCelticsH2HGames,
} from "./sixers-celtics-regular-2526";
import {
  SPURS_BLAZERS_TEAM_IDS,
  spursBlazersH2HAveragesForSides,
  spursBlazersH2HGames,
} from "./spurs-blazers-regular-2526";
import {
  SPURS_TIMBERWOLVES_TEAM_IDS,
  spursTimberwolvesH2HAveragesForSides,
  spursTimberwolvesH2HGames,
} from "./spurs-timberwolves-regular-2526";
import {
  SUNS_BLAZERS_TEAM_IDS,
  sunsBlazersH2HAveragesForSides,
  sunsBlazersH2HGames,
} from "./suns-blazers-regular-2526";
import {
  THUNDER_LAKERS_TEAM_IDS,
  thunderLakersH2HAveragesForSides,
  thunderLakersH2HGames,
} from "./thunder-lakers-regular-2526";
import {
  THUNDER_SUNS_TEAM_IDS,
  thunderSunsH2HAveragesForSides,
  thunderSunsH2HGames,
} from "./thunder-suns-regular-2526";
import {
  TOR_CLE_TEAM_IDS,
  torCleH2HAveragesForSides,
  torCleH2HGames,
} from "./tor-cle-regular-2526";
import {
  WARRIORS_SUNS_TEAM_IDS,
  warriorsSunsH2HAveragesForSides,
  warriorsSunsH2HGames,
} from "./warriors-suns-regular-2526";

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

function idsAreMagicPistons(homeTeamId: string, awayTeamId: string): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return MAGIC_PISTONS_TEAM_IDS.every((id) => s.has(id));
}

function idsAreMagicHornets(homeTeamId: string, awayTeamId: string): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return MAGIC_HORNETS_TEAM_IDS.every((id) => s.has(id));
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

function idsAreWarriorsSuns(homeTeamId: string, awayTeamId: string): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return WARRIORS_SUNS_TEAM_IDS.every((id) => s.has(id));
}

function idsAreThunderLakers(homeTeamId: string, awayTeamId: string): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return THUNDER_LAKERS_TEAM_IDS.every((id) => s.has(id));
}

function idsAreThunderSuns(homeTeamId: string, awayTeamId: string): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return THUNDER_SUNS_TEAM_IDS.every((id) => s.has(id));
}

function idsAreSpursBlazers(homeTeamId: string, awayTeamId: string): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return SPURS_BLAZERS_TEAM_IDS.every((id) => s.has(id));
}

function idsAreSpursTimberwolves(
  homeTeamId: string,
  awayTeamId: string
): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return SPURS_TIMBERWOLVES_TEAM_IDS.every((id) => s.has(id));
}

function idsAreSixersMagic(homeTeamId: string, awayTeamId: string): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return SIXERS_MAGIC_TEAM_IDS.every((id) => s.has(id));
}

function idsAreSixersCeltics(homeTeamId: string, awayTeamId: string): boolean {
  const s = new Set([homeTeamId, awayTeamId]);
  return SIXERS_CELTICS_TEAM_IDS.every((id) => s.has(id));
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

function namesLookMagicPistons(homeName?: string, awayName?: string): boolean {
  const blob = `${(homeName ?? "").toLowerCase()} ${(awayName ?? "").toLowerCase()}`;
  const hasPiston = blob.includes("piston") || blob.includes("detroit");
  const hasMagic = blob.includes("magic") || blob.includes("orlando");
  return hasPiston && hasMagic;
}

function inferMagicPistonsIdsFromNames(
  homeName?: string,
  awayName?: string
): { homeTeamId: string; awayTeamId: string } | null {
  if (!namesLookMagicPistons(homeName, awayName)) return null;
  const hn = (homeName ?? "").toLowerCase();
  const an = (awayName ?? "").toLowerCase();
  let hid = "";
  let aid = "";
  if (hn.includes("piston") || hn.includes("detroit")) hid = "nba-pistons";
  else if (hn.includes("magic") || hn.includes("orlando")) hid = "nba-magic";
  if (an.includes("piston") || an.includes("detroit")) aid = "nba-pistons";
  else if (an.includes("magic") || an.includes("orlando")) aid = "nba-magic";
  if (!hid || !aid || hid === aid) return null;
  return { homeTeamId: hid, awayTeamId: aid };
}

function namesLookMagicHornets(homeName?: string, awayName?: string): boolean {
  const blob = `${(homeName ?? "").toLowerCase()} ${(awayName ?? "").toLowerCase()}`;
  const hasSixers =
    blob.includes("76er") ||
    blob.includes("sixer") ||
    blob.includes("philadelphia");
  if (hasSixers) return false;
  if (namesLookMagicPistons(homeName, awayName)) return false;
  return (
    blob.includes("hornet") &&
    (blob.includes("magic") || blob.includes("orlando"))
  );
}

function inferMagicHornetsIdsFromNames(
  homeName?: string,
  awayName?: string
): { homeTeamId: string; awayTeamId: string } | null {
  if (!namesLookMagicHornets(homeName, awayName)) return null;
  const hn = (homeName ?? "").toLowerCase();
  const an = (awayName ?? "").toLowerCase();
  let hid = "";
  let aid = "";
  if (hn.includes("hornet")) hid = "nba-hornets";
  else if (hn.includes("magic") || hn.includes("orlando")) hid = "nba-magic";
  if (an.includes("hornet")) aid = "nba-hornets";
  else if (an.includes("magic") || an.includes("orlando")) aid = "nba-magic";
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

function namesLookSixersCeltics(homeName?: string, awayName?: string): boolean {
  const blob = `${(homeName ?? "").toLowerCase()} ${(awayName ?? "").toLowerCase()}`;
  const hasSixers =
    blob.includes("76er") ||
    blob.includes("sixer") ||
    blob.includes("philadelphia");
  const hasCeltic =
    blob.includes("celtic") || blob.includes("boston");
  return hasSixers && hasCeltic;
}

function inferSixersCelticsIdsFromNames(
  homeName?: string,
  awayName?: string
): { homeTeamId: string; awayTeamId: string } | null {
  if (!namesLookSixersCeltics(homeName, awayName)) return null;
  const hn = (homeName ?? "").toLowerCase();
  const an = (awayName ?? "").toLowerCase();
  let hid = "";
  let aid = "";
  if (hn.includes("76er") || hn.includes("sixer") || hn.includes("philadelphia"))
    hid = "nba-76ers";
  else if (hn.includes("celtic") || hn.includes("boston")) hid = "nba-celtics";
  if (an.includes("76er") || an.includes("sixer") || an.includes("philadelphia"))
    aid = "nba-76ers";
  else if (an.includes("celtic") || an.includes("boston")) aid = "nba-celtics";
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

function namesLookWarriorsSuns(homeName?: string, awayName?: string): boolean {
  const blob = `${(homeName ?? "").toLowerCase()} ${(awayName ?? "").toLowerCase()}`;
  const hasSuns = blob.includes("suns") || blob.includes("phoenix");
  const hasWarrior =
    blob.includes("warrior") || blob.includes("golden state");
  return hasSuns && hasWarrior;
}

function inferWarriorsSunsIdsFromNames(
  homeName?: string,
  awayName?: string
): { homeTeamId: string; awayTeamId: string } | null {
  if (!namesLookWarriorsSuns(homeName, awayName)) return null;
  const hn = (homeName ?? "").toLowerCase();
  const an = (awayName ?? "").toLowerCase();
  let hid = "";
  let aid = "";
  if (hn.includes("suns") || hn.includes("phoenix")) hid = "nba-suns";
  else if (hn.includes("warrior") || hn.includes("golden state"))
    hid = "nba-warriors";
  if (an.includes("suns") || an.includes("phoenix")) aid = "nba-suns";
  else if (an.includes("warrior") || an.includes("golden state"))
    aid = "nba-warriors";
  if (!hid || !aid || hid === aid) return null;
  return { homeTeamId: hid, awayTeamId: aid };
}

function namesLookThunderLakers(homeName?: string, awayName?: string): boolean {
  const blob = `${(homeName ?? "").toLowerCase()} ${(awayName ?? "").toLowerCase()}`;
  const hasThunder =
    blob.includes("thunder") ||
    blob.includes("oklahoma") ||
    blob.includes("okc");
  const hasLakers = blob.includes("laker");
  return hasThunder && hasLakers;
}

function inferThunderLakersIdsFromNames(
  homeName?: string,
  awayName?: string
): { homeTeamId: string; awayTeamId: string } | null {
  if (!namesLookThunderLakers(homeName, awayName)) return null;
  const hn = (homeName ?? "").toLowerCase();
  const an = (awayName ?? "").toLowerCase();
  let hid = "";
  let aid = "";
  if (
    hn.includes("thunder") ||
    hn.includes("oklahoma") ||
    hn.includes("okc")
  ) {
    hid = "nba-thunder";
  } else if (hn.includes("laker")) hid = "nba-lakers";
  if (
    an.includes("thunder") ||
    an.includes("oklahoma") ||
    an.includes("okc")
  ) {
    aid = "nba-thunder";
  } else if (an.includes("laker")) aid = "nba-lakers";
  if (!hid || !aid || hid === aid) return null;
  return { homeTeamId: hid, awayTeamId: aid };
}

function namesLookThunderSuns(homeName?: string, awayName?: string): boolean {
  const blob = `${(homeName ?? "").toLowerCase()} ${(awayName ?? "").toLowerCase()}`;
  const hasSuns = blob.includes("suns") || blob.includes("phoenix");
  const hasThunder =
    blob.includes("thunder") ||
    blob.includes("oklahoma") ||
    blob.includes("okc");
  return hasSuns && hasThunder;
}

function inferThunderSunsIdsFromNames(
  homeName?: string,
  awayName?: string
): { homeTeamId: string; awayTeamId: string } | null {
  if (!namesLookThunderSuns(homeName, awayName)) return null;
  const hn = (homeName ?? "").toLowerCase();
  const an = (awayName ?? "").toLowerCase();
  let hid = "";
  let aid = "";
  if (hn.includes("suns") || hn.includes("phoenix")) hid = "nba-suns";
  else if (
    hn.includes("thunder") ||
    hn.includes("oklahoma") ||
    hn.includes("okc")
  ) {
    hid = "nba-thunder";
  }
  if (an.includes("suns") || an.includes("phoenix")) aid = "nba-suns";
  else if (
    an.includes("thunder") ||
    an.includes("oklahoma") ||
    an.includes("okc")
  ) {
    aid = "nba-thunder";
  }
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

function namesLookSpursBlazers(homeName?: string, awayName?: string): boolean {
  const blob = `${(homeName ?? "").toLowerCase()} ${(awayName ?? "").toLowerCase()}`;
  const hasSpurs =
    blob.includes("spur") ||
    blob.includes("san antonio");
  const hasBlazers =
    blob.includes("blazer") ||
    blob.includes("portland");
  return hasSpurs && hasBlazers;
}

function inferSpursBlazersIdsFromNames(
  homeName?: string,
  awayName?: string
): { homeTeamId: string; awayTeamId: string } | null {
  if (!namesLookSpursBlazers(homeName, awayName)) return null;
  const hn = (homeName ?? "").toLowerCase();
  const an = (awayName ?? "").toLowerCase();
  let hid = "";
  let aid = "";
  if (hn.includes("spur") || hn.includes("san antonio")) hid = "nba-spurs";
  else if (hn.includes("blazer") || hn.includes("portland"))
    hid = "nba-blazers";
  if (an.includes("spur") || an.includes("san antonio")) aid = "nba-spurs";
  else if (an.includes("blazer") || an.includes("portland"))
    aid = "nba-blazers";
  if (!hid || !aid || hid === aid) return null;
  return { homeTeamId: hid, awayTeamId: aid };
}

function namesLookSpursTimberwolves(
  homeName?: string,
  awayName?: string
): boolean {
  const blob = `${(homeName ?? "").toLowerCase()} ${(awayName ?? "").toLowerCase()}`;
  const hasSpurs =
    blob.includes("spur") ||
    blob.includes("san antonio");
  const hasWolves =
    blob.includes("timberwolf") ||
    blob.includes("minnesota");
  return hasSpurs && hasWolves;
}

function inferSpursTimberwolvesIdsFromNames(
  homeName?: string,
  awayName?: string
): { homeTeamId: string; awayTeamId: string } | null {
  if (!namesLookSpursTimberwolves(homeName, awayName)) return null;
  const hn = (homeName ?? "").toLowerCase();
  const an = (awayName ?? "").toLowerCase();
  let hid = "";
  let aid = "";
  if (hn.includes("spur") || hn.includes("san antonio")) hid = "nba-spurs";
  else if (hn.includes("timberwolf") || hn.includes("minnesota"))
    hid = "nba-timberwolves";
  if (an.includes("spur") || an.includes("san antonio")) aid = "nba-spurs";
  else if (an.includes("timberwolf") || an.includes("minnesota"))
    aid = "nba-timberwolves";
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
    const inferredMagicPistons = inferMagicPistonsIdsFromNames(
      homeName,
      awayName
    );
    const inferredMagicHornets = inferMagicHornetsIdsFromNames(
      homeName,
      awayName
    );
    const inferredSunsBlazers = inferSunsBlazersIdsFromNames(
      homeName,
      awayName
    );
    const inferredWarriorsSuns = inferWarriorsSunsIdsFromNames(
      homeName,
      awayName
    );
    const inferredThunderLakers = inferThunderLakersIdsFromNames(
      homeName,
      awayName
    );
    const inferredThunderSuns = inferThunderSunsIdsFromNames(
      homeName,
      awayName
    );
    const inferredSixersMagic = inferSixersMagicIdsFromNames(
      homeName,
      awayName
    );
    const inferredSixersCeltics = inferSixersCelticsIdsFromNames(
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
    const inferredSpursBlazers = inferSpursBlazersIdsFromNames(
      homeName,
      awayName
    );
    const inferredSpursTimberwolves = inferSpursTimberwolvesIdsFromNames(
      homeName,
      awayName
    );
    const inferred =
      inferredTorCle ??
      inferredMinDen ??
      inferredHawksKnicks ??
      inferredHeatHornets ??
      inferredMagicPistons ??
      inferredMagicHornets ??
      inferredSunsBlazers ??
      inferredWarriorsSuns ??
      inferredThunderLakers ??
      inferredThunderSuns ??
      inferredSixersMagic ??
      inferredSixersCeltics ??
      inferredClippersWarriors ??
      inferredLakersRockets ??
      inferredSpursTimberwolves ??
      inferredSpursBlazers;
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

  if (idsAreMagicPistons(hid, aid)) {
    const h2hAverages = magicPistonsH2HAveragesForSides({
      homeTeamId: hid,
      awayTeamId: aid,
    });
    if (!h2hAverages) return null;
    return {
      games: magicPistonsH2HGames,
      h2hAverages,
      seriesRecord: computeH2hSeriesRecord(magicPistonsH2HGames),
    };
  }

  if (idsAreMagicHornets(hid, aid)) {
    const h2hAverages = magicHornetsH2HAveragesForSides({
      homeTeamId: hid,
      awayTeamId: aid,
    });
    if (!h2hAverages) return null;
    return {
      games: magicHornetsH2HGames,
      h2hAverages,
      seriesRecord: computeH2hSeriesRecord(magicHornetsH2HGames),
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

  if (idsAreWarriorsSuns(hid, aid)) {
    const h2hAverages = warriorsSunsH2HAveragesForSides({
      homeTeamId: hid,
      awayTeamId: aid,
    });
    if (!h2hAverages) return null;
    return {
      games: warriorsSunsH2HGames,
      h2hAverages,
      seriesRecord: computeH2hSeriesRecord(warriorsSunsH2HGames),
    };
  }

  if (idsAreThunderLakers(hid, aid)) {
    const h2hAverages = thunderLakersH2HAveragesForSides({
      homeTeamId: hid,
      awayTeamId: aid,
    });
    if (!h2hAverages) return null;
    return {
      games: thunderLakersH2HGames,
      h2hAverages,
      seriesRecord: computeH2hSeriesRecord(thunderLakersH2HGames),
    };
  }

  if (idsAreThunderSuns(hid, aid)) {
    const h2hAverages = thunderSunsH2HAveragesForSides({
      homeTeamId: hid,
      awayTeamId: aid,
    });
    if (!h2hAverages) return null;
    return {
      games: thunderSunsH2HGames,
      h2hAverages,
      seriesRecord: computeH2hSeriesRecord(thunderSunsH2HGames),
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

  if (idsAreSixersCeltics(hid, aid)) {
    const h2hAverages = sixersCelticsH2HAveragesForSides({
      homeTeamId: hid,
      awayTeamId: aid,
    });
    if (!h2hAverages) return null;
    return {
      games: sixersCelticsH2HGames,
      h2hAverages,
      seriesRecord: computeH2hSeriesRecord(sixersCelticsH2HGames),
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

  if (idsAreSpursTimberwolves(hid, aid)) {
    const h2hAverages = spursTimberwolvesH2HAveragesForSides({
      homeTeamId: hid,
      awayTeamId: aid,
    });
    if (!h2hAverages) return null;
    return {
      games: spursTimberwolvesH2HGames,
      h2hAverages,
      seriesRecord: computeH2hSeriesRecord(spursTimberwolvesH2HGames),
    };
  }

  if (idsAreSpursBlazers(hid, aid)) {
    const h2hAverages = spursBlazersH2HAveragesForSides({
      homeTeamId: hid,
      awayTeamId: aid,
    });
    if (!h2hAverages) return null;
    return {
      games: spursBlazersH2HGames,
      h2hAverages,
      seriesRecord: computeH2hSeriesRecord(spursBlazersH2HGames),
    };
  }

  return null;
}
