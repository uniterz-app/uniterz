/**
 * 日付ストリップ用「シーズン全試合の開始時刻」インデックス（Admin SDK）。
 * `gameDayIndex/{league}__{season}` に distinct な開始 ms を昇順で保持する。
 * 日付キーは閲覧者 TZ で変わるため、ここでは時刻のまま持つ。
 */

import type { Firestore } from "firebase-admin/firestore";
import { Timestamp } from "firebase-admin/firestore";
import { normalizeLeague, type League } from "@/lib/leagues";
import type { GameDayIndexPayload } from "@/lib/games/gameDayIndex";

export const GAME_DAY_INDEX_COLLECTION = "gameDayIndex";

export function gameDayIndexDocId(league: League, season: string): string {
  return `${normalizeLeague(league)}__${season}`;
}

function toStartMs(raw: unknown): number | null {
  if (raw instanceof Timestamp) return raw.toMillis();
  if (raw && typeof (raw as { toMillis?: unknown }).toMillis === "function") {
    return (raw as { toMillis: () => number }).toMillis();
  }
  if (raw instanceof Date) return raw.getTime();
  return null;
}

async function collectStartMsFromGames(
  db: Firestore,
  league: League,
  season: string
): Promise<number[]> {
  const snap = await db
    .collection("games")
    .where("league", "==", league)
    .where("season", "==", season)
    .select("startAtJst")
    .get();
  const set = new Set<number>();
  for (const doc of snap.docs) {
    const ms = toStartMs(doc.get("startAtJst"));
    if (ms != null && Number.isFinite(ms)) set.add(ms);
  }
  return [...set].sort((a, b) => a - b);
}

/** games から組み立てて Firestore に保存する（ingest 用） */
export async function writeGameDayIndexFromGames(
  db: Firestore,
  input: { league: League; season: string }
): Promise<{ docId: string; startCount: number }> {
  const league = normalizeLeague(input.league);
  const startMs = await collectStartMsFromGames(db, league, input.season);
  const docId = gameDayIndexDocId(league, input.season);
  await db.collection(GAME_DAY_INDEX_COLLECTION).doc(docId).set({
    league,
    season: input.season,
    startMs,
    updatedAt: Timestamp.now(),
  });
  return { docId, startCount: startMs.length };
}

/** 公開 API 用。インデックス未作成のリーグは games から都度組み立てる（書き込みはしない） */
export async function loadGameDayIndex(
  db: Firestore,
  input: { league: League; season: string }
): Promise<GameDayIndexPayload> {
  const league = normalizeLeague(input.league);
  const snap = await db
    .collection(GAME_DAY_INDEX_COLLECTION)
    .doc(gameDayIndexDocId(league, input.season))
    .get();
  const stored = snap.exists ? snap.get("startMs") : null;
  const startMs = Array.isArray(stored)
    ? stored.filter((v): v is number => typeof v === "number" && Number.isFinite(v))
    : await collectStartMsFromGames(db, league, input.season);
  return { ok: true, league, season: input.season, startMs };
}
