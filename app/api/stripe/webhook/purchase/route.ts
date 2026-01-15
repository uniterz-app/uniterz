import { NextResponse } from "next/server";
import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

/* =====================
   Stripe
===================== */
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

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

const sleep = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

/* =====================
   Webhook: Purchase Only
===================== */
export async function POST(req: Request) {
  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  const body = await req.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  try {
    console.log("[PURCHASE] EVENT:", event.type);

    // 購入確定は subscription.created のみ
    if (event.type !== "customer.subscription.created") {
      return NextResponse.json({ received: true });
    }

    const sub = event.data.object as Stripe.Subscription;

    /* ===== customerId から user を逆引き ===== */
    const customerId = sub.customer as string;

    const snap = await db
      .collection("users")
      .where("stripeCustomerId", "==", customerId)
      .limit(1)
      .get();

    if (snap.empty) {
      console.error("[PURCHASE] user not found by customerId", customerId);
      return NextResponse.json({ received: true });
    }

    const uid = snap.docs[0].id;

    /* ===== planType 判定 ===== */
    const priceId = sub.items.data[0]?.price.id;
    const planType =
      priceId === process.env.STRIPE_PRICE_ANNUAL
        ? "annual"
        : "monthly";

    /* ===== period は未確定でも通す ===== */
    let periodEndSec = (sub as any).current_period_end;

    // ===== 初回購入用：invoice から期間を取る =====
if (typeof periodEndSec !== "number") {
  const invoiceId = sub.latest_invoice as string | null;

  if (invoiceId) {
    const invoice = await stripe.invoices.retrieve(invoiceId);

    const line = invoice.lines.data[0];
    const invoicePeriodEnd = line?.period?.end;

    if (typeof invoicePeriodEnd === "number") {
      periodEndSec = invoicePeriodEnd;
    }
  }
}

    console.log("SUB ID:", sub.id);
    console.log("CURRENT_PERIOD_END:", periodEndSec);

    /* ===== Firestore 更新 ===== */
await db.collection("users").doc(uid).set(
  {
    plan: "pro",
    planType,                // 今有効なプラン
    nextPlanType: null,      // ★ 必ずクリア
    cancelAtPeriodEnd: false,
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
    ...(typeof periodEndSec === "number"
      ? { proUntil: Timestamp.fromMillis(periodEndSec * 1000) }
      : {}),
    updatedAt: FieldValue.serverTimestamp(),
  },
  { merge: true }
);

    console.log("[PURCHASE] user updated:", uid);

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[PURCHASE] webhook error", err);
    return NextResponse.json({ received: true });
  }
}
