/**
 * 交換申請ステータス遷移
 */

import type { RedemptionRequestStatus } from "@/lib/redemption/redemptionTypes";
import {
  L,
  resolveLocalizedLang,
  type LocalizedLang,
} from "@/lib/i18n/localize";

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
  language: LocalizedLang | string
): string {
  const lang = resolveLocalizedLang(language);
  switch (status) {
    case "draft":
      return L(lang, {
        ja: "下書き",
        en: "Draft",
        ko: "초안",
        zh: "草稿",
        es: "Borrador",
        pt: "Rascunho",
        fr: "Brouillon",
      });
    case "pending":
      return L(lang, {
        ja: "受付・審査中",
        en: "Under review",
        ko: "접수·심사 중",
        zh: "受理审查中",
        es: "En revisión",
        pt: "Em análise",
        fr: "En revue",
      });
    case "needs_revision":
      return L(lang, {
        ja: "修正待ち",
        en: "Needs revision",
        ko: "수정 대기",
        zh: "待修改",
        es: "Necesita revisión",
        pt: "Precisa de revisão",
        fr: "À corriger",
      });
    case "approved":
      return L(lang, {
        ja: "月末購入待ち",
        en: "Queued for batch order",
        ko: "월말 구매 대기",
        zh: "等待月末采购",
        es: "En cola de pedido",
        pt: "Na fila do lote",
        fr: "En file d’achat",
      });
    case "ordered":
      return L(lang, {
        ja: "購入済",
        en: "Ordered",
        ko: "구매 완료",
        zh: "已采购",
        es: "Pedido",
        pt: "Pedido",
        fr: "Commandé",
      });
    case "shipped":
      return L(lang, {
        ja: "発送済",
        en: "Shipped",
        ko: "발송 완료",
        zh: "已发货",
        es: "Enviado",
        pt: "Enviado",
        fr: "Expédié",
      });
    case "completed":
      return L(lang, {
        ja: "到着・完了",
        en: "Completed",
        ko: "도착·완료",
        zh: "已送达·完成",
        es: "Completado",
        pt: "Concluído",
        fr: "Terminé",
      });
    case "cancelled":
      return L(lang, {
        ja: "取消",
        en: "Cancelled",
        ko: "취소",
        zh: "已取消",
        es: "Cancelado",
        pt: "Cancelado",
        fr: "Annulé",
      });
    case "rejected":
      return L(lang, {
        ja: "却下",
        en: "Rejected",
        ko: "거절",
        zh: "已拒绝",
        es: "Rechazado",
        pt: "Recusado",
        fr: "Refusé",
      });
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
