import { NextResponse } from "next/server";
import Stripe from "stripe";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue, Timestamp } from "firebase-admin/firestore";

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

/* =====================
   Webhook: Cancel Plan
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

  console.log("[CANCEL PLAN] EVENT:", event.type);

  if (event.type !== "customer.subscription.updated") {
    return NextResponse.json({ received: true });
  }

  const sub = event.data.object as Stripe.Subscription;

  console.log("[CANCEL PLAN] Subscription:", {
    id: sub.id,
    cancel_at: sub.cancel_at,
    cancel_at_period_end: sub.cancel_at_period_end,
    cancellation_details: sub.cancellation_details,
    current_period_end: (sub as any).current_period_end,
    metadata: sub.metadata,
  });

  const uid = sub.metadata?.uid;
  if (!uid) {
    console.error("[CANCEL PLAN] uid missing");
    return NextResponse.json({ received: true });
  }

  /**
   * 解約予約判定
   * - Billing Portal 経由の解約では cancel_at_period_end は false のまま
   * - cancel_at が入っていれば「解約予約あり」とみなす
   */
  const hasCancelReservation =
    typeof sub.cancel_at === "number" ||
    sub.cancel_at_period_end === true ||
    sub.cancellation_details?.reason === "cancellation_requested";

  console.log("[CANCEL PLAN] hasCancelReservation:", hasCancelReservation);

  if (!hasCancelReservation) {
    console.log("[CANCEL PLAN] No cancel reservation → skip");
    return NextResponse.json({ received: true });
  }

  const periodEndSec = (sub as any).current_period_end;
  if (typeof periodEndSec !== "number") {
    console.error("[CANCEL PLAN] current_period_end missing");
    return NextResponse.json({ received: true });
  }

  console.log("[CANCEL PLAN] periodEndSec:", periodEndSec);

  // Firestore 更新（解約予約）
  await db.collection("users").doc(uid).set(
    {
      cancelAtPeriodEnd: true,
      proUntil: Timestamp.fromMillis(periodEndSec * 1000),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  console.log("[CANCEL PLAN] Firestore updated:", {
    uid,
    cancelAtPeriodEnd: true,
    proUntil: periodEndSec,
  });

  return NextResponse.json({ received: true });
}
