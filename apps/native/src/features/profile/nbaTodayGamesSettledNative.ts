/**
 * 当日 NBA 試合がすべて final（または試合なし）ならカードキャッシュを長く持つ。
 * プロフィール表示ごとに games を読まず、セッション内で共有する。
 */
import {
  collection,
  getDocs,
  query,
  Timestamp,
  where,
} from "firebase/firestore";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../lib/rankings/nbaSeason";
import {
  getPastDateKeysInTimeZone,
  TIMEZONE_JST,
} from "../../../../../lib/time/zonedTime";
import { db } from "../../lib/firebase";

const LIVE_TTL_MS = 45_000;
const SETTLED_TTL_MS = 30 * 60_000;
const PROBE_TTL_MS = 5 * 60_000;

type SettledCache = {
  dateKey: string;
  settled: boolean;
  at: number;
};

let settledCache: SettledCache | null = null;
let probeInflight: Promise<boolean> | null = null;

function todayJstKey(): string {
  return getPastDateKeysInTimeZone(new Date(), TIMEZONE_JST, 1)[0] ?? "";
}

function jstDayRangeMs(dateKey: string): { startMs: number; endMs: number } {
  const [y, m, d] = dateKey.split("-").map(Number);
  const start = new Date(y!, m! - 1, d!, 0, 0, 0);
  const end = new Date(y!, m! - 1, d! + 1, 0, 0, 0);
  return { startMs: start.getTime(), endMs: end.getTime() };
}

/** 未解決なら null（短い TTL を使う） */
export function peekNbaTodayGamesSettled(): boolean | null {
  const dateKey = todayJstKey();
  if (!dateKey || !settledCache || settledCache.dateKey !== dateKey) return null;
  if (Date.now() - settledCache.at >= PROBE_TTL_MS) return null;
  return settledCache.settled;
}

export function nbaCardStatsCacheTtlMs(): number {
  return peekNbaTodayGamesSettled() === true ? SETTLED_TTL_MS : LIVE_TTL_MS;
}

export function nbaCardStatsBackgroundRefreshMs(): number {
  return peekNbaTodayGamesSettled() === true ? SETTLED_TTL_MS : LIVE_TTL_MS;
}

/** 裏で一度だけ当日確定を解決（失敗時は live 扱い） */
export function ensureNbaTodayGamesSettled(): void {
  const dateKey = todayJstKey();
  if (!dateKey) return;
  if (
    settledCache &&
    settledCache.dateKey === dateKey &&
    Date.now() - settledCache.at < PROBE_TTL_MS
  ) {
    return;
  }
  if (probeInflight) return;

  probeInflight = (async () => {
    try {
      const { startMs, endMs } = jstDayRangeMs(dateKey);
      const q = query(
        collection(db, "games"),
        where("league", "==", "nba"),
        where("season", "==", CURRENT_NBA_SEASON_KEY),
        where("startAtJst", ">=", Timestamp.fromMillis(startMs)),
        where("startAtJst", "<", Timestamp.fromMillis(endMs))
      );
      const snap = await getDocs(q);
      const settled =
        snap.empty ||
        snap.docs.every((d) => {
          const status = (d.data() as { status?: unknown }).status;
          return status === "final";
        });
      settledCache = { dateKey, settled, at: Date.now() };
      return settled;
    } catch {
      settledCache = { dateKey, settled: false, at: Date.now() };
      return false;
    } finally {
      probeInflight = null;
    }
  })();
}
