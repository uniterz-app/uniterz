/**
 * Emirates NBA Cup ノックアウト期間（公式は米国東部の暦日）。
 * カレンダー表示用に、閲覧 TZ の日付キーへ落とす。
 *
 * 2026: QF 12/4–5 · SF 12/8–9 · Championship 12/11（ET）
 * @see https://www.nba.com/news/emirates-nba-cup-key-dates-schedule
 */

import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import {
  TIMEZONE_ET,
  parseDateKeyInTimeZone,
  zonedTimeToUtcMs,
} from "@/lib/time/zonedTime";

/** シーズンごとのノックアウト公式日（東部） */
export const NBA_CUP_KNOCKOUT_BY_SEASON: Readonly<
  Record<string, { etStartDate: string; etEndDate: string }>
> = {
  "2026-27": {
    etStartDate: "2026-12-04",
    etEndDate: "2026-12-11",
  },
};

function parseYmd(key: string): { y: number; m: number; d: number } | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!m) return null;
  return { y: Number(m[1]), m: Number(m[2]), d: Number(m[3]) };
}

function addUtcDays(key: string, days: number): string {
  const p = parseYmd(key);
  if (!p) return key;
  const dt = new Date(Date.UTC(p.y, p.m - 1, p.d));
  dt.setUTCDate(dt.getUTCDate() + days);
  const y = dt.getUTCFullYear();
  const mo = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

/**
 * ノックアウト試合のチップオフが載りうる絶対時刻の窓。
 * 東部の昼〜深夜西海岸までを覆い、JST では翌日午前まで含む。
 */
export function nbaCupKnockoutInstantRange(
  season: string = GAME_SCHEDULE_SEASON
): { startMs: number; endMs: number } | null {
  const cfg = NBA_CUP_KNOCKOUT_BY_SEASON[season];
  if (!cfg) return null;
  const start = parseYmd(cfg.etStartDate);
  const end = parseYmd(cfg.etEndDate);
  if (!start || !end) return null;

  // 準々決勝日の正午 ET から（午前の別カードを誤って期間に入れない）
  const startMs = zonedTimeToUtcMs({
    year: start.y,
    month: start.m,
    day: start.d,
    hour: 12,
    minute: 0,
    second: 0,
    timeZone: TIMEZONE_ET,
  });
  // 決勝翌日の早朝 ET まで（決勝夜の JST 翌日を含める）
  const endNext = addUtcDays(cfg.etEndDate, 1);
  const endP = parseYmd(endNext)!;
  const endMs = zonedTimeToUtcMs({
    year: endP.y,
    month: endP.m,
    day: endP.d,
    hour: 8,
    minute: 0,
    second: 0,
    timeZone: TIMEZONE_ET,
  });
  return { startMs, endMs };
}

/** 閲覧 TZ でノックアウト期間に重なる日付キー（昇順） */
export function nbaCupKnockoutDateKeys(
  timeZone: string,
  season: string = GAME_SCHEDULE_SEASON
): string[] {
  const range = nbaCupKnockoutInstantRange(season);
  if (!range) return [];

  const cfg = NBA_CUP_KNOCKOUT_BY_SEASON[season];
  if (!cfg) return [];

  const keys: string[] = [];
  let cursor = addUtcDays(cfg.etStartDate, -1);
  const last = addUtcDays(cfg.etEndDate, 2);
  while (cursor <= last) {
    const dayStart = parseDateKeyInTimeZone(cursor, timeZone);
    if (dayStart) {
      const startMs = dayStart.getTime();
      const endMs = startMs + 24 * 60 * 60 * 1000 - 1;
      if (startMs < range.endMs && endMs >= range.startMs) {
        keys.push(cursor);
      }
    }
    cursor = addUtcDays(cursor, 1);
  }
  return keys;
}

export function nbaCupKnockoutDateKeySet(
  timeZone: string,
  season: string = GAME_SCHEDULE_SEASON
): ReadonlySet<string> {
  return new Set(nbaCupKnockoutDateKeys(timeZone, season));
}

/** バナー用の短い期間表記（閲覧 TZ） */
export function formatNbaCupKnockoutRangeLabel(
  timeZone: string,
  lang: string,
  season: string = GAME_SCHEDULE_SEASON
): string | null {
  const keys = nbaCupKnockoutDateKeys(timeZone, season);
  if (keys.length === 0) return null;
  const a = keys[0]!;
  const b = keys[keys.length - 1]!;
  const fmt = (key: string) => {
    const p = parseYmd(key)!;
    if (lang === "ja" || lang === "zh" || lang === "ko") return `${p.m}/${p.d}`;
    return `${p.m}/${p.d}`;
  };
  return a === b ? fmt(a) : `${fmt(a)}–${fmt(b)}`;
}
