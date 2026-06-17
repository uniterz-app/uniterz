import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";

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
        billingProvider: "apple",
        appleOriginalTransactionId: transactionId ?? null,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[iap/apple/verify]", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
