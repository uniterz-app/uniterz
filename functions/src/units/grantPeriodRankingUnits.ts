/**
 * 個人ランキング（週総合 / 月総合+部門）Unit 冪等付与。
 * period_ranking_snapshots（standard）確定後に実行。
 * 同順位は同量（competition）。タイブレークなし。
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
import {
  periodRankingUnitIdempotencyKey,
  periodRankingUnitLedgerReason,
  periodRankingUnitMaxRank,
  periodRankingUnitMetricsForPeriod,
  unitsForPeriodRankingRank,
  type PeriodRankingUnitMetric,
  type PeriodRankingUnitPeriod,
} from "./periodRankingUnitRewards";

/** running のままこの時間を超えたらリトライ許可 */
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

function periodStandardSnapshotDocId(
  period: PeriodRankingUnitPeriod,
  label: string,
  metric: PeriodRankingUnitMetric
): string {
  return `nba_${period}_${label}_${metric}`;
}

/** Pro Skin 付与と同じ猶予（期間終了 + grace 後のみ true） */
export function isNbaPeriodFinalForUnitGrants(
  period: NbaRankingPeriod,
  labelKey: string,
  now: Date = new Date()
): boolean {
  const todayKey = dateKeyJST(now);
  if (period === "weekly") {
    const current = weekStartDateKeyJST(now);
    if (labelKey >= current) return false;
    if (
      todayKey <= addDaysToDateKey(current, PERIOD_FINALIZE_GRACE_DAYS) &&
      labelKey === previousLabel("weekly", current)
    ) {
      return false;
    }
    return true;
  }
  const current = monthLabelJST(now);
  if (labelKey >= current) return false;
  if (
    todayKey <=
      addDaysToDateKey(`${current}-01`, PERIOD_FINALIZE_GRACE_DAYS) &&
    labelKey === previousLabel("monthly", current)
  ) {
    return false;
  }
  return true;
}

async function claimPeriodUnitGrant(opts: {
  period: PeriodRankingUnitPeriod;
  labelKey: string;
}): Promise<boolean> {
  const db = getFirestore();
  const grantRef = db.doc(
    `meta/periodRankingUnitGrants/${opts.period}_${opts.labelKey}`
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
        status: "running",
        startedAt: FieldValue.serverTimestamp(),
        attempt: FieldValue.increment(1),
      },
      { merge: true }
    );
    return true;
  });
}

type RankEntry = { uid: string; rank: number };

function loadRankEntriesFromSnapshot(data: {
  ranks?: Record<string, number>;
  rows?: Array<{ uid?: string; rank?: number }>;
}): RankEntry[] {
  const byUid = new Map<string, number>();
  const ranks = data.ranks ?? {};
  for (const [uid, rank] of Object.entries(ranks)) {
    if (typeof rank === "number" && rank > 0) byUid.set(uid, rank);
  }
  if (byUid.size === 0 && Array.isArray(data.rows)) {
    for (const row of data.rows) {
      const uid = typeof row.uid === "string" ? row.uid : "";
      const rank = typeof row.rank === "number" ? row.rank : 0;
      if (uid && rank > 0) byUid.set(uid, rank);
    }
  }
  return [...byUid.entries()].map(([uid, rank]) => ({ uid, rank }));
}

export async function grantPeriodRankingUnitsForPeriod(opts: {
  period: PeriodRankingUnitPeriod;
  labelKey: string;
  now?: Date;
}): Promise<{ granted: boolean; ledgerWrites: number; skipped: number }> {
  const now = opts.now ?? new Date();
  if (!isNbaPeriodFinalForUnitGrants(opts.period, opts.labelKey, now)) {
    return { granted: false, ledgerWrites: 0, skipped: 0 };
  }

  const claimed = await claimPeriodUnitGrant({
    period: opts.period,
    labelKey: opts.labelKey,
  });
  if (!claimed) return { granted: false, ledgerWrites: 0, skipped: 0 };

  const db = getFirestore();
  const grantRef = db.doc(
    `meta/periodRankingUnitGrants/${opts.period}_${opts.labelKey}`
  );
  const reason = periodRankingUnitLedgerReason(opts.period);
  const metrics = periodRankingUnitMetricsForPeriod(opts.period);

  let ledgerWrites = 0;
  let skipped = 0;
  const metricStats: Record<string, number> = {};

  try {
    for (const metric of metrics) {
      const maxRank = periodRankingUnitMaxRank(opts.period, metric);
      if (maxRank <= 0) continue;

      const snap = await db
        .collection("period_ranking_snapshots")
        .doc(
          periodStandardSnapshotDocId(opts.period, opts.labelKey, metric)
        )
        .get();
      if (!snap.exists) {
        console.warn(
          `[grantPeriodRankingUnits] missing snapshot ${opts.period} ${opts.labelKey} ${metric}`
        );
        continue;
      }

      const entries = loadRankEntriesFromSnapshot(
        (snap.data() ?? {}) as {
          ranks?: Record<string, number>;
          rows?: Array<{ uid?: string; rank?: number }>;
        }
      );

      let metricGranted = 0;
      for (const { uid, rank } of entries) {
        if (rank > maxRank) continue;
        const amount = unitsForPeriodRankingRank(opts.period, metric, rank);
        if (amount == null) continue;

        const key = periodRankingUnitIdempotencyKey({
          period: opts.period,
          label: opts.labelKey,
          metric,
          uid,
        });
        const ledgerRef = db.collection("unit_ledger").doc(key);
        const userRef = db.collection("users").doc(uid);

        const did = await db.runTransaction(async (tx) => {
          const existing = await tx.get(ledgerRef);
          if (existing.exists) return false;
          tx.set(ledgerRef, {
            uid,
            amount,
            reason,
            idempotencyKey: key,
            period: opts.period,
            label: opts.labelKey,
            metric,
            rank,
            createdAt: FieldValue.serverTimestamp(),
          });
          tx.set(
            userRef,
            {
              unitBalance: FieldValue.increment(amount),
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
          return true;
        });

        if (did) {
          ledgerWrites += 1;
          metricGranted += 1;
        } else {
          skipped += 1;
        }
      }
      metricStats[metric] = metricGranted;
    }

    await grantRef.set(
      {
        status: "done",
        period: opts.period,
        labelKey: opts.labelKey,
        division: "standard",
        ledgerWrites,
        skipped,
        metricStats,
        grantedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(
      `[grantPeriodRankingUnits] ${opts.period} ${opts.labelKey} writes=${ledgerWrites} skipped=${skipped}`,
      metricStats
    );
    return { granted: true, ledgerWrites, skipped };
  } catch (err) {
    await grantRef.set(
      {
        status: "error",
        error: err instanceof Error ? err.message : String(err),
        failedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    throw err;
  }
}

export async function grantPeriodRankingUnitsAfterPeriodSnapshots(
  now: Date = new Date()
): Promise<void> {
  const weekCurrent = weekStartDateKeyJST(now);
  const weekPrev = previousLabel("weekly", weekCurrent);
  const monthCurrent = monthLabelJST(now);
  const monthPrev = previousLabel("monthly", monthCurrent);

  await grantPeriodRankingUnitsForPeriod({
    period: "weekly",
    labelKey: weekPrev,
    now,
  });
  await grantPeriodRankingUnitsForPeriod({
    period: "monthly",
    labelKey: monthPrev,
    now,
  });
}
