import { NextResponse } from "next/server";

export function jsonOk<T extends Record<string, unknown>>(data: T, status = 200) {
  return NextResponse.json({ ok: true, ...data }, { status });
}

export function jsonErr(error: string, status: number, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error, ...extra }, { status });
}

export function mapAuthError(e: unknown): NextResponse {
  const msg = e instanceof Error ? e.message : String(e);
  const status = (e as { status?: number })?.status;
  if (status === 401 || msg === "unauthorized") {
    return jsonErr("unauthorized", 401);
  }
  if (status === 403 || msg === "forbidden") {
    return jsonErr("forbidden", 403);
  }
  if (msg === "phase_locked" || (e as { code?: string })?.code === "phase_locked") {
    return jsonErr("phase_locked", 409);
  }
  console.error("[group-battles]", e);
  return jsonErr("internal", 500);
}
