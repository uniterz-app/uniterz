/**
 * ロスター外の氏名・最終所属をリーグ表 players マップから探す（Firestore のみ）。
 */
import type { Firestore } from "firebase-admin/firestore";
import {
  NBA_LEAGUE_PLAYER_STATS_COLLECTION,
} from "@/lib/nba/playerStatLeaders/loadPlayerStatLeadersSnapshot";
import {
  nbaLeagueStatsSeasonKeys,
} from "@/lib/rankings/nbaSeason";
import type { NbaConferenceId } from "@/lib/nba/nbaConferenceTeams";
import type { OffRosterPlayerIdentity } from "@/lib/nba/playerDetail/resolveOffRosterPlayerIdentity";

type CompactPlayer = {
  n?: unknown;
  t?: unknown;
  c?: unknown;
};

export async function loadOffRosterIdentityFromLeagueStats(
  db: Firestore,
  playerId: string
): Promise<OffRosterPlayerIdentity | null> {
  const id = String(playerId ?? "").trim();
  if (!id) return null;

  for (const seasonKey of nbaLeagueStatsSeasonKeys()) {
    const snap = await db
      .collection(NBA_LEAGUE_PLAYER_STATS_COLLECTION)
      .doc(seasonKey)
      .get();
    if (!snap.exists) continue;
    const players = (snap.data() as { players?: Record<string, CompactPlayer> })
      ?.players;
    const row = players?.[id];
    if (!row) continue;
    const playerName = String(row.n ?? "").trim();
    const teamId = String(row.t ?? "").trim();
    if (!playerName) continue;
    const confRaw = String(row.c ?? "").trim().toLowerCase();
    const conference: NbaConferenceId | null =
      confRaw === "east" || confRaw === "west"
        ? (confRaw as NbaConferenceId)
        : null;
    return {
      playerName,
      teamId,
      conference,
    };
  }
  return null;
}
