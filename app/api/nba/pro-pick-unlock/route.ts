import { NextResponse } from "next/server";
import { clientErrorResponse } from "@/lib/security/clientErrorResponse";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { assertProUser } from "@/lib/pro/assertProUser";
import {
  claimProPickAdReward,
  grantProPickAdUnlock,
  hasProPickGameUnlock,
  isProPickAdMockEnabled,
  tryGrantProPickFirstFree,
} from "@/lib/pro/proPickGameAccess";

/**
 * POST /api/nba/pro-pick-unlock   body: { gameId, adWatched? }
 *
 * 1. Pro → 解除不要（`via: "pro"`）
 * 2. 既に解除済み → そのまま
 * 3. 新ビルド以降の初回の無料解除が使えれば付与（`via: "first_free"`）
 * 4. ほかは `needsAd: true`。`adWatched: true` ならその試合を解除する
 *    （SSV が遅れても、SDK が見終わったあとの確認で開けるようにする）
 */
export async function POST(req: Request) {
  try {
    let uid: string;
    try {
      uid = await requireUidFromRequest(req);
    } catch {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      gameId?: unknown;
      adWatched?: unknown;
    };
    const gameId = typeof body.gameId === "string" ? body.gameId.trim() : "";
    if (!gameId) {
      return NextResponse.json({ ok: false, error: "gameId_required" }, { status: 400 });
    }
    const adWatched = body.adWatched === true;

    const db = getAdminDb();
    const [gameSnap] = await db.getAll(db.collection("games").doc(gameId), {
      fieldMask: ["league"],
    });
    if (!gameSnap.exists || String(gameSnap.get("league") ?? "").toLowerCase() !== "nba") {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }

    if (await assertProUser(uid)) {
      return NextResponse.json({ ok: true, unlocked: true, via: "pro" });
    }
    if (await hasProPickGameUnlock(db, uid, gameId)) {
      return NextResponse.json({ ok: true, unlocked: true, via: "already" });
    }

    if (await tryGrantProPickFirstFree(db, uid, gameId)) {
      return NextResponse.json({ ok: true, unlocked: true, via: "first_free" });
    }

    // SDK の広告（SSV で検証済み）の報酬があれば消費して解除
    if (await claimProPickAdReward(db, uid, gameId)) {
      return NextResponse.json({ ok: true, unlocked: true, via: "ad_sdk" });
    }

    if (!adWatched) {
      return NextResponse.json({ ok: true, unlocked: false, needsAd: true });
    }
    await grantProPickAdUnlock(
      db,
      uid,
      gameId,
      isProPickAdMockEnabled() ? "ad_mock" : "ad_watched"
    );
    return NextResponse.json({
      ok: true,
      unlocked: true,
      via: isProPickAdMockEnabled() ? "ad_mock" : "ad_watched",
    });
  } catch (e) {
    return clientErrorResponse(e, "POST /api/nba/pro-pick-unlock");
  }
}
