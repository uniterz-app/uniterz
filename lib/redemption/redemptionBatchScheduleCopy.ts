/**
 * 商品交換の運用スケジュール文言（月末まとめ購入）
 * 4/1 申請 → 同月 25 日前後にまとめて購入、という体験を先に伝える。
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
      ja: "月末まとめ購入（おおよそ25日前後）",
      en: "Monthly batch order (~25th)",
      ko: "월말 일괄 구매(대략 25일 전후)",
      zh: "月末集中采购（约 25 日前后）",
      es: "Pedido mensual conjunto (~día 25)",
      pt: "Pedido mensal em lote (~dia 25)",
      fr: "Commande groupée mensuelle (~25)",
    }),
    detail: L(lang, {
      ja: "交換申請はいつでも受け付けます。運営は配送料を抑えるため、その月の申請をまとめて月末（おおよそ25日前後）に購入・発送準備します。例: 4/1 の申請も、実際の購入は 4/25 前後になります。",
      en: "You can apply any day. To keep shipping costs down, we review and purchase that month’s requests together near month-end (around the 25th). Example: an Apr 1 request is typically purchased around Apr 25.",
      ko: "교환 신청은 언제든 가능합니다. 배송비를 낮추기 위해 그달 신청을 모아 월말(대략 25일 전후)에 구매·발송 준비합니다. 예: 4/1 신청도 실제 구매는 4/25 전후입니다.",
      zh: "随时可提交兑换申请。为控制运费，当月申请会集中在月末（约 25 日前后）采购并发货准备。例：4/1 的申请通常约在 4/25 采购。",
      es: "Puedes solicitar cualquier día. Para reducir envíos, revisamos y compramos las solicitudes del mes cerca de fin de mes (~día 25). Ej.: una del 1 abr. suele comprarse hacia el 25 abr.",
      pt: "Você pode solicitar qualquer dia. Para reduzir frete, revisamos e compramos os pedidos do mês perto do fim (~dia 25). Ex.: um de 1º abr. costuma ser comprado por volta de 25 abr.",
      fr: "Vous pouvez demander n’importe quel jour. Pour limiter les frais, nous achetons les demandes du mois vers fin de mois (~25). Ex. : une demande au 1er avr. est souvent achetée vers le 25 avr.",
    }),
    pendingHint: L(lang, {
      ja: "受付済み。月末のまとめ購入までお待ちください。",
      en: "Received. Waiting for the month-end batch purchase.",
      ko: "접수됨. 월말 일괄 구매까지 기다려 주세요.",
      zh: "已受理。请等待月末集中采购。",
      es: "Recibido. Esperando la compra conjunta de fin de mes.",
      pt: "Recebido. Aguardando a compra em lote do fim do mês.",
      fr: "Reçu. En attente de l’achat groupé de fin de mois.",
    }),
    approvedHint: L(lang, {
      ja: "購入準備中。月末まとめ購入（おおよそ25日前後）の対象です。",
      en: "Queued for the monthly batch purchase (~25th).",
      ko: "구매 준비 중. 월말 일괄 구매(대략 25일 전후) 대상입니다.",
      zh: "采购准备中。已纳入月末集中采购（约 25 日前后）。",
      es: "En cola para la compra mensual (~día 25).",
      pt: "Na fila da compra mensal (~dia 25).",
      fr: "En file pour l’achat mensuel (~25).",
    }),
  };
}
