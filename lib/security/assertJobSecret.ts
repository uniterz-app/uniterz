/**
 * 運用ジョブ用共有シークレット検証（Next API）
 *
 * 既定は INTERNAL_JOB_SECRET のみ。GROUP_BATTLE_ADMIN_SECRET はグループバトル系ルートだけが
 * `allowGroupBattleSecret` で受け付ける（NBA ingest / OpenAI 等は開けない）。
 */
import { timingSafeEqualString } from "@/lib/security/timingSafeEqualString";

const HEADER_CANDIDATES = [
  "x-internal-job-secret",
  "x-group-battle-admin-secret",
] as const;

export type JobSecretOptions = {
  allowGroupBattleSecret?: boolean;
};

function readExpectedSecrets(opts: JobSecretOptions): string[] {
  const out: string[] = [];
  const keys = opts.allowGroupBattleSecret
    ? (["INTERNAL_JOB_SECRET", "GROUP_BATTLE_ADMIN_SECRET"] as const)
    : (["INTERNAL_JOB_SECRET"] as const);
  for (const key of keys) {
    const v = process.env[key]?.trim();
    if (v) out.push(v);
  }
  return out;
}

function readProvidedSecret(req: Request): string | null {
  for (const h of HEADER_CANDIDATES) {
    const v = req.headers.get(h)?.trim();
    if (v) return v;
  }
  const authz =
    req.headers.get("authorization") || req.headers.get("Authorization");
  if (authz?.toLowerCase().startsWith("bearer ")) {
    const token = authz.slice(7).trim();
    if (token) return token;
  }
  return null;
}

/** 一致すれば true。シークレット未設定や不一致は false */
export function checkJobSecret(
  req: Request,
  opts: JobSecretOptions = {}
): boolean {
  const expected = readExpectedSecrets(opts);
  if (expected.length === 0) return false;
  const provided = readProvidedSecret(req);
  if (!provided) return false;
  return expected.some((s) => timingSafeEqualString(provided, s));
}

export function assertJobSecretOrThrow(
  req: Request,
  opts: JobSecretOptions = {}
): void {
  if (!checkJobSecret(req, opts)) {
    const err = new Error("forbidden");
    (err as Error & { status?: number }).status = 403;
    throw err;
  }
}
