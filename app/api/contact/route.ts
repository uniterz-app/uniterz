import { NextResponse } from "next/server";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { submitContactAdmin } from "@/lib/support/submitContactAdmin";

export const runtime = "nodejs";

/**
 * お問い合わせ — Bearer 必須・日次レート制限。
 * Native `/api/contact` と Web submitContact が利用。
 */
export async function POST(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const body = (await req.json().catch(() => null)) as {
      type?: unknown;
      message?: unknown;
      email?: unknown;
      screenshotUrl?: unknown;
      fromPath?: unknown;
      appVariant?: unknown;
      handle?: unknown;
      userDisplayName?: unknown;
    } | null;

    const result = await submitContactAdmin(getAdminDb(), uid, {
      type: typeof body?.type === "string" ? body.type : "",
      message: typeof body?.message === "string" ? body.message : "",
      email: typeof body?.email === "string" ? body.email : null,
      screenshotUrl:
        typeof body?.screenshotUrl === "string" ? body.screenshotUrl : null,
      fromPath: typeof body?.fromPath === "string" ? body.fromPath : null,
      appVariant:
        body?.appVariant === "web" || body?.appVariant === "mobile"
          ? body.appVariant
          : null,
      userDisplayName:
        typeof body?.userDisplayName === "string"
          ? body.userDisplayName
          : typeof body?.handle === "string"
            ? body.handle
            : null,
    });

    if (!result.ok) {
      const status = result.error === "rate_limited" ? 429 : 400;
      return NextResponse.json(
        { ok: false, error: result.error },
        { status }
      );
    }

    return NextResponse.json({ ok: true, id: result.id });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }
    console.error("POST /api/contact:", e);
    return NextResponse.json(
      { ok: false, error: "server error" },
      { status: 500 }
    );
  }
}
