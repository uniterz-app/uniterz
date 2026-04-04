/**
 * 開発時: API の参加者が少ないときにランキング一覧を埋めるデモ行。
 * 本番ビルドでは無効（next build では NODE_ENV=production）。
 */

export type CumulativeRankingMetric =
  | "winRate"
  | "totalPoints"
  | "totalPrecision"
  | "totalUpset"
  | "activeWinStreak";

/** useRanking と API 行と同じ形 */
export type DevRankingRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  totalPosts: number;
  totalWins: number;
  winRate: number;
  totalPoints: number;
  totalPrecision: number;
  totalUpset: number;
  currentStreak: number;
  activeWinStreak: number;
  rank: number;
};

const MOCK_NAMES = [
  "アヤ",
  "クロウ",
  "セナ",
  "リク",
  "ミオ",
  "ハル",
  "ケン",
  "ナナ",
  "トウマ",
  "ユイ",
  "ソラ",
  "レイ",
  "ヒナ",
  "カイト",
] as const;

const MOCK_UID_PREFIX = "__dev_ranking_mock_";

const DEFAULT_MIN_ROWS = 10;

function buildDevMockRankingRows(): DevRankingRow[] {
  return MOCK_NAMES.map((name, i) => {
    const totalPosts = Math.max(6, 28 - i);
    const totalWins = Math.max(
      1,
      Math.floor(totalPosts * (0.36 + (i % 5) * 0.035))
    );
    const winRate = totalPosts > 0 ? totalWins / totalPosts : 0;

    return {
      uid: `${MOCK_UID_PREFIX}${i}`,
      displayName: name,
      handle: `demo_${i + 1}`,
      photoURL: null,
      totalPosts,
      totalWins,
      winRate,
      totalPoints: Math.round(188 - i * 10 + (i % 4) * 2),
      totalPrecision: Math.max(0, 86 - i * 3),
      totalUpset: Math.max(0, 44 - i * 2),
      currentStreak: Math.max(0, 6 - (i % 5)),
      activeWinStreak: Math.max(1, 10 - i),
      rank: 0,
    };
  });
}

let cachedMocks: DevRankingRow[] | null = null;

function getMockPool(): DevRankingRow[] {
  if (!cachedMocks) {
    cachedMocks = buildDevMockRankingRows();
  }
  return cachedMocks;
}

export function isRankingDevMocksEnabled(): boolean {
  if (process.env.NODE_ENV !== "development") return false;
  if (process.env.NEXT_PUBLIC_RANKING_DEV_MOCKS === "0") return false;
  return true;
}

function sortRankingRowsByMetric(
  rows: DevRankingRow[],
  metric: CumulativeRankingMetric
): DevRankingRow[] {
  const copy = [...rows];
  switch (metric) {
    case "totalPoints":
      copy.sort((a, b) => b.totalPoints - a.totalPoints);
      break;
    case "winRate":
      copy.sort((a, b) => b.winRate - a.winRate);
      break;
    case "totalPrecision":
      copy.sort((a, b) => b.totalPrecision - a.totalPrecision);
      break;
    case "totalUpset":
      copy.sort((a, b) => b.totalUpset - a.totalUpset);
      break;
    case "activeWinStreak":
      copy.sort((a, b) => b.activeWinStreak - a.activeWinStreak);
      break;
    default:
      break;
  }
  return copy;
}

function minRowsForDev(): number {
  const raw = process.env.NEXT_PUBLIC_RANKING_DEV_MIN_ROWS;
  if (raw === undefined || raw === "") return DEFAULT_MIN_ROWS;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.min(50, Math.floor(n)) : DEFAULT_MIN_ROWS;
}

/**
 * 開発時かつ行数が少ないときだけモックを足し、指標で並べ替えて rank を振り直す。
 */
export function padRankingRowsForDev<T extends DevRankingRow>(
  apiRows: T[],
  metric: CumulativeRankingMetric
): T[] {
  if (!isRankingDevMocksEnabled()) return apiRows;

  const minRows = minRowsForDev();
  if (apiRows.length >= minRows) return apiRows;

  const existing = new Set(apiRows.map((r) => r.uid));
  const need = minRows - apiRows.length;
  const extras = getMockPool()
    .filter((m) => !existing.has(m.uid))
    .slice(0, need)
    .map((m) => ({ ...m })) as T[];

  const merged = [...apiRows, ...extras];
  const sorted = sortRankingRowsByMetric(merged as DevRankingRow[], metric);
  return sorted.map((r, i) => ({ ...r, rank: i + 1 })) as T[];
}
