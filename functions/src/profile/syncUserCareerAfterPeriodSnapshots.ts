/**
 * 週/月 period_ranking_snapshots（totalPoints）確定後に
 * 全行の順位を user_career へ冪等反映。
 */
import { getFirestore } from "firebase-admin/firestore";
import {
  isNbaPeriodFinalForUnitGrants,
} from "../units/grantPeriodRankingUnits";
import {
  monthLabelJST,
  previousLabel,
  weekStartDateKeyJST,
  type NbaRankingPeriod,
} from "../rankings/nbaPeriod";
import { nbaSeasonKeyFromDateJST } from "../rankings/nbaSeason";
import { syncUserCareerPeriodRank } from "./syncUserCareer";

function periodStandardSnapshotDocId(
  period: NbaRankingPeriod,
  label: string,
  metric: string
): string {
  return `nba_${period}_${label}_${metric}`;
}

function loadRankEntries(data: {
  ranks?: Record<string, number>;
  rows?: Array<{ uid?: string; rank?: number }>;
}): Array<{ uid: string; rank: number }> {
  const out: Array<{ uid: string; rank: number }> = [];
  if (data.ranks && typeof data.ranks === "object") {
    for (const [uid, rank] of Object.entries(data.ranks)) {
      if (!uid) continue;
      const r = typeof rank === "number" ? rank : Number(rank);
      if (Number.isFinite(r) && r >= 1) out.push({ uid, rank: Math.floor(r) });
    }
    return out;
  }
  if (Array.isArray(data.rows)) {
    for (const row of data.rows) {
      const uid = typeof row.uid === "string" ? row.uid : "";
      const r = typeof row.rank === "number" ? row.rank : Number(row.rank);
      if (uid && Number.isFinite(r) && r >= 1) {
        out.push({ uid, rank: Math.floor(r) });
      }
    }
  }
  return out;
}

function seasonKeyFromPeriodLabel(
  period: NbaRankingPeriod,
  label: string
): string {
  if (period === "monthly") {
    const [y, m] = label.split("-").map(Number);
    if (Number.isFinite(y) && Number.isFinite(m)) {
      return nbaSeasonKeyFromDateJST(new Date(Date.UTC(y, m - 1, 15)));
    }
  }
  // weekly label = Monday dateKey
  const [y, m, d] = label.split("-").map(Number);
  if (Number.isFinite(y) && Number.isFinite(m) && Number.isFinite(d)) {
    return nbaSeasonKeyFromDateJST(new Date(Date.UTC(y, m - 1, d)));
  }
  return nbaSeasonKeyFromDateJST(new Date());
}

export async function syncUserCareerForPeriod(opts: {
  period: NbaRankingPeriod;
  labelKey: string;
  now?: Date;
}): Promise<{ updated: number }> {
  const now = opts.now ?? new Date();
  if (!isNbaPeriodFinalForUnitGrants(opts.period, opts.labelKey, now)) {
    return { updated: 0 };
  }

  const db = getFirestore();
  const docId = periodStandardSnapshotDocId(
    opts.period,
    opts.labelKey,
    "totalPoints"
  );
  const snap = await db.collection("period_ranking_snapshots").doc(docId).get();
  if (!snap.exists) return { updated: 0 };

  const entries = loadRankEntries(
    (snap.data() ?? {}) as {
      ranks?: Record<string, number>;
      rows?: Array<{ uid?: string; rank?: number }>;
    }
  );
  const seasonKey = seasonKeyFromPeriodLabel(opts.period, opts.labelKey);
  let updated = 0;
  // 逐次で OK（週1/月1）。並列しすぎると transaction 競合・コスト増。
  for (const { uid, rank } of entries) {
    try {
      await syncUserCareerPeriodRank({
        uid,
        period: opts.period,
        label: opts.labelKey,
        rank,
        seasonKey,
      });
      updated += 1;
    } catch (err) {
      console.warn(
        `[syncUserCareerForPeriod] ${opts.period} ${opts.labelKey} uid=${uid}`,
        err
      );
    }
  }
  console.log(
    `[syncUserCareerForPeriod] ${opts.period} ${opts.labelKey} updated=${updated}/${entries.length}`
  );
  return { updated };
}

export async function syncUserCareerAfterPeriodSnapshots(
  now: Date = new Date()
): Promise<void> {
  const weekPrev = previousLabel("weekly", weekStartDateKeyJST(now));
  const monthPrev = previousLabel("monthly", monthLabelJST(now));
  await syncUserCareerForPeriod({
    period: "weekly",
    labelKey: weekPrev,
    now,
  });
  await syncUserCareerForPeriod({
    period: "monthly",
    labelKey: monthPrev,
    now,
  });
}
