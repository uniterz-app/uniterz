/**
 * users.plan / proUntil から Pro 判定（期限切れは free）。
 * Web `lib/pro/userPlanActive.ts` と同じ判定。Functions は lib を import できないため複製。
 */
export function userDataIsPro(
  userData: Record<string, unknown> | null | undefined
): boolean {
  if (!userData || userData.plan !== "pro") return false;
  const until = userData.proUntil as
    | { toMillis?: () => number; seconds?: number; _seconds?: number }
    | Date
    | number
    | string
    | null
    | undefined;
  if (until == null || until === "") return true;
  let ms = 0;
  if (until instanceof Date) {
    ms = until.getTime();
  } else if (typeof until === "number") {
    ms = until < 1e12 ? until * 1000 : until;
  } else if (typeof until === "string") {
    const parsed = Date.parse(until);
    ms = Number.isFinite(parsed) ? parsed : 0;
  } else if (typeof until.toMillis === "function") {
    ms = until.toMillis();
  } else if (typeof until.seconds === "number") {
    ms = until.seconds * 1000;
  } else if (typeof until._seconds === "number") {
    ms = until._seconds * 1000;
  }
  if (!Number.isFinite(ms) || ms <= 0) return true;
  return ms > Date.now();
}

export function userDataPlan(
  userData: Record<string, unknown> | null | undefined
): "free" | "pro" {
  return userDataIsPro(userData) ? "pro" : "free";
}
