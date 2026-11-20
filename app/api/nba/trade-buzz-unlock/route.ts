import { NextResponse } from "next/server";
import { clientErrorResponse } from "@/lib/security/clientErrorResponse";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { assertProUser } from "@/lib/pro/assertProUser";
import { hasTradeBuzzUnlockToday, tradeBuzzDayKey } from "@/lib/ads/tradeBuzzAdUnlock";

export const dynamic = "force-dynamic";

/**
 * GET /api/nba/trade-buzz-unlock
 *
 * トレード Buzz を今見てよいか。
 * - Pro → 広告なし（`via: "pro"`）
 * - 今日（日本時間）に広告の解除があれば `via: "ad"`
 * - それ以外は `unlocked: false`（アプリは広告を出す）
 * 判定はサーバーだけ。クライアントの「見た」は信用しない。
 */
export async function GET(req: Request) {
  try {
    let uid: string;
    try {
      uid = await requireUidFromRequest(req);
    } catch {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    if (await assertProUser(uid)) {
      return NextResponse.json({ ok: true, unlocked: true, via: "pro", dayKey: tradeBuzzDayKey() });
    }
    const unlocked = await hasTradeBuzzUnlockToday(getAdminDb(), uid);
    return NextResponse.json({
      ok: true,
      unlocked,
      via: unlocked ? "ad" : null,
      dayKey: tradeBuzzDayKey(),
    });
  } catch (e) {
    return clientErrorResponse(e, "GET /api/nba/trade-buzz-unlock");
  }
}
