/**
 * Pro Skin 解放状態のサーバ側解決（永続アンロック含む）。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { pickNbaSeasonKeyCumulativeSlice } from "@/lib/rankings/pickNbaStatsBucket";
import {
  periodRankingPeriodKey,
} from "@/lib/rankings/rankingDivision";
import {
  applyProSkinTitleCollections,
  EMPTY_PRO_SKIN_RANK_MAP,
  getProSkinUnlockEntry,
  isProSkinUnlockRuleMet,
  listUnlockedProSkinIds,
  PRO_SKIN_UNLOCK_CATALOG,
  type ProSkinRankMetric,
  type ProSkinUnlockProgress,
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

/** 最新週/月の指標順位（1始まり）。無い場合は null */
async function readLatestPeriodRank(
  db: Firestore,
  uid: string,
  period: "weekly" | "monthly",
  metric: ProSkinRankMetric
): Promise<number | null> {
  try {
    const snap = await db
      .collection("period_ranking_snapshots")
      .where("periodKey", "==", periodRankingPeriodKey("standard", period))
      .where("metric", "==", metric)
      .select("label", "ranks")
      .get();
    if (snap.empty) return null;
    const docs = snap.docs
      .map((d) => {
        const data = d.data() as {
          label?: string;
          ranks?: Record<string, number>;
        };
        return {
          label: String(data.label ?? ""),
          ranks: data.ranks ?? {},
        };
      })
      .filter((d) => d.label);
    docs.sort((a, b) => (a.label < b.label ? 1 : -1));
    const latest = docs[0];
    if (!latest) return null;
    const rank = latest.ranks[uid];
    return typeof rank === "number" && Number.isFinite(rank) && rank > 0
      ? Math.floor(rank)
      : null;
  } catch {
    return null;
  }
}

export async function loadProSkinUnlockProgress(
  db: Firestore,
  uid: string,
  userData: Record<string, unknown>
): Promise<ProSkinUnlockProgress> {
  const isPro = userData.plan === "pro";

  let posts = 0;
  let exactHits = 0;
  let maxWinStreak = safeInt(userData.maxWinStreak);

  try {
    const cumSnap = await db.doc(`cumulative_stats/${uid}`).get();
    if (cumSnap.exists) {
      const cum = cumSnap.data() as Record<string, unknown>;
      const bucket = pickNbaSeasonKeyCumulativeSlice(
        cum,
        CURRENT_NBA_SEASON_KEY
      ) as Record<string, unknown>;
      posts = Math.max(posts, safeInt(bucket.posts ?? bucket.fullPosts));
      exactHits = Math.max(
        exactHits,
        safeInt(bucket.exactHitCount ?? bucket.totalExactHits)
      );
      maxWinStreak = Math.max(
        maxWinStreak,
        safeInt(bucket.maxWinStreak ?? bucket.bestWinStreak)
      );
    }
  } catch {
    /* best-effort */
  }

  const [weeklyTotalPointsRank, monthlyTotalPointsRank] = await Promise.all([
    readLatestPeriodRank(db, uid, "weekly", "totalPoints"),
    readLatestPeriodRank(db, uid, "monthly", "totalPoints"),
  ]);

  return {
    isPro,
    posts,
    exactHits,
    maxWinStreak,
    weeklyRanks: {
      ...EMPTY_PRO_SKIN_RANK_MAP,
      totalPoints: weeklyTotalPointsRank,
    },
    monthlyRanks: {
      ...EMPTY_PRO_SKIN_RANK_MAP,
      totalPoints: monthlyTotalPointsRank,
    },
  };
}

export function mergeProSkinUnlockedIds(
  progress: ProSkinUnlockProgress,
  persisted: ReadonlySet<string>
): ProfilePlanProBgVariant[] {
  const live = listUnlockedProSkinIds(progress);
  const merged = new Set<string>([...persisted, ...live]);
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
  return isProSkinUnlockRuleMet(entry.unlock, progress);
}

export async function ensurePersistedProSkinUnlocks(
  db: Firestore,
  uid: string,
  userData: Record<string, unknown>,
  progress: ProSkinUnlockProgress
): Promise<ProfilePlanProBgVariant[]> {
  const persisted = readPersistedUnlockIds(userData.proSkinUnlockedIds);
  const merged = mergeProSkinUnlockedIds(progress, persisted);
  const newlyUnlocked = merged.filter((id) => !persisted.has(id));
  const changed =
    newlyUnlocked.length > 0 ||
    merged.length !== persisted.size ||
    merged.some((id) => !persisted.has(id));

  if (changed) {
    await db.doc(`users/${uid}`).set(
      {
        proSkinUnlockedIds: merged,
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

  return merged;
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

/** 新規解放分だけ保持人数を +1（適用切替では動かさない） */
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
