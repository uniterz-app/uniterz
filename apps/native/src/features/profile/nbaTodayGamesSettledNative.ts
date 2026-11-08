/**
 * 当日 NBA 試合がすべて final（または試合なし）ならカードキャッシュを長く持つ。
 * プロフィール表示ごとに games を読まず、セッション内で共有する。
 * games を Firestore から直接読むと 1 件 20KB 前後を毎回受け取るので、CDN 共有の試合窓 API を使う。
 */
import { fetchGamesWindowShared } from "../../../../../lib/games/fetchGamesWindowShared";
import {
  getPastDateKeysInTimeZone,
  TIMEZONE_JST,
  toDateKeyInTimeZone,
} from "../../../../../lib/time/zonedTime";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";

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
      const { rows } = await fetchGamesWindowShared({
        league: "nba",
        timeZone: TIMEZONE_JST,
        anchorDateKey: dateKey,
        plusMinus: 0,
        includePeers: false,
        apiBaseUrl: getUniterzApiBaseUrl(),
      });
      const settled = rows
        .filter((row) => {
          const start = row.startAtJst as { toMillis?: () => number } | undefined;
          const ms = start?.toMillis?.();
          return (
            typeof ms === "number" &&
            toDateKeyInTimeZone(new Date(ms), TIMEZONE_JST) === dateKey
          );
        })
        .every((row) => row.status === "final");
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
