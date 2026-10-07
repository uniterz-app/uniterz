export const runtime = "nodejs";

import { NextResponse } from "next/server";
import Stripe from "stripe";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

/** 削除は直前の再認証（パスワード再入力）を必須にする */
const RECENT_AUTH_MAX_AGE_SEC = 5 * 60;

async function requireRecentlyAuthenticatedUid(req: Request): Promise<string> {
  const authz =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");
  let decoded;
  try {
    decoded = await getAdminAuth().verifyIdToken(token, true);
  } catch {
    throw new Error("unauthorized");
  }
  const nowSec = Math.floor(Date.now() / 1000);
  if (
    typeof decoded.auth_time !== "number" ||
    nowSec - decoded.auth_time > RECENT_AUTH_MAX_AGE_SEC
  ) {
    throw new Error("recent login required");
  }
  return decoded.uid;
}

/**
 * 本人アカウント削除 — Auth ユーザー削除 + users/{uid} を墓標化（PII・経済・招待も消去）
 * Stripe サブスクはここで即時解約。App Store / Google Play はクライアント側で案内
 */
async function cancelStripeSubscription(subscriptionId: string): Promise<void> {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return;
  try {
    await new Stripe(key).subscriptions.cancel(subscriptionId);
  } catch (err) {
    console.warn("DELETE /api/me/account stripe cancel:", err);
  }
}

async function releaseUserSlugs(
  db: FirebaseFirestore.Firestore,
  uid: string,
  tombstoneHandle: string
): Promise<void> {
  try {
    const slugs = await db.collection("slugs").where("uid", "==", uid).limit(50).get();
    const batch = db.batch();
    for (const docSnap of slugs.docs) {
      if (docSnap.id !== tombstoneHandle) batch.delete(docSnap.ref);
    }
    batch.set(db.collection("slugs").doc(tombstoneHandle), { uid });
    await batch.commit();
  } catch (err) {
    console.warn("DELETE /api/me/account slugs:", err);
  }
}
export async function DELETE(req: Request) {
  try {
    const uid = await requireRecentlyAuthenticatedUid(req);
    const db = getAdminDb();
    const auth = getAdminAuth();
    const userRef = db.doc(`users/${uid}`);

    const snap = await userRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

    const tombstoneHandle = `deleted_${uid.slice(0, 8)}`;

    try {
      const billing = await userRef.collection("secure").doc("billing").get();
      const subId = billing.data()?.stripeSubscriptionId;
      if (typeof subId === "string" && subId) {
        await cancelStripeSubscription(subId);
      }
    } catch (billingErr) {
      console.warn("DELETE /api/me/account billing read:", billingErr);
    }

    await releaseUserSlugs(db, uid, tombstoneHandle);

    // pushTokens を可能な範囲で掃除
    try {
      const tokens = await userRef.collection("pushTokens").limit(200).get();
      if (!tokens.empty) {
        const batch = db.batch();
        for (const docSnap of tokens.docs) {
          batch.delete(docSnap.ref);
        }
        await batch.commit();
      }
    } catch {
      // サブコレ掃除失敗でも本体削除は続行
    }

    // secure/* / private/* も消去
    try {
      await Promise.all([
        userRef.collection("secure").doc("billing").delete(),
        userRef.collection("secure").doc("referral").delete(),
        userRef.collection("private").doc("notificationPrefs").delete(),
      ]);
    } catch {
      // ignore
    }

    await userRef.set(
      {
        deletedAt: FieldValue.serverTimestamp(),
        displayName: "Deleted User",
        bio: "",
        photoURL: "",
        avatarUrl: "",
        handle: tombstoneHandle,
        slug: FieldValue.delete(),
        username: FieldValue.delete(),
        email: FieldValue.delete(),
        notificationPrefs: FieldValue.delete(),
        unitBalance: 0,
        unitReserved: 0,
        inviteCode: FieldValue.delete(),
        referredByUid: FieldValue.delete(),
        referralInviteCode: FieldValue.delete(),
        referralBoundAt: FieldValue.delete(),
        referralStats: FieldValue.delete(),
        referralSettledAt: FieldValue.delete(),
        stripeCustomerId: FieldValue.delete(),
        stripeSubscriptionId: FieldValue.delete(),
        googlePurchaseToken: FieldValue.delete(),
        appleOriginalTransactionId: FieldValue.delete(),
        plan: "free",
        planType: FieldValue.delete(),
        proUntil: FieldValue.delete(),
        nextPlanType: FieldValue.delete(),
        cancelAtPeriodEnd: false,
        billingProvider: FieldValue.delete(),
        planProBgVariant: FieldValue.delete(),
        proSkinUnlockedIds: FieldValue.delete(),
        proSkinProgress: FieldValue.delete(),
        proSkinRankEarnedIds: FieldValue.delete(),
        proSkinUnlockNoticeIds: FieldValue.delete(),
        proSkinUnlockSeason: FieldValue.delete(),
        proSkinHeldIds: FieldValue.delete(),
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    try {
      const relRef = db.collection("referralRelations").doc(uid);
      const relSnap = await relRef.get();
      if (relSnap.exists) {
        const st = String(relSnap.data()?.status ?? "");
        if (st !== "completed") {
          await relRef.set(
            {
              status: "withdrawn",
              updatedAt: FieldValue.serverTimestamp(),
            },
            { merge: true }
          );
        }
      }
    } catch (relErr) {
      console.warn("DELETE /api/me/account referral withdraw:", relErr);
    }

    await auth.deleteUser(uid);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "server error";
    if (msg === "unauthorized") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    if (msg === "recent login required") {
      return NextResponse.json({ error: msg }, { status: 403 });
    }
    console.error("DELETE /api/me/account:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
