/**
 * 週/月 period_ranking_snapshots が確定したあとに順位マイルストーンを記録・解放。
 *
 * - 対象順位: **standard（通常ランキング）**
 * - Free/Pro とも `users.proSkinRankEarnedIds` に薄い権利だけ残す
 * - Pro のときだけ unlocked + notice
 * - Free→Pro 遡及は ensurePersisted（notice なし）
 * - 冪等: meta/proSkinPeriodGrants — status=done のみスキップ。running 停滞はリトライ可
 */
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import {
  addDaysToDateKey,
  dateKeyJST,
  monthLabelJST,
  PERIOD_FINALIZE_GRACE_DAYS,
  previousLabel,
  weekStartDateKeyJST,
  type NbaRankingPeriod,
} from "../rankings/nbaPeriod";
import { nbaSeasonKeyFromDateJST } from "../rankings/nbaSeason";
import {
  PRO_SKIN_RANK_MILESTONES,
  PRO_SKIN_UNLOCK_FROM_SEASON_KEY,
} from "./proSkinMilestoneCatalog";

const OWNER_COUNTS_DOC = "meta/proSkinOwnerCounts";
/** running のままこの時間を超えたらリトライ許可 */
const GRANT_RUNNING_STALE_MS = 15 * 60 * 1000;

type PeriodMetric =
  | "totalPoints"
  | "winRate"
  | "totalUpset"
  | "totalGoalScorerHits";

function periodStandardSnapshotDocId(
  period: NbaRankingPeriod,
  label: string,
  metric: PeriodMetric
): string {
  return `nba_${period}_${label}_${metric}`;
}

function addGrace(periodStartKey: string): string {
  return addDaysToDateKey(periodStartKey, PERIOD_FINALIZE_GRACE_DAYS);
}

function parseDateKeyToUtcNoon(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 3, 0, 0));
}

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

/** 猶予終了後の過去期間のみ true */
export function isNbaPeriodFinalForProSkinGrants(
  period: NbaRankingPeriod,
  labelKey: string,
  now: Date = new Date()
): boolean {
  const todayKey = dateKeyJST(now);
  if (period === "weekly") {
    const current = weekStartDateKeyJST(now);
    if (labelKey >= current) return false;
    if (
      todayKey <= addGrace(current) &&
      labelKey === previousLabel("weekly", current)
    ) {
      return false;
    }
    return true;
  }
  const current = monthLabelJST(now);
  if (labelKey >= current) return false;
  if (
    todayKey <= addGrace(`${current}-01`) &&
    labelKey === previousLabel("monthly", current)
  ) {
    return false;
  }
  return true;
}

function isProUser(user: Record<string, unknown>): boolean {
  if (user.plan !== "pro") return false;
  const until = user.proUntil as
    | { toMillis?: () => number; seconds?: number; _seconds?: number }
    | Date
    | number
    | string
    | null
    | undefined;
  if (until == null || until === "") return true;
  let ms = 0;
  if (until instanceof Date) ms = until.getTime();
  else if (typeof until === "number") ms = until < 1e12 ? until * 1000 : until;
  else if (typeof until === "string") {
    const parsed = Date.parse(until);
    ms = Number.isFinite(parsed) ? parsed : 0;
  } else if (typeof until.toMillis === "function") ms = until.toMillis();
  else if (typeof until.seconds === "number") ms = until.seconds * 1000;
  else if (typeof until._seconds === "number") ms = until._seconds * 1000;
  if (!Number.isFinite(ms) || ms <= 0) return true;
  return ms > Date.now();
}

async function incrementHolderCounts(
  newlyBySkin: Map<string, number>
): Promise<void> {
  if (newlyBySkin.size === 0) return;
  const db = getFirestore();
  const updates: Record<string, unknown> = {
    updatedAt: FieldValue.serverTimestamp(),
  };
  for (const [id, n] of newlyBySkin) {
    if (n > 0) updates[`counts.${id}`] = FieldValue.increment(n);
  }
  await db.doc(OWNER_COUNTS_DOC).set(updates, { merge: true });
}

/**
 * grant ロック取得。done → スキップ。fresh running → スキップ。それ以外は claim。
 */
async function claimPeriodGrant(opts: {
  period: NbaRankingPeriod;
  labelKey: string;
  startKey: string;
  seasonKey: string;
}): Promise<boolean> {
  const db = getFirestore();
  const grantRef = db.doc(
    `meta/proSkinPeriodGrants/${opts.period}_${opts.labelKey}`
  );
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(grantRef);
    if (snap.exists) {
      const data = (snap.data() ?? {}) as Record<string, unknown>;
      if (data.status === "done") return false;
      if (data.status === "running") {
        const startedMs = timestampToMs(data.startedAt);
        if (
          startedMs > 0 &&
          Date.now() - startedMs < GRANT_RUNNING_STALE_MS
        ) {
          return false;
        }
      }
    }
    tx.set(
      grantRef,
      {
        period: opts.period,
        labelKey: opts.labelKey,
        startKey: opts.startKey,
        seasonKey: opts.seasonKey,
        status: "running",
        startedAt: FieldValue.serverTimestamp(),
        attempt: FieldValue.increment(1),
      },
      { merge: true }
    );
    return true;
  });
}

export async function grantProSkinRankUnlocksForPeriod(opts: {
  period: NbaRankingPeriod;
  labelKey: string;
  startKey: string;
  now?: Date;
}): Promise<{ granted: boolean; unlockedUsers: number }> {
  const now = opts.now ?? new Date();
  if (!isNbaPeriodFinalForProSkinGrants(opts.period, opts.labelKey, now)) {
    return { granted: false, unlockedUsers: 0 };
  }

  const seasonKey = nbaSeasonKeyFromDateJST(
    parseDateKeyToUtcNoon(opts.startKey)
  );
  if (!seasonKey || seasonKey < PRO_SKIN_UNLOCK_FROM_SEASON_KEY) {
    return { granted: false, unlockedUsers: 0 };
  }

  const claimed = await claimPeriodGrant({
    period: opts.period,
    labelKey: opts.labelKey,
    startKey: opts.startKey,
    seasonKey,
  });
  if (!claimed) return { granted: false, unlockedUsers: 0 };

  const db = getFirestore();
  const grantRef = db.doc(
    `meta/proSkinPeriodGrants/${opts.period}_${opts.labelKey}`
  );

  const rules = PRO_SKIN_RANK_MILESTONES.filter(
    (r) => r.period === opts.period
  );
  if (rules.length === 0) {
    await grantRef.set(
      {
        status: "done",
        unlockedUsers: 0,
        grantedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    return { granted: true, unlockedUsers: 0 };
  }

  const grantsByUid = new Map<string, string[]>();

  for (const rule of rules) {
    const snap = await db
      .collection("period_ranking_snapshots")
      .doc(
        periodStandardSnapshotDocId(
          opts.period,
          opts.labelKey,
          rule.metric as PeriodMetric
        )
      )
      .get();
    if (!snap.exists) continue;
    const data = snap.data() as {
      ranks?: Record<string, number>;
      rows?: Array<{ uid?: string; rank?: number }>;
    };
    const ranks = data.ranks ?? {};
    const candidates = new Set<string>();
    for (const [uid, rank] of Object.entries(ranks)) {
      if (typeof rank === "number" && rank > 0 && rank <= rule.maxRank) {
        candidates.add(uid);
      }
    }
    if (candidates.size === 0 && Array.isArray(data.rows)) {
      for (const row of data.rows) {
        const uid = typeof row.uid === "string" ? row.uid : "";
        const rank = typeof row.rank === "number" ? row.rank : 0;
        if (uid && rank > 0 && rank <= rule.maxRank) candidates.add(uid);
      }
    }
    for (const uid of candidates) {
      const list = grantsByUid.get(uid) ?? [];
      if (!list.includes(rule.id)) list.push(rule.id);
      grantsByUid.set(uid, list);
    }
  }

  const holderIncrements = new Map<string, number>();
  let unlockedUsers = 0;
  let earnedUsers = 0;

  for (const [uid, skinIds] of grantsByUid) {
    const userRef = db.doc(`users/${uid}`);
    let newlyUnlocked: string[] = [];
    let wroteEarn = false;
    await db.runTransaction(async (tx) => {
      newlyUnlocked = [];
      wroteEarn = false;
      const userSnap = await tx.get(userRef);
      const user = (userSnap.exists ? userSnap.data() : {}) as Record<
        string,
        unknown
      >;

      const patch: Record<string, unknown> = {
        proSkinRankEarnedIds: FieldValue.arrayUnion(...skinIds),
        proSkinUnlockSeason: PRO_SKIN_UNLOCK_FROM_SEASON_KEY,
        updatedAt: FieldValue.serverTimestamp(),
      };
      wroteEarn = true;

      if (isProUser(user)) {
        const unlocked = new Set<string>(
          Array.isArray(user.proSkinUnlockedIds)
            ? user.proSkinUnlockedIds.filter(
                (x): x is string => typeof x === "string"
              )
            : []
        );
        for (const id of skinIds) {
          if (!unlocked.has(id)) {
            unlocked.add(id);
            newlyUnlocked.push(id);
          }
        }
        patch.proSkinUnlockedIds = [...unlocked];
        if (newlyUnlocked.length > 0) {
          patch.proSkinUnlockNoticeIds = FieldValue.arrayUnion(
            ...newlyUnlocked
          );
        }
      }

      tx.set(userRef, patch, { merge: true });
    });
    if (wroteEarn) earnedUsers += 1;
    if (newlyUnlocked.length === 0) continue;
    unlockedUsers += 1;
    for (const id of newlyUnlocked) {
      holderIncrements.set(id, (holderIncrements.get(id) ?? 0) + 1);
    }
  }

  await incrementHolderCounts(holderIncrements);

  await grantRef.set(
    {
      status: "done",
      period: opts.period,
      labelKey: opts.labelKey,
      startKey: opts.startKey,
      seasonKey,
      division: "standard",
      unlockedUsers,
      earnedUsers,
      skinIds: [...new Set([...grantsByUid.values()].flat())],
      grantedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(
    `[grantProSkinRankUnlocks] ${opts.period} ${opts.labelKey} earned=${earnedUsers} unlocked=${unlockedUsers} candidates=${grantsByUid.size}`
  );
  return { granted: true, unlockedUsers };
}

export async function grantProSkinRankUnlocksAfterPeriodSnapshots(
  now: Date = new Date()
): Promise<void> {
  const weekCurrent = weekStartDateKeyJST(now);
  const weekPrev = previousLabel("weekly", weekCurrent);
  const monthCurrent = monthLabelJST(now);
  const monthPrev = previousLabel("monthly", monthCurrent);

  await grantProSkinRankUnlocksForPeriod({
    period: "weekly",
    labelKey: weekPrev,
    startKey: weekPrev,
    now,
  });
  await grantProSkinRankUnlocksForPeriod({
    period: "monthly",
    labelKey: monthPrev,
    startKey: `${monthPrev}-01`,
    now,
  });
}
