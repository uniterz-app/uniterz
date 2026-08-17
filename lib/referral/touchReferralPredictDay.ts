/**
 * 招待進捗: 有効予想投稿日キーを referralRelations に積む（Admin）
 * docs/referral-design.md §22
 *
 * - 関係なし / 終端 status → 読み取りのみ（write なし）
 * - 同日既計上 → write なし
 * - under_review → write なし、needsSettle で再試行を促す
 */
import type { Firestore } from "firebase-admin/firestore";
import { FieldValue } from "firebase-admin/firestore";
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";

const PROGRESS_STATUSES = new Set(["registered", "in_progress"]);
const QUALIFY_DAYS = 7;

export type TouchReferralPredictDayResult =
  | {
      ok: true;
      skipped: true;
      reason: string;
      needsSettle: boolean;
    }
  | {
      ok: true;
      skipped: false;
      dayKey: string;
      activePredictDays: number;
      status: string;
      newlyAdded: boolean;
      needsSettle: boolean;
    }
  | { ok: false; error: string };

/**
 * 予想投稿成功後に呼ぶ。呼び出し側は referredByUid があるときだけ実行すること。
 */
export async function touchReferralPredictDay(
  db: Firestore,
  inviteeUid: string,
  now: Date = new Date()
): Promise<TouchReferralPredictDayResult> {
  const uid = String(inviteeUid ?? "").trim();
  if (!uid) return { ok: false, error: "uid required" };

  const dayKey = dateKeyJST(now);
  const ref = db.collection("referralRelations").doc(uid);

  try {
    const result = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      if (!snap.exists) {
        return {
          ok: true as const,
          skipped: true as const,
          reason: "no_relation",
          needsSettle: false,
        };
      }

      const data = snap.data() ?? {};
      const status = String(data.status ?? "");

      if (status === "under_review") {
        return {
          ok: true as const,
          skipped: true as const,
          reason: "under_review",
          needsSettle: true,
        };
      }

      if (!PROGRESS_STATUSES.has(status)) {
        return {
          ok: true as const,
          skipped: true as const,
          reason: `status_${status || "unknown"}`,
          needsSettle: false,
        };
      }

      const prevKeys: string[] = Array.isArray(data.activePredictDayKeys)
        ? data.activePredictDayKeys
            .map((k: unknown) => String(k ?? "").trim())
            .filter(Boolean)
        : [];

      const already = prevKeys.includes(dayKey);
      if (already) {
        return {
          ok: true as const,
          skipped: true as const,
          reason: "same_day",
          needsSettle: false,
        };
      }

      const nextKeys = [...prevKeys, dayKey].sort((a, b) =>
        a.localeCompare(b)
      );
      const activePredictDays = nextKeys.length;

      let nextStatus = status;
      if (activePredictDays >= QUALIFY_DAYS) {
        nextStatus = "under_review";
      } else if (status === "registered") {
        nextStatus = "in_progress";
      }

      const patch: Record<string, unknown> = {
        activePredictDayKeys: nextKeys,
        activePredictDays,
        status: nextStatus,
        updatedAt: FieldValue.serverTimestamp(),
      };
      if (nextStatus === "under_review") {
        patch.qualifiedAt = FieldValue.serverTimestamp();
      }

      tx.set(ref, patch, { merge: true });

      return {
        ok: true as const,
        skipped: false as const,
        dayKey,
        activePredictDays,
        status: nextStatus,
        newlyAdded: true,
        needsSettle: nextStatus === "under_review",
      };
    });

    return result;
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
