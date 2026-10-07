/**
 * TODAY UNITERZ — NBA の試合日（米国東部の暦日）の確定ポイント合計 Top20。全ユーザー同じ。
 * PICK UP = stats.countedForPickup、PRO LEAGUE = stats.countedForRanking（Pro のみ掲載）。
 * プレシーズンの試合は両方に数える（通常ランキング対象外だが TODAY には出す）。
 */

export const DAILY_SCORE_TOP_N = 20;

export type DailyScoreDivision = "standard" | "open";

export type DailyScorePostInput = {
  uid: string;
  points: number;
  countedForPickup: boolean;
  countedForRanking: boolean;
  displayName?: string;
  handle?: string;
  photoURL?: string | null;
};

export type DailyScoreLeaderRow = {
  rank: number;
  uid: string;
  displayName: string;
  handle?: string;
  photoURL?: string | null;
  plan?: string;
  planProBgVariant?: unknown;
  countryCode?: string | null;
  points: number;
  posts: number;
};

export type DailyScoreLeadersPayload = {
  ok: true;
  dateKey: string;
  timeZone: string;
  gameCount: number;
  finalCount: number;
  /** 延期以外の全試合が settle 済み → 以後この日の結果は変わらない */
  complete: boolean;
  /** その日の最初の試合開始（未開始の日は 1 つ前の試合日を出す判定用） */
  firstStartAtMs: number | null;
  preseason: boolean;
  boards: Record<DailyScoreDivision, DailyScoreLeaderRow[]>;
};

/** GET /api/uniterz/daily-leaders のレスポンス（division 1 枚分） */
export type DailyScoreLeadersResponse = Omit<DailyScoreLeadersPayload, "boards"> & {
  division: DailyScoreDivision;
  rows: DailyScoreLeaderRow[];
};

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

/** division ごとに uid で合計し、ポイント降順。同点は同順位 */
export function aggregateDailyScores(
  posts: DailyScorePostInput[],
  division: DailyScoreDivision
): DailyScoreLeaderRow[] {
  const byUid = new Map<string, DailyScoreLeaderRow>();
  for (const p of posts) {
    const counted = division === "standard" ? p.countedForPickup : p.countedForRanking;
    if (!counted || !p.uid || !Number.isFinite(p.points)) continue;
    const row = byUid.get(p.uid) ?? {
      rank: 0,
      uid: p.uid,
      displayName: p.displayName || p.handle || "",
      handle: p.handle,
      photoURL: p.photoURL ?? null,
      points: 0,
      posts: 0,
    };
    row.points += p.points;
    row.posts += 1;
    byUid.set(p.uid, row);
  }
  const rows = [...byUid.values()]
    .map((r) => ({ ...r, points: round1(r.points) }))
    .sort((a, b) => b.points - a.points || a.posts - b.posts || a.uid.localeCompare(b.uid));
  return withRanks(rows);
}

export function withRanks(rows: DailyScoreLeaderRow[]): DailyScoreLeaderRow[] {
  let prevPoints: number | null = null;
  let prevRank = 0;
  return rows.map((r, i) => {
    const rank = prevPoints === r.points ? prevRank : i + 1;
    prevPoints = r.points;
    prevRank = rank;
    return { ...r, rank };
  });
}
