/**
 * リーグ別 teams 一覧（全ユーザー共通）→ CDN 共有用。
 */

import type { Firestore } from "firebase-admin/firestore";
import { normalizeLeague, type League } from "@/lib/leagues";
import { serializeGameDoc } from "@/lib/games/gameDocJson";

export type TeamsByLeaguePayload = {
  ok: true;
  league: League;
  teams: Record<string, unknown>[];
};

export async function loadTeamsByLeague(
  db: Firestore,
  rawLeague: string
): Promise<TeamsByLeaguePayload> {
  const league = normalizeLeague(rawLeague);
  const snap = await db.collection("teams").where("league", "==", league).get();
  const teams = snap.docs.map((d) =>
    serializeGameDoc(d.id, d.data() as Record<string, unknown>)
  );
  teams.sort((a, b) =>
    String(a.name ?? a.shortName ?? a.id).localeCompare(
      String(b.name ?? b.shortName ?? b.id),
      "ja"
    )
  );
  return { ok: true, league, teams };
}

export function teamsByLeagueCacheControl(): string {
  // W/L は試合後に変わるが、カード一覧ほど頻繁ではない
  return "public, s-maxage=120, stale-while-revalidate=600";
}
