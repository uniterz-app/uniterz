/**
 * 選手詳細・チーム詳細・リーグ表の期間絞り。
 * 試合ログは新しい順。日付は選手 `11/23`・チーム `Nov 23`（JST）・`startMs` のどれでも月を取る。
 */
export type NbaStatsLastN = 3 | 5 | 10 | 20;

export type NbaStatsWindow =
  | { kind: "season" }
  | { kind: "last"; n: NbaStatsLastN }
  | { kind: "months"; months: readonly number[] };

export type NbaStatsWindowId = string;

export const NBA_STATS_LAST_NS: readonly NbaStatsLastN[] = [20, 10, 5, 3];

/** レギュラーの月（10〜4） */
export const NBA_STATS_SEASON_MONTHS = [10, 11, 12, 1, 2, 3, 4] as const;

const LAST_RE = /^last(3|5|10|20)$/;
const MONTH_RE = /^m([1-9]|1[0-2])$/;

export function compareNbaSeasonMonth(a: number, b: number): number {
  const ia = NBA_STATS_SEASON_MONTHS.indexOf(
    a as (typeof NBA_STATS_SEASON_MONTHS)[number]
  );
  const ib = NBA_STATS_SEASON_MONTHS.indexOf(
    b as (typeof NBA_STATS_SEASON_MONTHS)[number]
  );
  return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib) || a - b;
}

function sortedMonths(months: readonly number[]): number[] {
  return [...new Set(months.filter((m) => m >= 1 && m <= 12))].sort(
    compareNbaSeasonMonth
  );
}

export function nbaStatsWindowId(window: NbaStatsWindow): NbaStatsWindowId {
  if (window.kind === "season") return "season";
  if (window.kind === "last") return `last${window.n}`;
  return sortedMonths(window.months)
    .map((m) => `m${m}`)
    .join("+");
}

export function parseNbaStatsWindowId(id: string): NbaStatsWindow {
  if (id === "season") return { kind: "season" };
  const last = LAST_RE.exec(id);
  if (last) return { kind: "last", n: Number(last[1]) as NbaStatsLastN };
  const months: number[] = [];
  for (const part of id.split("+")) {
    const month = MONTH_RE.exec(part.trim());
    if (month) months.push(Number(month[1]));
  }
  const unique = sortedMonths(months);
  if (unique.length) return { kind: "months", months: unique };
  return { kind: "season" };
}

function monthChip(month: number, lang: "ja" | "en"): string {
  if (lang === "ja") return `${month}月`;
  const names = ["", "JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  return names[month] ?? `M${month}`;
}

export function nbaStatsWindowChipLabel(
  window: NbaStatsWindow,
  lang: "ja" | "en" = "en"
): string {
  if (window.kind === "season") return "SEASON";
  if (window.kind === "last") return `L${window.n}`;
  return sortedMonths(window.months)
    .map((m) => monthChip(m, lang))
    .join("+");
}

/** 選択リスト用。月は「10月」だけ（「だけ」は付けない） */
export function nbaStatsWindowListLabel(
  window: NbaStatsWindow,
  lang: "ja" | "en" = "en"
): string {
  if (window.kind === "season") {
    return lang === "ja" ? "シーズン" : "Season";
  }
  if (window.kind === "last") {
    return lang === "ja" ? `直近 ${window.n} 試合` : `Last ${window.n} games`;
  }
  return nbaStatsWindowChipLabel(window, lang);
}

export function nbaStatsWindowHasMonth(
  window: NbaStatsWindow,
  month: number
): boolean {
  return window.kind === "months" && window.months.includes(month);
}

export function toggleNbaStatsMonth(
  current: NbaStatsWindow,
  month: number
): NbaStatsWindow {
  const selected =
    current.kind === "months" ? sortedMonths(current.months) : [];
  const next = selected.includes(month)
    ? selected.filter((m) => m !== month)
    : sortedMonths([...selected, month]);
  if (next.length === 0) return { kind: "season" };
  return { kind: "months", months: next };
}

export function nbaStatsWindowSection(
  window: NbaStatsWindow
): "season" | "month" | "last" {
  if (window.kind === "months") return "month";
  return window.kind;
}

const MONTH_PREFIX: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12,
};

const JST_MONTH = new Intl.DateTimeFormat("en-US", {
  timeZone: "Asia/Tokyo",
  month: "numeric",
});

function monthFromStartMs(ms: number): number | null {
  if (!Number.isFinite(ms) || ms <= 0) return null;
  const part = JST_MONTH.formatToParts(new Date(ms)).find(
    (p) => p.type === "month"
  );
  const month = Number(part?.value);
  return month >= 1 && month <= 12 ? month : null;
}

/** `11/23` / `Nov 23` / `11月23日` → 11。年をまたぐ 1〜4 月も月番号だけ返す */
export function monthFromDateLabel(dateLabel: string): number | null {
  const s = String(dateLabel ?? "")
    .trim()
    .replace(/\u202f|\u00a0/g, " ");
  const slash = /^(\d{1,2})[/\-.](\d{1,2})(?:[/\-.]\d{2,4})?$/.exec(s);
  if (slash) {
    const month = Number(slash[1]);
    return month >= 1 && month <= 12 ? month : null;
  }
  const named = /^([A-Za-z]{3,9})\s+(\d{1,2})\b/.exec(s);
  if (named) {
    const month = MONTH_PREFIX[named[1].slice(0, 3).toLowerCase()];
    return month ?? null;
  }
  const ja = /^(\d{1,2})月/.exec(s);
  if (ja) {
    const month = Number(ja[1]);
    return month >= 1 && month <= 12 ? month : null;
  }
  return null;
}

export type NbaStatsWindowLog = {
  dateLabel: string;
  startMs?: number;
};

export function monthFromLog(log: NbaStatsWindowLog): number | null {
  return monthFromStartMs(log.startMs ?? 0) ?? monthFromDateLabel(log.dateLabel);
}

export function filterLogsByWindow<T extends NbaStatsWindowLog>(
  logs: readonly T[],
  window: NbaStatsWindow
): T[] {
  if (window.kind === "season") return [...logs];
  if (window.kind === "last") return logs.slice(0, window.n);
  const set = new Set(window.months);
  return logs.filter((g) => {
    const month = monthFromLog(g);
    return month != null && set.has(month);
  });
}

/** ログに出ている月 + 直近 N。SEASON は常に先頭 */
export function nbaStatsWindowsForLogs(
  logs: readonly NbaStatsWindowLog[]
): NbaStatsWindow[] {
  const months = new Set<number>();
  for (const g of logs) {
    const m = monthFromLog(g);
    if (m != null) months.add(m);
  }
  const out: NbaStatsWindow[] = [{ kind: "season" }];
  for (const month of NBA_STATS_SEASON_MONTHS) {
    if (months.has(month)) out.push({ kind: "months", months: [month] });
  }
  for (const n of NBA_STATS_LAST_NS) out.push({ kind: "last", n });
  return out;
}

/** リーグ表用。月はログが無くても出す */
export function nbaStatsLeagueTableWindows(): NbaStatsWindow[] {
  const out: NbaStatsWindow[] = [{ kind: "season" }];
  for (const month of NBA_STATS_SEASON_MONTHS) {
    out.push({ kind: "months", months: [month] });
  }
  for (const n of NBA_STATS_LAST_NS) out.push({ kind: "last", n });
  return out;
}

/** シーズン以外（月 + 直近 N）。ingest の期間スナップショット用 */
export function nbaStatsPeriodWindows(): NbaStatsWindow[] {
  return nbaStatsLeagueTableWindows().filter((w) => w.kind !== "season");
}
