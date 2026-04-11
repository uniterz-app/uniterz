import { getAdminDb } from "@/lib/firebaseAdmin";

type RowLike = Record<string, unknown> & { uid?: string };

function planFromUserDoc(data: { plan?: string } | undefined): "free" | "pro" {
  return data?.plan === "pro" ? "pro" : "free";
}

/** Firestore users をバッチ取得して uid → plan */
async function loadPlansByUid(uids: string[]): Promise<Map<string, "free" | "pro">> {
  const out = new Map<string, "free" | "pro">();
  const unique = [...new Set(uids.filter(Boolean))];
  if (unique.length === 0) return out;

  const db = getAdminDb();
  const BATCH = 100;
  for (let i = 0; i < unique.length; i += BATCH) {
    const batch = unique.slice(i, i + BATCH);
    const refs = batch.map((id) => db.collection("users").doc(id));
    const snaps = await db.getAll(...refs);
    snaps.forEach((snap, j) => {
      const id = batch[j];
      if (!id) return;
      if (!snap.exists) {
        out.set(id, "free");
        return;
      }
      out.set(id, planFromUserDoc(snap.data() as { plan?: string }));
    });
  }
  return out;
}

function collectUidsFromBulk(
  byMetric: Record<string, { rows?: unknown[]; myRow?: unknown | null }>
): string[] {
  const uids = new Set<string>();
  for (const bundle of Object.values(byMetric)) {
    for (const row of Array.isArray(bundle.rows) ? bundle.rows : []) {
      const uid = (row as RowLike).uid;
      if (typeof uid === "string" && uid) uids.add(uid);
    }
    const my = bundle.myRow as RowLike | null | undefined;
    if (my && typeof my.uid === "string" && my.uid) uids.add(my.uid);
  }
  return [...uids];
}

/** cumulative-ranking/bulk のレスポンスに users.plan を反映（Functions 未更新でもバッジ表示用） */
export async function mergeUserPlansIntoBulkByMetric(
  byMetric: Record<string, { rows?: unknown[]; myRow?: unknown | null }>
): Promise<void> {
  const planByUid = await loadPlansByUid(collectUidsFromBulk(byMetric));

  for (const bundle of Object.values(byMetric)) {
    if (Array.isArray(bundle.rows)) {
      bundle.rows = bundle.rows.map((row) => {
        const r = row as RowLike;
        const uid = r.uid;
        if (typeof uid !== "string" || !uid) return row;
        const p = planByUid.get(uid);
        if (p === undefined) return row;
        return { ...r, plan: p };
      });
    }
    if (bundle.myRow && typeof (bundle.myRow as RowLike).uid === "string") {
      const m = bundle.myRow as RowLike;
      const p = planByUid.get(m.uid as string);
      if (p !== undefined) {
        bundle.myRow = { ...m, plan: p };
      }
    }
  }
}

/** cumulative-ranking 単体 GET 用 */
export async function mergeUserPlansIntoSingleRanking(body: {
  rows: unknown[];
  myRow: unknown | null;
}): Promise<void> {
  const uids = new Set<string>();
  for (const row of body.rows) {
    const uid = (row as RowLike).uid;
    if (typeof uid === "string" && uid) uids.add(uid);
  }
  if (body.myRow && typeof (body.myRow as RowLike).uid === "string") {
    uids.add((body.myRow as RowLike).uid as string);
  }
  const planByUid = await loadPlansByUid([...uids]);

  body.rows = body.rows.map((row) => {
    const r = row as RowLike;
    const uid = r.uid;
    if (typeof uid !== "string" || !uid) return row;
    const p = planByUid.get(uid);
    if (p === undefined) return row;
    return { ...r, plan: p };
  });

  if (body.myRow && typeof (body.myRow as RowLike).uid === "string") {
    const m = body.myRow as RowLike;
    const p = planByUid.get(m.uid as string);
    if (p !== undefined) {
      body.myRow = { ...m, plan: p };
    }
  }
}
