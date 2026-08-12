import { NextResponse } from "next/server";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { bindReferralOnSignupAdmin } from "@/lib/referral/bindReferralOnSignupAdmin";

export const runtime = "nodejs";

/**
 * サインアップ直後の招待コード紐づけ（Admin）。
 * 解決できないコードは永続化しない（打ち間違いロック防止）。
 */
export async function POST(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const body = (await req.json().catch(() => null)) as {
      inviteCode?: unknown;
    } | null;
    const inviteCode =
      typeof body?.inviteCode === "string" ? body.inviteCode : "";

    const result = await bindReferralOnSignupAdmin(
      getAdminDb(),
      uid,
      inviteCode
    );

    if (!result.ok) {
      const status =
        result.error === "already_bound"
          ? 409
          : result.error === "bind_window_expired" ||
              result.error === "referrer_rate_limited" ||
              result.error === "referrer_open_cap"
            ? 403
            : result.error === "mutual_invite" ||
                result.error === "referrer_unavailable" ||
                result.error === "invalid_code" ||
                result.error === "invite_code_not_found" ||
                result.error === "self_invite"
              ? 400
              : 400;
      return NextResponse.json(
        { ok: false, error: result.error, inviteCode: result.inviteCode },
        { status }
      );
    }

    return NextResponse.json(result);
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }
    console.error("POST /api/me/referral/bind:", e);
    return NextResponse.json(
      { ok: false, error: "server error" },
      { status: 500 }
    );
  }
}
