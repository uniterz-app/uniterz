/**
 * Unit 台帳エントリの表示文言
 */

import type { UnitLedgerReasonCode } from "@/lib/units/unitLedgerTypes";

export function normalizeUnitLedgerReason(raw: unknown): UnitLedgerReasonCode {
  if (typeof raw !== "string") return "unknown";
  switch (raw) {
    case "referral_invitee":
    case "referral_referrer":
    case "referral_milestone":
    case "group_battle_weekly":
    case "group_battle_monthly":
    case "weekly_rank":
    case "monthly_rank":
    case "redemption":
    case "adjustment":
      return raw;
    default:
      return "unknown";
  }
}

export function unitLedgerReasonTitle(
  reason: UnitLedgerReasonCode,
  language: "ja" | "en",
  meta?: { milestoneAt?: number; rank?: number }
): string {
  const ja = language === "ja";
  switch (reason) {
    case "referral_invitee":
      return ja ? "招待ボーナス" : "Invite bonus";
    case "referral_referrer":
      return ja ? "招待で獲得" : "Referral reward";
    case "referral_milestone":
      return ja
        ? `招待マイルストーン（${meta?.milestoneAt ?? "?"}人）`
        : `Referral milestone (${meta?.milestoneAt ?? "?"} friends)`;
    case "group_battle_weekly":
      return ja ? "グループバトル（週間）" : "Group Battle (weekly)";
    case "group_battle_monthly":
      return ja ? "グループバトル（期間）" : "Group Battle (period)";
    case "weekly_rank":
      return ja ? "週間ランキング報酬" : "Weekly ranking reward";
    case "monthly_rank":
      return ja ? "月間ランキング報酬" : "Monthly ranking reward";
    case "redemption":
      return ja ? "商品交換で使用" : "Redeemed for product";
    case "adjustment":
      return ja ? "調整" : "Adjustment";
    default:
      return ja ? "Unit" : "Units";
  }
}

export function unitLedgerReasonDetail(
  reason: UnitLedgerReasonCode,
  language: "ja" | "en",
  meta?: { rank?: number; label?: string }
): string | null {
  const ja = language === "ja";
  if (
    (reason === "group_battle_weekly" || reason === "group_battle_monthly") &&
    meta?.rank != null
  ) {
    return ja ? `${meta.rank}位` : `Rank #${meta.rank}`;
  }
  if (
    (reason === "weekly_rank" || reason === "monthly_rank") &&
    meta?.rank != null
  ) {
    return ja ? `${meta.rank}位` : `Rank #${meta.rank}`;
  }
  if (meta?.label) return meta.label;
  return null;
}

/** 12/3 のような短い日付 */
export function formatUnitLedgerDate(
  createdAtMs: number,
  language: "ja" | "en"
): string {
  if (!Number.isFinite(createdAtMs) || createdAtMs <= 0) return "—";
  const d = new Date(createdAtMs);
  if (language === "ja") {
    return `${d.getMonth() + 1}/${d.getDate()}`;
  }
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function formatUnitLedgerAmount(
  amount: number,
  language: "ja" | "en"
): string {
  const abs = Math.abs(Math.round(amount));
  const n =
    language === "ja"
      ? abs.toLocaleString("ja-JP")
      : abs.toLocaleString("en-US");
  if (amount > 0) return `+${n}`;
  if (amount < 0) return `−${n}`;
  return n;
}
