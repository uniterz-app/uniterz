/**
 * API の catch 用。4xx は意図したメッセージを返し、5xx は内部詳細を隠す。
 */
import { NextResponse } from "next/server";

export function isFirebaseAuthTokenError(e: unknown): boolean {
  const code = String((e as { code?: unknown } | null)?.code ?? "");
  return code.startsWith("auth/");
}

export function clientErrorStatus(e: unknown): number {
  const err = e as { status?: unknown; message?: unknown } | null;
  if (err?.message === "unauthorized" || isFirebaseAuthTokenError(e)) return 401;
  const status = Number(err?.status);
  return Number.isInteger(status) && status >= 400 && status < 600 ? status : 500;
}

export function clientErrorResponse(e: unknown, logLabel?: string): NextResponse {
  const status = clientErrorStatus(e);
  if (status >= 500) {
    console.error(logLabel ?? "[api]", e);
    return NextResponse.json({ ok: false, error: "server error" }, { status });
  }
  if (status === 401) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status });
  }
  const message = (e as { message?: unknown } | null)?.message;
  return NextResponse.json(
    { ok: false, error: typeof message === "string" ? message : "bad request" },
    { status }
  );
}
