/**
 * デスクトップウィジェット用の手元集計。
 * 総登録 = Firestore `users` の件数。
 * 課金 = いま Pro で、proUntil が未来（または未設定）の人数。プラン別も返す。
 * 登録 = 指定日（日本時間、省略時は今日）に作られた users。
 * 予想数 = その日に作られた posts の件数。
 *
 * `--day=YYYY-MM-DD` で日を指定。stdout は JSON のみ。
 */
import "./_loadAdminEnv";
import { Timestamp } from "firebase-admin/firestore";
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

/** 期限切れの Pro は含めない。期間内の解約予約は加入者のまま。 */
async function countActiveSubscribers(now = new Date()): Promise<{
  total: number;
  plans: PlanCounts;
}> {
  const db = getAdminDb();
  const nowMs = now.getTime();
  const plans: PlanCounts = { weekly: 0, monthly: 0, season: 0, annual: 0, other: 0 };
  let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;

  for (;;) {
    let q = db
      .collection("users")
      .where("plan", "==", "pro")
      .select("proUntil", "planType")
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
    }
    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE) break;
  }

  const total = plans.weekly + plans.monthly + plans.season + plans.annual + plans.other;
  return { total, plans };
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

async function countTodayPredictions(start: Date, end: Date): Promise<{
  predictors: number;
  posts: number;
}> {
  const db = getAdminDb();
  const uids = new Set<string>();
  let posts = 0;
  let cursor: FirebaseFirestore.QueryDocumentSnapshot | undefined;

  for (;;) {
    let q = db
      .collection("posts")
      .where("createdAt", ">=", Timestamp.fromDate(start))
      .where("createdAt", "<", Timestamp.fromDate(end))
      .orderBy("createdAt")
      .select("authorUid", "createdAt")
      .limit(PAGE);
    if (cursor) q = q.startAfter(cursor);
    const snap = await q.get();
    if (snap.empty) break;
    for (const doc of snap.docs) {
      posts += 1;
      const uid = doc.get("authorUid");
      if (typeof uid === "string" && uid.trim()) uids.add(uid);
    }
    cursor = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE) break;
  }

  return { predictors: uids.size, posts };
}

async function main() {
  const { start, end, dayKey } = rangeForDayKey(resolveDayKey());
  const [registered, subscribers, todayRegistered, today] = await Promise.all([
    countRegisteredUsers(),
    countActiveSubscribers(),
    countTodayRegistrations(start, end),
    countTodayPredictions(start, end),
  ]);
  const payload = {
    registered,
    subscribers: subscribers.total,
    plans: subscribers.plans,
    todayRegistered,
    todayPredictors: today.predictors,
    todayPosts: today.posts,
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
