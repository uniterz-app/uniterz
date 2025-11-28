// functions/src/periods.ts

// すべて JST ベース（UTC+9）でカレンダー期間を計算するユーティリティ

const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

export type PeriodRange = {
  id: string;   // 例: "2025-10" / "2025-11-04"（週の開始日）
  start: Date;  // UTC Date（JST で 00:00 を指す）※含む
  end: Date;    // UTC Date（JST で 00:00 を指す）※含まない
};

/** UTC の now から「JST の現在日時」を作る */
function toJstDate(d: Date): Date {
  return new Date(d.getTime() + JST_OFFSET_MS);
}

/** JST の y-m-d 0:00 を表す UTC Date を作る */
function jstYmdToUtcDate(y: number, m: number, d: number): Date {
  // Date.UTC は「そのまま UTC」として扱われるので、そこから JST 分を引く
  const jstMidnight = Date.UTC(y, m - 1, d, 0, 0, 0);
  return new Date(jstMidnight - JST_OFFSET_MS);
}

/* =========================
 * 月間
 * =======================*/

/** 今月のレンジ（JST 基準） */
export function getThisMonthRangeJst(today = new Date()): PeriodRange {
  const j = toJstDate(today);
  const year = j.getUTCFullYear();
  const monthIndex = j.getUTCMonth(); // 0-11

  const id = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  const start = jstYmdToUtcDate(year, monthIndex + 1, 1);
  const endYear = monthIndex === 11 ? year + 1 : year;
  const endMonthIndex = (monthIndex + 1) % 12;
  const end = jstYmdToUtcDate(endYear, endMonthIndex + 1, 1);

  return { id, start, end };
}

/** 先月のレンジ（JST 基準） */
export function getLastMonthRangeJst(today = new Date()): PeriodRange {
  const j = toJstDate(today);
  let year = j.getUTCFullYear();
  let monthIndex = j.getUTCMonth(); // 0-11（今月）

  // 先月へ
  monthIndex -= 1;
  if (monthIndex < 0) {
    monthIndex = 11;
    year -= 1;
  }

  const id = `${year}-${String(monthIndex + 1).padStart(2, "0")}`;

  const start = jstYmdToUtcDate(year, monthIndex + 1, 1);
  const endYear = monthIndex === 11 ? year + 1 : year;
  const endMonthIndex = (monthIndex + 1) % 12;
  const end = jstYmdToUtcDate(endYear, endMonthIndex + 1, 1);

  return { id, start, end };
}

/* =========================
 * 週間（月曜スタート）
 * =======================*/

/** 与えられた JST 日付が属する週の「月曜 0:00 JST」の UTC Date を返す */
function getWeekMondayJstDate(j: Date): Date {
  // 0=Sun,1=Mon,...6=Sat
  const dow = j.getUTCDay();
  const offsetToMonday = dow === 0 ? -6 : 1 - dow; // 日曜なら -6, 月曜なら 0, ...
  const mondayJstUtc = Date.UTC(
    j.getUTCFullYear(),
    j.getUTCMonth(),
    j.getUTCDate() + offsetToMonday,
    0,
    0,
    0
  );
  return new Date(mondayJstUtc);
}

/** 今週（月曜〜来週月曜）のレンジ（JST 基準） */
export function getThisWeekRangeJst(today = new Date()): PeriodRange {
  const j = toJstDate(today);
  const mondayJstUtc = getWeekMondayJstDate(j);
  const nextMondayJstUtc = new Date(mondayJstUtc.getTime() + 7 * 24 * 60 * 60 * 1000);

  const y = mondayJstUtc.getUTCFullYear();
  const m = mondayJstUtc.getUTCMonth() + 1;
  const d = mondayJstUtc.getUTCDate();

  // 週 ID は「その週の月曜の日付」で表現（例: "2025-11-03"）
  const id = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  // JST 0:00 を指す UTC に直すため、JST 分を引く
  const start = new Date(mondayJstUtc.getTime() - JST_OFFSET_MS);
  const end = new Date(nextMondayJstUtc.getTime() - JST_OFFSET_MS);

  return { id, start, end };
}

/** 先週（月曜〜日曜）のレンジ（JST 基準） */
export function getLastWeekRangeJst(today = new Date()): PeriodRange {
  const thisWeek = getThisWeekRangeJst(today);

  const start = new Date(thisWeek.start.getTime() - 7 * 24 * 60 * 60 * 1000);
  const end = thisWeek.start; // 今週の start が先週の end

  const j = toJstDate(start);
  const y = j.getUTCFullYear();
  const m = j.getUTCMonth() + 1;
  const d = j.getUTCDate();

  const id = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

  return { id, start, end };
}
