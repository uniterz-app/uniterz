/**
 * 自分のグループバトル Unit 獲得（クライアント共有型）
 */

import type { SquadBattleWeekIndex } from "@/lib/squads/squadBattleUiCopy";

export type GroupBattlePayoutLine = {
  weekIndex: SquadBattleWeekIndex;
  label: string;
  rank: number | null;
  units: number;
  status: "paid" | "pending" | "none";
};

export type GroupBattleMyPayout = {
  hasSquad: boolean;
  weekly: GroupBattlePayoutLine[];
  monthlyRank: number | null;
  monthlyUnits: number;
  monthlyLabel: string;
  monthlyStatus: "paid" | "pending" | "none";
  totalUnits: number;
  payoutNote: string;
  source: "ledger" | "mixed" | "estimate" | "empty";
};
