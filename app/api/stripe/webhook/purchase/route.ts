import { NextResponse } from "next/server";
import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

/* =====================
   Lazy Stripe
===================== */
function getStripe() {
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error("STRIPE_SECRET_KEY not set");
  }
  return new Stripe(process.env.STRIPE_SECRET_KEY);
}

/* =====================
   Lazy Firebase Admin
===================== */
function getDb() {
  if (!getApps().length) {
    if (
      !process.env.FIREBASE_PROJECT_ID ||
      !process.env.FIREBASE_CLIENT_EMAIL ||
      !process.env.FIREBASE_PRIVATE_KEY
    ) {
      throw new Error("Firebase env vars not set");
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

/* =====================
   Webhook: Purchase
===================== */
export async function POST(req: Request) {
  const stripe = getStripe(); // ★ ここで初期化
  const db = getDb();         // ★ ここで初期化

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

  if (event.type !== "customer.subscription.created") {
    return NextResponse.json({ received: true });
  }

  const sub = event.data.object as Stripe.Subscription;
  const customerId = sub.customer as string;

  const { resolveUidByStripeCustomerId, writeUserBillingSecure } = await import(
    "@/lib/billing/userBillingSecure"
  );
  const uid = await resolveUidByStripeCustomerId(db, customerId);
  if (!uid) return NextResponse.json({ received: true });

  const priceId = sub.items.data[0]?.price.id;
  const planType =
    priceId === process.env.STRIPE_PRICE_ANNUAL ? "annual" : "monthly";

  let periodEndSec = (sub as any).current_period_end;

  if (typeof periodEndSec !== "number") {
    const invoiceId = sub.latest_invoice as string | null;
    if (invoiceId) {
      const invoice = await stripe.invoices.retrieve(invoiceId);
      const end = invoice.lines.data[0]?.period?.end;
      if (typeof end === "number") periodEndSec = end;
    }
  }

  await writeUserBillingSecure(db, uid, {
    stripeCustomerId: customerId,
    stripeSubscriptionId: sub.id,
  });

  await db.collection("users").doc(uid).set(
    {
      plan: "pro",
      planType,
      nextPlanType: null,
      cancelAtPeriodEnd: false,
      ...(typeof periodEndSec === "number"
        ? { proUntil: Timestamp.fromMillis(periodEndSec * 1000) }
        : {}),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  try {
    const { ensureUserPlanStartDate } = await import(
      "@/lib/pro/ensureUserPlanStartDate"
    );
    await ensureUserPlanStartDate(db, uid);
  } catch (err) {
    console.warn("[stripe/purchase] planStartDate ensure failed:", err);
  }

  try {
    const { applyProSkinUnlocksAfterProUpgrade } = await import(
      "@/lib/profile/applyProSkinUnlocksAfterProUpgrade"
    );
    await applyProSkinUnlocksAfterProUpgrade(db, uid);
  } catch (err) {
    console.warn("[PURCHASE] pro-skin upgrade merge failed:", err);
  }

  return NextResponse.json({ received: true });
}
