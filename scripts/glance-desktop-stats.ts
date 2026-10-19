/**
 * デスクトップウィジェット用の手元集計。
 * 総登録 = Firestore `users` の件数。
 * 課金 = いま Pro で、proUntil が未来（または未設定）の人数。プラン別も返す。
 * 試用中 = trialEndAt が未来。試用後 = 試用が終わってもまだ見られる。試用なし = trialEndAt が無い。
 * 開始 = 指定日に planStartDate が入った人数（いま Pro でなくても数える）。
 * 登録 = 指定日（日本時間、省略時は今日）に作られた users。
 * 予想数 = その日に作られた posts の件数。予想した人 = その日の authorUid の人数。
 * 招待した人 = 1人以上招待した紹介者。招かれた人 = 無効・不正を除いた招待関係。今日 = その日に結ばれた数。成立 = 報酬まで進んだ数。
 * 名簿の名前は表示名（displayName）。無ければユーザーネーム。課金は試用中を除く今の Pro。招待は紹介した人だけ、人数つき。
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

type PeopleNames = {
  paid: string[];
  trialing: string[];
  referrers: { name: string; count: number }[];
};

function personName(data: FirebaseFirestore.DocumentData | undefined): string {
  if (!data) return "";
  const text = (key: string) => {
    const raw = data[key];
    return typeof raw === "string" ? raw.trim().replace(/^@+/, "") : "";
  };
  const isUid = (value: string) => /^[a-zA-Z0-9]{20,128}$/.test(value);
  for (const key of ["displayName", "name"]) {
    const value = text(key);
    if (value && !isUid(value)) return value;
  }
  for (const key of ["handle", "username", "slug"]) {
    const value = text(key);
    if (value && !isUid(value)) return value;
  }
  return "";
}

function named(value: string | undefined): string {
  const trimmed = value?.trim() ?? "";
  return trimmed || "名前なし";
}

/** 期限切れの Pro は含めない。期間内の解約予約は加入者のまま。 */
async function countActiveSubscribers(now = new Date()): Promise<{
  total: number;
  plans: PlanCounts;
  billing: BillingDetail;
  paidNames: string[];
  trialNames: string[];
}> {
  const db = getAdminDb();
  const nowMs = now.getTime();
  const plans: PlanCounts = { weekly: 0, monthly: 0, season: 0, annual: 0, other: 0 };
  const billing: BillingDetail = { trialing: 0, afterTrial: 0, noTrial: 0, canceling: 0 };
  const paidNames: string[] = [];
  const trialNames: string[] = [];
  let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;

  for (;;) {
    let q = db
      .collection("users")
      .where("plan", "==", "pro")
      .select(
        "proUntil",
        "planType",
        "trialEndAt",
        "cancelAtPeriodEnd",
        "handle",
        "username",
        "slug",
        "displayName",
        "name"
      )
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
      const name = named(personName(doc.data()));
      const trialMs = proUntilMillis(doc.get("trialEndAt"));
      if (trialMs != null && trialMs > nowMs) {
        billing.trialing += 1;
        trialNames.push(name);
      } else if (trialMs != null) {
        billing.afterTrial += 1;
        paidNames.push(name);
      } else {
        billing.noTrial += 1;
        paidNames.push(name);
      }
      if (doc.get("cancelAtPeriodEnd") === true) billing.canceling += 1;
    }
    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE) break;
  }

  const total = plans.weekly + plans.monthly + plans.season + plans.annual + plans.other;
  paidNames.sort((a, b) => a.localeCompare(b, "ja"));
  trialNames.sort((a, b) => a.localeCompare(b, "ja"));
  return { total, plans, billing, paidNames, trialNames };
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

/** 選んだ日を含む直近7日。登録と予想の件数。 */
async function loadSeries(dayKey: string): Promise<DayPoint[]> {
  const keys = dayKeysEnding(dayKey, 7);
  return Promise.all(
    keys.map(async (key) => {
      const { start, end } = rangeForDayKey(key);
      const [registered, posts] = await Promise.all([
        countCreated("users", start, end),
        countCreated("posts", start, end),
      ]);
      return { dayKey: key, registered, posts };
    })
  );
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

const CACHE_DIR = join(homedir(), ".cache", "uniterz-glance");

function predictorCachePath(dayKey: string): string {
  return join(CACHE_DIR, `predictors-${dayKey}.json`);
}

function loadPredictorCache(dayKey: string): PredictorCache {
  try {
    const raw = JSON.parse(readFileSync(predictorCachePath(dayKey), "utf8")) as PredictorCache;
    if (raw.dayKey === dayKey && Array.isArray(raw.uids)) return raw;
  } catch {
    // 無い・壊れている → 最初から
  }
  return { dayKey, uids: [], lastCreatedAtMs: null, lastId: null };
}

function savePredictorCache(cache: PredictorCache): void {
  mkdirSync(CACHE_DIR, { recursive: true });
  writeFileSync(predictorCachePath(cache.dayKey), JSON.stringify(cache));
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

type InviteCounts = {
  referrers: number;
  invited: number;
  today: number;
  completed: number;
};

type InviteRollup = InviteCounts & {
  referrerRows: { name: string; count: number }[];
};

const INVITE_SKIP = new Set(["invalid", "fraud_rejected", "withdrawn"]);

async function namesByUid(uids: string[]): Promise<Map<string, string>> {
  const unique = [...new Set(uids.map((uid) => uid.trim()).filter(Boolean))];
  const map = new Map<string, string>();
  if (unique.length === 0) return map;
  const db = getAdminDb();
  for (let i = 0; i < unique.length; i += 100) {
    const refs = unique.slice(i, i + 100).map((uid) => db.collection("users").doc(uid));
    const snaps = await db.getAll(...refs, {
      fieldMask: ["handle", "username", "slug", "displayName", "name"],
    });
    for (const snap of snaps) {
      const name = personName(snap.data());
      if (name) map.set(snap.id, name);
    }
  }
  return map;
}

/** 招待関係を1回読んで、紹介者・招かれた人・その日の成立と名前を集める。 */
async function countInvites(start: Date, end: Date): Promise<InviteRollup> {
  const db = getAdminDb();
  const startMs = start.getTime();
  const endMs = end.getTime();
  const referrerCounts = new Map<string, number>();
  const invitees: { uid: string; createdMs: number }[] = [];
  let today = 0;
  let completed = 0;
  let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;

  for (;;) {
    let q = db
      .collection("referralRelations")
      .orderBy(FieldPath.documentId())
      .select("referrerUid", "createdAt", "status")
      .limit(PAGE);
    if (cursor) q = q.startAfter(cursor);
    const snap = await q.get();
    if (snap.empty) break;
    for (const doc of snap.docs) {
      const status = String(doc.get("status") ?? "");
      if (INVITE_SKIP.has(status)) continue;
      const uid = String(doc.get("referrerUid") ?? "").trim();
      if (uid) referrerCounts.set(uid, (referrerCounts.get(uid) ?? 0) + 1);
      if (status === "completed") completed += 1;
      const createdMs = proUntilMillis(doc.get("createdAt")) ?? 0;
      invitees.push({ uid: doc.id, createdMs });
      if (createdMs >= startMs && createdMs < endMs) today += 1;
    }
    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE) break;
  }

  const names = await namesByUid([...referrerCounts.keys()]);
  const referrerRows = [...referrerCounts.entries()]
    .sort((a, b) => b[1] - a[1] || named(names.get(a[0])).localeCompare(named(names.get(b[0])), "ja"))
    .map(([uid, count]) => ({ name: named(names.get(uid)), count }));

  return {
    referrers: referrerCounts.size,
    invited: invitees.length,
    today,
    completed,
    referrerRows,
  };
}

function peoplePayload(
  subscribers: { paidNames: string[]; trialNames: string[] },
  invites: InviteRollup
): PeopleNames {
  return {
    paid: subscribers.paidNames,
    trialing: subscribers.trialNames,
    referrers: invites.referrerRows,
  };
}

async function main() {
  const { start, end, dayKey } = rangeForDayKey(resolveDayKey());
  if (process.argv.includes("--people-only")) {
    const [subscribers, invites] = await Promise.all([
      countActiveSubscribers(),
      countInvites(start, end),
    ]);
    process.stdout.write(`${JSON.stringify({ people: peoplePayload(subscribers, invites) })}\n`);
    return;
  }
  /** 前日比と7日グラフ。更新ボタンのときだけ読む */
  const withDiff = process.argv.includes("--diff");
  const [registered, subscribers, todayRegistered, today, started, series, invites] = await Promise.all([
    countRegisteredUsers(),
    countActiveSubscribers(),
    countTodayRegistrations(start, end),
    countTodayPredictions(start, end, dayKey),
    countPlanStarts(start, end),
    withDiff ? loadSeries(dayKey) : Promise.resolve([] as DayPoint[]),
    countInvites(start, end),
  ]);
  const payload = {
    registered,
    subscribers: subscribers.total,
    plans: subscribers.plans,
    billing: { ...subscribers.billing, started },
    todayRegistered,
    todayPredictors: today.predictors,
    todayPosts: today.posts,
    series,
    invites: {
      referrers: invites.referrers,
      invited: invites.invited,
      today: invites.today,
      completed: invites.completed,
    },
    people: peoplePayload(subscribers, invites),
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
