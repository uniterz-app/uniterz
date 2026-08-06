import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { planForProductId, stubProUntilForPlan } from "@/lib/pro/iapProductIds";
import { writeUserBillingSecure } from "@/lib/billing/userBillingSecure";
import { isIapVerifyStubAllowed } from "@/lib/pro/iapVerifyPolicy";

/** Google Play 購入検証（本番では Play Developer API を使用） */
export async function POST(req: NextRequest) {
  try {
    const uid = await requireUidFromRequest(req);

    if (!isIapVerifyStubAllowed()) {
      return NextResponse.json(
        {
          error: "iap_verify_not_configured",
          message:
            "Google Play purchase verification is not enabled. Set IAP_VERIFY_STUB_ALLOW=true only for non-production.",
        },
        { status: 501 }
      );
    }

    const body = await req.json();
    const { productId, purchaseToken } = body as {
      productId?: string;
      purchaseToken?: string;
    };

    if (!productId || !purchaseToken) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    const planType = planForProductId(productId);
    if (!planType) {
      return NextResponse.json({ error: "unknown product" }, { status: 400 });
    }

    const now = new Date();
    const proUntil = stubProUntilForPlan(planType, now);

    const db = getAdminDb();
    await writeUserBillingSecure(db, uid, {
      googlePurchaseToken: purchaseToken,
    });
    await db.doc(`users/${uid}`).set(
      {
        plan: "pro",
        planType,
        proUntil,
        cancelAtPeriodEnd: false,
        billingProvider: "google",
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
      console.warn("[iap/google/verify] pro-skin upgrade merge failed:", err);
    }

    return NextResponse.json({ ok: true, stub: true });
  } catch (e) {
    console.error("[iap/google/verify]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
