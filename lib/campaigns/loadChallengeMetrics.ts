import type {
  DocumentReference,
  DocumentSnapshot,
  Firestore,
} from "firebase-admin/firestore";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { PRO_PICK_AD_REWARDS_COLLECTION } from "@/lib/pro/proPickGameAccess";
import { TRADE_BUZZ_AD_REWARDS_COLLECTION } from "@/lib/ads/tradeBuzzAdUnlock";
import { GAME_SCHEDULE_SEASON } from "@/lib/games/gameScheduleSeason";
import { nbaCupKnockoutEtGameDates } from "@/lib/nba/nbaCupKnockoutPeriod";
import { periodRankingSnapshotDocId } from "@/lib/rankings/rankingDivision";
import {
  TIMEZONE_ET,
  TIMEZONE_JST,
  getCalendarMonthRangeInTimeZone,
  parseDateKeyInTimeZone,
} from "@/lib/time/zonedTime";
import { plannedMonthlyRankingUnitsIfFull } from "@/lib/units/periodRankingUnitRewards";
import {
  aggregatePickupScores,
  type PickupScoreEntry,
  type PickupScoreRow,
} from "./aggregatePickupScores";
import {
  DECEMBER_2026_CAMPAIGN_ID,
  DECEMBER_2026_CHRISTMAS_ET_DATE,
  DECEMBER_2026_COMBO_NOTICE_ID,
  DECEMBER_2026_COSTS_DOC,
  DECEMBER_2026_MONTH_KEY,
  DECEMBER_2026_MONTHLY_BODY_JA,
  DECEMBER_2026_NOTICE_TITLE_JA,
  DECEMBER_2026_PLANNED_PHYSICAL,
  parseDecember2026CostInputs,
  physicalCostYen,
  type December2026CostInputs,
} from "./december2026Campaign";
import type {
  ChallengeBoard,
  ChallengeAdMobSlice,
  ChallengeMetricsPayload,
} from "./challengeMetricsTypes";

export type {
  ChallengeBoard,
  ChallengeAdMobSlice,
  ChallengeMetricsPayload,
} from "./challengeMetricsTypes";

const TOP_N = 10;
const GET_ALL_CHUNK = 300;

function isSettledGame(data: Record<string, unknown>): boolean {
  return data.resultComputedAtV2 != null;
}

async function getAllChunked(
  db: Firestore,
  refs: DocumentReference[]
): Promise<DocumentSnapshot[]> {
  const out: DocumentSnapshot[] = [];
  for (let i = 0; i < refs.length; i += GET_ALL_CHUNK) {
    const part = await db.getAll(...refs.slice(i, i + GET_ALL_CHUNK));
    out.push(...part);
  }
  return out;
}

async function loadNbaGamesOnEtDate(
  db: Firestore,
  dateKey: string
): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
  const start = parseDateKeyInTimeZone(dateKey, TIMEZONE_ET);
  const next = parseDateKeyInTimeZone(
    shiftEtDateKey(dateKey, 1),
    TIMEZONE_ET
  );
  if (!start || !next) return [];
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", GAME_SCHEDULE_SEASON)
    .where("startAtJst", ">=", Timestamp.fromDate(start))
    .where("startAtJst", "<", Timestamp.fromDate(next))
    .orderBy("startAtJst", "asc")
    .limit(40)
    .select("postponed", "resultComputedAtV2", "startAtJst")
    .get();
  return snap.docs
    .map((d) => ({ id: d.id, data: d.data() as Record<string, unknown> }))
    .filter((g) => g.data.postponed !== true);
}

function shiftEtDateKey(dateKey: string, days: number): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!m) return dateKey;
  const dt = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  dt.setUTCDate(dt.getUTCDate() + days);
  const y = dt.getUTCFullYear();
  const mo = String(dt.getUTCMonth() + 1).padStart(2, "0");
  const d = String(dt.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

async function loadPickupEntriesForGames(
  db: Firestore,
  games: Array<{ id: string; data: Record<string, unknown> }>
): Promise<PickupScoreEntry[]> {
  const finals = games.filter((g) => isSettledGame(g.data));
  if (finals.length === 0) return [];
  const snaps = await getAllChunked(
    db,
    finals.map((g) => db.doc(`gameUserPoints/${g.id}`))
  );
  const entries: PickupScoreEntry[] = [];
  const missing: string[] = [];
  snaps.forEach((snap, i) => {
    const raw = snap.exists ? (snap.data()?.entries as unknown) : null;
    if (!Array.isArray(raw)) {
      missing.push(finals[i]!.id);
      return;
    }
    for (const e of raw as Array<{ u?: unknown; p?: unknown }>) {
      const uid = String(e.u ?? "");
      const points = Number(e.p);
      if (!uid || !Number.isFinite(points)) continue;
      entries.push({ uid, points });
    }
  });
  if (missing.length === 0) return entries;
  const postSnaps = await Promise.all(
    missing.map((gameId) =>
      db
        .collection("posts")
        .where("gameId", "==", gameId)
        .where("schemaVersion", "==", 2)
        .get()
    )
  );
  for (const snap of postSnaps) {
    for (const doc of snap.docs) {
      const d = doc.data() as Record<string, unknown>;
      if (d.status !== "final") continue;
      const stats = (d.stats ?? {}) as Record<string, unknown>;
      const points = Number(stats.pointsV3);
      const uid = String(d.authorUid ?? "");
      if (!uid || !Number.isFinite(points)) continue;
      entries.push({ uid, points });
    }
  }
  return entries;
}

async function attachDisplayNames(
  db: Firestore,
  rows: PickupScoreRow[]
): Promise<Array<PickupScoreRow & { displayName?: string }>> {
  if (rows.length === 0) return [];
  const snaps = await getAllChunked(
    db,
    rows.map((r) => db.doc(`users/${r.uid}`))
  );
  return rows.map((r, i) => {
    const d = snaps[i]?.data() as Record<string, unknown> | undefined;
    const displayName =
      (typeof d?.displayName === "string" && d.displayName) ||
      (typeof d?.handle === "string" && d.handle) ||
      undefined;
    return { ...r, displayName };
  });
}

async function loadMonthlyBoard(db: Firestore): Promise<ChallengeBoard> {
  const id = periodRankingSnapshotDocId({
    division: "standard",
    period: "monthly",
    label: DECEMBER_2026_MONTH_KEY,
    metric: "totalPoints",
  });
  const snap = await db.doc(`period_ranking_snapshots/${id}`).get();
  if (!snap.exists) {
    return {
      id,
      labelJa: "月間（12月・ピックアップ）",
      status: "スナップショット未作成（月が進むと日次で入る）",
      gameCount: 0,
      settledCount: 0,
      participantCount: 0,
      top: [],
    };
  }
  const data = snap.data() as {
    participantCount?: unknown;
    rows?: Array<{
      uid?: unknown;
      rank?: unknown;
      totalPoints?: unknown;
      totalPosts?: unknown;
      displayName?: unknown;
      handle?: unknown;
    }>;
    updatedAt?: { toMillis?: () => number };
  };
  const participantCount = Number(data.participantCount) || 0;
  const top = (data.rows ?? [])
    .filter((r) => Number(r.rank) >= 1 && Number(r.rank) <= TOP_N)
    .map((r) => ({
      rank: Number(r.rank) || 0,
      uid: String(r.uid ?? ""),
      points: Number(r.totalPoints) || 0,
      posts: Number(r.totalPosts) || 0,
      displayName:
        (typeof r.displayName === "string" && r.displayName) ||
        (typeof r.handle === "string" && r.handle) ||
        undefined,
    }));
  return {
    id,
    labelJa: "月間（12月・ピックアップ）",
    status: "期間中スナップショット（月が終わると確定）",
    gameCount: 0,
    settledCount: 0,
    participantCount,
    top,
  };
}

async function loadWindowBoard(
  db: Firestore,
  opts: {
    id: string;
    labelJa: string;
    dateKeys: readonly string[];
  }
): Promise<ChallengeBoard> {
  const gamesNested = await Promise.all(
    opts.dateKeys.map((key) => loadNbaGamesOnEtDate(db, key))
  );
  const games = gamesNested.flat();
  const settledCount = games.filter((g) => isSettledGame(g.data)).length;
  const entries = await loadPickupEntriesForGames(db, games);
  const ranked = aggregatePickupScores(entries);
  const top = await attachDisplayNames(db, ranked.slice(0, TOP_N));
  const pending = games.length === 0
    ? "対象試合がまだ無い"
    : settledCount < games.length
      ? `確定 ${settledCount}/${games.length} 試合`
      : "対象試合はすべて確定";
  return {
    id: opts.id,
    labelJa: opts.labelJa,
    status: pending,
    gameCount: games.length,
    settledCount,
    participantCount: ranked.length,
    top,
  };
}

async function countAdRewards(
  db: Firestore,
  collection: string,
  start: Date,
  end: Date
): Promise<ChallengeAdMobSlice> {
  const snap = await db
    .collection(collection)
    .where("createdAt", ">=", Timestamp.fromDate(start))
    .where("createdAt", "<", Timestamp.fromDate(end))
    .get();
  const uids = new Set<string>();
  for (const doc of snap.docs) {
    const uid = String(doc.data()?.uid ?? "");
    if (uid) uids.add(uid);
  }
  return { completions: snap.size, uniqueUids: uids.size };
}

async function loadGrantedMonthlyUnits(db: Firestore): Promise<number> {
  const snap = await db
    .collection("unit_ledger")
    .where("label", "==", DECEMBER_2026_MONTH_KEY)
    .get();
  let sum = 0;
  for (const doc of snap.docs) {
    const d = doc.data() as { period?: unknown; amount?: unknown };
    if (d.period !== "monthly") continue;
    const amount = Number(d.amount);
    if (Number.isFinite(amount)) sum += amount;
  }
  return sum;
}

async function loadCosts(db: Firestore): Promise<December2026CostInputs> {
  const snap = await db.doc(DECEMBER_2026_COSTS_DOC).get();
  return parseDecember2026CostInputs(
    snap.exists ? (snap.data() as Record<string, unknown>) : null
  );
}

export async function loadChallengeMetrics(
  db: Firestore
): Promise<ChallengeMetricsPayload> {
  const monthAnchor = parseDateKeyInTimeZone(
    `${DECEMBER_2026_MONTH_KEY}-01`,
    TIMEZONE_JST
  );
  const monthRange = monthAnchor
    ? getCalendarMonthRangeInTimeZone(monthAnchor, TIMEZONE_JST)
    : null;

  const cupDates = nbaCupKnockoutEtGameDates();
  const [
    monthly,
    cup,
    christmas,
    costs,
    granted,
    noticeSnap,
    proPick,
    tradeBuzz,
  ] = await Promise.all([
    loadMonthlyBoard(db),
    loadWindowBoard(db, {
      id: "nba-cup-knockout-2026",
      labelJa: "NBAカップ ノックアウト（全7試合・ピックアップスコア）",
      dateKeys: cupDates,
    }),
    loadWindowBoard(db, {
      id: "nba-christmas-2026",
      labelJa: "クリスマス（クリスマスゲームすべて）",
      dateKeys: [DECEMBER_2026_CHRISTMAS_ET_DATE],
    }),
    loadCosts(db),
    loadGrantedMonthlyUnits(db),
    db.doc(`announcements/${DECEMBER_2026_CAMPAIGN_ID}`).get(),
    monthRange
      ? countAdRewards(
          db,
          PRO_PICK_AD_REWARDS_COLLECTION,
          monthRange.start,
          monthRange.end
        )
      : Promise.resolve({ completions: 0, uniqueUids: 0 }),
    monthRange
      ? countAdRewards(
          db,
          TRADE_BUZZ_AD_REWARDS_COLLECTION,
          monthRange.start,
          monthRange.end
        )
      : Promise.resolve({ completions: 0, uniqueUids: 0 }),
  ]);

  const noticeData = noticeSnap.exists
    ? (noticeSnap.data() as { postedAt?: { toMillis?: () => number } })
    : null;

  return {
    ok: true,
    asOfMs: Date.now(),
    monthKey: DECEMBER_2026_MONTH_KEY,
    boards: { monthly, cup, christmas },
    admob: {
      noteJa:
        "円は AdMob コンソールの数字を下の欄に入れる。ここは完了回数だけ（SSV）。",
      proPick,
      tradeBuzz,
      yenActual: costs.admobYenActual,
    },
    units: {
      plannedIfFull: plannedMonthlyRankingUnitsIfFull(),
      granted,
      yenPerUnit: costs.unitYenPerUnit,
      yenActual: granted * costs.unitYenPerUnit,
    },
    physical: {
      planned: DECEMBER_2026_PLANNED_PHYSICAL,
      costs,
      yenActual: physicalCostYen(costs),
    },
    notice: {
      id: DECEMBER_2026_CAMPAIGN_ID,
      published: noticeSnap.exists && noticeSnap.data()?.visible === true,
      publishedAtMs:
        typeof noticeData?.postedAt?.toMillis === "function"
          ? noticeData.postedAt.toMillis()
          : null,
    },
  };
}

export async function saveChallengeCosts(
  db: Firestore,
  raw: Record<string, unknown>
): Promise<December2026CostInputs> {
  const costs = parseDecember2026CostInputs(raw);
  await db.doc(DECEMBER_2026_COSTS_DOC).set(
    {
      ...costs,
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return costs;
}

export async function publishDecember2026Notice(
  db: Firestore
): Promise<{ id: string; created: boolean }> {
  const ref = db.doc(`announcements/${DECEMBER_2026_CAMPAIGN_ID}`);
  const existing = await ref.get();
  const comboRef = db.doc(`announcements/${DECEMBER_2026_COMBO_NOTICE_ID}`);
  const combo = await comboRef.get();
  if (combo.exists) {
    await comboRef.set({ visible: false, updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  }

  await ref.set(
    {
      title: DECEMBER_2026_NOTICE_TITLE_JA,
      body: DECEMBER_2026_MONTHLY_BODY_JA,
      type: "event",
      league: "all",
      visible: true,
      pinned: true,
      priority: 10,
      heroImageURL: null,
      postedAt: existing.exists
        ? existing.data()?.postedAt ?? FieldValue.serverTimestamp()
        : FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  return { id: DECEMBER_2026_CAMPAIGN_ID, created: !existing.exists };
}

/** アプリ内お知らせを非表示（ドキュメントは残す） */
export async function hideDecember2026Notice(
  db: Firestore
): Promise<{ id: string; hidden: boolean }> {
  const ref = db.doc(`announcements/${DECEMBER_2026_CAMPAIGN_ID}`);
  const comboRef = db.doc(`announcements/${DECEMBER_2026_COMBO_NOTICE_ID}`);
  const [existing, combo] = await Promise.all([ref.get(), comboRef.get()]);
  const writes: Promise<unknown>[] = [];
  if (combo.exists) {
    writes.push(
      comboRef.set(
        { visible: false, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      )
    );
  }
  if (existing.exists) {
    writes.push(
      ref.set(
        { visible: false, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      )
    );
  }
  await Promise.all(writes);
  return { id: DECEMBER_2026_CAMPAIGN_ID, hidden: existing.exists };
}
