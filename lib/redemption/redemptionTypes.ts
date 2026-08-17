/**
 * Unit 商品交換 — 型・ステータス（docs/unit-redemption-design.md）
 */

export type RedemptionProductKind = "jersey" | "tshirt" | "cap";

export type RedemptionRequestStatus =
  | "draft"
  | "pending"
  | "needs_revision"
  | "approved"
  | "ordered"
  | "shipped"
  | "completed"
  | "cancelled"
  | "rejected";

export type RedemptionCatalogItem = {
  kind: RedemptionProductKind;
  unitsRequired: number;
  /** 日本語 UI・国内審査の価格上限（税込・円） */
  priceCapJpy: number;
  /** 英語 UI 表示用の価格上限（USD）。運用上の固定上限（為替都度換算ではない） */
  priceCapUsd: number;
  titleJa: string;
  titleEn: string;
  blurbJa: string;
  blurbEn: string;
};

/** 申請フォーム入力 */
export type RedemptionApplicationInput = {
  productKind: RedemptionProductKind;
  productName: string;
  productUrl: string;
  storeName: string;
  size: string;
  color: string;
  /** 任意の補足 */
  notes?: string;
  /** 商品画像 URL（アップロード後） */
  imageUrl?: string;
  shippingName: string;
  shippingPostalCode: string;
  shippingAddress: string;
  shippingPhone: string;
  shippingCountry: string;
};

export type RedemptionTimelineEvent = {
  status: RedemptionRequestStatus;
  atMs: number;
  note?: string | null;
};

export type RedemptionRequest = {
  id: string;
  uid: string;
  status: RedemptionRequestStatus;
  productKind: RedemptionProductKind;
  unitsRequired: number;
  productName: string;
  productUrl: string;
  storeName: string;
  size: string;
  color: string;
  notes: string | null;
  imageUrl: string | null;
  shippingName: string;
  shippingPostalCode: string;
  shippingAddress: string;
  shippingPhone: string;
  shippingCountry: string;
  /** 追跡番号（発送後） */
  trackingNumber: string | null;
  trackingCarrier: string | null;
  orderReference: string | null;
  adminNote: string | null;
  /** Unit ロック済みか（ライブ時） */
  unitsReserved: boolean;
  /** Unit 消費済みか（購入確定時） */
  unitsConsumed: boolean;
  seasonKey: string;
  createdAtMs: number;
  updatedAtMs: number;
  timeline: RedemptionTimelineEvent[];
};

export type RedemptionListPayload = {
  ok: boolean;
  balance: number;
  reservedUnits: number;
  seasonUnitsUsed: number;
  seasonCap: number;
  unitsLive: boolean;
  catalog: RedemptionCatalogItem[];
  requests: RedemptionRequest[];
  error?: string;
};
