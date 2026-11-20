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
/** ログ用: パラメータの名前だけ（値は出さない） */
function paramNames(rawQuery: string): string {
  return rawQuery
    .split("&")
    .map((p) => p.split("=")[0])
    .filter(Boolean)
    .join(",");
}

export async function GET(req: Request) {
  const rawQuery = req.url.split("?")[1] ?? "";
  const result = await verifyAdMobSsv(rawQuery);
  // 署名が確認できないものは報酬にしない。ただし Google は 200 以外に再送するため、
  // 受け取り自体は 200 で返す（記録はしない）。
  if (!result.ok) {
    console.warn(`[admob-ssv] ignored reason=${result.reason} params=${paramNames(rawQuery)}`);
    return new NextResponse(`ignored: ${result.reason}`, { status: 200 });
  }
  console.log(
    `[admob-ssv] verified tx=${result.transactionId} purpose=${result.purpose.kind} params=${paramNames(rawQuery)}`
  );

  // 広告ユニットは用途ごとに分ける（設定されていれば一致が必要。違えば記録しない）
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
      console.warn(`[admob-ssv] ignored reason=ad_unit purpose=trade_buzz`);
      return new NextResponse("ignored: ad_unit", { status: 200 });
    }
  } else {
    // PRO PICK の報酬で Buzz 専用ユニットは受け付けない（用途を混ぜない）
    if (buzzUnits.includes(unit) || (proPickUnits.length > 0 && !proPickUnits.includes(unit))) {
      console.warn(`[admob-ssv] ignored reason=ad_unit purpose=pro_pick`);
      return new NextResponse("ignored: ad_unit", { status: 200 });
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
