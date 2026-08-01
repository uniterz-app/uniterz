/**
 * グループバトル期間スナップショット（Cloud Functions）。
 * Next 側 lib/groupBattles/server/buildPeriodSnapshot.ts と同ロジック。
 */

import { FieldValue, getFirestore } from "firebase-admin/firestore";
import { admin } from "../firebase";
import { addDaysToDateKey, dateKeyJST } from "../rankings/nbaPeriod";

const COLLECTION = "group_battles";
const SNAPSHOTS = "group_battle_period_snapshots";
const GRACE_DAYS = 2;

type MemberScore = { uid: string; points: number };

function pickPoints(data: Record<string, unknown>, seasonKey: string): number {
  const bySeason = data.rankingBySeason as Record<string, { pointsSumV3?: number }> | undefined;
  if (bySeason?.[seasonKey] && typeof bySeason[seasonKey] === "object") {
    return Number(bySeason[seasonKey].pointsSumV3 ?? 0) || 0;
  }
  const nba = (data.leagues as { nba?: { pointsSumV3?: number } } | undefined)?.nba;
  if (nba) return Number(nba.pointsSumV3 ?? 0) || 0;
  const ranking = data.ranking as { pointsSumV3?: number } | undefined;
  if (ranking) return Number(ranking.pointsSumV3 ?? 0) || 0;
  const all = data.all as { pointsSumV3?: number } | undefined;
  if (all) return Number(all.pointsSumV3 ?? 0) || 0;
  return 0;
}

function uidFromDailyDocId(docId: string, dateKey: string): string | null {
  const suffix = `_${dateKey}`;
  if (docId.endsWith(suffix)) return docId.slice(0, -suffix.length);
  const i = docId.lastIndexOf("_");
  if (i <= 0) return null;
  return docId.slice(0, i);
}

function rankRows(
  inputs: Array<{
    squadId: string;
    name: string;
    memberCount: number;
    memberScores: MemberScore[];
    prevRank: number | null;
  }>
) {
  const prepared = inputs.map((s) => {
    const sum = s.memberScores.reduce((a, m) => a + m.points, 0);
    const groupScore = s.memberCount > 0 ? sum / s.memberCount : 0;
    return { ...s, groupScore };
  });
  prepared.sort((a, b) => {
    const d = b.groupScore - a.groupScore;
    if (d !== 0) return d;
    return a.squadId.localeCompare(b.squadId);
  });
  let lastScore: number | null = null;
  let lastRank = 0;
  return prepared.map((s, i) => {
    const rank =
      lastScore != null && s.groupScore === lastScore ? lastRank : i + 1;
    lastScore = s.groupScore;
    lastRank = rank;
    const above = i > 0 ? prepared[i - 1] : null;
    return {
      rank,
      squadId: s.squadId,
      name: s.name,
      groupScore: s.groupScore,
      memberCount: s.memberCount,
      memberScores: s.memberScores,
      prevRank: s.prevRank,
      scoreGapToAbove: above ? above.groupScore - s.groupScore : null,
    };
  });
}

async function buildOne(
  battleId: string,
  battle: Record<string, unknown>,
  period: "weekly" | "monthly",
  label: string,
  startKey: string,
  endKey: string,
  todayKey: string
) {
  const db = getFirestore(admin.app());
  const squadSnap = await db
    .collection(COLLECTION)
    .doc(battleId)
    .collection("squads")
    .where("status", "==", "locked")
    .get();

  const squads = squadSnap.docs.map((d) => {
    const data = d.data();
    const memberUids = Array.isArray(data.memberUids)
      ? data.memberUids.map(String)
      : [];
    return {
      id: d.id,
      name: String(data.name ?? ""),
      memberUids,
      memberCount: Number(data.memberCount ?? memberUids.length) || 0,
    };
  });

  const uidSet = new Set(squads.flatMap((s) => s.memberUids));
  const pointsByUid = new Map<string, number>();
  for (const uid of uidSet) pointsByUid.set(uid, 0);

  const seasonKey = String(battle.seasonKey ?? "");
  const statsSnap = await db
    .collection("user_stats_v2_daily")
    .where("date", ">=", startKey)
    .where("date", "<=", endKey)
    .get();

  for (const doc of statsSnap.docs) {
    const data = doc.data();
    const dateKey = String(data.date ?? "");
    const uid = uidFromDailyDocId(doc.id, dateKey);
    if (!uid || !uidSet.has(uid)) continue;
    pointsByUid.set(
      uid,
      (pointsByUid.get(uid) ?? 0) + pickPoints(data, seasonKey)
    );
  }

  const snapId = `${battleId}_${period}_${label}`;
  const prevRef = db.collection(SNAPSHOTS).doc(snapId);
  const prev = await prevRef.get();
  const prevRanks = new Map<string, number>();
  if (prev.exists) {
    const rows = (prev.data()?.rows as Array<{ squadId: string; rank: number }>) ?? [];
    for (const r of rows) prevRanks.set(r.squadId, r.rank);
  }

  const rows = rankRows(
    squads.map((s) => ({
      squadId: s.id,
      name: s.name,
      memberCount: s.memberCount,
      memberScores: s.memberUids.map((uid) => ({
        uid,
        points: pointsByUid.get(uid) ?? 0,
      })),
      prevRank: prevRanks.get(s.id) ?? null,
    }))
  );

  const graceEnd = addDaysToDateKey(endKey, GRACE_DAYS);
  const shouldFinal = todayKey > graceEnd;

  await prevRef.set(
    {
      battleId,
      period,
      label,
      status: shouldFinal ? "final" : "live",
      range: { startKey, endKey },
      rows,
      builtAt: FieldValue.serverTimestamp(),
      finalizedAt: shouldFinal ? FieldValue.serverTimestamp() : null,
    },
    { merge: true }
  );
}

export async function buildGroupBattlePeriodSnapshots(): Promise<number> {
  const db = getFirestore(admin.app());
  const todayKey = dateKeyJST(new Date());
  const snap = await db
    .collection(COLLECTION)
    .where("phase", "in", ["battle", "settling", "final"])
    .get();

  let built = 0;
  for (const doc of snap.docs) {
    const battle = doc.data() as Record<string, unknown>;
    const weeklyLabels: string[] = Array.isArray(battle.weeklyLabels)
      ? battle.weeklyLabels.map(String)
      : [];
    const monthlyRange = (battle.monthlyRange ?? {}) as {
      startKey?: string;
      endKey?: string;
      label?: string;
    };

    for (const label of weeklyLabels) {
      const startKey = label;
      const endKey = addDaysToDateKey(label, 6);
      const rangeStart = String(monthlyRange.startKey ?? startKey);
      const rangeEnd = String(monthlyRange.endKey ?? endKey);
      const clippedStart = startKey < rangeStart ? rangeStart : startKey;
      const clippedEnd = endKey > rangeEnd ? rangeEnd : endKey;
      if (clippedStart > clippedEnd || clippedStart > todayKey) continue;
      await buildOne(
        doc.id,
        battle,
        "weekly",
        label,
        clippedStart,
        clippedEnd < todayKey ? clippedEnd : todayKey,
        todayKey
      );
      built += 1;
    }

    const mStart = String(monthlyRange.startKey ?? "");
    const mEnd = String(monthlyRange.endKey ?? "");
    const mLabel = String(monthlyRange.label ?? "battle");
    if (mStart && mEnd && mStart <= todayKey) {
      await buildOne(
        doc.id,
        battle,
        "monthly",
        mLabel,
        mStart,
        mEnd < todayKey ? mEnd : todayKey,
        todayKey
      );
      built += 1;
    }
  }

  console.log(`[buildGroupBattlePeriodSnapshots] built=${built}`);
  return built;
}
