/**
 * 運営向け大会作成（Admin SDK）。
 */

import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import { GROUP_BATTLE_COLLECTION, GROUP_BATTLE_TIE_RULE } from "@/lib/groupBattles/constants";
import { deriveBattleSchedule } from "@/lib/groupBattles/schedule";
import {
  GROUP_BATTLE_DEFAULT_MONTHLY_UNITS_PER_MEMBER,
  GROUP_BATTLE_DEFAULT_WEEKLY_UNITS_PER_MEMBER,
} from "@/lib/groupBattles/unitLedger";
import type { GroupBattlePhase } from "@/lib/groupBattles/types";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { battleRef, parseBattleDoc } from "@/lib/groupBattles/server/firestore";

export type CreateGroupBattleInput = {
  name: string;
  recruitStartAt: string;
  recruitEndAt: string;
  battleStartAt: string;
  battleEndAt: string;
  /** 省略時は現行 NBA シーズン */
  seasonKey?: string;
  /** true → すぐ recruiting、false → announced */
  startRecruiting?: boolean;
  rulesVersion?: string;
  monthlyLabel?: string;
  createdByUid?: string;
};

export async function createGroupBattle(
  db: Firestore,
  input: CreateGroupBattleInput
): Promise<
  | { ok: true; battleId: string; battle: ReturnType<typeof parseBattleDoc> }
  | { ok: false; error: string }
> {
  const name = String(input.name ?? "").trim();
  if (name.length < 1 || name.length > 80) {
    return { ok: false, error: "invalid_name" };
  }

  const derived = deriveBattleSchedule({
    recruitStartAt: input.recruitStartAt,
    recruitEndAt: input.recruitEndAt,
    battleStartAt: input.battleStartAt,
    battleEndAt: input.battleEndAt,
    monthlyLabel: input.monthlyLabel,
  });
  if (!derived.ok) return derived;

  const { schedule } = derived;
  const phase: GroupBattlePhase = input.startRecruiting
    ? "recruiting"
    : "announced";
  const seasonKey = (input.seasonKey ?? CURRENT_NBA_SEASON_KEY).trim();
  if (!/^\d{4}-\d{2}$/.test(seasonKey)) {
    return { ok: false, error: "invalid_season_key" };
  }

  const ref = db.collection(GROUP_BATTLE_COLLECTION).doc();
  const now = FieldValue.serverTimestamp();
  const payload = {
    name,
    phase,
    recruitStartAt: Timestamp.fromMillis(schedule.recruitStartAtMs),
    recruitEndAt: Timestamp.fromMillis(schedule.recruitEndAtMs),
    battleStartAt: Timestamp.fromMillis(schedule.battleStartAtMs),
    battleEndAt: Timestamp.fromMillis(schedule.battleEndAtMs),
    weeklyLabels: schedule.weeklyLabels,
    monthlyRange: schedule.monthlyRange,
    league: "nba" as const,
    seasonKey,
    tieRule: GROUP_BATTLE_TIE_RULE,
    unitRewards: {
      weekly: {
        maxRank: GROUP_BATTLE_DEFAULT_WEEKLY_UNITS_PER_MEMBER.length,
        unitsPerMemberByRank: [...GROUP_BATTLE_DEFAULT_WEEKLY_UNITS_PER_MEMBER],
      },
      monthly: {
        maxRank: GROUP_BATTLE_DEFAULT_MONTHLY_UNITS_PER_MEMBER.length,
        unitsPerMemberByRank: [...GROUP_BATTLE_DEFAULT_MONTHLY_UNITS_PER_MEMBER],
      },
    },
    rulesVersion: String(input.rulesVersion ?? "1").trim() || "1",
    createdByUid: input.createdByUid ?? null,
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(payload);
  const snap = await battleRef(db, ref.id).get();
  const battle = parseBattleDoc(
    snap.id,
    snap.data() as Record<string, unknown>
  );
  return { ok: true, battleId: ref.id, battle };
}
