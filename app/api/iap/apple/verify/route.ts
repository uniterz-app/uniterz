import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { planForProductId, stubProUntilForPlan } from "@/lib/pro/iapProductIds";
import { isIapVerifyStubAllowed } from "@/lib/pro/iapVerifyPolicy";
import { isAppleIapConfigured } from "@/lib/billing/apple/appleIapEnv";
import { fetchAppleTransactionById } from "@/lib/billing/apple/fetchAppleTransaction";
import { verifyAndDecodeAppleTransactionJws } from "@/lib/billing/apple/appleSignedDataVerifier";
import { applyAppleTransactionEntitlement } from "@/lib/billing/apple/applyAppleTransactionEntitlement";
import { applyProEntitlement } from "@/lib/billing/applyProEntitlement";

async function applyAppleVerifyStub(
  uid: string,
  productId: string,
  transactionId?: string | null
) {
  const planType = planForProductId(productId);
  if (!planType) {
    return NextResponse.json({ error: "unknown product" }, { status: 400 });
  }

  const proUntil = stubProUntilForPlan(planType);
  const db = getAdminDb();
  await applyProEntitlement(db, uid, {
    planType,
    proUntil,
    cancelAtPeriodEnd: false,
    billing: {
      appleOriginalTransactionId: transactionId ?? null,
      billingProvider: "apple",
      nextPlanType: null,
    },
  });

  return NextResponse.json({ ok: true, stub: true });
}

/** Apple IAP レシート検証 → users.plan = pro */
export async function POST(req: NextRequest) {
  try {
    const uid = await requireUidFromRequest(req);
    const body = await req.json();
    const {
      productId,
      transactionReceipt,
      transactionId,
      signedTransactionInfo,
    } = body as {
      productId?: string;
      transactionReceipt?: string;
      transactionId?: string;
      signedTransactionInfo?: string;
    };

    if (isIapVerifyStubAllowed()) {
      if (!productId || !transactionReceipt) {
        return NextResponse.json({ error: "invalid payload" }, { status: 400 });
      }
      return applyAppleVerifyStub(uid, productId, transactionId);
    }

    if (!isAppleIapConfigured()) {
      return NextResponse.json(
        {
          error: "iap_verify_not_configured",
          message:
            "Apple IAP verification is not configured. Set APPLE_IAP_* env vars.",
        },
        { status: 501 }
      );
    }

    const db = getAdminDb();
    let tx;
    if (typeof signedTransactionInfo === "string" && signedTransactionInfo.startsWith("eyJ")) {
      ({ tx } = await verifyAndDecodeAppleTransactionJws(signedTransactionInfo));
    } else if (typeof transactionId === "string" && transactionId.trim()) {
      ({ tx } = await fetchAppleTransactionById(transactionId.trim()));
    } else if (
      typeof transactionReceipt === "string" &&
      transactionReceipt.startsWith("eyJ")
    ) {
      ({ tx } = await verifyAndDecodeAppleTransactionJws(transactionReceipt));
    } else {
      return NextResponse.json(
        { error: "invalid payload", message: "transactionId or signed JWS required" },
        { status: 400 }
      );
    }

    if (productId && tx.productId && productId !== tx.productId) {
      return NextResponse.json({ error: "product_mismatch" }, { status: 400 });
    }

    const result = await applyAppleTransactionEntitlement(db, uid, tx);
    if (!result.ok) {
      const status =
        result.reason === "unknown_product" || result.reason === "bundle_mismatch"
          ? 400
          : result.reason === "revoked"
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
    console.error("[iap/apple/verify]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
