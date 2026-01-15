import { NextResponse } from "next/server";
import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/* =====================
   Stripe（遅延初期化）
===================== */
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }

  // apiVersion を指定しない
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

/* =====================
   Firebase Admin（遅延初期化）
===================== */
function getDb() {
  if (!getApps().length) {
    if (
      !process.env.FIREBASE_PROJECT_ID ||
      !process.env.FIREBASE_CLIENT_EMAIL ||
      !process.env.FIREBASE_PRIVATE_KEY
    ) {
      throw new Error("Firebase Admin env vars are not set");
    }

    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
      }),
    });
  }

  return getFirestore();
}

export async function POST(req: Request) {
  try {
    const stripe = getStripe();
    const db = getDb();

    const body = await req.json();
    const plan = body?.plan;
    const uid = body?.uid;
    const platform = body?.platform === "web" ? "web" : "mobile";

    if (!uid) {
      return NextResponse.json({ error: "uid required" }, { status: 400 });
    }

    const priceId =
      plan === "annual"
        ? process.env.STRIPE_PRICE_ANNUAL
        : process.env.STRIPE_PRICE_MONTHLY;

    if (!priceId) {
      return NextResponse.json({ error: "Invalid price" }, { status: 400 });
    }

    const successPath =
      platform === "web" ? "/web/pro/success" : "/mobile/pro/success";
    const cancelPath =
      platform === "web" ? "/web/pro/subscribe" : "/mobile/pro/subscribe";

    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    const currentPlanType = userSnap.data()?.planType;

    if (currentPlanType === "annual") {
      return NextResponse.json(
        { error: "Annual users must use Stripe Portal" },
        { status: 400 }
      );
    }

    let customerId = userSnap.data()?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        metadata: { uid },
      });

      customerId = customer.id;

      await userRef.set(
        { stripeCustomerId: customerId },
        { merge: true }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      payment_method_types: ["card"],
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: { uid, plan },
      },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}${cancelPath}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("STRIPE CHECKOUT ERROR:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
