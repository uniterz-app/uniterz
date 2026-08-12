/**
 * 交換カタログ定数（docs/unit-redemption-design.md §2 / §5）
 */

import type {
  RedemptionCatalogItem,
  RedemptionProductKind,
} from "@/lib/redemption/redemptionTypes";

export const REDEMPTION_SEASON_CAP_UNITS = 2000;

export const REDEMPTION_CATALOG: readonly RedemptionCatalogItem[] = [
  {
    kind: "jersey",
    unitsRequired: 1000,
    priceCapJpy: 25_000,
    priceCapUsd: 170,
    titleJa: "NBA ジャージ",
    titleEn: "NBA Jersey",
    blurbJa: "スウィングマン基本。25,000円まで。上限内ならオーセンティック可。",
    blurbEn: "Swingman baseline; up to $170. Authentic OK within cap.",
  },
  {
    kind: "tshirt",
    unitsRequired: 600,
    priceCapJpy: 12_000,
    priceCapUsd: 80,
    titleJa: "NBA Tシャツ",
    titleEn: "NBA T-Shirt",
    blurbJa: "正規販売店の新品のみ。12,000円まで。",
    blurbEn: "New items from approved retailers only. Up to $80.",
  },
  {
    kind: "cap",
    unitsRequired: 300,
    priceCapJpy: 7_000,
    priceCapUsd: 50,
    titleJa: "NBA キャップ",
    titleEn: "NBA Cap",
    blurbJa: "7,000円まで。価格が上限未満でも必要 Unit は変わりません。",
    blurbEn:
      "Up to $50. Units required stay fixed even if the price is lower.",
  },
] as const;

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

/** カタログ行の価格上限ラベル（言語別） */
export function redemptionPriceCapLabel(
  item: Pick<RedemptionCatalogItem, "priceCapJpy" | "priceCapUsd">,
  language: "ja" | "en"
): string {
  if (language === "en") {
    return `Price cap $${item.priceCapUsd.toLocaleString("en-US")}`;
  }
  return `価格上限 ${item.priceCapJpy.toLocaleString("ja-JP")} 円`;
}

/** 申請フォーム等の短い上限表示 */
export function redemptionPriceCapShort(
  item: Pick<RedemptionCatalogItem, "priceCapJpy" | "priceCapUsd">,
  language: "ja" | "en"
): string {
  if (language === "en") {
    return `$${item.priceCapUsd.toLocaleString("en-US")}`;
  }
  return `${item.priceCapJpy.toLocaleString("ja-JP")} 円`;
}

/** 対象外の案内（カタログ注意書き） */
export const REDEMPTION_EXCLUSIONS_JA = [
  "中古・転売・フリマ・オークション",
  "ギフトカード・金券・デジタルコード",
  "予約商品・オーダーメイド・名前入れ",
  "正規品と確認できない商品",
] as const;

export const REDEMPTION_EXCLUSIONS_EN = [
  "Used, resale, flea market, or auction items",
  "Gift cards, vouchers, or digital codes",
  "Pre-orders, custom, or name-customized items",
  "Items that cannot be verified as authentic",
] as const;

export const REDEMPTION_DISCLAIMER_JA =
  "UNITERZ は NBA およびその関連団体とは無関係の独立したサービスです。商品は運営が正規販売店から購入し、ユーザーへお届けします。";

export const REDEMPTION_DISCLAIMER_EN =
  "UNITERZ is an independent service and is not affiliated with the NBA or its partners. Products are purchased by the operator from authorized retailers and shipped to you.";
