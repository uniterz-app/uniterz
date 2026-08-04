/**
 * Pro Skin 解放状態のサーバ側解決（永続アンロック含む）。
 *
 * コスト方針:
 * - ホットパス（GET/POST /api/me/pro-skin）では cumulative_stats / period_ranking を読まない
 * - 進捗・閾値解放は users.proSkinProgress（settle が 2026-27+ で更新）
 * - 週/月順位解放は期間確定フックで proSkinUnlockedIds へ（別途）
 *
 * 通知方針:
 * - Free 中も proSkinProgress は積む。Pro 化時に ensurePersisted で閾値スキンを遡及解放（notice なし）
 * - Free 中の順位達成は users.proSkinRankEarnedIds のみ。Pro 化時に unlocked へ合流（notice なし）
 * - Pro 中の閾値跨ぎ / 期間確定時の順位達成のみ settle・grant が noticeIds に積み、モーダル対象
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { pickNbaSeasonKeyCumulativeSlice } from "@/lib/rankings/pickNbaStatsBucket";
import {
  listThresholdUnlockIdsFromProgress,
  parseProSkinProgressSnapshot,
  progressFromProSkinSnapshot,
} from "@/lib/profile/proSkinProgress";
import {
  applyProSkinTitleCollections,
  EMPTY_PRO_SKIN_RANK_MAP,
  emptyProSkinUnlockProgress,
  getProSkinUnlockEntry,
  isProSkinUnlockRuleMet,
  isProSkinUnlockSeasonKeyEligible,
  listProImmediateSkinIds,
  listUnlockedProSkinIds,
  PRO_SKIN_UNLOCK_CATALOG,
  PRO_SKIN_UNLOCK_FROM_SEASON_KEY,
  type ProSkinUnlockProgress,
  userDataIsPro,
} from "@/lib/profile/proSkinUnlock";
import type { ProfilePlanProBgVariant } from "@/lib/profile/profilePlanProBgVariants";

export const PRO_SKIN_OWNER_COUNTS_DOC = "meta/proSkinOwnerCounts";

function safeInt(v: unknown): number {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0;
}

function readPersistedUnlockIds(raw: unknown): Set<string> {
  if (!Array.isArray(raw)) return new Set();
  return new Set(raw.filter((x): x is string => typeof x === "string"));
}

/** users.proSkinRankEarnedIds — 期間確定時に Free/Pro 共通で積む薄い権利 */
export function readProSkinRankEarnedIds(raw: unknown): Set<string> {
  const out = new Set<string>();
  if (!Array.isArray(raw)) return out;
  for (const id of raw) {
    if (typeof id !== "string") continue;
    const entry = getProSkinUnlockEntry(id);
    if (
      entry &&
      (entry.unlock.kind === "weeklyRank" ||
        entry.unlock.kind === "monthlyRank")
    ) {
      out.add(id);
    }
  }
  return out;
}

function readStoredUnlockSeason(userData: Record<string, unknown>): string | null {
  const v = userData.proSkinUnlockSeason;
  return typeof v === "string" && v.length > 0 ? v : null;
}

/** users doc のみ（追加 read なし）。proSkinProgress があれば進捗付き */
export function progressFromUserDocOnly(
  userData: Record<string, unknown>
): ProSkinUnlockProgress {
  const isPro = userDataIsPro(userData);
  const snap = parseProSkinProgressSnapshot(userData.proSkinProgress);
  return progressFromProSkinSnapshot(snap, isPro);
}

/**
 * 旧評価の順位解放などを掃除しつつ、即解放 + 進捗閾値 + 正当な永続順位を残す。
 * @param rankEarned Free 中に確定した順位権利（Pro 時のみ unlocked に合流）
 */
export function sanitizePersistedUnlockIds(
  persisted: ReadonlySet<string>,
  progress: ProSkinUnlockProgress,
  storedSeason: string | null,
  rankEarned: ReadonlySet<string> = new Set()
): ProfilePlanProBgVariant[] {
  const eligibleSeason = isProSkinUnlockSeasonKeyEligible(storedSeason);
  const immediate = new Set(listProImmediateSkinIds());
  const fromProgress = new Set(listThresholdUnlockIdsFromProgress(progress));
  const kept = new Set<string>();

  if (progress.isPro) {
    for (const id of immediate) kept.add(id);
    for (const id of rankEarned) kept.add(id);
  }
  for (const id of fromProgress) kept.add(id);

  if (eligibleSeason) {
    for (const id of persisted) {
      const entry = getProSkinUnlockEntry(id);
      if (!entry) continue;
      if (
        entry.unlock.kind === "weeklyRank" ||
        entry.unlock.kind === "monthlyRank" ||
        entry.unlock.kind === "titleCollection"
      ) {
        kept.add(id);
      }
    }
  }

  applyProSkinTitleCollections(kept, progress);
  return PRO_SKIN_UNLOCK_CATALOG.map((e) => e.id).filter((id) => kept.has(id));
}

/**
 * ジョブ用: cumulative の 2026-27+ バケットを読む（ホットパス禁止）。
 * 注: シーズン連勝は cumulative に無いことが多い → proSkinProgress を正とする。
 */
export async function loadProSkinUnlockProgressFromSeasonStats(
  db: Firestore,
  uid: string,
  userData: Record<string, unknown>,
  seasonKey: string = CURRENT_NBA_SEASON_KEY
): Promise<ProSkinUnlockProgress> {
  const isPro = userDataIsPro(userData);
  const mirrored = parseProSkinProgressSnapshot(userData.proSkinProgress);
  if (mirrored && mirrored.seasonKey === seasonKey) {
    return progressFromProSkinSnapshot(mirrored, isPro);
  }
  if (!isProSkinUnlockSeasonKeyEligible(seasonKey)) {
    return emptyProSkinUnlockProgress(isPro, PRO_SKIN_UNLOCK_FROM_SEASON_KEY);
  }

  let posts = 0;
  let exactHits = 0;
  let maxWinStreak = 0;

  try {
    const cumSnap = await db.doc(`cumulative_stats/${uid}`).get();
    if (cumSnap.exists) {
      const cum = cumSnap.data() as Record<string, unknown>;
      const bucket = pickNbaSeasonKeyCumulativeSlice(cum, seasonKey) as Record<
        string,
        unknown
      >;
      posts = safeInt(
        bucket.posts ?? bucket.fullPosts ?? bucket.totalPosts
      );
      exactHits = safeInt(
        bucket.exactHitCount ?? bucket.totalExactHits ?? bucket.totalPrecision
      );
      maxWinStreak = safeInt(bucket.maxWinStreak ?? bucket.bestWinStreak);
    }
  } catch {
    /* best-effort */
  }

  return {
    isPro,
    posts,
    exactHits,
    maxWinStreak,
    weeklyRanks: { ...EMPTY_PRO_SKIN_RANK_MAP },
    monthlyRanks: { ...EMPTY_PRO_SKIN_RANK_MAP },
    seasonKey,
  };
}

/** @deprecated ホットパス互換 */
export async function loadProSkinUnlockProgress(
  _db: Firestore,
  _uid: string,
  userData: Record<string, unknown>
): Promise<ProSkinUnlockProgress> {
  return progressFromUserDocOnly(userData);
}

export function mergeProSkinUnlockedIds(
  progress: ProSkinUnlockProgress,
  persisted: ReadonlySet<string>,
  rankEarned: ReadonlySet<string> = new Set()
): ProfilePlanProBgVariant[] {
  const threshold = listThresholdUnlockIdsFromProgress(progress);
  const livePro = progress.isPro ? listProImmediateSkinIds() : [];
  const liveRank =
    isProSkinUnlockSeasonKeyEligible(progress.seasonKey) &&
    (Object.values(progress.weeklyRanks).some((r) => r != null) ||
      Object.values(progress.monthlyRanks).some((r) => r != null))
      ? listUnlockedProSkinIds(progress).filter((id) => {
          const e = getProSkinUnlockEntry(id);
          return (
            e?.unlock.kind === "weeklyRank" ||
            e?.unlock.kind === "monthlyRank"
          );
        })
      : [];

  const merged = new Set<string>([
    ...persisted,
    ...threshold,
    ...livePro,
    ...liveRank,
  ]);
  if (progress.isPro) {
    for (const id of rankEarned) merged.add(id);
  }
  if (!progress.isPro) {
    for (const id of listProImmediateSkinIds()) merged.delete(id);
  }
  applyProSkinTitleCollections(merged, progress);
  return PRO_SKIN_UNLOCK_CATALOG.map((e) => e.id).filter((id) =>
    merged.has(id)
  );
}

export function isProSkinIdUnlockedForUser(
  id: string,
  progress: ProSkinUnlockProgress,
  persistedUnlocked: ReadonlySet<string>
): boolean {
  if (persistedUnlocked.has(id)) return true;
  const entry = getProSkinUnlockEntry(id);
  if (!entry) return false;
  if (entry.unlock.kind === "titleCollection") {
    return isProSkinUnlockRuleMet(
      entry.unlock,
      progress,
      persistedUnlocked
    );
  }
  if (entry.unlock.kind === "pro") {
    return progress.isPro;
  }
  if (
    entry.unlock.kind === "streak" ||
    entry.unlock.kind === "posts" ||
    entry.unlock.kind === "exactHits"
  ) {
    return (
      progress.isPro && isProSkinUnlockRuleMet(entry.unlock, progress)
    );
  }
  return false;
}

export async function ensurePersistedProSkinUnlocks(
  db: Firestore,
  uid: string,
  userData: Record<string, unknown>,
  progress: ProSkinUnlockProgress
): Promise<ProfilePlanProBgVariant[]> {
  const storedSeason = readStoredUnlockSeason(userData);
  const persisted = readPersistedUnlockIds(userData.proSkinUnlockedIds);
  const rankEarned = readProSkinRankEarnedIds(userData.proSkinRankEarnedIds);
  const sanitized = sanitizePersistedUnlockIds(
    persisted,
    progress,
    storedSeason,
    rankEarned
  );
  const withLive = mergeProSkinUnlockedIds(
    progress,
    new Set(sanitized),
    rankEarned
  );

  const newlyUnlocked = withLive.filter((id) => !persisted.has(id));
  const seasonNeedsStamp =
    !isProSkinUnlockSeasonKeyEligible(storedSeason) ||
    storedSeason !== PRO_SKIN_UNLOCK_FROM_SEASON_KEY;
  const changed =
    newlyUnlocked.length > 0 ||
    withLive.length !== persisted.size ||
    withLive.some((id) => !persisted.has(id)) ||
    seasonNeedsStamp;

  if (changed) {
    await db.doc(`users/${uid}`).set(
      {
        proSkinUnlockedIds: withLive,
        proSkinUnlockSeason: PRO_SKIN_UNLOCK_FROM_SEASON_KEY,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  }

  if (newlyUnlocked.length > 0) {
    try {
      await incrementProSkinHolderCounts(db, newlyUnlocked);
    } catch (err) {
      console.warn("pro-skin holder count update failed:", err);
    }
  }

  return withLive;
}

export async function readProSkinOwnerCounts(
  db: Firestore
): Promise<Record<string, number>> {
  const snap = await db.doc(PRO_SKIN_OWNER_COUNTS_DOC).get();
  const data = snap.data() as { counts?: Record<string, unknown> } | undefined;
  const raw = data?.counts ?? {};
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(raw)) {
    out[k] = safeInt(v);
  }
  return out;
}

export async function incrementProSkinHolderCounts(
  db: Firestore,
  newlyUnlockedIds: readonly string[]
): Promise<void> {
  const ids = [...new Set(newlyUnlockedIds)].filter(Boolean);
  if (ids.length === 0) return;
  const ref = db.doc(PRO_SKIN_OWNER_COUNTS_DOC);
  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  for (const id of ids) {
    updates[`counts.${id}`] = FieldValue.increment(1);
  }
  await ref.set(updates, { merge: true });
}

export { readPersistedUnlockIds };
