/**
 * profileCharts subcollection dual-write（Functions）。
 */
export const PROFILE_CHARTS_SUBCOL = "profileCharts";

export function profileChartsSubdocFields(
  charts: {
    v: number;
    seasonKey: string;
    dailyTrend?: unknown[];
    rankTrend?: unknown[];
    last20?: unknown[];
  },
  builtAtMs = Date.now()
): Record<string, unknown> {
  return {
    v: charts.v,
    seasonKey: charts.seasonKey,
    dailyTrend: charts.dailyTrend ?? [],
    rankTrend: charts.rankTrend ?? [],
    last20: charts.last20 ?? [],
    builtAtMs,
  };
}

export function profileChartsNestedPatch(
  charts: {
    v: number;
    seasonKey: string;
    dailyTrend?: unknown[];
    rankTrend?: unknown[];
    last20?: unknown[];
  },
  builtAtMs = Date.now()
): Record<string, unknown> {
  const fields = profileChartsSubdocFields(charts, builtAtMs);
  return {
    "profileCharts.v": fields.v,
    "profileCharts.seasonKey": fields.seasonKey,
    "profileCharts.dailyTrend": fields.dailyTrend,
    "profileCharts.rankTrend": fields.rankTrend,
    "profileCharts.last20": fields.last20,
    "profileCharts.builtAtMs": fields.builtAtMs,
  };
}

export function writeProfileChartsDualInBatch(
  batch: FirebaseFirestore.WriteBatch,
  firestore: FirebaseFirestore.Firestore,
  uid: string,
  charts: {
    v: number;
    seasonKey: string;
    dailyTrend?: unknown[];
    rankTrend?: unknown[];
    last20?: unknown[];
  },
  builtAtMs = Date.now()
): void {
  const fields = profileChartsSubdocFields(charts, builtAtMs);
  const cumRef = firestore.doc(`cumulative_stats/${uid}`);
  batch.set(cumRef, profileChartsNestedPatch(charts, builtAtMs), {
    merge: true,
  });
  batch.set(
    cumRef.collection(PROFILE_CHARTS_SUBCOL).doc(charts.seasonKey),
    fields,
    { merge: true }
  );
}
