/**
 * 累積ランキング Cloud Function の URL はサーバ専用。
 * NEXT_PUBLIC_ は使わない（ブラウザに計算口が載るため）。
 */

export function rankingFunctionUrl(): string | undefined {
  const url = process.env.CUMULATIVE_RANKING_FUNCTION_URL?.trim();
  return url || undefined;
}

export function rankingFunctionHeaders(): HeadersInit {
  const secret =
    process.env.CUMULATIVE_RANKING_INTERNAL_SECRET?.trim() ||
    process.env.INTERNAL_JOB_SECRET?.trim() ||
    "";
  if (!secret) return {};
  return { "x-internal-job-secret": secret };
}
