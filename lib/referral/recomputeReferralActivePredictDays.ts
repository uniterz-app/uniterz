/**
 * 招待進捗日キーを「現存 posts」から再集計（削除済みは含めない）。
 * docs/referral-design.md §5 — 削除・無効な予想は参加日数に含めない。
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";

const PROGRESS_STATUSES = new Set(["registered", "in_progress", "under_review"]);
const QUALIFY_DAYS = 7;
/** 招待期間中の posts 走査上限（ファーム対策・コスト上限） */
const MAX_POSTS_SCAN = 400;

export type RecomputeReferralActivePredictDaysResult =
  | { ok: true; skipped: true; reason: string }
  | {
      ok: true;
      skipped: false;
      activePredictDays: number;
      status: string;
      changed: boolean;
    }
  | { ok: false; error: string };

function createdAtToDate(v: unknown): Date | null {
  if (v == null) return null;
  if (v instanceof Date) return v;
  if (typeof v === "number") {
    const ms = v < 1e12 ? v * 1000 : v;
    return Number.isFinite(ms) ? new Date(ms) : null;
  }
  if (typeof v === "object") {
    const o = v as {
      toDate?: () => Date;
      toMillis?: () => number;
      seconds?: number;
    };
    if (typeof o.toDate === "function") return o.toDate();
    if (typeof o.toMillis === "function") return new Date(o.toMillis());
    if (typeof o.seconds === "number") return new Date(o.seconds * 1000);
  }
  return null;
}

/**
 * referralRelations の日キーを現存 posts から再構築する。
 * under_review でも実日数が 7 未満なら in_progress に戻す。
 */
export async function recomputeReferralActivePredictDays(
  db: Firestore,
  inviteeUidRaw: string
): Promise<RecomputeReferralActivePredictDaysResult> {
  const inviteeUid = String(inviteeUidRaw ?? "").trim();
  if (!inviteeUid) return { ok: false, error: "uid required" };

  const relRef = db.collection("referralRelations").doc(inviteeUid);
  const relSnap = await relRef.get();
  if (!relSnap.exists) {
    return { ok: true, skipped: true, reason: "no_relation" };
  }

  const data = relSnap.data() ?? {};
  const status = String(data.status ?? "");
  if (!PROGRESS_STATUSES.has(status)) {
    return { ok: true, skipped: true, reason: `status_${status || "unknown"}` };
  }

  const boundAt =
    createdAtToDate(data.createdAt) ??
    createdAtToDate(data.updatedAt) ??
    new Date(0);

  let snaps;
  try {
    snaps = await db
      .collection("posts")
      .where("authorUid", "==", inviteeUid)
      .where("createdAt", ">=", boundAt)
      .orderBy("createdAt", "asc")
      .limit(MAX_POSTS_SCAN)
      .get();
  } catch {
    // 複合 index 未整備時
    snaps = await db
      .collection("posts")
      .where("authorUid", "==", inviteeUid)
      .limit(MAX_POSTS_SCAN)
      .get();
  }

  const keySet = new Set<string>();
  for (const doc of snaps.docs) {
    const row = doc.data() ?? {};
    if (row.deletedAt != null) continue;
    // V1 招待は schema v2（posts_v2）のみ
    if (row.schemaVersion != null && Number(row.schemaVersion) !== 2) continue;
    const created = createdAtToDate(row.createdAt);
    if (!created) continue;
    if (created.getTime() < boundAt.getTime() - 1000) continue;
    keySet.add(dateKeyJST(created));
  }

  const nextKeys = [...keySet].sort((a, b) => a.localeCompare(b));
  const activePredictDays = nextKeys.length;

  let nextStatus = status;
  if (activePredictDays >= QUALIFY_DAYS) {
    nextStatus = "under_review";
  } else if (activePredictDays > 0) {
    nextStatus = "in_progress";
  } else {
    nextStatus = "registered";
  }

  const prevKeys: string[] = Array.isArray(data.activePredictDayKeys)
    ? data.activePredictDayKeys
        .map((k: unknown) => String(k ?? "").trim())
        .filter(Boolean)
    : [];
  const prevDays = Math.max(
    0,
    Math.floor(Number(data.activePredictDays ?? prevKeys.length))
  );
  const keysEqual =
    prevKeys.length === nextKeys.length &&
    prevKeys.every((k, i) => k === nextKeys[i]);
  const changed =
    !keysEqual || prevDays !== activePredictDays || status !== nextStatus;

  if (!changed) {
    return {
      ok: true,
      skipped: false,
      activePredictDays,
      status: nextStatus,
      changed: false,
    };
  }

  const patch: Record<string, unknown> = {
    activePredictDayKeys: nextKeys,
    activePredictDays,
    status: nextStatus,
    updatedAt: FieldValue.serverTimestamp(),
  };
  if (nextStatus === "under_review" && status !== "under_review") {
    patch.qualifiedAt = FieldValue.serverTimestamp();
  }
  if (nextStatus !== "under_review") {
    patch.qualifiedAt = FieldValue.delete();
  }

  await relRef.set(patch, { merge: true });

  return {
    ok: true,
    skipped: false,
    activePredictDays,
    status: nextStatus,
    changed: true,
  };
}
