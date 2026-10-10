/**
 * 試合中のお気に入り選手の TECH / FLAG / EJECT → `nbaDisciplineLiveAlerts`（Functions がプッシュ）。
 * ライブ ingest（毎分）に相乗り。お気に入り選手が box に居る試合だけ BDL play-by-play を取る。
 */
import type { Firestore } from "firebase-admin/firestore";
import type { BdlGamePlayerRef } from "@/lib/nba/bdl/fetchBdlPlays";
import { fetchBdlPlaysForGame } from "@/lib/nba/bdl/fetchBdlPlays";
import type { MappedLiveBoxScore } from "@/lib/nba/bdl/mapBdlBoxScoreToLiveStats";
import { parseBdlPlaysDiscipline } from "@/lib/nba/discipline/parseBdlPlaysDiscipline";
import type {
  NbaDisciplineLiveAlertDoc,
  NbaDisciplineSeasonType,
} from "@/lib/nba/discipline/disciplineTypes";
import { loadNbaFavoritePlayerIdIndex } from "@/lib/nba/discipline/nbaFavoritePlayerIndex";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";

export const NBA_DISCIPLINE_LIVE_ALERTS_COLLECTION = "nbaDisciplineLiveAlerts";

/** Firestore ALREADY_EXISTS */
const ALREADY_EXISTS = 6;

export type LiveDisciplineGame = {
  bdlGameId: number;
  date: string;
  seasonType: NbaDisciplineSeasonType;
  homeAbbr: string;
  awayAbbr: string;
  box: MappedLiveBoxScore;
};

function boxPlayerRefs(box: MappedLiveBoxScore): BdlGamePlayerRef[] {
  const side = (rows: MappedLiveBoxScore["liveStats"]["box"]["home"], teamId: string) =>
    rows.map((r) => ({
      playerId: r.playerId,
      firstName: r.firstName,
      lastName: r.lastName,
      teamId,
    }));
  return [
    ...side(box.liveStats.box.home, box.homeAppTeamId),
    ...side(box.liveStats.box.away, box.awayAppTeamId),
  ];
}

export async function detectLiveDisciplineAlerts(
  db: Firestore,
  games: readonly LiveDisciplineGame[]
): Promise<{ gamesChecked: number; alertsCreated: number }> {
  if (games.length === 0) return { gamesChecked: 0, alertsCreated: 0 };
  const favorites = await loadNbaFavoritePlayerIdIndex(db);
  if (favorites.size === 0) return { gamesChecked: 0, alertsCreated: 0 };

  let gamesChecked = 0;
  let alertsCreated = 0;
  for (const game of games) {
    const refs = boxPlayerRefs(game.box);
    if (!refs.some((r) => favorites.has(r.playerId))) continue;
    gamesChecked += 1;
    let plays;
    try {
      plays = await fetchBdlPlaysForGame(game.bdlGameId);
    } catch (e) {
      console.warn(`[liveDisciplineAlerts] plays failed game=${game.bdlGameId}`, e);
      continue;
    }
    const parsed = parseBdlPlaysDiscipline(plays, refs);
    const nthByKey = new Map<string, number>();
    for (const ev of parsed.events) {
      const key = `${ev.p}_${ev.k}`;
      const nth = (nthByKey.get(key) ?? 0) + 1;
      nthByKey.set(key, nth);
      if (!favorites.has(ev.p)) continue;
      const doc: NbaDisciplineLiveAlertDoc = {
        gameId: String(game.bdlGameId),
        playerId: ev.p,
        playerName: parsed.names[ev.p] ?? "",
        teamId: ev.t,
        opponentAbbr: ev.t === game.box.homeAppTeamId ? game.awayAbbr : game.homeAbbr,
        kind: ev.k,
        nth,
        period: ev.q ?? null,
        clock: ev.c ?? null,
        seasonKey: CURRENT_NBA_SEASON_KEY,
        seasonType: game.seasonType,
        date: game.date,
        createdAtMs: Date.now(),
      };
      try {
        await db
          .collection(NBA_DISCIPLINE_LIVE_ALERTS_COLLECTION)
          .doc(`${game.bdlGameId}_${ev.p}_${ev.k}_${nth}`)
          .create(doc);
        alertsCreated += 1;
      } catch (e) {
        if ((e as { code?: number }).code !== ALREADY_EXISTS) throw e;
      }
    }
  }
  return { gamesChecked, alertsCreated };
}
