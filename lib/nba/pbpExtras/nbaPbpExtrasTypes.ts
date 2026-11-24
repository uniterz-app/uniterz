/**
 * play-by-play から切った 1 試合分。期間の CLUTCH / PLAYTYPE / TRACK / HUSTLE 用。
 * Synergy / 光学トラッキングではなく、BDL の type / text。
 */
export const NBA_GAME_PBP_EXTRAS_COLLECTION = "nbaGamePbpExtras";

export type NbaPbpBox = {
  pts: number;
  fgm: number;
  fga: number;
  fg3m: number;
  fg3a: number;
  fta: number;
  oreb: number;
  tov: number;
};

export type NbaPbpClutchSide = NbaPbpBox & {
  oppPts: number;
};

export type NbaPbpPlaytypePts = {
  iso: number;
  pnrBh: number;
  pnrRoll: number;
  spotup: number;
  trans: number;
  cut: number;
  post: number;
};

export type NbaPbpTrack = {
  drives: number;
  drivePts: number;
  pullupFgm: number;
  pullupFga: number;
  pullupPts: number;
  cnsFgm: number;
  cnsFga: number;
  cnsPts: number;
};

export type NbaPbpHustle = {
  charges: number;
  looseBalls: number;
  deflections: number;
};

export type NbaPbpPlayerSlice = {
  t: string;
  clutch: NbaPbpBox;
  playtype: NbaPbpPlaytypePts;
  track: NbaPbpTrack;
  hustle: NbaPbpHustle;
};

export type NbaPbpTeamSlice = {
  clutch: NbaPbpClutchSide;
  playtype: NbaPbpPlaytypePts;
  track: NbaPbpTrack;
  hustle: NbaPbpHustle;
};

export type NbaGamePbpExtrasDoc = {
  seasonKey: string;
  date: string;
  homeTeamId: string;
  awayTeamId: string;
  home: NbaPbpTeamSlice;
  away: NbaPbpTeamSlice;
  players: Record<string, NbaPbpPlayerSlice>;
  builtAtMs: number;
};
