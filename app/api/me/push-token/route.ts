export const runtime = "nodejs";

import { createHash } from "crypto";
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

function tokenDocId(expoPushToken: string): string {
  return createHash("sha256").update(expoPushToken).digest("hex").slice(0, 32);
}

function isValidExpoPushToken(value: string): boolean {
  return /^ExpoPushToken\[[^\]]+\]$/.test(value) || /^ExponentPushToken\[[^\]]+\]$/.test(value);
}

/** Native: Expo Push Token を登録・更新 */
export async function POST(req: Request) {
  try {
    const uid = await requireUid(req);
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const expoPushToken =
      typeof body.expoPushToken === "string" ? body.expoPushToken.trim() : "";
    if (!expoPushToken || !isValidExpoPushToken(expoPushToken)) {
      return NextResponse.json({ error: "invalid expoPushToken" }, { status: 400 });
    }

    const platform = body.platform === "ios" || body.platform === "android"
      ? body.platform
      : null;
    if (!platform) {
      return NextResponse.json({ error: "invalid platform" }, { status: 400 });
    }

    const deviceName =
      typeof body.deviceName === "string" ? body.deviceName.slice(0, 120) : null;

    const db = getAdminDb();
    const docId = tokenDocId(expoPushToken);
    const ref = db.doc(`users/${uid}/pushTokens/${docId}`);
    const existing = await ref.get();

    await ref.set(
      {
        expoPushToken,
        platform,
        ...(deviceName ? { deviceName } : {}),
        updatedAt: FieldValue.serverTimestamp(),
        ...(existing.exists ? {} : { createdAt: FieldValue.serverTimestamp() }),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, tokenId: docId });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[push-token POST]", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}

/** Native: ログアウト時に当該端末トークンを削除 */
export async function DELETE(req: Request) {
  try {
    const uid = await requireUid(req);
    const body = (await req.json().catch(() => null)) as Record<
      string,
      unknown
    > | null;
    const expoPushToken =
      typeof body?.expoPushToken === "string" ? body.expoPushToken.trim() : "";
    if (!expoPushToken || !isValidExpoPushToken(expoPushToken)) {
      return NextResponse.json({ error: "invalid expoPushToken" }, { status: 400 });
    }

    const db = getAdminDb();
    const docId = tokenDocId(expoPushToken);
    await db.doc(`users/${uid}/pushTokens/${docId}`).delete();

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message === "unauthorized") {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }
    console.error("[push-token DELETE]", err);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
