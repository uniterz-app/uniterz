/** Web `POST /api/moderation/report` 呼び出し */
import { auth } from "../../lib/firebase";
import { getUniterzApiBaseUrl } from "../games/submitPredictionApi";
import type {
  ModerationReportReason,
  ModerationTargetType,
} from "../../../../../lib/moderation/moderationTypes";

export type ReportResultNative = "ok" | "rate_limited" | "failed";

export async function submitModerationReportNative(input: {
  targetType: ModerationTargetType;
  targetId: string;
  reason: ModerationReportReason;
}): Promise<ReportResultNative> {
  const base = getUniterzApiBaseUrl();
  const user = auth.currentUser;
  if (!base || !user) return "failed";
  try {
    const token = await user.getIdToken();
    const res = await fetch(`${base}/api/moderation/report`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ ...input, appVariant: "mobile" }),
    });
    if (res.status === 429) return "rate_limited";
    // 未デプロイ環境では SPA の HTML が 200 で返るため、JSON の ok で判定する
    const json = (await res.json().catch(() => null)) as { ok?: unknown } | null;
    return res.ok && json?.ok === true ? "ok" : "failed";
  } catch {
    return "failed";
  }
}
