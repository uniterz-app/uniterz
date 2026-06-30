export type PkScore = { home: number; away: number };

/** games.pkScore（PK 戦の本数。規定・延長スコアとは別） */
export function resolvePkScore(
  raw: Record<string, unknown> | null | undefined
): PkScore | null {
  if (!raw) return null;

  const pk = raw.pkScore as { home?: unknown; away?: unknown } | undefined;
  if (pk && pk.home != null && pk.away != null) {
    const home = Number(pk.home);
    const away = Number(pk.away);
    if (Number.isFinite(home) && Number.isFinite(away)) {
      return { home, away };
    }
  }

  const pkHome = raw.pkHomeScore;
  const pkAway = raw.pkAwayScore;
  if (pkHome != null && pkAway != null) {
    const home = Number(pkHome);
    const away = Number(pkAway);
    if (Number.isFinite(home) && Number.isFinite(away)) {
      return { home, away };
    }
  }

  return null;
}

export function formatPkResultSubLine(pk: PkScore | null | undefined): string | null {
  if (!pk) return null;
  return `PK ${pk.home}-${pk.away}`;
}

/** PK 本数が多い側が勝者（同点は null） */
export function resolvePkShootoutWinnerSide(
  pk: PkScore | null | undefined
): "home" | "away" | null {
  if (!pk) return null;
  if (pk.home > pk.away) return "home";
  if (pk.away > pk.home) return "away";
  return null;
}

/** リザルト投稿に保存された pkScore、または game スナップショットから取得 */
export function resolvePkScoreFromResultPost(
  post: Record<string, unknown> | null | undefined
): PkScore | null {
  if (!post) return null;
  const direct = resolvePkScore(post);
  if (direct) return direct;
  const game = post.game;
  if (game && typeof game === "object") {
    return resolvePkScore(game as Record<string, unknown>);
  }
  return null;
}
