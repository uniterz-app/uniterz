import { NextResponse } from "next/server";
import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

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

/* =====================
   Webhook: Subscription Update
===================== */
export async function POST(req: Request) {
  const stripe = getStripe();
  const db = getDb();

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

  if (event.type !== "customer.subscription.updated") {
    return NextResponse.json({ received: true });
  }

  const sub = event.data.object as Stripe.Subscription;

  console.log("[SUBSCRIPTION] RAW:", {
    id: sub.id,
    cancel_at: sub.cancel_at,
    cancel_at_period_end: sub.cancel_at_period_end,
    cancellation_details: sub.cancellation_details,
    current_period_end: (sub as any).current_period_end,
  });

  /* =====================
     user 特定
  ===================== */
  const snap = await db
    .collection("users")
    .where("stripeSubscriptionId", "==", sub.id)
    .limit(1)
    .get();

  if (snap.empty) {
    console.error("[SUBSCRIPTION] user not found:", sub.id);
    return NextResponse.json({ received: true });
  }

  const userDoc = snap.docs[0];
  const uid = userDoc.id;
  const userData = userDoc.data();

  /* =====================
     解約予約判定（Stripe仕様準拠）
  ===================== */
  const hasCancelReservation =
    typeof sub.cancel_at === "number" ||
    sub.cancellation_details?.reason === "cancellation_requested";

  /* =====================
     proUntil 決定
  ===================== */
  let proUntilSec: number | null = null;

  if (typeof sub.cancel_at === "number") {
    proUntilSec = sub.cancel_at;
  } else if (typeof (sub as any).current_period_end === "number") {
    proUntilSec = (sub as any).current_period_end;
  }

  if (!proUntilSec) {
    console.error("[SUBSCRIPTION] no valid proUntil source");
    return NextResponse.json({ received: true });
  }

  /* =====================
     Firestore 更新
  ===================== */
  const updateData: any = {
    cancelAtPeriodEnd: hasCancelReservation,
    proUntil: Timestamp.fromMillis(proUntilSec * 1000),
    updatedAt: FieldValue.serverTimestamp(),
  };

  // 年額→月額の予約処理（既存ロジック完全維持）
  if (
    userData.planType === "annual" &&
    userData.nextPlanType === "monthly"
  ) {
    updateData.planType = "annual";
    updateData.nextPlanType = "monthly";
  }

  console.log("[SUBSCRIPTION] UPDATE:", updateData);

  await db.collection("users").doc(uid).set(updateData, { merge: true });

  console.log("[SUBSCRIPTION] User updated:", uid);

  return NextResponse.json({ received: true });
}
