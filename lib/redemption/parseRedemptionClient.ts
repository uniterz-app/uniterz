import { normalizeRedemptionProductKind } from "@/lib/redemption/redemptionCatalog";
import type {
  RedemptionRequest,
  RedemptionRequestStatus,
  RedemptionTimelineEvent,
} from "@/lib/redemption/redemptionTypes";

const STATUSES: readonly RedemptionRequestStatus[] = [
  "draft",
  "pending",
  "needs_revision",
  "approved",
  "ordered",
  "shipped",
  "completed",
  "cancelled",
  "rejected",
] as const;

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asBool(v: unknown): boolean {
  return v === true;
}

function parseStatus(v: unknown): RedemptionRequestStatus {
  const s = asString(v);
  return (STATUSES as readonly string[]).includes(s)
    ? (s as RedemptionRequestStatus)
    : "pending";
}

function parseTimeline(v: unknown): RedemptionTimelineEvent[] {
  if (!Array.isArray(v)) return [];
  const out: RedemptionTimelineEvent[] = [];
  for (const row of v) {
    if (!row || typeof row !== "object") continue;
    const o = row as Record<string, unknown>;
    out.push({
      status: parseStatus(o.status),
      atMs: typeof o.atMs === "number" ? o.atMs : 0,
      note: typeof o.note === "string" ? o.note : null,
    });
  }
  return out;
}

/** Firestore クライアント向け。Admin SDK の docToRequest と同形。 */
export function parseRedemptionRequestClient(
  id: string,
  data: Record<string, unknown>
): RedemptionRequest {
  const kind = normalizeRedemptionProductKind(data.productKind) ?? "tshirt";
  return {
    id,
    uid: asString(data.uid),
    status: parseStatus(data.status),
    productKind: kind,
    unitsRequired:
      typeof data.unitsRequired === "number" && Number.isFinite(data.unitsRequired)
        ? data.unitsRequired
        : 0,
    productName: asString(data.productName),
    productUrl: asString(data.productUrl),
    storeName: asString(data.storeName),
    size: asString(data.size),
    color: asString(data.color),
    notes: asString(data.notes) || null,
    imageUrl: asString(data.imageUrl) || null,
    shippingName: asString(data.shippingName),
    shippingPostalCode: asString(data.shippingPostalCode),
    shippingAddress: asString(data.shippingAddress),
    shippingPhone: asString(data.shippingPhone),
    shippingCountry: asString(data.shippingCountry) || "JP",
    trackingNumber: asString(data.trackingNumber) || null,
    trackingCarrier: asString(data.trackingCarrier) || null,
    orderReference: asString(data.orderReference) || null,
    adminNote: asString(data.adminNote) || null,
    unitsReserved: asBool(data.unitsReserved),
    unitsConsumed: asBool(data.unitsConsumed),
    seasonKey: asString(data.seasonKey),
    createdAtMs: typeof data.createdAtMs === "number" ? data.createdAtMs : 0,
    updatedAtMs: typeof data.updatedAtMs === "number" ? data.updatedAtMs : 0,
    timeline: parseTimeline(data.timeline),
  };
}

export const ADMIN_REDEMPTION_STATUSES: readonly RedemptionRequestStatus[] = [
  "pending",
  "needs_revision",
  "approved",
  "ordered",
  "shipped",
  "completed",
  "cancelled",
  "rejected",
] as const;
