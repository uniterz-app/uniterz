/**
 * 自分のグループバトル Unit 獲得（台帳 + FINAL スナップ）。
 */

import type { Firestore } from "firebase-admin/firestore";
import { UNIT_LEDGER_COLLECTION } from "@/lib/groupBattles/constants";
import { estimatedGroupBattleUnitsPerMember } from "@/lib/groupBattles/unitLedger";
import type {
  GroupBattleMyPayout,
  GroupBattlePayoutLine,
} from "@/lib/groupBattles/myPayoutTypes";
import type { GroupBattlePeriod } from "@/lib/groupBattles/types";
import type { SquadBattleWeekIndex } from "@/lib/squads/squadBattleUiCopy";
import {
  getBattle,
  getMembership,
  parseSnapshotDoc,
  snapshotRef,
} from "@/lib/groupBattles/server/firestore";

export type {
  GroupBattleMyPayout,
  GroupBattlePayoutLine,
} from "@/lib/groupBattles/myPayoutTypes";

type LedgerHit = { amount: number; rank: number | null };

function emptyPayout(note: string): GroupBattleMyPayout {
  return {
    hasSquad: false,
    weekly: [],
    monthlyRank: null,
    monthlyUnits: 0,
    monthlyLabel: "",
    monthlyStatus: "none",
    totalUnits: 0,
    payoutNote: note,
    source: "empty",
  };
}

async function loadLedgerByBattle(
  db: Firestore,
  uid: string,
  battleId: string
): Promise<Map<string, LedgerHit>> {
  const out = new Map<string, LedgerHit>();
  let snap;
  try {
    snap = await db
      .collection(UNIT_LEDGER_COLLECTION)
      .where("uid", "==", uid)
      .where("battleId", "==", battleId)
      .get();
  } catch {
    snap = await db
      .collection(UNIT_LEDGER_COLLECTION)
      .where("uid", "==", uid)
      .limit(200)
      .get();
  }

  for (const doc of snap.docs) {
    const d = doc.data() as Record<string, unknown>;
    if (String(d.battleId ?? "") !== battleId) continue;
    const period = String(d.period ?? "");
    const label = String(d.label ?? "");
    if (!period || !label) continue;
    const amount = Number(d.amount ?? 0) || 0;
    const rankRaw = Number(d.rank);
    out.set(`${period}:${label}`, {
      amount,
      rank: Number.isFinite(rankRaw) && rankRaw > 0 ? rankRaw : null,
    });
  }
  return out;
}

async function squadRankFromSnapshot(
  db: Firestore,
  battleId: string,
  period: GroupBattlePeriod,
  label: string,
  squadId: string
): Promise<{ rank: number | null; status: "live" | "final" | null }> {
  const snap = await snapshotRef(db, battleId, period, label).get();
  if (!snap.exists) return { rank: null, status: null };
  const parsed = parseSnapshotDoc(
    snap.id,
    snap.data() as Record<string, unknown>
  );
  const row = parsed.rows.find((r) => r.squadId === squadId);
  return {
    rank: row?.rank ?? null,
    status: parsed.status,
  };
}

export async function loadMyGroupBattlePayout(
  db: Firestore,
  battleId: string,
  uid: string
): Promise<GroupBattleMyPayout> {
  const battle = await getBattle(db, battleId);
  if (!battle) {
    return emptyPayout("大会が見つかりません。");
  }

  const membership = await getMembership(db, battleId, uid);
  if (!membership?.squadId) {
    return emptyPayout(
      "未参加のため配布対象外です。次回 ENTRY から参加できます。"
    );
  }

  const ledger = await loadLedgerByBattle(db, uid, battleId);
  const weekLabels = battle.weeklyLabels.slice(0, 4);
  const weeklyTable = battle.unitRewards?.weekly?.unitsPerMemberByRank ?? null;
  const monthlyTable =
    battle.unitRewards?.monthly?.unitsPerMemberByRank ?? null;

  let paidCount = 0;
  let pendingCount = 0;

  const weekly: GroupBattlePayoutLine[] = [];
  for (let i = 0; i < 4; i++) {
    const weekIndex = (i + 1) as SquadBattleWeekIndex;
    const label = weekLabels[i] ?? "";
    if (!label) {
      weekly.push({
        weekIndex,
        label: "",
        rank: null,
        units: 0,
        status: "none",
      });
      continue;
    }

    const hit = ledger.get(`weekly:${label}`);
    if (hit) {
      paidCount += 1;
      weekly.push({
        weekIndex,
        label,
        rank: hit.rank,
        units: hit.amount,
        status: "paid",
      });
      continue;
    }

    const fromSnap = await squadRankFromSnapshot(
      db,
      battleId,
      "weekly",
      label,
      membership.squadId
    );
    if (fromSnap.status === "final" && fromSnap.rank != null) {
      pendingCount += 1;
      const est =
        estimatedGroupBattleUnitsPerMember(
          "weekly",
          fromSnap.rank,
          weeklyTable
        ) ?? 0;
      weekly.push({
        weekIndex,
        label,
        rank: fromSnap.rank,
        units: est,
        status: "pending",
      });
      continue;
    }

    weekly.push({
      weekIndex,
      label,
      rank: fromSnap.rank,
      units: 0,
      status: "none",
    });
  }

  const monthlyLabel = battle.monthlyRange.label;
  let monthlyRank: number | null = null;
  let monthlyUnits = 0;
  let monthlyStatus: GroupBattleMyPayout["monthlyStatus"] = "none";

  const monthlyHit = ledger.get(`monthly:${monthlyLabel}`);
  if (monthlyHit) {
    paidCount += 1;
    monthlyRank = monthlyHit.rank;
    monthlyUnits = monthlyHit.amount;
    monthlyStatus = "paid";
  } else {
    const fromSnap = await squadRankFromSnapshot(
      db,
      battleId,
      "monthly",
      monthlyLabel,
      membership.squadId
    );
    monthlyRank = fromSnap.rank;
    if (fromSnap.status === "final" && fromSnap.rank != null) {
      pendingCount += 1;
      monthlyUnits =
        estimatedGroupBattleUnitsPerMember(
          "monthly",
          fromSnap.rank,
          monthlyTable
        ) ?? 0;
      monthlyStatus = "pending";
    }
  }

  const totalUnits =
    weekly.reduce((s, w) => s + w.units, 0) + monthlyUnits;

  let source: GroupBattleMyPayout["source"] = "empty";
  if (paidCount > 0 && pendingCount > 0) source = "mixed";
  else if (paidCount > 0) source = "ledger";
  else if (pendingCount > 0) source = "estimate";

  let payoutNote = "確定メンバー全員へ同額付与 · Pick Up 試合のみ";
  if (pendingCount > 0 && paidCount === 0) {
    payoutNote =
      "順位は確定。Unit 反映まで最大24時間かかる場合があります";
  } else if (pendingCount > 0) {
    payoutNote =
      "一部は付与済み。残りは反映まで最大24時間かかる場合があります";
  } else if (paidCount > 0) {
    payoutNote = "台帳に記録済み · Pick Up 試合のみ · Free / Pro 共通";
  } else {
    payoutNote = "まだ確定結果がありません";
  }

  return {
    hasSquad: true,
    weekly,
    monthlyRank,
    monthlyUnits,
    monthlyLabel,
    monthlyStatus,
    totalUnits,
    payoutNote,
    source,
  };
}
