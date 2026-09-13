/**
 * 交換カタログ定数（docs/unit-redemption-design.md §2 / §5）
 */

import type {
  RedemptionCatalogItem,
  RedemptionProductKind,
} from "@/lib/redemption/redemptionTypes";
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

export const REDEMPTION_SEASON_CAP_UNITS = 2000;

export const REDEMPTION_CATALOG: readonly RedemptionCatalogItem[] = [
  {
    kind: "jersey",
    unitsRequired: 1000,
    priceCapJpy: 25_000,
    priceCapUsd: 170,
    titleJa: "NBA ジャージ",
    titleEn: "NBA Jersey",
    title: {
      ja: "NBA ジャージ",
      en: "NBA Jersey",
      ko: "NBA 저지",
      zh: "NBA 球衣",
      es: "Camiseta NBA",
      pt: "Camisa NBA",
      fr: "Maillot NBA",
    },
    blurbJa: "スウィングマン基本。25,000円まで。上限内ならオーセンティック可。",
    blurbEn: "Swingman baseline; up to $170. Authentic OK within cap.",
    blurb: {
      ja: "スウィングマン基本。25,000円まで。上限内ならオーセンティック可。",
      en: "Swingman baseline; up to $170. Authentic OK within cap.",
      ko: "스윙맨 기준, 최대 $170. 한도 내라면 어센틱도 가능합니다.",
      zh: "以 Swingman 版为准，上限 $170。在上限内可选球员版。",
      es: "Base Swingman; hasta $170. Authentic válida dentro del tope.",
      pt: "Base Swingman; até $170. Authentic permitida dentro do teto.",
      fr: "Base Swingman ; jusqu'à 170 $. Authentic possible dans la limite.",
    },
  },
  {
    kind: "tshirt",
    unitsRequired: 600,
    priceCapJpy: 12_000,
    priceCapUsd: 80,
    titleJa: "NBA Tシャツ",
    titleEn: "NBA T-Shirt",
    title: {
      ja: "NBA Tシャツ",
      en: "NBA T-Shirt",
      ko: "NBA 티셔츠",
      zh: "NBA T恤",
      es: "Camiseta NBA",
      pt: "Camiseta NBA",
      fr: "T-shirt NBA",
    },
    blurbJa: "正規販売店の新品のみ。12,000円まで。",
    blurbEn: "New items from approved retailers only. Up to $80.",
    blurb: {
      ja: "正規販売店の新品のみ。12,000円まで。",
      en: "New items from approved retailers only. Up to $80.",
      ko: "공식 판매처의 새 상품만. 최대 $80.",
      zh: "仅限正规零售商的全新商品，上限 $80。",
      es: "Solo artículos nuevos de tiendas autorizadas. Hasta $80.",
      pt: "Apenas itens novos de lojas autorizadas. Até $80.",
      fr: "Uniquement des articles neufs de revendeurs agréés. Jusqu'à 80 $.",
    },
  },
  {
    kind: "cap",
    unitsRequired: 300,
    priceCapJpy: 7_000,
    priceCapUsd: 50,
    titleJa: "NBA キャップ",
    titleEn: "NBA Cap",
    title: {
      ja: "NBA キャップ",
      en: "NBA Cap",
      ko: "NBA 모자",
      zh: "NBA 球帽",
      es: "Gorra NBA",
      pt: "Boné NBA",
      fr: "Casquette NBA",
    },
    blurbJa: "7,000円まで。価格が上限未満でも必要 Unit は変わりません。",
    blurbEn:
      "Up to $50. Units required stay fixed even if the price is lower.",
    blurb: {
      ja: "7,000円まで。価格が上限未満でも必要 Unit は変わりません。",
      en: "Up to $50. Units required stay fixed even if the price is lower.",
      ko: "최대 $50. 가격이 한도보다 낮아도 필요 Unit은 동일합니다.",
      zh: "上限 $50。即使价格低于上限，所需 Unit 也不变。",
      es: "Hasta $50. Las Units necesarias no cambian aunque el precio sea menor.",
      pt: "Até $50. As Units necessárias não mudam mesmo com preço menor.",
      fr: "Jusqu'à 50 $. Les Units requises restent identiques même si le prix est inférieur.",
    },
  },
] as const;

/** カタログ名（7言語） */
export function redemptionCatalogTitle(
  item: Pick<RedemptionCatalogItem, "title" | "titleJa" | "titleEn">,
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  if (item.title) return L(lang, item.title);
  return lang === "ja" ? item.titleJa : item.titleEn;
}

/** カタログ説明（7言語） */
export function redemptionCatalogBlurb(
  item: Pick<RedemptionCatalogItem, "blurb" | "blurbJa" | "blurbEn">,
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  if (item.blurb) return L(lang, item.blurb);
  return lang === "ja" ? item.blurbJa : item.blurbEn;
}

export function redemptionCatalogItem(
  kind: RedemptionProductKind
): RedemptionCatalogItem | null {
  return REDEMPTION_CATALOG.find((x) => x.kind === kind) ?? null;
}

export function normalizeRedemptionProductKind(
  raw: unknown
): RedemptionProductKind | null {
  if (raw === "jersey" || raw === "tshirt" || raw === "cap") return raw;
  return null;
}

/** カタログ行の価格上限ラベル（ja=円、その他=USD・文言は7言語） */
export function redemptionPriceCapLabel(
  item: Pick<RedemptionCatalogItem, "priceCapJpy" | "priceCapUsd">,
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  if (lang === "ja") {
    return L(lang, {
      ja: `価格上限 ${item.priceCapJpy.toLocaleString("ja-JP")} 円`,
      en: `Price cap ¥${item.priceCapJpy.toLocaleString("en-US")}`,
      ko: `가격 상한 ¥${item.priceCapJpy.toLocaleString("en-US")}`,
      zh: `价格上限 ¥${item.priceCapJpy.toLocaleString("en-US")}`,
      es: `Tope ¥${item.priceCapJpy.toLocaleString("en-US")}`,
      pt: `Teto ¥${item.priceCapJpy.toLocaleString("en-US")}`,
      fr: `Plafond ¥${item.priceCapJpy.toLocaleString("en-US")}`,
    });
  }
  const usd = item.priceCapUsd.toLocaleString("en-US");
  return L(lang, {
    ja: `価格上限 $${usd}`,
    en: `Price cap $${usd}`,
    ko: `가격 상한 $${usd}`,
    zh: `价格上限 $${usd}`,
    es: `Tope $${usd}`,
    pt: `Teto $${usd}`,
    fr: `Plafond $${usd}`,
  });
}

/** 申請フォーム等の短い上限表示 */
export function redemptionPriceCapShort(
  item: Pick<RedemptionCatalogItem, "priceCapJpy" | "priceCapUsd">,
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  if (lang === "ja") {
    return `${item.priceCapJpy.toLocaleString("ja-JP")} 円`;
  }
  return `$${item.priceCapUsd.toLocaleString("en-US")}`;
}

/** 対象外の案内（カタログ注意書き）— chrome は 7言語 */
export function redemptionExclusionsCopy(
  language: string | null | undefined
): readonly string[] {
  const lang = resolveLocalizedLang(language);
  return [
    L(lang, {
      ja: "中古・転売・フリマ・オークション",
      en: "Used, resale, flea market, or auction items",
      ko: "중고·리셀·플리마켓·경매",
      zh: "二手、转售、跳蚤市场或拍卖",
      es: "Usado, reventa, mercadillo o subasta",
      pt: "Usado, revenda, brechó ou leilão",
      fr: "Occasion, revente, brocante ou enchères",
    }),
    L(lang, {
      ja: "ギフトカード・金券・デジタルコード",
      en: "Gift cards, vouchers, or digital codes",
      ko: "기프트카드·상품권·디지털 코드",
      zh: "礼品卡、代金券或数字兑换码",
      es: "Tarjetas regalo, vales o códigos digitales",
      pt: "Cartões-presente, vales ou códigos digitais",
      fr: "Cartes cadeaux, bons ou codes numériques",
    }),
    L(lang, {
      ja: "予約商品・オーダーメイド・名前入れ",
      en: "Pre-orders, custom, or name-customized items",
      ko: "예약·주문 제작·각인 상품",
      zh: "预售、定制或刻名商品",
      es: "Preventas, personalizados o con nombre",
      pt: "Pré-venda, sob medida ou com nome",
      fr: "Précommandes, sur-mesure ou nominatifs",
    }),
    L(lang, {
      ja: "正規品と確認できない商品",
      en: "Items that cannot be verified as authentic",
      ko: "정품 확인이 불가한 상품",
      zh: "无法核实为正品的商品",
      es: "Artículos no verificables como auténticos",
      pt: "Itens que não podem ser verificados como autênticos",
      fr: "Articles non vérifiables comme authentiques",
    }),
  ];
}

export function redemptionDisclaimerCopy(
  language: string | null | undefined
): string {
  const lang = resolveLocalizedLang(language);
  return L(lang, {
    ja: "UNITERZ は NBA およびその関連団体とは無関係の独立したサービスです。商品は運営が、配送先の国・地域に対応する正規オンラインストア等から購入し、ユーザーへお届けします。送料・関税等は原則運営負担です。",
    en: "UNITERZ is an independent service and is not affiliated with the NBA or its partners. Products are purchased by the operator from authorized online stores for your shipping country/region when possible, and shipped to you. Shipping and duties are generally borne by the operator.",
    ko: "UNITERZ는 NBA 및 관련 단체와 무관한 독립 서비스입니다. 상품은 배송국 공식 온라인 스토어 등에서 운영이 구매해 직송합니다. 배송비·관세 등은 원칙 운영 부담입니다.",
    zh: "UNITERZ 为独立服务，与 NBA 及其关联机构无关。商品由运营方优先从配送国官方网店采购并直送。运费与关税等原则上由运营承担。",
    es: "UNITERZ es un servicio independiente y no está afiliado a la NBA ni a sus socios. Compramos en la tienda online oficial de tu país cuando es posible y enviamos directo. Envío y aranceles suelen ir a nuestro cargo.",
    pt: "UNITERZ é um serviço independente e não é afiliado à NBA ou parceiros. Compramos na loja online oficial do seu país quando possível e enviamos direto. Frete e taxas geralmente são nossos.",
    fr: "UNITERZ est un service indépendant, non affilié à la NBA ni à ses partenaires. Nous achetons sur la boutique officielle de votre pays si possible et expédions directement. Frais d’envoi et droits sont en général à notre charge.",
  });
}

/** @deprecated 互換: JA 配列 — 新規は redemptionExclusionsCopy */
export const REDEMPTION_EXCLUSIONS_JA = [
  "中古・転売・フリマ・オークション",
  "ギフトカード・金券・デジタルコード",
  "予約商品・オーダーメイド・名前入れ",
  "正規品と確認できない商品",
] as const;

/** @deprecated 互換: EN 配列 — 新規は redemptionExclusionsCopy */
export const REDEMPTION_EXCLUSIONS_EN = [
  "Used, resale, flea market, or auction items",
  "Gift cards, vouchers, or digital codes",
  "Pre-orders, custom, or name-customized items",
  "Items that cannot be verified as authentic",
] as const;

/** @deprecated 互換 — 新規は redemptionDisclaimerCopy */
export const REDEMPTION_DISCLAIMER_JA =
  "UNITERZ は NBA およびその関連団体とは無関係の独立したサービスです。商品は運営が、配送先の国・地域に対応する正規オンラインストア等から購入し、ユーザーへお届けします。送料・関税等は原則運営負担です。";

/** @deprecated 互換 — 新規は redemptionDisclaimerCopy */
export const REDEMPTION_DISCLAIMER_EN =
  "UNITERZ is an independent service and is not affiliated with the NBA or its partners. Products are purchased by the operator from authorized online stores for your shipping country/region when possible, and shipped to you. Shipping and duties are generally borne by the operator.";
