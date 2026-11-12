/**
 * 公開 NBA API 用の Firestore。下の表のコレクションの `doc().get()` だけを
 * unstable_cache（Vercel の共有キャッシュ）経由にする。
 *
 * 200KB 級のシーズン doc（ロスター・ペイロール・リーグ表など）を選手・チーム・試合ごとに
 * 読み直すと、Firestore のインターネット転送量（外向き）がそのまま課金される。
 * Vercel の関数は hnd1 の 1 リージョンだけなので、doc 1 本は TTL / tag 破棄ごとに 1 回だけ読む。
 *
 * ingest・書き込みでは使わない（古い doc で計算しないよう `getAdminDb()` を直接使う）。
 * クエリ（where / orderBy）・getAll・トランザクションは素通し。
 */
import { revalidateTag, unstable_cache } from "next/cache";
import {
  Timestamp,
  type CollectionReference,
  type DocumentData,
  type DocumentReference,
  type DocumentSnapshot,
  type Firestore,
} from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

/**
 * ingest の書き込みは必ず tag で捨てるので、期限は保険。
 * Next の外（scripts/）から書いたときだけ、この期限まで古いまま残る。
 */
const DEFAULT_TTL_SEC = 86400;

/** コレクション → 時間切れ（秒）。ingest 後は tag で即捨てる */
const NBA_PUBLIC_DOC_CACHE_TTL: Readonly<Record<string, number>> = {
  nbaTeamRosters: DEFAULT_TTL_SEC,
  nbaTeamPayrolls: DEFAULT_TTL_SEC,
  nbaTeamInjuries: 3600,
  nbaLeaguePlayerStats: DEFAULT_TTL_SEC,
  nbaLeagueTeamStats: DEFAULT_TTL_SEC,
  nbaDiscipline: DEFAULT_TTL_SEC,
  nbaTeamCleanRatings: DEFAULT_TTL_SEC,
  nbaTeamOffseasonMoves: DEFAULT_TTL_SEC,
  nbaTeamShapeRecords: DEFAULT_TTL_SEC,
  nbaTeamSeasonRecords: DEFAULT_TTL_SEC,
  nbaStandings: DEFAULT_TTL_SEC,
  nbaTeamAceOutRecords: DEFAULT_TTL_SEC,
  nbaLeagueHub: DEFAULT_TTL_SEC,
  nbaTeamGameLogs: DEFAULT_TTL_SEC,
  nbaTeamInsightExtras: DEFAULT_TTL_SEC,
  nbaPlayerShotAreas: DEFAULT_TTL_SEC,
  nbaPlayerContracts: DEFAULT_TTL_SEC,
  nbaPlayerCareerSeasons: DEFAULT_TTL_SEC,
  nbaPlayerGameLogs: DEFAULT_TTL_SEC,
  nbaPlayerShotZones: DEFAULT_TTL_SEC,
  nbaPlayerSeasonMetrics: DEFAULT_TTL_SEC,
  nbaPlayerOutImpact: DEFAULT_TTL_SEC,
};

export type NbaPublicDocCollection = keyof typeof NBA_PUBLIC_DOC_CACHE_TTL;

const NBA_DOC_CACHE_TAG = "nba-doc";

function nbaDocCacheTag(collection: string): string {
  return `${NBA_DOC_CACHE_TAG}:${collection}`;
}

/** doc から作った派生値を別に unstable_cache するときの tag（doc と同時に捨てる） */
export function nbaDocCacheTags(collections: readonly NbaPublicDocCollection[]): string[] {
  return [NBA_DOC_CACHE_TAG, ...collections.map(nbaDocCacheTag)];
}

/**
 * ingest の書き込み後に呼ぶ（Route Handler 内）。省略時は全コレクション。
 */
export function revalidateNbaDocCache(
  collections?: readonly NbaPublicDocCollection[]
): void {
  try {
    if (!collections) {
      revalidateTag(NBA_DOC_CACHE_TAG, { expire: 0 });
      return;
    }
    for (const c of collections) revalidateTag(nbaDocCacheTag(c), { expire: 0 });
  } catch {
    // スクリプト（Next 外）から呼ばれたときは無視。TTL で入れ替わる
  }
}

/** JSON 化で Timestamp が壊れないよう印を付ける */
const TS_KEY = "__fsTs";

function encodeValue(v: unknown): unknown {
  if (v instanceof Timestamp) return { [TS_KEY]: [v.seconds, v.nanoseconds] };
  if (Array.isArray(v)) return v.map(encodeValue);
  if (v && typeof v === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(v as Record<string, unknown>)) {
      out[k] = encodeValue(x);
    }
    return out;
  }
  return v;
}

function decodeValue(v: unknown): unknown {
  if (Array.isArray(v)) return v.map(decodeValue);
  if (v && typeof v === "object") {
    const obj = v as Record<string, unknown>;
    const ts = obj[TS_KEY];
    if (Array.isArray(ts) && ts.length === 2) {
      return new Timestamp(Number(ts[0]), Number(ts[1]));
    }
    const out: Record<string, unknown> = {};
    for (const [k, x] of Object.entries(obj)) out[k] = decodeValue(x);
    return out;
  }
  return v;
}

type CachedDoc = { exists: boolean; data: unknown };

function readDocCached(
  db: Firestore,
  path: string,
  collection: string,
  ttlSec: number
): Promise<CachedDoc> {
  return unstable_cache(
    async (): Promise<CachedDoc> => {
      const snap = await db.doc(path).get();
      return snap.exists
        ? { exists: true, data: encodeValue(snap.data()) }
        : { exists: false, data: null };
    },
    ["nba-doc", path],
    { revalidate: ttlSec, tags: nbaDocCacheTags([collection as NbaPublicDocCollection]) }
  )();
}

function fieldAt(data: DocumentData | undefined, field: string): unknown {
  let cur: unknown = data;
  for (const part of field.split(".")) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[part];
  }
  return cur;
}

function cachedSnapshot(ref: DocumentReference, hit: CachedDoc): DocumentSnapshot {
  const snap = {
    id: ref.id,
    ref,
    exists: hit.exists,
    data: () => (hit.exists ? (decodeValue(hit.data) as DocumentData) : undefined),
    get: (field: string) =>
      hit.exists ? fieldAt(decodeValue(hit.data) as DocumentData, field) : undefined,
  };
  return snap as unknown as DocumentSnapshot;
}

function bindPassthrough<T extends object>(target: T, prop: string | symbol): unknown {
  const v = Reflect.get(target, prop, target);
  return typeof v === "function" ? v.bind(target) : v;
}

function wrapDocRef(
  db: Firestore,
  ref: DocumentReference,
  collection: string,
  ttlSec: number
): DocumentReference {
  return new Proxy(ref, {
    get(target, prop) {
      if (prop === "get") {
        return async () =>
          cachedSnapshot(target, await readDocCached(db, target.path, collection, ttlSec));
      }
      if (prop === "collection") {
        return (id: string) => wrapCollectionRef(db, target.collection(id), collection, ttlSec);
      }
      return bindPassthrough(target, prop);
    },
  });
}

function wrapCollectionRef(
  db: Firestore,
  col: CollectionReference,
  collection: string,
  ttlSec: number
): CollectionReference {
  return new Proxy(col, {
    get(target, prop) {
      if (prop === "doc") {
        return (id?: string) =>
          id == null
            ? target.doc()
            : wrapDocRef(db, target.doc(id), collection, ttlSec);
      }
      return bindPassthrough(target, prop);
    },
  });
}

function ttlForPath(path: string): { collection: string; ttlSec: number } | null {
  const collection = path.split("/")[0] ?? "";
  const ttlSec = NBA_PUBLIC_DOC_CACHE_TTL[collection];
  return ttlSec ? { collection, ttlSec } : null;
}

let publicDb: Firestore | null = null;

/** 公開 NBA API（GET）専用。書き込み・ingest には `getAdminDb()` を使う */
export function getNbaPublicReadDb(): Firestore {
  if (publicDb) return publicDb;
  const db = getAdminDb();
  publicDb = new Proxy(db, {
    get(target, prop) {
      if (prop === "collection") {
        return (path: string) => {
          const col = target.collection(path);
          const hit = ttlForPath(path);
          return hit ? wrapCollectionRef(target, col, hit.collection, hit.ttlSec) : col;
        };
      }
      if (prop === "doc") {
        return (path: string) => {
          const ref = target.doc(path);
          const hit = ttlForPath(path);
          return hit ? wrapDocRef(target, ref, hit.collection, hit.ttlSec) : ref;
        };
      }
      return bindPassthrough(target, prop);
    },
  });
  return publicDb;
}
