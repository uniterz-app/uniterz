export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";

async function requireUid(req: Request): Promise<string> {
  const authz =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

/**
 * 本人アカウント削除 — Auth ユーザー削除 + users/{uid} を墓標化（PII・経済・招待も消去）
 * Pro サブスクのストア解約はクライアント側で案内（ここでは行わない）
 */
export async function DELETE(req: Request) {
  try {
    const uid = await requireUid(req);
    const db = getAdminDb();
    const auth = getAdminAuth();
    const userRef = db.doc(`users/${uid}`);

    const snap = await userRef.get();
    if (!snap.exists) {
      return NextResponse.json({ error: "user not found" }, { status: 404 });
    }

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

    // secure/billing も消去
    try {
      await userRef.collection("secure").doc("billing").delete();
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
        handle: `deleted_${uid.slice(0, 8)}`,
        email: FieldValue.delete(),
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
    console.error("DELETE /api/me/account:", e);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
