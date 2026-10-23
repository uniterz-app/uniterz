/**
 * デスクトップウィジェット用の手元集計。
 * 総登録 = Firestore `users` の件数。
 * 課金 = いま Pro で、proUntil が未来（または未設定）の人数。プラン別も返す。
 * 試用中 = trialEndAt が未来。試用後 = 試用が終わってもまだ見られる。試用なし = trialEndAt が無い。
 * 開始 = 指定日に planStartDate が入った人数（いま Pro でなくても数える）。
 * 登録 = 指定日（日本時間、省略時は今日）に作られた users。
 * 予想数 = その日に作られた posts の件数。予想した人 = その日の authorUid の人数。
 *
 * `--day=YYYY-MM-DD` で日を指定。stdout は JSON のみ。
 * `--diff` のときだけ直近7日を読み、前日比を出す。リロードボタンのときだけ付ける。
 */
import "./_loadAdminEnv";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { FieldPath, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "../lib/firebaseAdmin";

const PAGE = 500;

const CACHE_DIR = join(homedir(), ".cache", "uniterz-glance");

function cachePath(name: string): string {
  return join(CACHE_DIR, name);
}

function readCache<T>(path: string): T | null {
  try {
    return JSON.parse(readFileSync(path, "utf8")) as T;
  } catch {
    // 無い・壊れている → 読み直す
    return null;
  }
}

/** 書けなくても集計結果は返す（次回は読み直すだけ） */
function writeCache(path: string, value: unknown): void {
  try {
    mkdirSync(CACHE_DIR, { recursive: true });
    writeFileSync(path, JSON.stringify(value));
  } catch {
    // 無視
  }
}

function jstTodayKey(now = new Date()): string {
  const shifted = new Date(now.getTime() + 9 * 60 * 60 * 1000);
  const y = shifted.getUTCFullYear();
  const m = shifted.getUTCMonth() + 1;
  const d = shifted.getUTCDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function resolveDayKey(): string {
  const arg = process.argv.find((a) => a.startsWith("--day="));
  const raw = arg?.slice("--day=".length).trim();
  const today = jstTodayKey();
  if (!raw) return today;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    throw new Error("--day は YYYY-MM-DD");
  }
  const [y, m, d] = raw.split("-").map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  if (
    probe.getUTCFullYear() !== y ||
    probe.getUTCMonth() !== m - 1 ||
    probe.getUTCDate() !== d
  ) {
    throw new Error("--day が不正です");
  }
  return raw > today ? today : raw;
}

function rangeForDayKey(dayKey: string): { start: Date; end: Date; dayKey: string } {
  const [y, m, d] = dayKey.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d) - 9 * 60 * 60 * 1000);
  const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
  return { start, end, dayKey };
}

async function countRegisteredUsers(): Promise<number> {
  const snap = await getAdminDb().collection("users").count().get();
  return snap.data().count;
}

function proUntilMillis(raw: unknown): number | null {
  if (raw == null) return null;
  if (raw instanceof Timestamp) return raw.toMillis();
  if (raw instanceof Date) return raw.getTime();
  if (typeof raw === "object" && raw !== null && "toMillis" in raw) {
    const ms = (raw as { toMillis: () => number }).toMillis();
    return Number.isFinite(ms) ? ms : null;
  }
  return null;
}

type PlanCounts = {
  weekly: number;
  monthly: number;
  season: number;
  annual: number;
  other: number;
};

type BillingDetail = {
  trialing: number;
  afterTrial: number;
  noTrial: number;
  canceling: number;
};

/** 期限切れの Pro は含めない。期間内の解約予約は加入者のまま。 */
async function countActiveSubscribers(now = new Date()): Promise<{
  total: number;
  plans: PlanCounts;
  billing: BillingDetail;
}> {
  const db = getAdminDb();
  const nowMs = now.getTime();
  const plans: PlanCounts = { weekly: 0, monthly: 0, season: 0, annual: 0, other: 0 };
  const billing: BillingDetail = { trialing: 0, afterTrial: 0, noTrial: 0, canceling: 0 };
  let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;

  for (;;) {
    let q = db
      .collection("users")
      .where("plan", "==", "pro")
      .select("proUntil", "planType", "trialEndAt", "cancelAtPeriodEnd")
      .limit(PAGE);
    if (cursor) q = q.startAfter(cursor);
    const snap = await q.get();
    if (snap.empty) break;
    for (const doc of snap.docs) {
      const untilMs = proUntilMillis(doc.get("proUntil"));
      if (untilMs != null && untilMs <= nowMs) continue;
      const type = String(doc.get("planType") ?? "").trim();
      if (type === "weekly" || type === "monthly" || type === "season" || type === "annual") {
        plans[type] += 1;
      } else {
        plans.other += 1;
      }
      const trialMs = proUntilMillis(doc.get("trialEndAt"));
      if (trialMs != null && trialMs > nowMs) {
        billing.trialing += 1;
      } else if (trialMs != null) {
        billing.afterTrial += 1;
      } else {
        billing.noTrial += 1;
      }
      if (doc.get("cancelAtPeriodEnd") === true) billing.canceling += 1;
    }
    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE) break;
  }

  const total = plans.weekly + plans.monthly + plans.season + plans.annual + plans.other;
  return { total, plans, billing };
}

/** その日に Pro が始まった人数。いま加入中でなくても数える。 */
async function countPlanStarts(start: Date, end: Date): Promise<number> {
  const snap = await getAdminDb()
    .collection("users")
    .where("planStartDate", ">=", Timestamp.fromDate(start))
    .where("planStartDate", "<", Timestamp.fromDate(end))
    .count()
    .get();
  return snap.data().count;
}

type DayPoint = {
  dayKey: string;
  registered: number;
  posts: number;
};

function dayKeysEnding(dayKey: string, count: number): string[] {
  const { start } = rangeForDayKey(dayKey);
  const keys: string[] = [];
  for (let i = count - 1; i >= 0; i--) {
    keys.push(jstTodayKey(new Date(start.getTime() - i * 24 * 60 * 60 * 1000)));
  }
  return keys;
}

async function countCreated(
  collection: "users" | "posts",
  start: Date,
  end: Date
): Promise<number> {
  const snap = await getAdminDb()
    .collection(collection)
    .where("createdAt", ">=", Timestamp.fromDate(start))
    .where("createdAt", "<", Timestamp.fromDate(end))
    .count()
    .get();
  return snap.data().count;
}

type SeriesCache = { days: Record<string, { registered: number; posts: number }> };

/**
 * 選んだ日を含む直近7日。登録と予想の件数。
 * 終わった日の件数は手元に残して数え直さない。選んだ日は main で数えた値を使う。
 */
async function loadSeries(dayKey: string, selected: DayPoint): Promise<DayPoint[]> {
  const today = jstTodayKey();
  const path = cachePath("series.json");
  const cache = readCache<SeriesCache>(path) ?? { days: {} };
  if (dayKey < today) cache.days[dayKey] = { registered: selected.registered, posts: selected.posts };
  const points = await Promise.all(
    dayKeysEnding(dayKey, 7).map(async (key): Promise<DayPoint> => {
      if (key === dayKey) return selected;
      const hit = cache.days[key];
      if (hit) return { dayKey: key, ...hit };
      const { start, end } = rangeForDayKey(key);
      const [registered, posts] = await Promise.all([
        countCreated("users", start, end),
        countCreated("posts", start, end),
      ]);
      if (key < today) cache.days[key] = { registered, posts };
      return { dayKey: key, registered, posts };
    })
  );
  writeCache(path, cache);
  return points;
}

async function countTodayRegistrations(start: Date, end: Date): Promise<number> {
  const snap = await getAdminDb()
    .collection("users")
    .where("createdAt", ">=", Timestamp.fromDate(start))
    .where("createdAt", "<", Timestamp.fromDate(end))
    .count()
    .get();
  return snap.data().count;
}

/**
 * 予想者の uid は日ごとにローカルへ貯め、前回の続き（新しい posts）だけ読む。
 * 5 分ごとに当日の posts を全件読むと、それだけで 1 日数十万 read になるため。
 */
type PredictorCache = {
  dayKey: string;
  uids: string[];
  lastCreatedAtMs: number | null;
  lastId: string | null;
};

function loadPredictorCache(dayKey: string): PredictorCache {
  const raw = readCache<PredictorCache>(cachePath(`predictors-${dayKey}.json`));
  if (raw && raw.dayKey === dayKey && Array.isArray(raw.uids)) return raw;
  return { dayKey, uids: [], lastCreatedAtMs: null, lastId: null };
}

function savePredictorCache(cache: PredictorCache): void {
  writeCache(cachePath(`predictors-${cache.dayKey}.json`), cache);
}

async function countTodayPredictions(
  start: Date,
  end: Date,
  dayKey: string
): Promise<{
  predictors: number;
  posts: number;
}> {
  const db = getAdminDb();
  const range = db
    .collection("posts")
    .where("createdAt", ">=", Timestamp.fromDate(start))
    .where("createdAt", "<", Timestamp.fromDate(end));

  const cache = loadPredictorCache(dayKey);
  const uids = new Set(cache.uids);
  let lastCreatedAtMs = cache.lastCreatedAtMs;
  let lastId = cache.lastId;

  for (;;) {
    let q = range
      .orderBy("createdAt")
      .orderBy(FieldPath.documentId())
      .select("authorUid", "createdAt")
      .limit(PAGE);
    if (lastCreatedAtMs != null && lastId) {
      q = q.startAfter(Timestamp.fromMillis(lastCreatedAtMs), lastId);
    }
    const snap = await q.get();
    if (snap.empty) break;
    for (const doc of snap.docs) {
      const uid = doc.get("authorUid");
      if (typeof uid === "string" && uid.trim()) uids.add(uid);
    }
    const last = snap.docs[snap.docs.length - 1]!;
    const lastTs = last.get("createdAt");
    if (!(lastTs instanceof Timestamp)) break;
    lastCreatedAtMs = lastTs.toMillis();
    lastId = last.id;
    if (snap.size < PAGE) break;
  }

  savePredictorCache({ dayKey, uids: [...uids], lastCreatedAtMs, lastId });

  const posts = (await range.count().get()).data().count;
  return { predictors: uids.size, posts };
}

async function main() {
  const { start, end, dayKey } = rangeForDayKey(resolveDayKey());
  /** 前日比と7日グラフ。更新ボタンのときだけ読む */
  const withDiff = process.argv.includes("--diff");
  const [registered, subscribers, todayRegistered, today, started] = await Promise.all([
    countRegisteredUsers(),
    countActiveSubscribers(),
    countTodayRegistrations(start, end),
    countTodayPredictions(start, end, dayKey),
    countPlanStarts(start, end),
  ]);
  const series = withDiff
    ? await loadSeries(dayKey, { dayKey, registered: todayRegistered, posts: today.posts })
    : [];
  const payload = {
    registered,
    subscribers: subscribers.total,
    plans: subscribers.plans,
    billing: { ...subscribers.billing, started },
    todayRegistered,
    todayPredictors: today.predictors,
    todayPosts: today.posts,
    series,
    dayKey,
    timezone: "Asia/Tokyo",
    asOf: new Date().toISOString(),
  };
  process.stdout.write(`${JSON.stringify(payload)}\n`);
}

main().catch((err: unknown) => {
  const message = err instanceof Error ? err.message : String(err);
  process.stderr.write(`${message}\n`);
  process.exit(1);
});
