/**
 * リザルト日付ラベルをローカル暦の 0 時ミリ秒へ変換する。
 * 想定外フォーマットは null。
 */
export function parseResultDateLabelToLocalMidnightMs(
  label: string
): number | null {
  const t = label.trim();
  const m = /^(\d{4})\.(\d{1,2})\.(\d{1,2})$/.exec(t);
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]) - 1;
  const d = Number(m[3]);
  if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) {
    return null;
  }
  const dt = new Date(y, mo, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo || dt.getDate() !== d) {
    return null;
  }
  return dt.getTime();
}
