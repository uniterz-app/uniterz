/**
 * グループバトル期間スナップショット構築（Admin SDK / Next）。
 */

import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  GROUP_BATTLE_FINALIZE_GRACE_DAYS,
  GROUP_BATTLE_COLLECTION,
} from "@/lib/groupBattles/constants";
import { pointsFromDailyDoc, periodSnapshotDocId } from "@/lib/groupBattles/dailyPoints";
import { canBuildLiveSnapshots } from "@/lib/groupBattles/phases";
import {
  countTieGroups,
  rankSquadsByGroupScore,
  type SquadScoreInput,
} from "@/lib/groupBattles/score";
import type {
  GroupBattlePeriod,
  GroupBattlePeriodSnapshotDoc,
  GroupBattlePhase,
} from "@/lib/groupBattles/types";
import {
  getBattle,
  parseBattleDoc,
  parseSnapshotDoc,
  parseSquadDoc,
  snapshotRef,
  squadsCol,
} from "@/lib/groupBattles/server/firestore";

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function addDaysToDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d + days));
  return `${base.getUTCFullYear()}-${pad2(base.getUTCMonth() + 1)}-${pad2(
    base.getUTCDate()
  )}`;
}

function uidFromDailyDocId(docId: string, dateKey: string): string | null {
  const suffix = `_${dateKey}`;
  if (docId.endsWith(suffix)) return docId.slice(0, -suffix.length);
  const i = docId.lastIndexOf("_");
  if (i <= 0) return null;
  return docId.slice(0, i);
}

function enumerateDateKeys(startKey: string, endKey: string): string[] {
  const keys: string[] = [];
  let cur = startKey;
  while (cur <= endKey) {
    keys.push(cur);
    cur = addDaysToDateKey(cur, 1);
  }
  return keys;
}

/**
 * 対象メンバー×日付の daily のみ getAll（期間全体の date 範囲スキャンはしない）。
 * docId = `{uid}_{dateKey}`。
 */
async function sumMemberPoints(
  db: Firestore,
  memberUids: string[],
  startKey: string,
  endKey: string,
  seasonKey: string
): Promise<Map<string, number>> {
  const points = new Map<string, number>();
  for (const uid of memberUids) points.set(uid, 0);
  if (memberUids.length === 0) return points;

  const dateKeys = enumerateDateKeys(startKey, endKey);
  if (dateKeys.length === 0) return points;

  const col = db.collection("user_stats_v2_daily");
  const refs = memberUids.flatMap((uid) =>
    dateKeys.map((dateKey) => col.doc(`${uid}_${dateKey}`))
  );

  const CHUNK = 300;
  for (let i = 0; i < refs.length; i += CHUNK) {
    const docs = await db.getAll(...refs.slice(i, i + CHUNK));
    for (const doc of docs) {
      if (!doc.exists) continue;
      const data = doc.data() as Record<string, unknown>;
      const dateKey = String(data.date ?? "");
      const uid = uidFromDailyDocId(doc.id, dateKey);
      if (!uid || !points.has(uid)) continue;
      points.set(uid, (points.get(uid) ?? 0) + pointsFromDailyDoc(data, seasonKey));
    }
  }
  return points;
}

export type BuildSnapshotOpts = {
  battleId: string;
  period: GroupBattlePeriod;
  label: string;
  startKey: string;
  endKey: string;
  /** 今日の JST dateKey（猶予判定用） */
  todayKey: string;
  forceFinal?: boolean;
};

export async function buildGroupBattlePeriodSnapshot(
  db: Firestore,
  opts: BuildSnapshotOpts
): Promise<GroupBattlePeriodSnapshotDoc & { id: string }> {
  const battle = await getBattle(db, opts.battleId);
  if (!battle) throw new Error("battle_not_found");
  if (!canBuildLiveSnapshots(battle.phase)) {
    throw new Error("phase_not_aggregatable");
  }

  const squadSnap = await squadsCol(db, opts.battleId)
    .where("status", "==", "locked")
    .get();

  const squads = squadSnap.docs.map((d) =>
    parseSquadDoc(d.id, d.data() as Record<string, unknown>)
  );

  const allUids = [...new Set(squads.flatMap((s) => s.memberUids))];
  const pointsByUid = await sumMemberPoints(
    db,
    allUids,
    opts.startKey,
    opts.endKey,
    battle.seasonKey
  );

  const prevRef = snapshotRef(db, opts.battleId, opts.period, opts.label);
  const prevSnap = await prevRef.get();
  const prevRanks = new Map<string, number>();
  if (prevSnap.exists) {
    const prev = parseSnapshotDoc(
      prevSnap.id,
      prevSnap.data() as Record<string, unknown>
    );
    for (const row of prev.rows) prevRanks.set(row.squadId, row.rank);
  }

  const inputs: SquadScoreInput[] = squads.map((s) => ({
    squadId: s.id,
    name: s.name,
    memberCount: s.memberCount,
    memberScores: s.memberUids.map((uid: string) => ({
      uid,
      points: pointsByUid.get(uid) ?? 0,
    })),
    prevRank: prevRanks.get(s.id) ?? null,
  }));

  const rows = rankSquadsByGroupScore(inputs);

  let size3 = 0;
  let size4 = 0;
  let size5 = 0;
  let inactive = 0;
  let memberTotal = 0;
  for (const s of squads) {
    if (s.memberCount === 3) size3 += 1;
    else if (s.memberCount === 4) size4 += 1;
    else if (s.memberCount === 5) size5 += 1;
    for (const uid of s.memberUids) {
      memberTotal += 1;
      if ((pointsByUid.get(uid) ?? 0) === 0) inactive += 1;
    }
  }

  const graceEnd = addDaysToDateKey(opts.endKey, GROUP_BATTLE_FINALIZE_GRACE_DAYS);
  const shouldFinal =
    opts.forceFinal === true || opts.todayKey > graceEnd;

  const doc: GroupBattlePeriodSnapshotDoc = {
    battleId: opts.battleId,
    period: opts.period,
    label: opts.label,
    status: shouldFinal ? "final" : "live",
    range: { startKey: opts.startKey, endKey: opts.endKey },
    rows,
    metrics: {
      squadCount: squads.length,
      size3,
      size4,
      size5,
      tieGroups: countTieGroups(rows),
      inactiveMemberRate: memberTotal > 0 ? inactive / memberTotal : 0,
    },
    builtAtMs: Date.now(),
    finalizedAtMs: shouldFinal ? Date.now() : null,
  };

  await prevRef.set(
    {
      ...doc,
      builtAt: FieldValue.serverTimestamp(),
      finalizedAt: shouldFinal ? FieldValue.serverTimestamp() : null,
    },
    { merge: true }
  );

  return { ...doc, id: periodSnapshotDocId(opts.battleId, opts.period, opts.label) };
}

export async function buildAllActiveGroupBattleSnapshots(
  db: Firestore,
  todayKey: string
): Promise<number> {
  const phases: GroupBattlePhase[] = ["battle", "settling", "final"];
  const snap = await db
    .collection(GROUP_BATTLE_COLLECTION)
    .where("phase", "in", phases)
    .get();

  let built = 0;
  for (const doc of snap.docs) {
    const battle = parseBattleDoc(doc.id, doc.data() as Record<string, unknown>);
    for (const label of battle.weeklyLabels) {
      const startKey = label;
      const endKey = addDaysToDateKey(label, 6);
      // 開催期間外の週はスキップしない（マスタ列挙が正）
      if (endKey < battle.monthlyRange.startKey) continue;
      if (startKey > battle.monthlyRange.endKey && startKey > todayKey) continue;
      const clippedEnd =
        endKey > battle.monthlyRange.endKey ? battle.monthlyRange.endKey : endKey;
      const clippedStart =
        startKey < battle.monthlyRange.startKey
          ? battle.monthlyRange.startKey
          : startKey;
      if (clippedStart > clippedEnd) continue;
      if (clippedStart > todayKey) continue;

      await buildGroupBattlePeriodSnapshot(db, {
        battleId: battle.id,
        period: "weekly",
        label,
        startKey: clippedStart,
        endKey: clippedEnd < todayKey ? clippedEnd : todayKey,
        todayKey,
      });
      built += 1;
    }

    const m = battle.monthlyRange;
    if (m.startKey && m.endKey && m.startKey <= todayKey) {
      await buildGroupBattlePeriodSnapshot(db, {
        battleId: battle.id,
        period: "monthly",
        label: m.label || "battle",
        startKey: m.startKey,
        endKey: m.endKey < todayKey ? m.endKey : todayKey,
        todayKey,
      });
      built += 1;
    }
  }

  return built;
}
