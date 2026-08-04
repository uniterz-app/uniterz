/**
 * 交換申請ステータス遷移
 */

import type { RedemptionRequestStatus } from "@/lib/redemption/redemptionTypes";

const USER_CANCELABLE: ReadonlySet<RedemptionRequestStatus> = new Set([
  "draft",
  "pending",
  "needs_revision",
]);

const ADMIN_ADVANCE: Record<
  RedemptionRequestStatus,
  readonly RedemptionRequestStatus[]
> = {
  draft: ["pending", "cancelled"],
  pending: ["needs_revision", "approved", "rejected", "cancelled"],
  needs_revision: ["pending", "rejected", "cancelled"],
  approved: ["ordered", "rejected", "cancelled"],
  ordered: ["shipped", "completed"],
  shipped: ["completed"],
  completed: [],
  cancelled: [],
  rejected: [],
};

export function canUserCancelRedemption(
  status: RedemptionRequestStatus
): boolean {
  return USER_CANCELABLE.has(status);
}

export function canAdminTransition(
  from: RedemptionRequestStatus,
  to: RedemptionRequestStatus
): boolean {
  return ADMIN_ADVANCE[from]?.includes(to) === true;
}

/** 進捗 UI のメインレーン（分岐は別表示） */
export const REDEMPTION_PROGRESS_STEPS: readonly RedemptionRequestStatus[] = [
  "pending",
  "approved",
  "ordered",
  "shipped",
  "completed",
] as const;

export function redemptionStatusLabel(
  status: RedemptionRequestStatus,
  language: "ja" | "en"
): string {
  const ja = language === "ja";
  switch (status) {
    case "draft":
      return ja ? "下書き" : "Draft";
    case "pending":
      return ja ? "受付・審査中" : "Under review";
    case "needs_revision":
      return ja ? "修正待ち" : "Needs revision";
    case "approved":
      return ja ? "月末購入待ち" : "Queued for batch order";
    case "ordered":
      return ja ? "購入済" : "Ordered";
    case "shipped":
      return ja ? "発送済" : "Shipped";
    case "completed":
      return ja ? "到着・完了" : "Completed";
    case "cancelled":
      return ja ? "取消" : "Cancelled";
    case "rejected":
      return ja ? "却下" : "Rejected";
    default:
      return status;
  }
}

export function progressStepIndex(status: RedemptionRequestStatus): number {
  if (status === "needs_revision") return 0;
  if (status === "draft") return -1;
  if (status === "cancelled" || status === "rejected") return -1;
  const i = REDEMPTION_PROGRESS_STEPS.indexOf(status);
  return i;
}
