/**
 * profileCharts subcollection 書き込み（Functions）。
 * 親 cumulative_stats.profileCharts には書かない。
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

/** 欠けているキーは書かない（last20 未書き込みを [] で潰さない） */
export function profileChartsSubdocMergeFields(
  charts: {
    v: number;
    seasonKey: string;
    dailyTrend?: unknown[];
    rankTrend?: unknown[];
    last20?: unknown[];
  },
  builtAtMs = Date.now()
): Record<string, unknown> {
  const fields: Record<string, unknown> = {
    v: charts.v,
    seasonKey: charts.seasonKey,
    builtAtMs,
  };
  if (charts.dailyTrend !== undefined) fields.dailyTrend = charts.dailyTrend;
  if (charts.rankTrend !== undefined) fields.rankTrend = charts.rankTrend;
  if (charts.last20 !== undefined) fields.last20 = charts.last20;
  return fields;
}

const GET_ALL_CHUNK = 90;

/** ランキングスナップショット用。subcol を chunk getAll */
export async function loadProfileChartsSubcolByUid(
  firestore: FirebaseFirestore.Firestore,
  uids: string[],
  seasonKey: string
): Promise<Map<string, Record<string, unknown>>> {
  const out = new Map<string, Record<string, unknown>>();
  const unique = [...new Set(uids.map((u) => u.trim()).filter(Boolean))];
  const refs = unique.map((uid) =>
    firestore.doc(`cumulative_stats/${uid}/${PROFILE_CHARTS_SUBCOL}/${seasonKey}`)
  );
  for (let i = 0; i < refs.length; i += GET_ALL_CHUNK) {
    const snaps = await firestore.getAll(...refs.slice(i, i + GET_ALL_CHUNK));
    for (const snap of snaps) {
      if (!snap.exists) continue;
      const uid = snap.ref.parent.parent?.id;
      if (!uid) continue;
      out.set(uid, snap.data() as Record<string, unknown>);
    }
  }
  return out;
}

/** subcollection のみ（親 nested には書かない） */
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
  const cumRef = firestore.doc(`cumulative_stats/${uid}`);
  batch.set(
    cumRef.collection(PROFILE_CHARTS_SUBCOL).doc(charts.seasonKey),
    profileChartsSubdocMergeFields(charts, builtAtMs),
    { merge: true }
  );
}
