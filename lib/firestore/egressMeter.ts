/**
 * Firestore から Vercel が受け取った量（egress）の概算ログ。
 *
 * どの API / どのコレクションが転送量を食っているかを、推測ではなく数字で見るためのもの。
 * 1 分ごとに 1 行、`[fs-egress]` で console.log する（Vercel のログで検索できる）。
 *
 *   {"windowSec":60,"reads":812,"estMB":3.41,
 *    "byRoute":[{"k":"/api/games/window","calls":40,"reads":520,"estMB":2.1}, ...],
 *    "byCollection":[{"k":"games","reads":560,"estMB":2.8}, ...]}
 *
 * - 読み取りの結果は一切変えない（結果の Promise にそのまま副作用だけ付ける。失敗は握りつぶす）
 * - バイト数は JSON 長の概算。CPU を抑えるため呼び出しの一部（既定 10%）だけ測り、倍率をかけて足す。
 *   読み取り件数（reads）は全件数える
 * - 数えるのは `getAll`（DocumentReference.get を含む）と `Query.get` だけ。
 *   stream / トランザクション / 集計クエリは数えない（下限の概算）
 * - `unstable_cache` の命中は Firestore を読まないので数えない（＝キャッシュが効いた分は出ない）
 * - Next のサーバー内でだけ動く（NEXT_RUNTIME がある時）。scripts/ では何もしない
 *
 * 環境変数: FIRESTORE_EGRESS_LOG=0 で無効 / FIRESTORE_EGRESS_SAMPLE=0.1（0〜1）/ FIRESTORE_EGRESS_FLUSH_MS=60000
 */
import type { Firestore } from "firebase-admin/firestore";

type SnapLike = {
  exists?: boolean;
  ref?: { path?: string };
  data?: () => unknown;
};

type Bucket = { calls: number; reads: number; bytes: number };

const INSTALLED = Symbol.for("uniterz.firestoreEgressMeter");
const TOP_N = 12;

function envNumber(name: string, fallback: number, min: number, max: number): number {
  const raw = process.env[name];
  if (raw == null || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
}

const SAMPLE = envNumber("FIRESTORE_EGRESS_SAMPLE", 0.1, 0.001, 1);
const FLUSH_MS = envNumber("FIRESTORE_EGRESS_FLUSH_MS", 60_000, 1_000, 3_600_000);

const byRoute = new Map<string, Bucket>();
const byCollection = new Map<string, Bucket>();
let windowStartMs = Date.now();

function bump(map: Map<string, Bucket>, key: string, calls: number, reads: number, bytes: number) {
  const cur = map.get(key) ?? { calls: 0, reads: 0, bytes: 0 };
  cur.calls += calls;
  cur.reads += reads;
  cur.bytes += bytes;
  map.set(key, cur);
}

type WorkStorageModule = {
  workAsyncStorage?: { getStore?: () => { route?: string } | undefined };
};
let workStorage: WorkStorageModule | null | undefined;

/** いま処理中の API ルート（例: /api/games/window）。取れなければ "(no-route)" */
function currentRoute(): string {
  try {
    if (workStorage === undefined) {
      try {
        workStorage = require("next/dist/server/app-render/work-async-storage.external") as WorkStorageModule;
      } catch {
        workStorage = null;
      }
    }
    const route = workStorage?.workAsyncStorage?.getStore?.()?.route;
    return typeof route === "string" && route ? route : "(no-route)";
  } catch {
    return "(no-route)";
  }
}

/** コレクション単位のキー。シーズン doc（`2026-27`）は区別する */
function collectionKey(path: string | undefined): string {
  if (!path) return "(unknown)";
  const seg = path.split("/");
  const first = seg[0] ?? "(unknown)";
  const second = seg[1];
  return second && /^\d{4}-\d{2}(_|$)/.test(second) ? `${first}/${second}` : first;
}

function round(n: number, digits = 2): number {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
}

function top(map: Map<string, Bucket>) {
  return [...map.entries()]
    .sort((a, b) => b[1].bytes - a[1].bytes || b[1].reads - a[1].reads)
    .slice(0, TOP_N)
    .map(([k, b]) => ({
      k,
      calls: b.calls,
      reads: b.reads,
      estMB: round(b.bytes / 1_000_000),
    }));
}

function flushIfDue(now: number) {
  if (now - windowStartMs < FLUSH_MS) return;
  let reads = 0;
  let bytes = 0;
  for (const b of byRoute.values()) {
    reads += b.reads;
    bytes += b.bytes;
  }
  if (reads > 0) {
    console.log(
      "[fs-egress]",
      JSON.stringify({
        windowSec: Math.round((now - windowStartMs) / 1000),
        reads,
        estMB: round(bytes / 1_000_000),
        byRoute: top(byRoute),
        byCollection: top(byCollection),
      })
    );
  }
  byRoute.clear();
  byCollection.clear();
  windowStartMs = now;
}

function record(snaps: readonly SnapLike[]) {
  if (snaps.length === 0) return;
  const route = currentRoute();
  const sampled = Math.random() < SAMPLE;
  const weight = 1 / SAMPLE;

  let routeReads = 0;
  let routeBytes = 0;
  const perCollection = new Map<string, { reads: number; bytes: number }>();
  for (const snap of snaps) {
    const key = collectionKey(snap.ref?.path);
    let bytes = 0;
    if (sampled && snap.exists !== false && typeof snap.data === "function") {
      try {
        bytes = Buffer.byteLength(JSON.stringify(snap.data()) ?? "", "utf8") * weight;
      } catch {
        bytes = 0;
      }
    }
    routeReads += 1;
    routeBytes += bytes;
    const cur = perCollection.get(key) ?? { reads: 0, bytes: 0 };
    cur.reads += 1;
    cur.bytes += bytes;
    perCollection.set(key, cur);
  }

  bump(byRoute, route, 1, routeReads, routeBytes);
  for (const [key, c] of perCollection) bump(byCollection, key, 1, c.reads, c.bytes);
  flushIfDue(Date.now());
}

const noop = () => undefined;

/** 結果の Promise はそのまま返し、成功したときだけ数える（失敗・例外は呼び出し側に影響しない） */
function observe<T>(p: Promise<T>, pick: (value: T) => readonly SnapLike[]): Promise<T> {
  p.then((value) => {
    try {
      record(pick(value));
    } catch {
      /* 測定の失敗で本処理に影響させない */
    }
  }, noop);
  return p;
}

export function installFirestoreEgressMeter(db: Firestore): void {
  if (process.env.FIRESTORE_EGRESS_LOG === "0") return;
  /** Next のサーバー内だけ（scripts / tsx では何もしない） */
  if (typeof process.env.NEXT_RUNTIME === "undefined") return;
  try {
    const target = db as unknown as Record<symbol | string, unknown>;
    if (target[INSTALLED]) return;
    target[INSTALLED] = true;

    // Firestore#getAll（DocumentReference#get もここを通る）
    const origGetAll = db.getAll.bind(db) as (...a: unknown[]) => Promise<SnapLike[]>;
    (target as { getAll: unknown }).getAll = (...args: unknown[]) =>
      observe(origGetAll(...args), (snaps) => snaps);

    // Query#get（CollectionReference も継承）
    let proto: Record<symbol | string, unknown> | null = Object.getPrototypeOf(
      db.collection("__egress_meter_probe__")
    );
    while (proto && !Object.prototype.hasOwnProperty.call(proto, "get")) {
      proto = Object.getPrototypeOf(proto);
    }
    if (proto && !proto[INSTALLED] && typeof proto.get === "function") {
      const origGet = proto.get as (this: unknown, ...a: unknown[]) => Promise<{ docs?: SnapLike[] }>;
      proto.get = function patchedGet(this: unknown, ...args: unknown[]) {
        return observe(origGet.apply(this, args), (qs) => qs?.docs ?? []);
      };
      proto[INSTALLED] = true;
    }
  } catch {
    /* 入れられなければ測定なしで続行 */
  }
}
