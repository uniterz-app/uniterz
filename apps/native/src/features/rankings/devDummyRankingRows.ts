/**
 * 開発ビルド専用: 今季データが空のときランキング一覧の見た目確認用に差し込むダミー行。
 * `__DEV__` は本番ビルド / OTA では false になるため表示されない。
 */
import type { RankingApiRow } from "../../../../../lib/rankings/rankingTransform";

export const DEV_DUMMY_RANKINGS_ENABLED = __DEV__;

const DUMMY_COUNT = 40;
const MY_RANK = 17;

const NAMES = [
  "Kaito", "Mia", "Ren", "Sora", "Yuna", "Haruto", "Aoi", "Riku", "Hina", "Sota",
  "Emma", "Liam", "Noah", "Olivia", "Lucas", "Ava", "Ethan", "Chloe", "Leo", "Zoe",
];
const COUNTRIES = ["JP", "US", "CA", "PH", "KR", "TW", "AU", "GB"];

export type DevDummyRankingRow = RankingApiRow & { rank: number };

export function buildDevDummyRankingRows(me: {
  uid: string | null;
  displayName?: string | null;
  handle?: string | null;
  photoURL?: string | null;
}): DevDummyRankingRow[] {
  const rows: DevDummyRankingRow[] = [];
  for (let i = 0; i < DUMMY_COUNT; i += 1) {
    const rank = i + 1;
    const isMe = me.uid != null && rank === MY_RANK;
    const totalPosts = 40 - Math.floor(i / 3);
    const totalWins = Math.max(1, Math.round(totalPosts * (0.78 - i * 0.008)));
    const name = `${NAMES[i % NAMES.length]}${i >= NAMES.length ? "_2" : ""}`;
    rows.push({
      uid: isMe ? (me.uid as string) : `dev-dummy-${rank}`,
      handle: isMe ? (me.handle ?? "me") : name.toLowerCase(),
      displayName: isMe ? (me.displayName?.trim() || "ME") : name,
      photoURL: isMe ? (me.photoURL ?? null) : null,
      plan: rank % 4 === 1 ? "pro" : "free",
      totalPosts,
      totalWins,
      winRate: totalWins / totalPosts,
      totalPoints: Math.round((520 - i * 11.3) * 10) / 10,
      totalPrecision: Math.max(0, 30 - i),
      totalUpset: Math.round((48 - i * 1.1) * 10) / 10,
      totalGoalScorerHits: Math.max(0, 14 - Math.floor(i / 3)),
      activeWinStreak: (i * 7) % 6,
      countryCode: COUNTRIES[i % COUNTRIES.length],
      rankDeltaPlaces: ((i * 5) % 7) - 3,
      rank,
    });
  }
  return rows;
}
