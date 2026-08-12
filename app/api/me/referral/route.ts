import { NextResponse } from "next/server";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { loadReferrerInviteSummary } from "@/lib/referral/loadReferrerInviteSummary";
import { settleReferralRelationWithRetries } from "@/lib/referral/settleReferralRelation";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

/** 自分の招待コード・進捗サマリー */
export async function GET(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const db = getAdminDb();
    // 自分が invitee で under_review の取り残しがあればセルフヒール
    // 1 人分のみ・画面表示用なので posts 再走査は省略（投稿/削除パスで再集計済み想定）
    await settleReferralRelationWithRetries(db, uid, 2, {
      recomputeDays: false,
    }).catch(() => null);
    const summary = await loadReferrerInviteSummary(db, uid);
    return NextResponse.json({ ok: true, ...summary });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return unauthorized();
    }
    console.error("GET /api/me/referral:", e);
    return NextResponse.json(
      { ok: false, error: "server error" },
      { status: 500 }
    );
  }
}
