/**
 * 試合確定で印を付けたユーザーだけ、日次推移を組み立て直す。
 * 確定処理の中ではチャートを読まない。
 */
import { FieldValue, getFirestore } from "firebase-admin/firestore";
import {
  PROFILE_CHARTS_BUNDLE_VERSION,
  pruneLast20,
  replaceDailyTrendRow,
  type ProfileChartsDailyRow,
  type ProfileChartsLast20Point,
} from "./mergeProfileCharts";
import {
  PROFILE_CHARTS_SUBCOL,
  profileChartsOpenDocId,
  profileChartsSubdocMergeFields,
} from "./profileChartsStorage";
import {
  PROFILE_CHART_DIRTY_CHART_IDS_FIELD,
  PROFILE_CHART_DIRTY_DATES_FIELD,
  PROFILE_CHART_DIRTY_FIELD,
} from "./profileChartDirty";

const QUERY_LIMIT = 200;
const MAX_LOOPS = 20;
const MAX_DATES = 80;
const MAX_CHARTS = 20;
const BUDGET_MS = 90_000;
const CONCURRENCY = 8;

function asStringList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && item.length > 0);
}

function seasonKeyOfChart(chartId: string): { seasonKey: string; open: boolean } {
  const seasonKey = chartId.replace(/__open$/, "");
  const open = chartId === profileChartsOpenDocId(seasonKey);
  return { seasonKey: open ? seasonKey : chartId, open };
}

async function refreshOne(
  db: FirebaseFirestore.Firestore,
  cumulativeRef: FirebaseFirestore.DocumentReference
): Promise<void> {
  const uid = cumulativeRef.id;
  await db.runTransaction(async (tx) => {
    const cumSnap = await tx.get(cumulativeRef);
    if (!cumSnap.exists || cumSnap.get(PROFILE_CHART_DIRTY_FIELD) !== true) return;

    const allDates = asStringList(cumSnap.get(PROFILE_CHART_DIRTY_DATES_FIELD));
    const allChartIds = asStringList(cumSnap.get(PROFILE_CHART_DIRTY_CHART_IDS_FIELD));
    const dates = allDates.slice(0, MAX_DATES);
    const chartIds = allChartIds.slice(0, MAX_CHARTS);
    const truncated =
      dates.length < allDates.length || chartIds.length < allChartIds.length;

    const dailyRefs = dates.map((dateKey) =>
      db.doc(`user_stats_v2_daily/${uid}_${dateKey}`)
    );
    const chartRefs = chartIds.map((chartId) =>
      cumulativeRef.collection(PROFILE_CHARTS_SUBCOL).doc(chartId)
    );
    const [dailySnaps, chartSnaps] = await Promise.all([
      Promise.all(dailyRefs.map((ref) => tx.get(ref))),
      Promise.all(chartRefs.map((ref) => tx.get(ref))),
    ]);

    const dailyByDate = new Map<string, Record<string, unknown>>();
    dates.forEach((dateKey, index) => {
      const snap = dailySnaps[index];
      if (snap?.exists) {
        dailyByDate.set(dateKey, snap.data() as Record<string, unknown>);
      }
    });

    chartIds.forEach((chartId, index) => {
      const snap = chartSnaps[index];
      const stored = (snap?.exists ? snap.data() : {}) as Record<string, unknown>;
      const { seasonKey, open } = seasonKeyOfChart(chartId);
      let dailyTrend = Array.isArray(stored.dailyTrend)
        ? (stored.dailyTrend as ProfileChartsDailyRow[])
        : [];
      for (const dateKey of dates) {
        const daily = dailyByDate.get(dateKey);
        const bucketMap = (
          open ? daily?.openRankingBySeason : daily?.rankingBySeason
        ) as Record<string, Record<string, unknown>> | undefined;
        dailyTrend = replaceDailyTrendRow(dailyTrend, dateKey, bucketMap?.[seasonKey]);
      }
      const last20 = pruneLast20(
        Array.isArray(stored.last20)
          ? (stored.last20 as ProfileChartsLast20Point[])
          : []
      );
      const rankTrend = Array.isArray(stored.rankTrend) ? stored.rankTrend : undefined;
      tx.set(
        chartRefs[index]!,
        profileChartsSubdocMergeFields({
          v: PROFILE_CHARTS_BUNDLE_VERSION,
          seasonKey,
          dailyTrend,
          last20,
          ...(rankTrend ? { rankTrend } : {}),
        }),
        { merge: true }
      );
    });

    if (truncated) {
      tx.set(
        cumulativeRef,
        {
          ...(dates.length > 0
            ? { [PROFILE_CHART_DIRTY_DATES_FIELD]: FieldValue.arrayRemove(...dates) }
            : {}),
          ...(chartIds.length > 0
            ? {
                [PROFILE_CHART_DIRTY_CHART_IDS_FIELD]: FieldValue.arrayRemove(...chartIds),
              }
            : {}),
        },
        { merge: true }
      );
      return;
    }

    tx.set(
      cumulativeRef,
      {
        [PROFILE_CHART_DIRTY_FIELD]: false,
        [PROFILE_CHART_DIRTY_DATES_FIELD]: FieldValue.delete(),
        [PROFILE_CHART_DIRTY_CHART_IDS_FIELD]: FieldValue.delete(),
      },
      { merge: true }
    );
  });
}

async function mapPool(
  refs: FirebaseFirestore.DocumentReference[],
  worker: (ref: FirebaseFirestore.DocumentReference) => Promise<void>
): Promise<void> {
  let cursor = 0;
  const runners = Array.from({ length: Math.min(CONCURRENCY, refs.length) }, async () => {
    while (cursor < refs.length) {
      const ref = refs[cursor];
      cursor += 1;
      if (!ref) continue;
      try {
        await worker(ref);
      } catch (err) {
        console.warn("[refreshDirtyProfileCharts] user failed", ref.id, err);
      }
    }
  });
  await Promise.all(runners);
}

/** chartDirty のユーザーだけ日次推移を直す。16:00 と 23:30 の cron から呼ぶ */
export async function refreshDirtyProfileCharts(
  db: FirebaseFirestore.Firestore = getFirestore()
): Promise<{ users: number }> {
  const started = Date.now();
  let users = 0;

  for (let loop = 0; loop < MAX_LOOPS; loop++) {
    if (Date.now() - started > BUDGET_MS) break;
    const snap = await db
      .collection("cumulative_stats")
      .where(PROFILE_CHART_DIRTY_FIELD, "==", true)
      .limit(QUERY_LIMIT)
      .get();
    if (snap.empty) break;

    await mapPool(
      snap.docs.map((doc) => doc.ref),
      async (ref) => {
        await refreshOne(db, ref);
        users += 1;
      }
    );

    if (snap.size < QUERY_LIMIT) break;
  }

  console.log("[refreshDirtyProfileCharts]", { users, ms: Date.now() - started });
  return { users };
}
