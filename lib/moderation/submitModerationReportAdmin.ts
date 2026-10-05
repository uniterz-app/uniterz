/**
 * 通報（Admin）— 管理受信箱 `contacts`（type: "report"）へ書く。
 * 同じ通報者 × 同じ対象は 1 件にまとめ、日次上限を設ける。
 */
import { FieldValue, type Firestore } from "firebase-admin/firestore";
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";
import {
  isModerationReportReason,
  isModerationTargetType,
  type ModerationReportReason,
  type ModerationTargetType,
} from "@/lib/moderation/moderationTypes";

export const MODERATION_REPORT_DAILY_LIMIT = 20;
const TARGET_ID_MAX = 128;

const REASON_LABEL_JA: Record<ModerationReportReason, string> = {
  inappropriate: "不適切な名前・画像",
  spam: "スパム・なりすまし",
  harassment: "嫌がらせ・その他",
};

export type SubmitModerationReportInput = {
  targetType: unknown;
  targetId: unknown;
  reason: unknown;
  appVariant?: "web" | "mobile" | null;
};

export type SubmitModerationReportResult =
  | { ok: true; id: string }
  | {
      ok: false;
      error: "invalid_target" | "invalid_reason" | "not_found" | "rate_limited";
    };

async function loadTargetLabel(
  db: Firestore,
  targetType: ModerationTargetType,
  targetId: string
): Promise<string | null> {
  if (targetType === "user") {
    const snap = await db.collection("users").doc(targetId).get();
    if (!snap.exists) return null;
    const d = snap.data() ?? {};
    const handle = typeof d.handle === "string" ? d.handle : "";
    const name = typeof d.displayName === "string" ? d.displayName : "";
    return `${name || "(no name)"}${handle ? ` @${handle}` : ""}`;
  }
  const snap = await db.collection("groups").doc(targetId).get();
  if (!snap.exists) return null;
  const name = snap.data()?.name;
  return typeof name === "string" && name ? name : "(no name)";
}

export async function submitModerationReportAdmin(
  db: Firestore,
  reporterUid: string,
  input: SubmitModerationReportInput
): Promise<SubmitModerationReportResult> {
  if (!isModerationTargetType(input.targetType)) {
    return { ok: false, error: "invalid_target" };
  }
  const targetType = input.targetType;
  const targetId =
    typeof input.targetId === "string" ? input.targetId.trim() : "";
  if (
    !targetId ||
    targetId.length > TARGET_ID_MAX ||
    targetId.includes("/") ||
    (targetType === "user" && targetId === reporterUid)
  ) {
    return { ok: false, error: "invalid_target" };
  }
  if (!isModerationReportReason(input.reason)) {
    return { ok: false, error: "invalid_reason" };
  }
  const reason = input.reason;

  const targetLabel = await loadTargetLabel(db, targetType, targetId);
  if (targetLabel == null) return { ok: false, error: "not_found" };

  const reporterSnap = await db.collection("users").doc(reporterUid).get();
  const reporter = reporterSnap.data() ?? {};
  const reporterName =
    (typeof reporter.displayName === "string" && reporter.displayName) ||
    (typeof reporter.handle === "string" && reporter.handle) ||
    null;

  const docId = `report_${reporterUid}_${targetType}_${targetId}`;
  const docRef = db.collection("contacts").doc(docId);
  const dayKey = dateKeyJST(new Date());
  const rateRef = db
    .collection("users")
    .doc(reporterUid)
    .collection("secure")
    .doc(`moderationReportRate_${dayKey}`);

  const typeLabel = targetType === "user" ? "ユーザー" : "グループ";
  const message = [
    `[通報] ${typeLabel}: ${targetLabel}`,
    `ID: ${targetId}`,
    `理由: ${REASON_LABEL_JA[reason]}`,
  ].join("\n");

  try {
    await db.runTransaction(async (tx) => {
      const [rateSnap, existing] = await Promise.all([
        tx.get(rateRef),
        tx.get(docRef),
      ]);
      const count = Math.max(
        0,
        Math.floor(Number(rateSnap.data()?.count ?? 0))
      );
      if (!existing.exists && count >= MODERATION_REPORT_DAILY_LIMIT) {
        throw new Error("rate_limited");
      }
      if (!existing.exists) {
        tx.set(
          rateRef,
          { count: count + 1, dayKey, updatedAt: FieldValue.serverTimestamp() },
          { merge: true }
        );
      }
      tx.set(
        docRef,
        {
          type: "report",
          message,
          email: null,
          screenshotUrl: null,
          fromPath: null,
          appVariant: input.appVariant ?? null,
          userUid: reporterUid,
          userDisplayName: reporterName,
          reportTargetType: targetType,
          reportTargetId: targetId,
          reportReason: reason,
          status: "unread",
          createdAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "rate_limited") {
      return { ok: false, error: "rate_limited" };
    }
    throw e;
  }

  return { ok: true, id: docId };
}
