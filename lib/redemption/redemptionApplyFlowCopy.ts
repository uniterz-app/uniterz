/**
 * 交換申請ページ入場時のフロー説明モーダル文言
 */
import { REDELIVERY_SHIPPING_FEE_JPY } from "@/lib/legal/companyInfo";
import {
  L,
  resolveLocalizedLang,
  type LocalizedLang,
} from "@/lib/i18n/localize";

export type RedemptionApplyFlowSection = {
  title: string;
  bullets: string[];
};

export function redemptionApplyFlowCopy(language: LocalizedLang | string): {
  eyebrow: string;
  title: string;
  close: string;
  reopen: string;
  sections: RedemptionApplyFlowSection[];
} {
  const lang = resolveLocalizedLang(language);
  return {
    eyebrow: L(lang, {
      ja: "UNIT EXCHANGE",
      en: "UNIT EXCHANGE",
      ko: "UNIT EXCHANGE",
      zh: "UNIT EXCHANGE",
      es: "UNIT EXCHANGE",
      pt: "UNIT EXCHANGE",
      fr: "UNIT EXCHANGE",
    }),
    title: L(lang, {
      ja: "届くまでの流れ",
      en: "How delivery works",
      ko: "배송까지의 흐름",
      zh: "送达流程",
      es: "Cómo llega el pedido",
      pt: "Como a entrega funciona",
      fr: "Comment ça arrive",
    }),
    close: L(lang, {
      ja: "理解した",
      en: "Got it",
      ko: "확인",
      zh: "知道了",
      es: "Entendido",
      pt: "Entendi",
      fr: "Compris",
    }),
    reopen: L(lang, {
      ja: "届くまでの流れ・条件",
      en: "Delivery flow & terms",
      ko: "배송 흐름·조건",
      zh: "送达流程与条件",
      es: "Flujo y condiciones",
      pt: "Fluxo e condições",
      fr: "Flux et conditions",
    }),
    sections: [
      {
        title: L(lang, {
          ja: "届く流れ",
          en: "Delivery flow",
          ko: "배송 흐름",
          zh: "送达流程",
          es: "Flujo",
          pt: "Fluxo",
          fr: "Flux",
        }),
        bullets: [
          L(lang, {
            ja: "申請 → 審査 → 購入 → 発送 → 到着",
            en: "Apply → review → purchase → ship → delivered",
            ko: "신청 → 심사 → 구매 → 발송 → 도착",
            zh: "申请 → 审核 → 采购 → 发货 → 送达",
            es: "Solicitar → revisión → compra → envío → entrega",
            pt: "Solicitar → análise → compra → envio → entrega",
            fr: "Demande → revue → achat → envoi → livraison",
          }),
          L(lang, {
            ja: "運営が正規販売店で購入し、あなた宛に直送します",
            en: "We buy from an authorized retailer and ship direct to you",
            ko: "운영이 정식 판매점에서 구매해 당신에게 직송합니다",
            zh: "运营从正规店铺购买并直送到您",
            es: "Compramos en tienda autorizada y enviamos directo a ti",
            pt: "Compramos em loja autorizada e enviamos direto a você",
            fr: "Nous achetons chez un revendeur agréé et expédions directement",
          }),
          L(lang, {
            ja: "購入・発送は、配送先の国・地域に対応する公式オンラインストア（例: 日本住所 → 日本向け NBA Store）を優先します",
            en: "We prioritize the official online store for your shipping country (e.g. Japan address → Japan NBA Store)",
            ko: "배송국 공식 온라인 스토어를 우선합니다(예: 일본 주소 → 일본 NBA Store)",
            zh: "优先使用配送国对应的官方网店（例：日本地址 → 日本 NBA Store）",
            es: "Priorizamos la tienda online oficial de tu país de envío",
            pt: "Priorizamos a loja online oficial do seu país de envio",
            fr: "Nous priorisons la boutique officielle du pays de livraison",
          }),
        ],
      },
      {
        title: L(lang, {
          ja: "費用",
          en: "Costs",
          ko: "비용",
          zh: "费用",
          es: "Costos",
          pt: "Custos",
          fr: "Coûts",
        }),
        bullets: [
          L(lang, {
            ja: "通常の送料・関税・輸入税・現地手数料は原則運営負担です。届いたあとの追加請求はありません",
            en: "Ordinary shipping, duties, import taxes, and local fees are generally on us—no surprise bill on delivery",
            ko: "일반 배송비·관세·수입세·현지 수수료는 원칙 운영 부담. 도착 후 추가 청구 없음",
            zh: "普通运费、关税、进口税、当地手续费原则上由运营承担，送达后无追加收费",
            es: "Envío, aranceles e impuestos locales suelen ir a cargo nuestro; sin cobros sorpresa",
            pt: "Frete, taxas e impostos locais geralmente são nossos; sem cobrança na entrega",
            fr: "Frais d’envoi, droits et taxes locaux sont en général à notre charge; pas de surprise",
          }),
          L(lang, {
            ja: `例外: 住所誤りなどによる再配達・宛先変更は着払い ${REDELIVERY_SHIPPING_FEE_JPY} 円（税込・全国一律）`,
            en: `Exception: redelivery / address change from bad details is COD ¥${REDELIVERY_SHIPPING_FEE_JPY} (tax incl., flat nationwide)`,
            ko: `예외: 주소 오류 재배송·주소 변경은 착불 ¥${REDELIVERY_SHIPPING_FEE_JPY}(세금 포함·전국 동일)`,
            zh: `例外：因地址错误的再投/改址为到付 ¥${REDELIVERY_SHIPPING_FEE_JPY}（含税·全国统一）`,
            es: `Excepción: reenvío/cambio por datos erróneos es contra reembolso ¥${REDELIVERY_SHIPPING_FEE_JPY}`,
            pt: `Exceção: reenvio/mudança por dados errados é COD ¥${REDELIVERY_SHIPPING_FEE_JPY}`,
            fr: `Exception: réexpédition / changement d’adresse (erreur) en contre-remboursement ¥${REDELIVERY_SHIPPING_FEE_JPY}`,
          }),
        ],
      },
      {
        title: L(lang, {
          ja: "申請の条件",
          en: "Application terms",
          ko: "신청 조건",
          zh: "申请条件",
          es: "Condiciones",
          pt: "Condições",
          fr: "Conditions",
        }),
        bullets: [
          L(lang, {
            ja: "正規販売店の新品のみ。中古・転売・ギフトカード・予約・カスタムは不可",
            en: "New items from authorized retailers only—no used, resale, gift cards, preorders, or custom items",
            ko: "정식 판매점 신상품만. 중고·재판매·기프트카드·예약·커스텀 불가",
            zh: "仅限正规店新品。不接受二手、转卖、礼品卡、预售、定制",
            es: "Solo nuevo en tiendas autorizadas; no usado, reventa, tarjetas, preventa ni custom",
            pt: "Só novo em lojas autorizadas; sem usado, revenda, gift card, pré-venda ou custom",
            fr: "Neuf chez revendeurs agréés seulement; pas d’occasion, revente, carte, précommande, custom",
          }),
          L(lang, {
            ja: "商品スクショ・URL・規格・配送先が必要。価格はカタログの上限以内",
            en: "Product screenshot, URL, specs, and shipping address required. Price within catalog cap",
            ko: "상품 스크린샷·URL·규격·배송지 필요. 가격은 카탈로그 상한 이내",
            zh: "需商品截图、链接、规格与收货地址。价格须在目录上限内",
            es: "Se requieren captura, URL, specs y dirección. Precio dentro del tope",
            pt: "Precisa de print, URL, specs e endereço. Preço dentro do teto",
            fr: "Capture, URL, specs et adresse requis. Prix sous le plafond catalogue",
          }),
          L(lang, {
            ja: "申請時に Unit を仮押さえ。運営が購入した時点で消費。注文前の取消・却下なら戻ります",
            en: "Units are reserved on apply and consumed when we purchase. Cancel/reject before order returns them",
            ko: "신청 시 Unit 가압류. 구매 시 소비. 주문 전 취소·거절이면 복구",
            zh: "申请时暂扣 Unit，采购时消费。下单前取消/驳回则退回",
            es: "Units se reservan al solicitar y se consumen al comprar. Cancelación/rechazo antes del pedido las devuelve",
            pt: "Units são reservados na solicitação e consumidos na compra. Cancelar/recusar antes devolve",
            fr: "Units réservés à la demande, consommés à l’achat. Annulation/rejet avant commande les rend",
          }),
          L(lang, {
            ja: "シーズン交換上限あり。注文後のサイズ・カラー・配送先変更やユーザー都合のキャンセルは不可",
            en: "Season exchange cap applies. No size/color/address changes or user cancel after the retailer order",
            ko: "시즌 교환 상한 있음. 주문 후 사이즈·컬러·주소 변경·사용자 취소 불가",
            zh: "有赛季兑换上限。下单后不可改尺码/颜色/地址或用户取消",
            es: "Hay tope por temporada. Tras el pedido no hay cambio de talla/color/dirección ni cancelación",
            pt: "Há teto por temporada. Após o pedido, sem mudança de tamanho/cor/endereço nem cancelamento",
            fr: "Plafond saisonnier. Après commande: pas de changement taille/couleur/adresse ni annulation user",
          }),
          L(lang, {
            ja: "配送国向けストアで手配できない場合などは、申請を却下することがあります",
            en: "We may reject if we cannot fulfill via a suitable store for your shipping country",
            ko: "배송국 스토어로 처리 불가 시 신청을 거절할 수 있습니다",
            zh: "若无法通过配送国合适店铺履约，可能驳回申请",
            es: "Podemos rechazar si no podemos cumplir con una tienda adecuada para tu país",
            pt: "Podemos recusar se não der para cumprir com loja adequada ao seu país",
            fr: "Nous pouvons refuser si aucune boutique adaptée à votre pays n’est possible",
          }),
        ],
      },
    ],
  };
}
