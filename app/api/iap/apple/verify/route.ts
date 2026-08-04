import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  planForProductId,
  stubProUntilForPlan,
} from "@/lib/pro/iapProductIds";

/** Apple IAP レシート検証（本番では App Store Server API を使用） */
export async function POST(req: NextRequest) {
  try {
    const uid = await requireUidFromRequest(req);

    const body = await req.json();
    const { productId, transactionReceipt, transactionId } = body as {
      productId?: string;
      transactionReceipt?: string;
      transactionId?: string;
    };

    if (!productId || !transactionReceipt) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const planType = planForProductId(productId);
    if (!planType) {
      return NextResponse.json({ error: "unknown product" }, { status: 400 });
    }

    const now = new Date();
    const proUntil = stubProUntilForPlan(planType, now);

    const db = getAdminDb();
    await db.doc(`users/${uid}`).set(
      {
        plan: "pro",
        planType,
        proUntil,
        cancelAtPeriodEnd: false,
        billingProvider: "apple",
        appleOriginalTransactionId: transactionId ?? null,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    try {
      const { applyProSkinUnlocksAfterProUpgrade } = await import(
        "@/lib/profile/applyProSkinUnlocksAfterProUpgrade"
      );
      await applyProSkinUnlocksAfterProUpgrade(db, uid);
    } catch (err) {
      console.warn("[iap/apple/verify] pro-skin upgrade merge failed:", err);
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[iap/apple/verify]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
