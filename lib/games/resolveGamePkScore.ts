/** ノックアウト PK 戦の本数（Firestore `pkScore`） */
export function resolveGamePkScore(
  raw: Record<string, unknown>
): { home: number; away: number } | null {
  const pk = raw.pkScore as
    | { home?: unknown; away?: unknown; h?: unknown; a?: unknown }
    | undefined;
  if (!pk) return null;

  if (pk.home != null || pk.away != null) {
    const home = Number(pk.home ?? 0);
    const away = Number(pk.away ?? 0);
    if (Number.isFinite(home) && Number.isFinite(away)) return { home, away };
  }
  if (pk.h != null || pk.a != null) {
    const home = Number(pk.h ?? 0);
    const away = Number(pk.a ?? 0);
    if (Number.isFinite(home) && Number.isFinite(away)) return { home, away };
  }
  return null;
}
