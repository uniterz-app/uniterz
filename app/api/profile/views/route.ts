import { FieldValue } from "firebase-admin/firestore";
import { NextResponse } from "next/server";

import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { dateKeyJST } from "@/lib/rankings/rankSnapshotDate";

export const runtime = "nodejs";

const VIEW_EVENTS_COLLECTION = "profile_views";
const VIEW_COUNTS_COLLECTION = "profile_view_counts";

function isValidUid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.trim().length <= 128 &&
    !value.includes("/")
  );
}

function unauthorizedResponse() {
  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

/** 任意ユーザーの累計プロフィール閲覧数（公開）。`?uid=` 省略時は本人。 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const rawUid = url.searchParams.get("uid")?.trim() ?? "";
    let uid = "";
    if (rawUid) {
      if (!isValidUid(rawUid)) {
        return NextResponse.json({ error: "invalid_uid" }, { status: 400 });
      }
      uid = rawUid;
    } else {
      uid = await requireUidFromRequest(req);
    }

    const snap = await getAdminDb()
      .collection(VIEW_COUNTS_COLLECTION)
      .doc(uid)
      .get();
    const raw = snap.data()?.count;
    const count =
      typeof raw === "number" && Number.isFinite(raw)
        ? Math.max(0, Math.floor(raw))
        : 0;
    return NextResponse.json({ count, uid });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return unauthorizedResponse();
    }
    console.error("[profile/views] GET failed", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}

/** ログイン済み閲覧者を対象に、JST暦日で1人1回だけ記録する。 */
export async function POST(req: Request) {
  try {
    const viewerUid = await requireUidFromRequest(req);
    const body = (await req.json().catch(() => null)) as {
      targetUid?: unknown;
    } | null;
    if (!isValidUid(body?.targetUid)) {
      return NextResponse.json({ error: "invalid_target_uid" }, { status: 400 });
    }

    const targetUid = body.targetUid.trim();
    if (viewerUid === targetUid) {
      return NextResponse.json({ counted: false });
    }

    const db = getAdminDb();
    const dateKey = dateKeyJST();
    const targetRef = db.collection("users").doc(targetUid);
    const eventRef = db
      .collection(VIEW_EVENTS_COLLECTION)
      .doc(`${targetUid}_${viewerUid}_${dateKey}`);
    const countRef = db.collection(VIEW_COUNTS_COLLECTION).doc(targetUid);

    const counted = await db.runTransaction(async (tx) => {
      const [targetSnap, eventSnap] = await Promise.all([
        tx.get(targetRef),
        tx.get(eventRef),
      ]);
      if (!targetSnap.exists) throw new Error("target_not_found");
      if (eventSnap.exists) return false;

      tx.create(eventRef, {
        targetUid,
        viewerUid,
        dateKey,
        createdAt: FieldValue.serverTimestamp(),
      });
      tx.set(
        countRef,
        {
          uid: targetUid,
          count: FieldValue.increment(1),
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return true;
    });

    return NextResponse.json({ counted });
  } catch (error) {
    if (error instanceof Error && error.message === "unauthorized") {
      return unauthorizedResponse();
    }
    if (error instanceof Error && error.message === "target_not_found") {
      return NextResponse.json({ error: "target_not_found" }, { status: 404 });
    }
    console.error("[profile/views] POST failed", error);
    return NextResponse.json({ error: "internal_error" }, { status: 500 });
  }
}
