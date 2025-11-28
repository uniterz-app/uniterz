// JSTの1日をUTC境界に変換（Firestoreクエリ用）
export function jstDayRange(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth();
  const day = d.getDate();
  // JSTはUTC+9 → JST 00:00 を UTC にすると -9:00
  const startUtc = new Date(Date.UTC(y, m, day, -9, 0, 0));
  const endUtc = new Date(Date.UTC(y, m, day + 1, -9, 0, 0));
  return { startUtc, endUtc };
}

// 表示やグルーピング用：JSTの yyyy-mm-dd 文字列キー
export function toJstKey(dt: Date) {
  const j = new Date(dt.getTime() + 9 * 60 * 60 * 1000);
  const yyyy = j.getUTCFullYear();
  const mm = String(j.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(j.getUTCDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}
