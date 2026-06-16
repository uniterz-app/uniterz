import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";

/** Google Play 購入検証（本番では Play Developer API を使用） */
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

    const planType = productId.includes("annual") ? "annual" : "monthly";
    const now = new Date();
    const proUntil = new Date(now);
    if (planType === "annual") {
      proUntil.setFullYear(proUntil.getFullYear() + 1);
    } else {
      proUntil.setMonth(proUntil.getMonth() + 1);
    }

    const db = getAdminDb();
    await db.doc(`users/${uid}`).set(
      {
        plan: "pro",
        planType,
        proUntil,
        cancelAtPeriodEnd: false,
        billingProvider: "google",
        googlePurchaseToken: purchaseToken,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[iap/google/verify]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
