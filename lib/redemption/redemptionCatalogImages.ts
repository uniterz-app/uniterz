/**
 * 交換カタログの区分サムネ（Web public パス）
 * NBA 公式ロゴは使わない汎用シルエット。
 */

import type { RedemptionProductKind } from "@/lib/redemption/redemptionTypes";

export const REDEMPTION_CATALOG_IMAGE_SRC: Record<
  RedemptionProductKind,
  string
> = {
  jersey: "/redemption/catalog-jersey.png",
  tshirt: "/redemption/catalog-tshirt.png",
  cap: "/redemption/catalog-cap.png",
};

export function redemptionCatalogImageSrc(
  kind: RedemptionProductKind
): string {
  return REDEMPTION_CATALOG_IMAGE_SRC[kind];
}
