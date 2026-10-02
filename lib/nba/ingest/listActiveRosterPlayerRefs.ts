/**
 * アクティブロスターから ingest 対象プレイヤー一覧を取る。
 */
import type { Firestore } from "firebase-admin/firestore";
import { loadTeamRostersSnapshot } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";

export type RosterPlayerRef = {
  playerId: string;
  teamId: string;
  position: string;
  /** ロスター bio。無いときは null */
  draftYear: number | null;
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
      const draftYear =
        typeof p.draftYear === "number" &&
        Number.isFinite(p.draftYear) &&
        p.draftYear > 0
          ? Math.trunc(p.draftYear)
          : null;
      out.push({
        playerId,
        teamId: team.teamId,
        position: String(p.position ?? "").trim() || "—",
        draftYear,
      });
    }
  }
  out.sort((a, b) => a.playerId.localeCompare(b.playerId));
  return out;
}
