/**
 * 商品交換の届き方・審査後の案内文言（申請・進捗・ハブ）
 */
import {
  L,
  resolveLocalizedLang,
  type LocalizedLang,
} from "@/lib/i18n/localize";

export function redemptionBatchScheduleCopy(
  language: LocalizedLang | string
): {
  short: string;
  detail: string;
  pendingHint: string;
  approvedHint: string;
} {
  const lang = resolveLocalizedLang(language);
  return {
    short: L(lang, {
      ja: "審査後に購入・直送",
      en: "Purchase & ship after review",
      ko: "심사 후 구매·직송",
      zh: "审核后采购并直送",
      es: "Compra y envío tras revisión",
      pt: "Compra e envio após análise",
      fr: "Achat et envoi après revue",
    }),
    detail: L(lang, {
      ja: "交換申請はいつでも受け付けます。審査のあと、配送先の国・地域に対応する正規オンラインストア等から購入し、あなた宛に直送します。",
      en: "You can apply any day. After review, we buy from an official online store for your shipping country/region when possible and ship direct to you.",
      ko: "교환 신청은 언제든 가능합니다. 심사 후 배송국 공식 온라인 스토어 등에서 구매해 당신에게 직송합니다.",
      zh: "随时可申请兑换。审核后，优先从配送国官方网店采购并直送到您。",
      es: "Puedes solicitar cualquier día. Tras la revisión, compramos en la tienda online oficial de tu país cuando sea posible y enviamos directo a ti.",
      pt: "Você pode solicitar qualquer dia. Após a análise, compramos na loja online oficial do seu país quando possível e enviamos direto a você.",
      fr: "Vous pouvez demander n’importe quel jour. Après revue, nous achetons sur la boutique officielle de votre pays si possible et expédions directement.",
    }),
    pendingHint: L(lang, {
      ja: "受付済み。審査完了までお待ちください。",
      en: "Received. Waiting for review.",
      ko: "접수됨. 심사 완료까지 기다려 주세요.",
      zh: "已受理。请等待审核完成。",
      es: "Recibido. Esperando la revisión.",
      pt: "Recebido. Aguardando a análise.",
      fr: "Reçu. En attente de revue.",
    }),
    approvedHint: L(lang, {
      ja: "承認済み。購入・発送の準備に入ります。",
      en: "Approved. Preparing purchase and shipment.",
      ko: "승인됨. 구매·발송 준비에 들어갑니다.",
      zh: "已批准。正在准备采购与发货。",
      es: "Aprobado. Preparando compra y envío.",
      pt: "Aprovado. Preparando compra e envio.",
      fr: "Approuvé. Préparation de l’achat et de l’envoi.",
    }),
  };
}
