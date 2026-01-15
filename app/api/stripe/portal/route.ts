import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb } from "@/lib/firebaseAdmin";

/* =====================
   Stripe
===================== */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

/* =====================
   Portal API
===================== */
export async function POST(req: Request) {
  try {
    const { uid, returnUrl } = await req.json();

    if (!uid) {
      return NextResponse.json({ error: "uid required" }, { status: 400 });
    }

    const userSnap = await adminDb.collection("users").doc(uid).get();

    if (!userSnap.exists) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    const customerId = userSnap.data()?.stripeCustomerId;

    if (!customerId) {
      return NextResponse.json(
        { error: "stripeCustomerId not found" },
        { status: 400 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL!;
    const redirectPath =
      typeof returnUrl === "string" && returnUrl.startsWith("/")
        ? returnUrl
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
