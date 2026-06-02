import { getAdminDb } from "@/lib/firebaseAdmin";

type RowLike = Record<string, unknown> & { uid?: string };

function pickUserHandle(data: {
  handle?: string;
  slug?: string;
  username?: string;
}): string | undefined {
  for (const v of [data.handle, data.slug, data.username]) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickUserDisplayName(data: {
  displayName?: string;
  name?: string;
  handle?: string;
  slug?: string;
  username?: string;
}): string | undefined {
  if (typeof data.displayName === "string" && data.displayName.trim()) {
    return data.displayName.trim();
  }
  if (typeof data.name === "string" && data.name.trim()) {
    return data.name.trim();
  }
  const h = pickUserHandle(data);
  return h;
}

/** users ドキュメントから plan と（存在する場合のみ）国旗用 countryCode を取り出す */
type UserMergeFields = {
  plan: "free" | "pro";
  /** ドキュメントがあるときだけ付与。未設定は Functions の行をそのまま使う */
  countryCode?: string | null;
  handle?: string;
  displayName?: string;
  photoURL?: string | null;
};

function planFromUserDoc(data: { plan?: string } | undefined): "free" | "pro" {
  return data?.plan === "pro" ? "pro" : "free";
}

/** Cloud Functions getCumulativeRanking と同じ country の正規化 */
function countryFromUserDoc(data: { countryCode?: unknown } | undefined): string | null {
  const raw = data?.countryCode;
  if (typeof raw === "string" && raw.trim() !== "") {
    return raw.trim().slice(0, 8);
  }
  return null;
}

/** Firestore users をバッチ取得して uid → plan / countryCode（1 回の getAll で両方） */
async function loadUserMergeFieldsByUid(
  uids: string[]
): Promise<Map<string, UserMergeFields>> {
  const out = new Map<string, UserMergeFields>();
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
        out.set(id, { plan: "free" });
        return;
      }
      const data = snap.data() as {
        plan?: string;
        countryCode?: unknown;
        handle?: string;
        displayName?: string;
        photoURL?: string | null;
      };
      out.set(id, {
        plan: planFromUserDoc(data),
        countryCode: countryFromUserDoc(data),
        handle: pickUserHandle(data),
        displayName: pickUserDisplayName(data),
        photoURL:
          typeof data.photoURL === "string" && data.photoURL.trim()
            ? data.photoURL.trim()
            : null,
      });
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

/**
 * cumulative-ranking/bulk のレスポンスに users の plan / countryCode を反映。
 * unstable_cache 内の古い行でも、他ユーザーの国旗が Firestore と一致するようにする。
 */
export async function mergeUserPlansIntoBulkByMetric(
  byMetric: Record<string, { rows?: unknown[]; myRow?: unknown | null }>
): Promise<void> {
  const fieldsByUid = await loadUserMergeFieldsByUid(collectUidsFromBulk(byMetric));

  for (const bundle of Object.values(byMetric)) {
    if (Array.isArray(bundle.rows)) {
      bundle.rows = bundle.rows.map((row) => {
        const r = row as RowLike;
        const uid = r.uid;
        if (typeof uid !== "string" || !uid) return row;
        const f = fieldsByUid.get(uid);
        if (f === undefined) return row;
        const next: RowLike = { ...r, plan: f.plan };
        if ("countryCode" in f) {
          next.countryCode = f.countryCode;
        }
        if (f.handle) next.handle = f.handle;
        if (f.displayName) next.displayName = f.displayName;
        if (f.photoURL) next.photoURL = f.photoURL;
        return next;
      });
    }
    if (bundle.myRow && typeof (bundle.myRow as RowLike).uid === "string") {
      const m = bundle.myRow as RowLike;
      const f = fieldsByUid.get(m.uid as string);
      if (f !== undefined) {
        const next: RowLike = { ...m, plan: f.plan };
        if ("countryCode" in f) {
          next.countryCode = f.countryCode;
        }
        if (f.handle) next.handle = f.handle;
        if (f.displayName) next.displayName = f.displayName;
        if (f.photoURL) next.photoURL = f.photoURL;
        bundle.myRow = next;
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
  const fieldsByUid = await loadUserMergeFieldsByUid([...uids]);

  body.rows = body.rows.map((row) => {
    const r = row as RowLike;
    const uid = r.uid;
    if (typeof uid !== "string" || !uid) return row;
    const f = fieldsByUid.get(uid);
    if (f === undefined) return row;
    const next: RowLike = { ...r, plan: f.plan };
    if ("countryCode" in f) {
      next.countryCode = f.countryCode;
    }
    if (f.handle) next.handle = f.handle;
    if (f.displayName) next.displayName = f.displayName;
    if (f.photoURL) next.photoURL = f.photoURL;
    return next;
  });

  if (body.myRow && typeof (body.myRow as RowLike).uid === "string") {
    const m = body.myRow as RowLike;
    const f = fieldsByUid.get(m.uid as string);
    if (f !== undefined) {
      const next: RowLike = { ...m, plan: f.plan };
      if ("countryCode" in f) {
        next.countryCode = f.countryCode;
      }
      if (f.handle) next.handle = f.handle;
      if (f.displayName) next.displayName = f.displayName;
      if (f.photoURL) next.photoURL = f.photoURL;
      body.myRow = next;
    }
  }
}
