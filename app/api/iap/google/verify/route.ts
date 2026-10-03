import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { planForProductId, stubProUntilForPlan } from "@/lib/pro/iapProductIds";
import { isIapVerifyStubAllowed } from "@/lib/pro/iapVerifyPolicy";
import { applyProEntitlement } from "@/lib/billing/applyProEntitlement";
import { isGooglePlayIapConfigured } from "@/lib/billing/google/googlePlayEnv";
import { GooglePlayApiError } from "@/lib/billing/google/googlePlayApi";
import { verifyAndApplyGooglePurchase } from "@/lib/billing/google/applyGooglePlayEntitlement";

async function applyGoogleVerifyStub(
  uid: string,
  productId: string,
  purchaseToken: string
) {
  const planType = planForProductId(productId);
  if (!planType) {
    return NextResponse.json({ error: "unknown product" }, { status: 400 });
  }
  const db = getAdminDb();
  await applyProEntitlement(db, uid, {
    planType,
    proUntil: stubProUntilForPlan(planType),
    cancelAtPeriodEnd: false,
    billing: {
      googlePurchaseToken: purchaseToken,
      billingProvider: "google",
      nextPlanType: null,
    },
  });
  return NextResponse.json({ ok: true, stub: true });
}

/** Google Play 購入検証 → Play Developer API で照会して users.plan = pro */
export async function POST(req: NextRequest) {
  try {
    const uid = await requireUidFromRequest(req);
    const body = await req.json();
    const { productId, purchaseToken } = body as {
      productId?: string;
      purchaseToken?: string;
    };

    if (!productId || !purchaseToken) {
      return NextResponse.json({ error: "invalid payload" }, { status: 400 });
    }

    if (isIapVerifyStubAllowed()) {
      return applyGoogleVerifyStub(uid, productId, purchaseToken);
    }

    if (!isGooglePlayIapConfigured()) {
      return NextResponse.json(
        {
          error: "iap_verify_not_configured",
          message:
            "Google Play verification is not configured. Set GOOGLE_PLAY_SERVICE_ACCOUNT_JSON.",
        },
        { status: 501 }
      );
    }

    const result = await verifyAndApplyGooglePurchase(
      getAdminDb(),
      uid,
      productId,
      purchaseToken
    );
    if (!result.ok) {
      const status =
        result.reason === "token_owned_by_other_user" || result.reason === "pending"
          ? 409
          : 400;
      return NextResponse.json({ error: result.reason }, { status });
    }

    return NextResponse.json({
      ok: true,
      planType: result.planType,
      proUntil: result.proUntil.toISOString(),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "internal";
    if (msg === "unauthorized") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    if (e instanceof GooglePlayApiError && (e.status === 400 || e.status === 404 || e.status === 410)) {
      return NextResponse.json({ error: "invalid_purchase_token" }, { status: 400 });
    }
    console.error("[iap/google/verify]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
