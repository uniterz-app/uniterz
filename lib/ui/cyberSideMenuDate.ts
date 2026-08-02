/**
 * サイドメニュー HUD ヘッダー用の日付ラベル
 * 例: { date: "08.02", weekday: "SUN" }
 * 曜日は GAMES // DRAWER などと同系統の Latin 表記に統一
 */
export function formatCyberSideMenuDate(
  now: Date = new Date()
): { date: string; weekday: string } {
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const weekday =
    ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"][now.getDay()] ?? "";
  return { date: `${mm}.${dd}`, weekday };
}
