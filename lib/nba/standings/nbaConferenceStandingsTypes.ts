import type { NbaConferenceStandingsBoard } from "@/lib/nba/nbaConferenceStandings";

/** Firestore `nbaStandings/{season}`。BDL ingest が正。開幕前は preseason スキャフォールド */
export type NbaConferenceStandingsSource =
  | "bdl"
  | "preseason"
  | "firestore"
  | "teams_fallback";

export type NbaConferenceStandingsApiPayload = {
  ok: true;
  season: string;
  board: NbaConferenceStandingsBoard;
  asOfLabel: string;
  source: NbaConferenceStandingsSource;
  updatedAt: string | null;
};
