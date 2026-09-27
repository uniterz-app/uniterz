/**
 * レギュラーシーズン累計（standard 総合）の最終順位マイルストーン。
 *
 * - RS の全試合が final になったのを検知 → settle 待ちで次回以降の実行で 1 回だけ grant
 * - 順位は cumulative_stats の rankingBySeason（RS のみ・プレーオフは別バケット）から算出
 * - Free/Pro とも `users.proSkinRankEarnedIds` に積む。Pro のときだけ unlocked + notice
 * - 冪等: meta/proSkinPeriodGrants/locks/season_{seasonKey}
 */
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { loadNbaSeasonTop20RowsLive } from "../rankings/buildCumulativeRankingSnapshot";
import { nbaSeasonKeyFromDateJST } from "../rankings/nbaSeason";
import { countMilestoneUnlockedProSkins } from "./countMilestoneUnlockedProSkins";
import {
  incrementHolderCounts,
  isProUser,
} from "./grantProSkinRankUnlocksOnPeriodFinal";
import {
  PRO_SKIN_SEASON_RANK_MILESTONES,
  PRO_SKIN_UNLOCK_FROM_SEASON_KEY,
  proSkinSeasonRankGrantLockDocPath,
} from "./proSkinMilestoneCatalog";

/** RS 完了検知からこの時間経つまでは settle 待ち */
const RS_FINAL_SETTLE_GRACE_MS = 18 * 60 * 60 * 1000;
const GRANT_RUNNING_STALE_MS = 15 * 60 * 1000;

function timestampToMs(v: unknown): number {
  if (
    v &&
    typeof v === "object" &&
    typeof (v as { toMillis?: () => number }).toMillis === "function"
  ) {
    return (v as { toMillis: () => number }).toMillis();
  }
  return 0;
}

/**
 * RS 完了判定: regular の未終了試合なし + regular final が 1 件以上
 * + プレーイン／プレーオフの試合が登録済み（日程未取り込みの誤判定防止）。
 */
export async function isNbaRegularSeasonComplete(
  seasonKey: string
): Promise<boolean> {
  const db = getFirestore();
  const games = db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", seasonKey);

  const [pending, postseason, anyRegularFinal] = await Promise.all([
    games
      .where("seasonPhase", "==", "regular")
      .where("status", "in", ["scheduled", "live"])
      .limit(1)
      .get(),
    games
      .where("seasonPhase", "in", ["play_in", "playoffs"])
      .limit(1)
      .get(),
    games
      .where("seasonPhase", "==", "regular")
      .where("status", "==", "final")
      .limit(1)
      .get(),
  ]);

  return pending.empty && !postseason.empty && !anyRegularFinal.empty;
}

async function claimSeasonGrant(seasonKey: string): Promise<boolean> {
  const db = getFirestore();
  const ref = db.doc(proSkinSeasonRankGrantLockDocPath(seasonKey));
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      const data = (snap.data() ?? {}) as Record<string, unknown>;
      if (data.status === "done") return false;
      if (data.status === "running") {
        const startedMs = timestampToMs(data.startedAt);
        if (startedMs > 0 && Date.now() - startedMs < GRANT_RUNNING_STALE_MS) {
          return false;
        }
      }
    }
    tx.set(
      ref,
      {
        kind: "seasonRank",
        seasonKey,
        status: "running",
        startedAt: FieldValue.serverTimestamp(),
        attempt: FieldValue.increment(1),
      },
      { merge: true }
    );
    return true;
  });
}

export async function grantProSkinSeasonRankUnlocks(opts: {
  seasonKey?: string;
  now?: Date;
  /** 手動: RS 完了判定をスキップ */
  force?: boolean;
} = {}): Promise<{ granted: boolean; unlockedUsers: number; reason?: string }> {
  const now = opts.now ?? new Date();
  const seasonKey = opts.seasonKey ?? nbaSeasonKeyFromDateJST(now);
  if (!seasonKey || seasonKey < PRO_SKIN_UNLOCK_FROM_SEASON_KEY) {
    return { granted: false, unlockedUsers: 0, reason: "season-ineligible" };
  }
  if (PRO_SKIN_SEASON_RANK_MILESTONES.length === 0) {
    return { granted: false, unlockedUsers: 0, reason: "no-rules" };
  }

  const db = getFirestore();
  const lockRef = db.doc(proSkinSeasonRankGrantLockDocPath(seasonKey));
  const lockSnap = await lockRef.get();
  if (lockSnap.exists && lockSnap.get("status") === "done") {
    return { granted: false, unlockedUsers: 0, reason: "already-done" };
  }

  if (!opts.force) {
    const detectedMs = timestampToMs(lockSnap.get("rsCompleteDetectedAt"));
    if (detectedMs <= 0) {
      if (!(await isNbaRegularSeasonComplete(seasonKey))) {
        return { granted: false, unlockedUsers: 0, reason: "rs-in-progress" };
      }
      await lockRef.set(
        {
          kind: "seasonRank",
          seasonKey,
          rsCompleteDetectedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return { granted: false, unlockedUsers: 0, reason: "settle-wait" };
    }
    if (now.getTime() - detectedMs < RS_FINAL_SETTLE_GRACE_MS) {
      return { granted: false, unlockedUsers: 0, reason: "settle-wait" };
    }
  }

  if (!(await claimSeasonGrant(seasonKey))) {
    return { granted: false, unlockedUsers: 0, reason: "locked" };
  }

  const { rankByUid, totalCount } = await loadNbaSeasonTop20RowsLive(
    "totalPoints",
    undefined,
    seasonKey
  );

  const grantsByUid = new Map<string, string[]>();
  for (const [uid, rank] of rankByUid) {
    if (!(rank > 0)) continue;
    const ids = PRO_SKIN_SEASON_RANK_MILESTONES.filter(
      (r) => rank <= r.maxRank
    ).map((r) => r.id);
    if (ids.length > 0) grantsByUid.set(uid, ids);
  }

  const holderIncrements = new Map<string, number>();
  let unlockedUsers = 0;

  for (const [uid, skinIds] of grantsByUid) {
    const userRef = db.doc(`users/${uid}`);
    let newlyUnlocked: string[] = [];
    let careerCount = 0;
    await db.runTransaction(async (tx) => {
      newlyUnlocked = [];
      careerCount = 0;
      const userSnap = await tx.get(userRef);
      const user = (userSnap.exists ? userSnap.data() : {}) as Record<
        string,
        unknown
      >;
      const patch: Record<string, unknown> = {
        proSkinUnlockSeason: PRO_SKIN_UNLOCK_FROM_SEASON_KEY,
        proSkinRankEarnedIds: FieldValue.arrayUnion(...skinIds),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (isProUser(user)) {
        const unlocked = new Set<string>(
          Array.isArray(user.proSkinUnlockedIds)
            ? user.proSkinUnlockedIds.filter(
                (x): x is string => typeof x === "string"
              )
            : []
        );
        const prevHeld = new Set<string>([
          ...unlocked,
          ...(Array.isArray(user.proSkinHeldIds)
            ? user.proSkinHeldIds.filter(
                (x): x is string => typeof x === "string"
              )
            : []),
        ]);
        for (const id of skinIds) {
          if (unlocked.has(id)) continue;
          unlocked.add(id);
          if (!prevHeld.has(id)) newlyUnlocked.push(id);
        }
        patch.proSkinUnlockedIds = [...unlocked];
        patch.proSkinHeldIds = [...new Set([...prevHeld, ...unlocked])];
        if (newlyUnlocked.length > 0) {
          patch.proSkinUnlockNoticeIds = FieldValue.arrayUnion(
            ...newlyUnlocked
          );
        }
        careerCount = countMilestoneUnlockedProSkins([...unlocked]);
      }

      tx.set(userRef, patch, { merge: true });
    });

    if (newlyUnlocked.length === 0) continue;
    unlockedUsers += 1;
    for (const id of newlyUnlocked) {
      holderIncrements.set(id, (holderIncrements.get(id) ?? 0) + 1);
    }
    if (careerCount > 0) {
      try {
        const { syncUserCareerUnlockedSkinCount } = await import(
          "./syncUserCareer"
        );
        await syncUserCareerUnlockedSkinCount(uid, careerCount);
      } catch (err) {
        console.warn("[grantProSkinSeasonRank] career skin sync failed", err);
      }
    }
  }

  await incrementHolderCounts(holderIncrements);

  await lockRef.set(
    {
      status: "done",
      seasonKey,
      division: "standard",
      metric: "totalPoints",
      participantCount: totalCount,
      earnedUsers: grantsByUid.size,
      unlockedUsers,
      forced: opts.force === true,
      grantedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(
    `[grantProSkinSeasonRank] ${seasonKey} earned=${grantsByUid.size} unlocked=${unlockedUsers} participants=${totalCount}`
  );
  return { granted: true, unlockedUsers };
}
