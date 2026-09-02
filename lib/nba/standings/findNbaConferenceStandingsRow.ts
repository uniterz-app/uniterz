import type {
  NbaConferenceStandingsBoard,
  NbaConferenceStandingsRow,
} from "@/lib/nba/nbaConferenceStandings";

/** 東西ボードから teamId の行を探す */
export function findNbaConferenceStandingsRow(
  board: NbaConferenceStandingsBoard,
  teamId: string
): NbaConferenceStandingsRow | null {
  const id = teamId.trim();
  if (!id) return null;
  return (
    board.east.find((r) => r.teamId === id) ??
    board.west.find((r) => r.teamId === id) ??
    null
  );
}
