// lib/wc/wcGamesPageScheduleWindow.ts
//
// Games ページの日付ストリップ用: Firestore から取得する startAtJst の範囲。
// 通常の NBA/サッカーは「今日±3日」で足りるが、W杯本戦は日付が大きく離れるため
// 本戦期間をまるごと一窓で取る（クライアント側で日付タブ用に日付を展開する）。

import { parseDateKeyInTimeZone } from "@/lib/time/zonedTime";

/**
 * 2026 年 W杯本戦（グループ + 以降）に加え、シード用の近い日付が窓外にならないよう
 * 5 月〜7 月（暦、指定タイムゾーン）を [start, end) で返す。
 * 毎年の大会に合わせて年と終端日を更新すること。
 */
export function getWcGamesPageQueryRange(timeZone: string): {
  start: Date;
  end: Date;
} {
  const start = parseDateKeyInTimeZone("2026-05-01", timeZone);
  const end = parseDateKeyInTimeZone("2026-08-01", timeZone);
  if (!start || !end) {
    throw new Error("getWcGamesPageQueryRange: failed to parse window");
  }
  return { start, end };
}
