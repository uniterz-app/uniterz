import { NextResponse } from "next/server";
import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/* =====================
   Stripe
===================== */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

/* =====================
   Firebase Admin
===================== */
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, "\n"),
    }),
  });
}

const db = getFirestore();

export async function POST(req: Request) {
  try {
    // 環境変数チェック
    console.log("ENV CHECK:", {
      hasSecret: !!process.env.STRIPE_SECRET_KEY,
      monthly: process.env.STRIPE_PRICE_MONTHLY,
      annual: process.env.STRIPE_PRICE_ANNUAL,
      appUrl: process.env.NEXT_PUBLIC_APP_URL,
    });

    const body = await req.json();
    const plan = body?.plan;
    const uid = body?.uid;
    const platform = body?.platform === "web" ? "web" : "mobile";

    console.log("REQUEST:", { plan, uid, platform });

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

    /* =========================================================
       ★ 追加：customer を必ず固定する
    ========================================================= */
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();

    const currentPlanType = userSnap.data()?.planType;

// 年額ユーザーは Checkout を使わせない
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
  {
    stripeCustomerId: customerId,
  },
  { merge: true }
);
    }

    /* =========================================================
       Checkout Session 作成
    ========================================================= */
    const session = await stripe.checkout.sessions.create({
  mode: "subscription",
  customer: customerId,
  payment_method_types: ["card"],
  line_items: [
    {
      price: priceId,
      quantity: 1,
    },
  ],
  subscription_data: {
    metadata: {
      uid,   // ★ ここ
      plan,  // ★ ここ
    },
  },
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}${successPath}?session_id={CHECKOUT_SESSION_ID}`,
cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}${cancelPath}`,
});

    console.log("SESSION CREATED:", session.id);

    return NextResponse.json({ url: session.url });
  } catch (e) {
    console.error("STRIPE CHECKOUT ERROR:", e);
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}
