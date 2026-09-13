/**
 * 交換申請フォームの不足判定・エラー文言
 */
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export function redemptionAvailableUnits(
  balance: number,
  reservedUnits: number
): number {
  return Math.max(0, Math.floor(balance) - Math.max(0, Math.floor(reservedUnits)));
}

export function canAffordRedemption(opts: {
  balance: number;
  reservedUnits: number;
  unitsRequired: number;
  seasonUnitsUsed: number;
  seasonCap: number;
}): { ok: true } | { ok: false; reason: "insufficient_units" | "season_cap_exceeded" } {
  const available = redemptionAvailableUnits(opts.balance, opts.reservedUnits);
  if (available < opts.unitsRequired) {
    return { ok: false, reason: "insufficient_units" };
  }
  if (opts.seasonUnitsUsed + opts.unitsRequired > opts.seasonCap) {
    return { ok: false, reason: "season_cap_exceeded" };
  }
  return { ok: true };
}

export function redemptionApplyErrorMessage(
  code: string | null | undefined,
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  const key = (code ?? "").trim();
  if (key === "insufficient_units") {
    return L(lang, {
      ja: "Unit が不足しています。必要数を貯めてから申請してください。",
      en: "Not enough Units. Earn more before applying.",
      ko: "Unit이 부족합니다. 필요한 만큼 모은 뒤 신청하세요.",
      zh: "Unit 不足。请先攒够后再申请。",
      es: "No hay Units suficientes. Gana más antes de solicitar.",
      pt: "Units insuficientes. Ganhe mais antes de solicitar.",
      fr: "Pas assez d’Units. Gagnez-en plus avant de demander.",
    });
  }
  if (key === "season_cap_exceeded") {
    return L(lang, {
      ja: "今シーズンの交換上限（2,000 Unit）を超えます。",
      en: "This would exceed the season exchange cap (2,000 Units).",
      ko: "이번 시즌 교환 한도(2,000 Unit)를 초과합니다.",
      zh: "将超过本赛季兑换上限（2,000 Unit）。",
      es: "Superaría el tope de temporada (2.000 Units).",
      pt: "Ultrapassaria o limite da temporada (2.000 Units).",
      fr: "Dépasserait le plafond de saison (2 000 Units).",
    });
  }
  if (key === "consent_required") {
    return L(lang, {
      ja: "申請には同意が必要です。",
      en: "Consent is required to submit.",
      ko: "신청하려면 동의가 필요합니다.",
      zh: "提交申请需要同意。",
      es: "Se requiere consentimiento para enviar.",
      pt: "É necessário consentimento para enviar.",
      fr: "Le consentement est requis pour envoyer.",
    });
  }
  if (key === "image_required") {
    return L(lang, {
      ja: "商品画像（スクショ）を添付してください。",
      en: "Please attach a product screenshot.",
      ko: "상품 이미지(스크린샷)를 첨부해 주세요.",
      zh: "请附上商品截图。",
      es: "Adjunta una captura del producto.",
      pt: "Anexe uma captura do produto.",
      fr: "Joignez une capture du produit.",
    });
  }
  if (!key || key === "error") {
    return L(lang, {
      ja: "申請に失敗しました。",
      en: "Could not submit application.",
      ko: "신청에 실패했습니다.",
      zh: "申请提交失败。",
      es: "No se pudo enviar la solicitud.",
      pt: "Não foi possível enviar o pedido.",
      fr: "Impossible d’envoyer la demande.",
    });
  }
  return key;
}
