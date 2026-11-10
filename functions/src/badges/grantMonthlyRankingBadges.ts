/**
 * 月間ランキングバッジの自動付与（前月分）。
 * 期間 Unit 付与と同じ cron から毎日呼ぶ。付与済みの月はロック doc 1 件の読み取りで終わる。
 * 前月の画像がサイト（public/badges/monthly/{YYYY-MM}/）に出るまでは付与しない（翌日以降に再試行）。
 */
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { monthLabelJST, previousLabel } from "../rankings/nbaPeriod";
import { isNbaPeriodFinalForUnitGrants } from "../units/grantPeriodRankingUnits";
import {
  MONTHLY_BADGE_DIVISIONS,
  MONTHLY_BADGE_FIRST_LABEL,
  MONTHLY_BADGE_KINDS,
  monthlyBadgeArt,
  monthlyBadgeGrantsFromSnapshot,
  monthlyBadgeMasterDoc,
  monthlyBadgeRefsForLabel,
  monthlyBadgeSnapshotDocId,
  monthlyBadgeUserMeta,
  monthlyRankingBadgeId,
  type MonthlyBadgeGrant,
} from "./monthlyRankingBadge";

const ASSET_ORIGIN = "https://www.uniterz.app";
const LOCK_COLLECTION = "meta/monthlyRankingBadgeGrants/locks";
const RUNNING_STALE_MS = 15 * 60 * 1000;

function timestampToMs(v: unknown): number {
  if (v && typeof v === "object" && typeof (v as { toMillis?: () => number }).toMillis === "function") {
    return (v as { toMillis: () => number }).toMillis();
  }
  return 0;
}

async function artIsLive(label: string): Promise<boolean> {
  const refs = monthlyBadgeRefsForLabel(label);
  const paths = new Set<string>();
  for (const ref of refs) {
    const art = monthlyBadgeArt(ref);
    paths.add(art.full);
    paths.add(art.back);
  }
  for (const p of paths) {
    try {
      const res = await fetch(`${ASSET_ORIGIN}${p}`, { method: "HEAD" });
      if (!res.ok) {
        console.warn(`[grantMonthlyRankingBadges] art missing ${p} (${res.status})`);
        return false;
      }
    } catch (err) {
      console.warn(`[grantMonthlyRankingBadges] art check failed ${p}`, err);
      return false;
    }
  }
  return true;
}

async function claim(label: string): Promise<boolean> {
  const db = getFirestore();
  const ref = db.doc(`${LOCK_COLLECTION}/${label}`);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (snap.exists) {
      const data = (snap.data() ?? {}) as Record<string, unknown>;
      if (data.status === "done") return false;
      if (data.status === "running") {
        const started = timestampToMs(data.startedAt);
        if (started > 0 && Date.now() - started < RUNNING_STALE_MS) return false;
      }
    }
    tx.set(
      ref,
      { label, status: "running", startedAt: FieldValue.serverTimestamp(), attempt: FieldValue.increment(1) },
      { merge: true }
    );
    return true;
  });
}

export async function grantMonthlyRankingBadgesForLabel(
  label: string,
  now: Date = new Date()
): Promise<{ granted: boolean; written: number }> {
  if (label < MONTHLY_BADGE_FIRST_LABEL) return { granted: false, written: 0 };
  if (!isNbaPeriodFinalForUnitGrants("monthly", label, now)) return { granted: false, written: 0 };

  const db = getFirestore();
  const lockRef = db.doc(`${LOCK_COLLECTION}/${label}`);
  const lock = await lockRef.get();
  if (lock.exists && (lock.data() ?? {}).status === "done") return { granted: false, written: 0 };

  const snapshots = new Map<string, Record<string, unknown>>();
  for (const division of MONTHLY_BADGE_DIVISIONS) {
    for (const spec of MONTHLY_BADGE_KINDS) {
      const docId = monthlyBadgeSnapshotDocId(division, label, spec.kind);
      const snap = await db.collection("period_ranking_snapshots").doc(docId).get();
      if (!snap.exists) {
        console.warn(`[grantMonthlyRankingBadges] wait: missing snapshot ${docId}`);
        return { granted: false, written: 0 };
      }
      const data = (snap.data() ?? {}) as Record<string, unknown>;
      const built = typeof data.snapshotDateKey === "string" ? data.snapshotDateKey : "";
      const range = (data.range ?? {}) as { endKey?: unknown };
      const endKey = typeof range.endKey === "string" ? range.endKey : "";
      if (!built || !endKey || built <= endKey) {
        console.warn(`[grantMonthlyRankingBadges] wait: ${docId} not rebuilt after period end`);
        return { granted: false, written: 0 };
      }
      snapshots.set(docId, data);
    }
  }

  if (!(await artIsLive(label))) return { granted: false, written: 0 };
  if (!(await claim(label))) return { granted: false, written: 0 };

  try {
    const grants: MonthlyBadgeGrant[] = [];
    const participantByBadge = new Map<string, number>();
    for (const division of MONTHLY_BADGE_DIVISIONS) {
      for (const spec of MONTHLY_BADGE_KINDS) {
        const data = snapshots.get(monthlyBadgeSnapshotDocId(division, label, spec.kind))!;
        grants.push(...monthlyBadgeGrantsFromSnapshot({ label, division, kind: spec.kind, snapshot: data }));
        const pc = Number(data.participantCount);
        if (Number.isFinite(pc) && pc > 0) {
          for (let rank = 1; rank <= spec.maxRank; rank++) {
            participantByBadge.set(monthlyRankingBadgeId({ division, label, kind: spec.kind, rank }), Math.floor(pc));
          }
        }
      }
    }

    for (const ref of monthlyBadgeRefsForLabel(label)) {
      const id = monthlyRankingBadgeId(ref);
      const pc = participantByBadge.get(id);
      await db
        .collection("master_badges")
        .doc(id)
        .set({ ...monthlyBadgeMasterDoc(ref), ...(pc != null ? { participantCount: pc } : {}) }, { merge: true });
    }

    let written = 0;
    const newByUid = new Map<string, string>();
    for (const g of grants) {
      const ref = db.collection("user_badges").doc(g.uid).collection("badges").doc(g.badgeId);
      const did = await db.runTransaction(async (tx) => {
        if ((await tx.get(ref)).exists) return false;
        tx.set(ref, { badgeId: g.badgeId, meta: monthlyBadgeUserMeta(g), grantedAt: FieldValue.serverTimestamp() });
        return true;
      });
      if (did) {
        written += 1;
        const prev = newByUid.get(g.uid);
        if (!prev || g.ref.kind === "overall") newByUid.set(g.uid, g.badgeId);
      }
    }

    await lockRef.set(
      { label, status: "done", source: "functions", written, grantedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );

    if (newByUid.size > 0) {
      try {
        const { sendExpoPushToUids } = await import("../notifications/sendExpoPush");
        await sendExpoPushToUids({
          type: "badge_reward",
          targets: [...newByUid.entries()].map(([uid, badgeId]) => ({
            uid,
            data: { type: "badge_reward", badgeId, label },
          })),
        });
      } catch (err) {
        console.warn("[grantMonthlyRankingBadges] push failed", err);
      }
    }

    console.log(`[grantMonthlyRankingBadges] ${label} written=${written} users=${newByUid.size}`);
    return { granted: true, written };
  } catch (err) {
    await lockRef.set(
      { status: "error", error: err instanceof Error ? err.message : String(err), failedAt: FieldValue.serverTimestamp() },
      { merge: true }
    );
    throw err;
  }
}

/** 前月分。毎日呼んでよい（付与済みならロック 1 件の読み取りだけ） */
export async function grantMonthlyRankingBadgesForPreviousMonth(now: Date = new Date()): Promise<void> {
  const label = previousLabel("monthly", monthLabelJST(now));
  await grantMonthlyRankingBadgesForLabel(label, now);
}
