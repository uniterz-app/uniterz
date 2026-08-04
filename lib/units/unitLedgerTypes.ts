/**
 * Unit 台帳（unit_ledger）の表示・API 用型
 * 正: docs/group-battle-tech-design.md §4.6 / referral settle
 */

export type UnitLedgerReasonCode =
  | "referral_invitee"
  | "referral_referrer"
  | "referral_milestone"
  | "group_battle_weekly"
  | "group_battle_monthly"
  | "weekly_rank"
  | "monthly_rank"
  | "redemption"
  | "adjustment"
  | "unknown";

export type UnitLedgerEntry = {
  id: string;
  amount: number;
  reason: UnitLedgerReasonCode;
  /** 表示用タイトル（例: 招待で獲得） */
  title: string;
  /** 補足（例: マイルストーン 5人） */
  detail: string | null;
  /** epoch ms */
  createdAtMs: number;
  /** メタ（任意） */
  meta?: {
    milestoneAt?: number;
    rank?: number;
    battleId?: string;
    period?: string;
    label?: string;
  };
};

export type UnitLedgerListPayload = {
  ok: boolean;
  balance: number;
  entries: UnitLedgerEntry[];
  error?: string;
};
