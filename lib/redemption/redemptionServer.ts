/**
 * Admin — 商品交換申請の読取・作成・状態遷移
 */

import type { Firestore, Transaction } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import {
  REDEMPTION_CATALOG,
  REDEMPTION_SEASON_CAP_UNITS,
  redemptionCatalogItem,
  normalizeRedemptionProductKind,
} from "@/lib/redemption/redemptionCatalog";
import { isRedemptionUnitsLive } from "@/lib/redemption/redemptionLiveFlags";
import {
  canAdminTransition,
  canUserCancelRedemption,
} from "@/lib/redemption/redemptionStatus";
import type {
  RedemptionApplicationInput,
  RedemptionRequest,
  RedemptionRequestStatus,
  RedemptionTimelineEvent,
} from "@/lib/redemption/redemptionTypes";

const COLLECTION = "unit_redemptions";

function nowMs() {
  return Date.now();
}

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asBool(v: unknown): boolean {
  return v === true;
}

function parseStatus(raw: unknown): RedemptionRequestStatus {
  switch (raw) {
    case "draft":
    case "pending":
    case "needs_revision":
    case "approved":
    case "ordered":
    case "shipped":
    case "completed":
    case "cancelled":
    case "rejected":
      return raw;
    default:
      return "pending";
  }
}

function parseTimeline(raw: unknown): RedemptionTimelineEvent[] {
  if (!Array.isArray(raw)) return [];
  const out: RedemptionTimelineEvent[] = [];
  for (const row of raw) {
    if (!row || typeof row !== "object") continue;
    const r = row as Record<string, unknown>;
    const status = parseStatus(r.status);
    const atMs =
      typeof r.atMs === "number" && Number.isFinite(r.atMs) ? r.atMs : 0;
    out.push({
      status,
      atMs,
      note: typeof r.note === "string" ? r.note : null,
    });
  }
  return out;
}

function docToRequest(
  id: string,
  data: Record<string, unknown>
): RedemptionRequest {
  const kind =
    normalizeRedemptionProductKind(data.productKind) ?? "tshirt";
  const catalog = redemptionCatalogItem(kind);
  return {
    id,
    uid: asString(data.uid),
    status: parseStatus(data.status),
    productKind: kind,
    unitsRequired:
      typeof data.unitsRequired === "number" && Number.isFinite(data.unitsRequired)
        ? data.unitsRequired
        : catalog?.unitsRequired ?? 0,
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
    seasonKey: asString(data.seasonKey) || currentSeasonKey(),
    createdAtMs:
      typeof data.createdAtMs === "number" ? data.createdAtMs : 0,
    updatedAtMs:
      typeof data.updatedAtMs === "number" ? data.updatedAtMs : 0,
    timeline: parseTimeline(data.timeline),
  };
}

/** 簡易シーズンキー（NBA シーズン表記に寄せる。厳密切替は別途） */
export function currentSeasonKey(now = new Date()): string {
  const y = now.getFullYear();
  const m = now.getMonth() + 1;
  // 10月以降は次シーズン開始
  if (m >= 10) return `${y}-${String(y + 1).slice(2)}`;
  return `${y - 1}-${String(y).slice(2)}`;
}

function validateInput(input: RedemptionApplicationInput): string | null {
  const kind = normalizeRedemptionProductKind(input.productKind);
  if (!kind) return "invalid productKind";
  if (!input.productName?.trim()) return "productName required";
  if (!input.productUrl?.trim()) return "productUrl required";
  if (!input.storeName?.trim()) return "storeName required";
  if (!input.size?.trim()) return "size required";
  if (!input.shippingName?.trim()) return "shippingName required";
  if (!input.shippingAddress?.trim()) return "shippingAddress required";
  if (!input.shippingPhone?.trim()) return "shippingPhone required";
  return null;
}

async function sumSeasonUnitsUsed(
  db: Firestore,
  uid: string,
  seasonKey: string
): Promise<number> {
  const snap = await db.collection(COLLECTION).where("uid", "==", uid).get();
  let sum = 0;
  for (const doc of snap.docs) {
    const data = doc.data() as Record<string, unknown>;
    if (asString(data.seasonKey) !== seasonKey) continue;
    const status = parseStatus(data.status);
    if (
      status === "cancelled" ||
      status === "rejected" ||
      status === "draft"
    ) {
      continue;
    }
    const units =
      typeof data.unitsRequired === "number" ? data.unitsRequired : 0;
    sum += units;
  }
  return sum;
}

async function sumReservedUnits(db: Firestore, uid: string): Promise<number> {
  const snap = await db.collection(COLLECTION).where("uid", "==", uid).get();
  let sum = 0;
  for (const doc of snap.docs) {
    const data = doc.data() as Record<string, unknown>;
    if (data.unitsReserved === true && data.unitsConsumed !== true) {
      const units =
        typeof data.unitsRequired === "number" ? data.unitsRequired : 0;
      sum += units;
    }
  }
  return sum;
}

export async function loadRedemptionsForUid(
  db: Firestore,
  uid: string
): Promise<{
  balance: number;
  reservedUnits: number;
  seasonUnitsUsed: number;
  seasonCap: number;
  unitsLive: boolean;
  catalog: typeof REDEMPTION_CATALOG;
  requests: RedemptionRequest[];
}> {
  const seasonKey = currentSeasonKey();
  const userSnap = await db.collection("users").doc(uid).get();
  const balanceRaw = userSnap.data()?.unitBalance;
  const balance =
    typeof balanceRaw === "number" && Number.isFinite(balanceRaw)
      ? Math.max(0, Math.floor(balanceRaw))
      : 0;

  const snap = await db.collection(COLLECTION).where("uid", "==", uid).get();
  const requests = snap.docs
    .map((d) => docToRequest(d.id, d.data() as Record<string, unknown>))
    .sort((a, b) => b.updatedAtMs - a.updatedAtMs);

  const reservedUnits = await sumReservedUnits(db, uid);
  const seasonUnitsUsed = await sumSeasonUnitsUsed(db, uid, seasonKey);

  return {
    balance,
    reservedUnits,
    seasonUnitsUsed,
    seasonCap: REDEMPTION_SEASON_CAP_UNITS,
    unitsLive: isRedemptionUnitsLive(),
    catalog: REDEMPTION_CATALOG,
    requests,
  };
}

export async function loadRedemptionById(
  db: Firestore,
  id: string
): Promise<RedemptionRequest | null> {
  const snap = await db.collection(COLLECTION).doc(id).get();
  if (!snap.exists) return null;
  return docToRequest(snap.id, snap.data() as Record<string, unknown>);
}

export async function loadAllRedemptionsAdmin(
  db: Firestore,
  opts?: { limit?: number; status?: RedemptionRequestStatus }
): Promise<RedemptionRequest[]> {
  const limit = Math.min(200, Math.max(1, opts?.limit ?? 100));
  const snap = opts?.status
    ? await db
        .collection(COLLECTION)
        .where("status", "==", opts.status)
        .limit(limit * 2)
        .get()
    : await db.collection(COLLECTION).limit(limit * 2).get();
  const rows = snap.docs.map((d) =>
    docToRequest(d.id, d.data() as Record<string, unknown>)
  );
  rows.sort((a, b) => b.updatedAtMs - a.updatedAtMs);
  return rows.slice(0, limit);
}

async function reserveUnitsInTx(
  tx: Transaction,
  db: Firestore,
  uid: string,
  amount: number,
  redemptionId: string
): Promise<void> {
  if (!isRedemptionUnitsLive() || amount <= 0) return;
  const userRef = db.collection("users").doc(uid);
  const userSnap = await tx.get(userRef);
  const balanceRaw = userSnap.data()?.unitBalance;
  const balance =
    typeof balanceRaw === "number" && Number.isFinite(balanceRaw)
      ? Math.floor(balanceRaw)
      : 0;
  const reservedField = userSnap.data()?.unitReserved;
  const alreadyReserved =
    typeof reservedField === "number" && Number.isFinite(reservedField)
      ? Math.floor(reservedField)
      : 0;
  const available = balance - alreadyReserved;
  if (available < amount) {
    throw new Error("insufficient_units");
  }
  tx.set(
    userRef,
    {
      unitReserved: FieldValue.increment(amount),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  // ロックは残高を減らさず unitReserved で拘束。消費時に balance 減算。
  void redemptionId;
}

async function releaseReservedInTx(
  tx: Transaction,
  db: Firestore,
  uid: string,
  amount: number
): Promise<void> {
  if (!isRedemptionUnitsLive() || amount <= 0) return;
  const userRef = db.collection("users").doc(uid);
  const userSnap = await tx.get(userRef);
  const reservedField = userSnap.data()?.unitReserved;
  const alreadyReserved =
    typeof reservedField === "number" && Number.isFinite(reservedField)
      ? Math.floor(reservedField)
      : 0;
  if (alreadyReserved < amount) {
    throw new Error("invalid_reserved");
  }
  tx.set(
    userRef,
    {
      unitReserved: FieldValue.increment(-amount),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
}

async function consumeUnitsInTx(
  tx: Transaction,
  db: Firestore,
  uid: string,
  amount: number,
  redemptionId: string
): Promise<void> {
  if (!isRedemptionUnitsLive() || amount <= 0) return;
  const userRef = db.collection("users").doc(uid);
  const ledgerRef = db
    .collection("unit_ledger")
    .doc(`redemption:${redemptionId}:consume`);
  const ledgerSnap = await tx.get(ledgerRef);
  if (ledgerSnap.exists) return;

  const userSnap = await tx.get(userRef);
  const balanceRaw = userSnap.data()?.unitBalance;
  const balance =
    typeof balanceRaw === "number" && Number.isFinite(balanceRaw)
      ? Math.floor(balanceRaw)
      : 0;
  if (balance < amount) {
    throw new Error("insufficient_units");
  }

  tx.set(
    userRef,
    {
      unitBalance: FieldValue.increment(-amount),
      unitReserved: FieldValue.increment(-amount),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );
  tx.set(ledgerRef, {
    uid,
    amount: -amount,
    reason: "redemption",
    idempotencyKey: `redemption:${redemptionId}:consume`,
    redemptionId,
    createdAt: FieldValue.serverTimestamp(),
  });
}

export async function createRedemptionRequest(
  db: Firestore,
  uid: string,
  input: RedemptionApplicationInput,
  opts?: { asDraft?: boolean }
): Promise<{ ok: true; request: RedemptionRequest } | { ok: false; error: string }> {
  const err = validateInput(input);
  if (err) return { ok: false, error: err };

  const kind = normalizeRedemptionProductKind(input.productKind)!;
  const catalog = redemptionCatalogItem(kind)!;
  const seasonKey = currentSeasonKey();
  const seasonUsed = await sumSeasonUnitsUsed(db, uid, seasonKey);
  if (seasonUsed + catalog.unitsRequired > REDEMPTION_SEASON_CAP_UNITS) {
    return { ok: false, error: "season_cap_exceeded" };
  }

  const asDraft = opts?.asDraft === true;
  const status: RedemptionRequestStatus = asDraft ? "draft" : "pending";
  const ts = nowMs();
  const ref = db.collection(COLLECTION).doc();
  const timeline: RedemptionTimelineEvent[] = [
    { status, atMs: ts, note: null },
  ];

  try {
    await db.runTransaction(async (tx) => {
      if (!asDraft && isRedemptionUnitsLive()) {
        await reserveUnitsInTx(tx, db, uid, catalog.unitsRequired, ref.id);
      }
      tx.set(ref, {
        uid,
        status,
        productKind: kind,
        unitsRequired: catalog.unitsRequired,
        productName: input.productName.trim(),
        productUrl: input.productUrl.trim(),
        storeName: input.storeName.trim(),
        size: input.size.trim(),
        color: (input.color ?? "").trim(),
        notes: (input.notes ?? "").trim() || null,
        imageUrl: (input.imageUrl ?? "").trim() || null,
        shippingName: input.shippingName.trim(),
        shippingPostalCode: (input.shippingPostalCode ?? "").trim(),
        shippingAddress: input.shippingAddress.trim(),
        shippingPhone: input.shippingPhone.trim(),
        shippingCountry: (input.shippingCountry ?? "JP").trim() || "JP",
        trackingNumber: null,
        trackingCarrier: null,
        orderReference: null,
        adminNote: null,
        unitsReserved: !asDraft && isRedemptionUnitsLive(),
        unitsConsumed: false,
        seasonKey,
        createdAtMs: ts,
        updatedAtMs: ts,
        timeline,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    });
  } catch (e) {
    if (e instanceof Error && e.message === "insufficient_units") {
      return { ok: false, error: "insufficient_units" };
    }
    throw e;
  }

  const created = await loadRedemptionById(db, ref.id);
  if (!created) return { ok: false, error: "create_failed" };
  return { ok: true, request: created };
}

export async function submitDraftRedemption(
  db: Firestore,
  uid: string,
  id: string
): Promise<{ ok: true; request: RedemptionRequest } | { ok: false; error: string }> {
  const ts = nowMs();
  try {
    await db.runTransaction(async (tx) => {
      const ref = db.collection(COLLECTION).doc(id);
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("not_found");
      const existing = docToRequest(id, snap.data() as Record<string, unknown>);
      if (!existing || existing.uid !== uid) throw new Error("not_found");
      if (existing.status !== "draft") throw new Error("not_draft");

      const seasonUsed = await sumSeasonUnitsUsed(db, uid, existing.seasonKey);
      if (seasonUsed + existing.unitsRequired > REDEMPTION_SEASON_CAP_UNITS) {
        throw new Error("season_cap_exceeded");
      }

      if (isRedemptionUnitsLive()) {
        await reserveUnitsInTx(tx, db, uid, existing.unitsRequired, id);
      }
      const timeline = [
        ...existing.timeline,
        { status: "pending" as const, atMs: ts, note: null },
      ];
      tx.set(
        ref,
        {
          status: "pending",
          unitsReserved: isRedemptionUnitsLive(),
          updatedAtMs: ts,
          timeline,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "submit_failed";
    if (
      msg === "insufficient_units" ||
      msg === "not_found" ||
      msg === "not_draft" ||
      msg === "season_cap_exceeded"
    ) {
      return { ok: false, error: msg };
    }
    throw e;
  }

  const updated = await loadRedemptionById(db, id);
  if (!updated) return { ok: false, error: "update_failed" };
  return { ok: true, request: updated };
}

export async function cancelRedemptionByUser(
  db: Firestore,
  uid: string,
  id: string
): Promise<{ ok: true; request: RedemptionRequest } | { ok: false; error: string }> {
  const ts = nowMs();
  try {
    await db.runTransaction(async (tx) => {
      const ref = db.collection(COLLECTION).doc(id);
      const snap = await tx.get(ref);
      if (!snap.exists) throw new Error("not_found");
      const existing = docToRequest(id, snap.data() as Record<string, unknown>);
      if (!existing || existing.uid !== uid) throw new Error("not_found");
      if (!canUserCancelRedemption(existing.status)) {
        throw new Error("not_cancellable");
      }
      if (existing.unitsReserved && !existing.unitsConsumed) {
        await releaseReservedInTx(tx, db, uid, existing.unitsRequired);
      }
      const timeline = [
        ...existing.timeline,
        { status: "cancelled" as const, atMs: ts, note: null },
      ];
      tx.set(
        ref,
        {
          status: "cancelled",
          unitsReserved: false,
          updatedAtMs: ts,
          timeline,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "cancel_failed";
    if (
      msg === "not_found" ||
      msg === "not_cancellable"
    ) {
      return { ok: false, error: msg };
    }
    throw e;
  }

  const updated = await loadRedemptionById(db, id);
  if (!updated) return { ok: false, error: "update_failed" };
  return { ok: true, request: updated };
}

export type AdminRedemptionPatch = {
  status?: RedemptionRequestStatus;
  trackingNumber?: string | null;
  trackingCarrier?: string | null;
  orderReference?: string | null;
  adminNote?: string | null;
};

export async function adminUpdateRedemption(
  db: Firestore,
  id: string,
  patch: AdminRedemptionPatch
): Promise<{ ok: true; request: RedemptionRequest } | { ok: false; error: string }> {
  const existing = await loadRedemptionById(db, id);
  if (!existing) return { ok: false, error: "not_found" };

  const nextStatus = patch.status ?? existing.status;
  if (patch.status && patch.status !== existing.status) {
    if (!canAdminTransition(existing.status, patch.status)) {
      return { ok: false, error: "invalid_transition" };
    }
  }

  const ts = nowMs();
  const willConsume =
    nextStatus === "ordered" &&
    !existing.unitsConsumed &&
    (existing.unitsReserved || isRedemptionUnitsLive());
  const willRelease =
    (nextStatus === "rejected" || nextStatus === "cancelled") &&
    existing.unitsReserved &&
    !existing.unitsConsumed;

  await db.runTransaction(async (tx) => {
    const ref = db.collection(COLLECTION).doc(id);
    if (willConsume) {
      await consumeUnitsInTx(
        tx,
        db,
        existing.uid,
        existing.unitsRequired,
        id
      );
    }
    if (willRelease) {
      await releaseReservedInTx(tx, db, existing.uid, existing.unitsRequired);
    }

    const timeline =
      nextStatus !== existing.status
        ? [
            ...existing.timeline,
            {
              status: nextStatus,
              atMs: ts,
              note: patch.adminNote ?? null,
            },
          ]
        : existing.timeline;

    tx.set(
      ref,
      {
        status: nextStatus,
        trackingNumber:
          patch.trackingNumber !== undefined
            ? patch.trackingNumber
            : existing.trackingNumber,
        trackingCarrier:
          patch.trackingCarrier !== undefined
            ? patch.trackingCarrier
            : existing.trackingCarrier,
        orderReference:
          patch.orderReference !== undefined
            ? patch.orderReference
            : existing.orderReference,
        adminNote:
          patch.adminNote !== undefined ? patch.adminNote : existing.adminNote,
        unitsReserved: willRelease
          ? false
          : willConsume
            ? false
            : existing.unitsReserved,
        unitsConsumed: willConsume ? true : existing.unitsConsumed,
        updatedAtMs: ts,
        timeline,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
  });

  const updated = await loadRedemptionById(db, id);
  if (!updated) return { ok: false, error: "update_failed" };
  return { ok: true, request: updated };
}
