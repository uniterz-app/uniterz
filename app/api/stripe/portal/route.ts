import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { readUserStripeCustomerId } from "@/lib/billing/userBillingSecure";

/* =====================
   Stripe（遅延初期化）
===================== */
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

/* =====================
   Portal API — Bearer 必須。uid はトークンのみ（body.uid は無視）
===================== */
export async function POST(req: Request) {
  try {
    let uid: string;
    try {
      uid = await requireUidFromRequest(req);
    } catch {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const stripe = getStripe();
    const body = (await req.json().catch(() => null)) as {
      returnUrl?: unknown;
    } | null;

    const db = getAdminDb();
    const userSnap = await db.collection("users").doc(uid).get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    const customerId = await readUserStripeCustomerId(db, uid, userSnap.data());

    if (!customerId) {
      return NextResponse.json(
        { error: "stripeCustomerId not found" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const redirectPath =
      typeof body?.returnUrl === "string" && body.returnUrl.startsWith("/")
        ? body.returnUrl
        : "/mobile/settings";

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${baseUrl}${redirectPath}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Portal API error:", err);
    return NextResponse.json(
      { error: "failed to create portal session" },
      { status: 500 }
    );
  }
}
