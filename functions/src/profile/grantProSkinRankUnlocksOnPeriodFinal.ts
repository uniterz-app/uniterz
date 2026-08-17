/**
 * 週/月 period_ranking_snapshots が確定したあとに順位マイルストーンを記録・解放。
 *
 * - 対象順位: **standard（通常ランキング）**
 * - Free/Pro とも `users.proSkinRankEarnedIds` に薄い権利だけ残す（1回達成系）
 * - 回数系は `users.proSkinProgress.periodWins` を加算（Free も積む）
 * - Pro のときだけ unlocked + notice
 * - Free→Pro 遡及は ensurePersisted（notice なし）
 * - 冪等: meta/proSkinPeriodGrants/locks/{period}_{label} — status=done のみスキップ。running 停滞はリトライ可
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
import { countMilestoneUnlockedProSkins } from "./countMilestoneUnlockedProSkins";
import {
  PRO_SKIN_PERIOD_WIN_MILESTONES,
  PRO_SKIN_RANK_MILESTONES,
  PRO_SKIN_UNLOCK_FROM_SEASON_KEY,
  proSkinPeriodGrantLockDocPath,
  proSkinPeriodWinCounterKey,
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
    proSkinPeriodGrantLockDocPath(opts.period, opts.labelKey)
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
    proSkinPeriodGrantLockDocPath(opts.period, opts.labelKey)
  );

  const rules = PRO_SKIN_RANK_MILESTONES.filter(
    (r) => r.period === opts.period
  );
  const periodWinRules = PRO_SKIN_PERIOD_WIN_MILESTONES.filter(
    (r) => r.period === opts.period
  );

  if (rules.length === 0 && periodWinRules.length === 0) {
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
  const periodWinIncrementsByUid = new Map<string, Set<string>>();

  async function loadRankCandidates(
    metric: PeriodMetric,
    maxRank: number
  ): Promise<Set<string>> {
    const snap = await db
      .collection("period_ranking_snapshots")
      .doc(
        periodStandardSnapshotDocId(opts.period, opts.labelKey, metric)
      )
      .get();
    if (!snap.exists) return new Set();
    const data = snap.data() as {
      ranks?: Record<string, number>;
      rows?: Array<{ uid?: string; rank?: number }>;
    };
    const ranks = data.ranks ?? {};
    const candidates = new Set<string>();
    for (const [uid, rank] of Object.entries(ranks)) {
      if (typeof rank === "number" && rank > 0 && rank <= maxRank) {
        candidates.add(uid);
      }
    }
    if (candidates.size === 0 && Array.isArray(data.rows)) {
      for (const row of data.rows) {
        const uid = typeof row.uid === "string" ? row.uid : "";
        const rank = typeof row.rank === "number" ? row.rank : 0;
        if (uid && rank > 0 && rank <= maxRank) candidates.add(uid);
      }
    }
    return candidates;
  }

  for (const rule of rules) {
    const candidates = await loadRankCandidates(
      rule.metric as PeriodMetric,
      rule.maxRank
    );
    for (const uid of candidates) {
      const list = grantsByUid.get(uid) ?? [];
      if (!list.includes(rule.id)) list.push(rule.id);
      grantsByUid.set(uid, list);
    }
  }

  const seenWinKeys = new Set<string>();
  for (const rule of periodWinRules) {
    const key = proSkinPeriodWinCounterKey({
      period: rule.period,
      metric: rule.metric,
      maxRank: rule.maxRank,
    });
    if (seenWinKeys.has(key)) continue;
    seenWinKeys.add(key);
    const candidates = await loadRankCandidates(
      rule.metric as PeriodMetric,
      rule.maxRank
    );
    for (const uid of candidates) {
      const set = periodWinIncrementsByUid.get(uid) ?? new Set();
      set.add(key);
      periodWinIncrementsByUid.set(uid, set);
    }
  }

  const allUids = new Set<string>([
    ...grantsByUid.keys(),
    ...periodWinIncrementsByUid.keys(),
  ]);

  const holderIncrements = new Map<string, number>();
  let unlockedUsers = 0;
  let earnedUsers = 0;

  for (const uid of allUids) {
    const skinIds = grantsByUid.get(uid) ?? [];
    const winKeys = periodWinIncrementsByUid.get(uid);
    const userRef = db.doc(`users/${uid}`);
    let newlyUnlocked: string[] = [];
    let wroteEarn = false;
    let careerCount = 0;
    await db.runTransaction(async (tx) => {
      newlyUnlocked = [];
      wroteEarn = false;
      careerCount = 0;
      const userSnap = await tx.get(userRef);
      const user = (userSnap.exists ? userSnap.data() : {}) as Record<
        string,
        unknown
      >;

      const patch: Record<string, unknown> = {
        proSkinUnlockSeason: PRO_SKIN_UNLOCK_FROM_SEASON_KEY,
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (skinIds.length > 0) {
        patch.proSkinRankEarnedIds = FieldValue.arrayUnion(...skinIds);
        wroteEarn = true;
      }

      const progressRaw =
        user.proSkinProgress && typeof user.proSkinProgress === "object"
          ? ({ ...(user.proSkinProgress as Record<string, unknown>) } as Record<
              string,
              unknown
            >)
          : {
              seasonKey: PRO_SKIN_UNLOCK_FROM_SEASON_KEY,
              posts: 0,
              exactHits: 0,
              maxWinStreak: 0,
            };

      const periodWinsRaw =
        progressRaw.periodWins && typeof progressRaw.periodWins === "object"
          ? ({
              ...(progressRaw.periodWins as Record<string, unknown>),
            } as Record<string, unknown>)
          : {};

      const unlocked = new Set<string>(
        Array.isArray(user.proSkinUnlockedIds)
          ? user.proSkinUnlockedIds.filter(
              (x): x is string => typeof x === "string"
            )
          : []
      );
      const origUnlockedSize = unlocked.size;
      const prevHeld = new Set<string>([
        ...unlocked,
        ...(Array.isArray(user.proSkinHeldIds)
          ? user.proSkinHeldIds.filter((x): x is string => typeof x === "string")
          : []),
      ]);

      if (winKeys && winKeys.size > 0) {
        for (const key of winKeys) {
          const prev = Number(periodWinsRaw[key] ?? 0);
          const next =
            (Number.isFinite(prev) ? Math.max(0, Math.floor(prev)) : 0) + 1;
          periodWinsRaw[key] = next;
        }
        progressRaw.periodWins = periodWinsRaw;
        progressRaw.seasonKey =
          typeof progressRaw.seasonKey === "string" &&
          progressRaw.seasonKey.length > 0
            ? progressRaw.seasonKey
            : PRO_SKIN_UNLOCK_FROM_SEASON_KEY;
        progressRaw.updatedAtMs = Date.now();
        patch.proSkinProgress = progressRaw;
        wroteEarn = true;

        if (isProUser(user)) {
          for (const rule of periodWinRules) {
            const key = proSkinPeriodWinCounterKey({
              period: rule.period,
              metric: rule.metric,
              maxRank: rule.maxRank,
            });
            if (!winKeys.has(key)) continue;
            const wins = Number(periodWinsRaw[key] ?? 0);
            if (wins >= rule.wins && !unlocked.has(rule.id)) {
              unlocked.add(rule.id);
              if (!prevHeld.has(rule.id)) newlyUnlocked.push(rule.id);
            }
          }
        }
      }

      if (isProUser(user) && skinIds.length > 0) {
        for (const id of skinIds) {
          if (!unlocked.has(id)) {
            unlocked.add(id);
            if (!prevHeld.has(id)) newlyUnlocked.push(id);
          }
        }
      }

      if (
        newlyUnlocked.length > 0 ||
        unlocked.size !== origUnlockedSize ||
        (isProUser(user) && skinIds.length > 0)
      ) {
        patch.proSkinUnlockedIds = [...unlocked];
        patch.proSkinHeldIds = [...new Set([...prevHeld, ...unlocked])];
      }
      if (newlyUnlocked.length > 0) {
        patch.proSkinUnlockNoticeIds = FieldValue.arrayUnion(...newlyUnlocked);
      }

      tx.set(userRef, patch, { merge: true });
      careerCount = countMilestoneUnlockedProSkins([...unlocked]);
    });
    if (wroteEarn) earnedUsers += 1;
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
        console.warn("[grantProSkinRankUnlocks] career skin sync failed", err);
      }
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
      skinIds: [
        ...new Set([
          ...[...grantsByUid.values()].flat(),
          ...periodWinRules.map((r) => r.id),
        ]),
      ],
      grantedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log(
    `[grantProSkinRankUnlocks] ${opts.period} ${opts.labelKey} earned=${earnedUsers} unlocked=${unlockedUsers} candidates=${allUids.size}`
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
