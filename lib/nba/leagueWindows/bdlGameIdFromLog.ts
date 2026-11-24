/** 試合ログの `nba-bdl-123` / `"123"` → BDL id */
export function bdlGameIdFromLogId(id: string | null | undefined): string | null {
  if (!id) return null;
  const m = /^(?:nba-bdl-)?(\d+)$/.exec(id.trim());
  return m?.[1] ?? null;
}
