import { NextResponse } from "next/server";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { submitModerationReportAdmin } from "@/lib/moderation/submitModerationReportAdmin";

export const runtime = "nodejs";

/** ユーザー / グループ通報 — Bearer 必須。管理受信箱 `contacts` に入る */
export async function POST(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const body = (await req.json().catch(() => null)) as {
      targetType?: unknown;
      targetId?: unknown;
      reason?: unknown;
      appVariant?: unknown;
    } | null;

    const result = await submitModerationReportAdmin(getAdminDb(), uid, {
      targetType: body?.targetType,
      targetId: body?.targetId,
      reason: body?.reason,
      appVariant:
        body?.appVariant === "web" || body?.appVariant === "mobile"
          ? body.appVariant
          : null,
    });

    if (!result.ok) {
      const status =
        result.error === "rate_limited"
          ? 429
          : result.error === "not_found"
            ? 404
            : 400;
      return NextResponse.json({ ok: false, error: result.error }, { status });
    }
    return NextResponse.json({ ok: true, id: result.id });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }
    console.error("POST /api/moderation/report:", e);
    return NextResponse.json(
      { ok: false, error: "server error" },
      { status: 500 }
    );
  }
}
