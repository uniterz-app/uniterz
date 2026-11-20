import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { verifyAdMobSsv } from "@/lib/ads/admobSsvVerify";

/** `lib/pro/proPickGameAccess.ts` の PRO_PICK_AD_REWARDS_COLLECTION と同じ値（そちらの変更が入るまで単独で動かすため） */
const PRO_PICK_AD_REWARDS_COLLECTION = "proPickAdRewards";

/**
 * GET /api/ads/admob-ssv?...（AdMob のサーバー側検証コールバック）
 *
 * 署名が正しい報酬だけ `proPickAdRewards/{transaction_id}` に 1 回記録する。
 * 解除は `POST /api/nba/pro-pick-unlock` がこの記録を消費して行う。
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
  console.log(`[admob-ssv] verified tx=${result.transactionId} gameId=${result.gameId} params=${paramNames(rawQuery)}`);

  // 本番では AdMob の広告ユニット ID を環境変数で絞る（設定されていれば一致が必要）
  const allowedUnits = (process.env.ADMOB_REWARDED_AD_UNIT_IDS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (allowedUnits.length > 0 && (!result.adUnit || !allowedUnits.includes(result.adUnit))) {
    console.warn(`[admob-ssv] ignored reason=ad_unit`);
    return new NextResponse("ignored: ad_unit", { status: 200 });
  }

  const db = getAdminDb();
  try {
    await db
      .collection(PRO_PICK_AD_REWARDS_COLLECTION)
      .doc(result.transactionId)
      .create({
        uid: result.userId,
        gameId: result.gameId,
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
