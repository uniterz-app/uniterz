/** 罰金 USD を表の幅に収める（$25K / $1.2M）。0 は "$0"。 */
export function formatDisciplineFineUsd(value: number): string {
  if (!Number.isFinite(value) || value <= 0) return "$0";
  if (value >= 1_000_000) {
    const m = value / 1_000_000;
    return `$${m >= 10 ? Math.round(m) : m.toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (value >= 1_000) {
    const k = value / 1_000;
    return `$${k >= 100 ? Math.round(k) : k.toFixed(1).replace(/\.0$/, "")}K`;
  }
  return `$${Math.round(value)}`;
}

/** 詳細の内訳行用（$25,000） */
export function formatDisciplineFineUsdFull(value: number): string {
  if (!Number.isFinite(value)) return "—";
  return `$${Math.round(value).toLocaleString("en-US")}`;
}
