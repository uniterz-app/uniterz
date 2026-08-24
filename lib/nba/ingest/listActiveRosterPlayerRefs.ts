/**
 * アクティブロスターから ingest 対象プレイヤー一覧を取る。
 */
import type { Firestore } from "firebase-admin/firestore";
import { loadTeamRostersSnapshot } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";

export type RosterPlayerRef = {
  playerId: string;
  teamId: string;
  position: string;
};

export async function listActiveRosterPlayerRefs(
  db: Firestore,
  seasonKey: string
): Promise<RosterPlayerRef[]> {
  const payload = await loadTeamRostersSnapshot(db, seasonKey);
  const out: RosterPlayerRef[] = [];
  const seen = new Set<string>();
  for (const team of Object.values(payload.bundle.teams)) {
    for (const p of team.players) {
      const playerId = String(p.id ?? "").trim();
      if (!playerId || seen.has(playerId)) continue;
      seen.add(playerId);
      out.push({
        playerId,
        teamId: team.teamId,
        position: String(p.position ?? "").trim() || "—",
      });
    }
  }
  out.sort((a, b) => a.playerId.localeCompare(b.playerId));
  return out;
}
