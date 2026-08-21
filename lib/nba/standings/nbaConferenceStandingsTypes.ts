import type { NbaConferenceStandingsBoard } from "@/lib/nba/nbaConferenceStandings";

/** Firestore `nbaStandings/{season}`。プロバイダ ingest も同じドキュメントを上書きする */
export type NbaConferenceStandingsSource = "firestore";

export type NbaConferenceStandingsApiPayload = {
  ok: true;
  season: string;
  board: NbaConferenceStandingsBoard;
  asOfLabel: string;
  source: NbaConferenceStandingsSource;
  updatedAt: string | null;
};
