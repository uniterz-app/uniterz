/** ピックアップのスコア（pointsV3）を uid で合計。同点は同順位。 */

export type PickupScoreEntry = {
  uid: string;
  points: number;
};

export type PickupScoreRow = {
  rank: number;
  uid: string;
  points: number;
  posts: number;
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

export function aggregatePickupScores(
  entries: PickupScoreEntry[]
): PickupScoreRow[] {
  const byUid = new Map<string, { uid: string; points: number; posts: number }>();
  for (const e of entries) {
    if (!e.uid || !Number.isFinite(e.points)) continue;
    const row = byUid.get(e.uid) ?? { uid: e.uid, points: 0, posts: 0 };
    row.points += e.points;
    row.posts += 1;
    byUid.set(e.uid, row);
  }
  const sorted = [...byUid.values()]
    .map((r) => ({ ...r, points: round1(r.points) }))
    .sort(
      (a, b) =>
        b.points - a.points || a.posts - b.posts || a.uid.localeCompare(b.uid)
    );
  let prevPoints: number | null = null;
  let prevRank = 0;
  return sorted.map((r, i) => {
    const rank = prevPoints === r.points ? prevRank : i + 1;
    prevPoints = r.points;
    prevRank = rank;
    return { rank, uid: r.uid, points: r.points, posts: r.posts };
  });
}
