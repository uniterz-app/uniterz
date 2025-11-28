// functions/src/trend/users.aggregate.ts
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { getApps, initializeApp } from "firebase-admin/app";

type League = "B1" | "J1";
type UserOut = {
  uid: string;
  displayName: string;
  handle?: string;
  photoURL?: string;
  score: number;
  counts?: { followers?: number };
  primaryLeague?: League | string | null;
};

/** Admin が未初期化なら初期化してから Firestore を返す */
function getDb() {
  if (!getApps().length) initializeApp();
  return getFirestore();
}

const NOW = () => Timestamp.now();
const WINDOW_HOURS_DEFAULT = 72;

function windowRange(hours: number) {
  const end = NOW();
  const start = Timestamp.fromMillis(end.toMillis() - hours * 60 * 60 * 1000);
  return { start, end };
}

async function getUserProfile(uid: string) {
  const db = getDb();
  const snap = await db.doc(`users/${uid}`).get();
  if (!snap.exists) return null;
  const d = snap.data() || {};
  return {
    uid,
    displayName: String(d.displayName ?? d.username ?? "No Name"),
    handle: String(d.handle ?? d.username ?? ""),
    photoURL: String(d.photoURL ?? d.avatarURL ?? ""),
    followers: Number(d.counts?.followers ?? 0),
  };
}

/** プロフィール閲覧カウント */
async function countProfileViews(start: Timestamp, end: Timestamp) {
  const db = getDb();
  const map = new Map<string, number>();

  const q1 = db
    .collection("events_profile")
    .where("createdAt", ">=", start)
    .where("createdAt", "<=", end);
  const s1 = await q1.get().catch(() => null);
  s1?.forEach((doc) => {
    const d = doc.data() as any;
    if (d.type && d.type !== "view") return;
    const uid = String(d.targetUid ?? d.uid ?? d.visitedUid ?? "");
    if (!uid) return;
    map.set(uid, (map.get(uid) ?? 0) + 1);
  });

  const q2 = db
    .collection("events_profile")
    .where("at", ">=", start)
    .where("at", "<=", end);
  const s2 = await q2.get().catch(() => null);
  s2?.forEach((doc) => {
    const d = doc.data() as any;
    const uid = String(d.targetUid ?? d.uid ?? d.visitedUid ?? "");
    if (!uid) return;
    map.set(uid, (map.get(uid) ?? 0) + 1);
  });

  return map;
}

/** フォロー獲得 */
async function countFollowGains(start: Timestamp, end: Timestamp) {
  const db = getDb();
  const map = new Map<string, number>();
  const q = db
    .collection("events_follow")
    .where("createdAt", ">=", start)
    .where("createdAt", "<=", end)
    .where("op", "==", "follow");
  const snap = await q.get().catch(() => null);
  snap?.forEach((doc) => {
    const t = String((doc.data() as any)?.targetUid ?? "");
    if (!t) return;
    map.set(t, (map.get(t) ?? 0) + 1);
  });
  return map;
}

/** いいね獲得 */
async function countLikes(start: Timestamp, end: Timestamp) {
  const db = getDb();
  const map = new Map<string, number>();
  const q = db
    .collection("events_like")
    .where("createdAt", ">=", start)
    .where("createdAt", "<=", end);
  const snap = await q.get().catch(() => null);
  snap?.forEach((doc) => {
    const d = doc.data() as any;
    const uid = String(d.targetUid ?? d.authorUid ?? "");
    if (!uid) return;
    map.set(uid, (map.get(uid) ?? 0) + 1);
  });
  return map;
}

/** 主戦リーグ判定 */
async function decidePrimaryLeague(start: Timestamp, end: Timestamp) {
  const db = getDb();
  type Cts = { B1: number; J1: number };
  const perUser: Map<string, Cts> = new Map();

  const bump = (uid: string, league: unknown) => {
    if (league !== "B1" && league !== "J1") return;
    const key: keyof Cts = league;
    const cur = perUser.get(uid) ?? { B1: 0, J1: 0 };
    cur[key] += 1;
    perUser.set(uid, cur);
  };

  const posts = await db
    .collection("posts")
    .where("createdAt", ">=", start)
    .where("createdAt", "<=", end)
    .get()
    .catch(() => null);
  posts?.forEach((doc) => {
    const d = doc.data() as any;
    bump(String(d.authorUid ?? d.uid ?? ""), d.league);
  });

  const preds = await db
    .collection("predictions")
    .where("createdAt", ">=", start)
    .where("createdAt", "<=", end)
    .get()
    .catch(() => null);
  preds?.forEach((doc) => {
    const d = doc.data() as any;
    bump(String(d.authorUid ?? d.uid ?? ""), d.league);
  });

  const result = new Map<string, League | string | null>();
  perUser.forEach((cts, uid) => {
    if (cts.B1 === 0 && cts.J1 === 0) {
      result.set(uid, null);
      return;
    }
    if (cts.B1 > cts.J1) result.set(uid, "B1");
    else if (cts.J1 > cts.B1) result.set(uid, "J1");
    else result.set(uid, "B1/J1");
  });

  return result;
}

/** メイン集計（HTTP/Cron から呼ばれる） */
export async function aggregateUsersTrend(
  windowHours: number = WINDOW_HOURS_DEFAULT
) {
  const { start, end } = windowRange(windowHours);

  const [viewMap, followMap, likeMap, leagueMap] = await Promise.all([
    countProfileViews(start, end),
    countFollowGains(start, end),
    countLikes(start, end),
    decidePrimaryLeague(start, end),
  ]);

  const uids = new Set<string>([
    ...viewMap.keys(),
    ...followMap.keys(),
    ...likeMap.keys(),
    ...leagueMap.keys(),
  ]);

  const rows: UserOut[] = [];
  for (const uid of uids) {
    const views = viewMap.get(uid) ?? 0;
    const follows = followMap.get(uid) ?? 0;
    const likes = likeMap.get(uid) ?? 0;
    const score = views * 1 + follows * 3 + likes * 2;

    const prof = await getUserProfile(uid);
    if (!prof) continue;

    rows.push({
      uid,
      displayName: prof.displayName,
      handle: prof.handle,
      photoURL: prof.photoURL,
      score,
      counts: { followers: prof.followers },
      primaryLeague: leagueMap.get(uid) ?? null,
    });
  }

  rows.sort(
    (a, b) =>
      b.score - a.score ||
      (b.counts?.followers ?? 0) - (a.counts?.followers ?? 0)
  );

  const TOP_N = 10;
  const top = rows.slice(0, TOP_N);

  const db = getDb();
  const payload = {
    updatedAt: NOW(),
    windowHours,
    users: top,
  };

  await db.doc("trend_cache/users").set(payload);

  return { ok: true, counts: { users: top.length } };
}
