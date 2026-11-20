import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { verifyAdMobSsv } from "@/lib/ads/admobSsvVerify";
import { PRO_PICK_AD_REWARDS_COLLECTION } from "@/lib/pro/proPickGameAccess";
import { grantTradeBuzzUnlockFromAd } from "@/lib/ads/tradeBuzzAdUnlock";

/**
 * GET /api/ads/admob-ssv?...（AdMob のサーバー側検証コールバック）
 *
 * 署名が正しい報酬だけ、用途ごとに 1 回記録する。
 * - PRO PICK（custom_data の gameId）: `proPickAdRewards/{transaction_id}`。解除は `POST /api/nba/pro-pick-unlock` が消費
 * - トレード Buzz（custom_data の feature = trade_buzz）: 今日（日本時間）の解除 `tradeBuzzUnlocks/{uid}_{日付}`
 * 同じ transaction_id は 2 回目以降無視する（再送に強くする）。
 */
export async function GET(req: Request) {
  const rawQuery = req.url.split("?")[1] ?? "";
  const result = await verifyAdMobSsv(rawQuery);
  if (!result.ok) {
    return new NextResponse(`rejected: ${result.reason}`, { status: 403 });
  }

  // 広告ユニットは用途ごとに分ける。設定されていれば一致が必要
  //  - PRO PICK: ADMOB_REWARDED_AD_UNIT_IDS
  //  - トレード Buzz: ADMOB_TRADE_BUZZ_AD_UNIT_IDS（未設定なら PRO PICK の一覧で代用）
  const parseUnits = (raw: string | undefined) =>
    (raw ?? "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  const proPickUnits = parseUnits(process.env.ADMOB_REWARDED_AD_UNIT_IDS);
  const buzzUnits = parseUnits(process.env.ADMOB_TRADE_BUZZ_AD_UNIT_IDS);
  const unit = result.adUnit ?? "";
  if (result.purpose.kind === "trade_buzz") {
    const allowed = buzzUnits.length > 0 ? buzzUnits : proPickUnits;
    if (allowed.length > 0 && !allowed.includes(unit)) {
      return new NextResponse("rejected: ad_unit", { status: 403 });
    }
  } else {
    // PRO PICK の報酬で Buzz 専用ユニットは受け付けない（用途を混ぜない）
    if (buzzUnits.includes(unit)) {
      return new NextResponse("rejected: ad_unit", { status: 403 });
    }
    if (proPickUnits.length > 0 && !proPickUnits.includes(unit)) {
      return new NextResponse("rejected: ad_unit", { status: 403 });
    }
  }

  const db = getAdminDb();
  if (result.purpose.kind === "trade_buzz") {
    await grantTradeBuzzUnlockFromAd(db, {
      transactionId: result.transactionId,
      uid: result.userId,
    });
    return new NextResponse("ok", { status: 200 });
  }
  try {
    await db
      .collection(PRO_PICK_AD_REWARDS_COLLECTION)
      .doc(result.transactionId)
      .create({
        uid: result.userId,
        gameId: result.purpose.gameId,
        claimed: false,
        createdAt: FieldValue.serverTimestamp(),
      });
  } catch (e) {
    // 既に記録済み（ALREADY_EXISTS = 6）なら成功扱い
    const code = (e as { code?: unknown })?.code;
    if (code !== 6 && code !== "already-exists") throw e;
  }
  return new NextResponse("ok", { status: 200 });
}
