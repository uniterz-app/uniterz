// NBA ピックアップ週 — 週キーと範囲（JST・月曜始まり）。
// docs/pro-subscription-plan.md § ピックアップ試合フロー

export type NbaPickupWeekStatus = "draft" | "final";

export type NbaPickupWeekDoc = {
  league: "nba";
  weekKey: string;
  rangeStartJst: string;
  rangeEndJst: string;
  status: NbaPickupWeekStatus;
  gameIds: string[];
  decidedAt: unknown | null;
  decidedBy: string | null;
  updatedAt: unknown;
  /** 運用メモ（Cursor 指定時の根拠など） */
  note?: string | null;
};

/** 月曜 JST の YYYY-MM-DD を weekKey にする */
export function assertWeekKey(weekKey: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(weekKey)) {
    throw new Error(`weekKey must be YYYY-MM-DD (Monday JST), got: ${weekKey}`);
  }
  return weekKey;
}

/** weekKey（月曜）から日曜の dateKey を返す */
export function weekRangeFromMondayKey(weekKey: string): {
  rangeStartJst: string;
  rangeEndJst: string;
} {
  assertWeekKey(weekKey);
  const [y, m, d] = weekKey.split("-").map(Number);
  const monday = new Date(Date.UTC(y!, m! - 1, d!));
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  const pad = (n: number) => String(n).padStart(2, "0");
  const rangeEndJst = `${sunday.getUTCFullYear()}-${pad(sunday.getUTCMonth() + 1)}-${pad(sunday.getUTCDate())}`;
  return { rangeStartJst: weekKey, rangeEndJst };
}

export function nbaPickupWeekDocPath(weekKey: string): string {
  return `nba_pickup_weeks/${assertWeekKey(weekKey)}`;
}
