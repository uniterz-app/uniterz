import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { planForProductId, stubProUntilForPlan } from "@/lib/pro/iapProductIds";
import { writeUserBillingSecure } from "@/lib/billing/userBillingSecure";
import { isIapVerifyStubAllowed } from "@/lib/pro/iapVerifyPolicy";

/** Apple IAP レシート検証（本番では App Store Server API を使用） */
export async function POST(req: NextRequest) {
  try {
    const uid = await requireUidFromRequest(req);

    if (!isIapVerifyStubAllowed()) {
      return NextResponse.json(
        {
          error: "iap_verify_not_configured",
          message:
            "Apple receipt verification is not enabled. Set IAP_VERIFY_STUB_ALLOW=true only for non-production.",
        },
        { status: 501 }
      );
    }

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
    await writeUserBillingSecure(db, uid, {
      appleOriginalTransactionId: transactionId ?? null,
      billingProvider: "apple",
      nextPlanType: null,
    });
    await db.doc(`users/${uid}`).set(
      {
        plan: "pro",
        planType,
        proUntil,
        cancelAtPeriodEnd: false,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    try {
      const { ensureUserPlanStartDate } = await import(
        "@/lib/pro/ensureUserPlanStartDate"
      );
      await ensureUserPlanStartDate(db, uid);
    } catch (err) {
      console.warn("[iap/apple/verify] planStartDate ensure failed:", err);
    }

    try {
      const { applyProSkinUnlocksAfterProUpgrade } = await import(
        "@/lib/profile/applyProSkinUnlocksAfterProUpgrade"
      );
      await applyProSkinUnlocksAfterProUpgrade(db, uid);
    } catch (err) {
      console.warn("[iap/apple/verify] pro-skin upgrade merge failed:", err);
    }

    return NextResponse.json({ ok: true, stub: true });
  } catch (e) {
    console.error("[iap/apple/verify]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
