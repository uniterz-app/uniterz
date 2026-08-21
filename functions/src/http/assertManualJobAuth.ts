/**
 * 手動 HTTP ジョブの認証（共有シークレット）
 * ヘッダ: x-internal-job-secret または x-group-battle-admin-secret
 * env: INTERNAL_JOB_SECRET（推奨）または GROUP_BATTLE_ADMIN_SECRET
 */
import { timingSafeEqual } from "crypto";
import type { Request } from "firebase-functions/v2/https";

function timingSafeEqualString(
  provided: string | null | undefined,
  expected: string | null | undefined
): boolean {
  if (typeof provided !== "string" || typeof expected !== "string") {
    return false;
  }
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) {
    const len = Math.max(a.length, b.length, 1);
    const padA = Buffer.alloc(len);
    const padB = Buffer.alloc(len);
    a.copy(padA);
    b.copy(padB);
    timingSafeEqual(padA, padB);
    return false;
  }
  return timingSafeEqual(a, b);
}

function expectedSecrets(): string[] {
  const out: string[] = [];
  for (const key of ["INTERNAL_JOB_SECRET", "GROUP_BATTLE_ADMIN_SECRET"]) {
    const v = process.env[key]?.trim();
    if (v) out.push(v);
  }
  return out;
}

function providedSecret(req: Request): string | null {
  const h1 = String(req.get("x-internal-job-secret") ?? "").trim();
  if (h1) return h1;
  const h2 = String(req.get("x-group-battle-admin-secret") ?? "").trim();
  if (h2) return h2;
  const authz = String(req.get("authorization") ?? "").trim();
  if (authz.toLowerCase().startsWith("bearer ")) {
    const t = authz.slice(7).trim();
    if (t) return t;
  }
  return null;
}

export function assertManualJobAuth(req: Request): void {
  const expected = expectedSecrets();
  if (expected.length === 0) {
    const err = new Error("job_secret_not_configured");
    (err as Error & { status?: number }).status = 503;
    throw err;
  }
  const provided = providedSecret(req);
  if (!provided || !expected.some((s) => timingSafeEqualString(provided, s))) {
    const err = new Error("forbidden");
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
}

/**
 * 累積ランキング計算口。シークレットが Functions に載っているときは必須。
 * 未設定の間は既存の公開 GET を維持（Next 側は URL を NEXT_PUBLIC にしない）。
 */
export function rankingComputeAllowed(req: Request): boolean {
  const extra = process.env.CUMULATIVE_RANKING_INTERNAL_SECRET?.trim();
  const expected = expectedSecrets();
  if (extra) expected.push(extra);
  if (expected.length === 0) return true;
  const provided = providedSecret(req);
  if (!provided) return false;
  return expected.some((s) => timingSafeEqualString(provided, s));
}
