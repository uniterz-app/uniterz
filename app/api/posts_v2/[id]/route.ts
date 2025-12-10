// app/api/posts_v2/[id]/route.ts
export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

/* ========= 認証 ========= */
async function requireUid(req: NextRequest): Promise<string> {
  const authz =
    req.headers.get("authorization") ||
    req.headers.get("Authorization");

  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");

  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

/* ========= 投稿取得（削除チェック） ========= */
async function getPostForDelete(uid: string, postId: string) {
  if (!postId || typeof postId !== "string" || postId.startsWith("(")) {
    const err: any = new Error("invalid id");
    err.status = 400;
    throw err;
  }

  const ref = adminDb.collection("posts").doc(postId);
  const snap = await ref.get();

  if (!snap.exists) {
    const err: any = new Error("not found");
    err.status = 404;
    throw err;
  }

  const data = snap.data() || {};

  if (data.authorUid !== uid) {
    const err: any = new Error("forbidden");
    err.status = 403;
    throw err;
  }

  // 試合前のみ削除可
  if (
    typeof data.startAtMillis === "number" &&
    Date.now() >= data.startAtMillis
  ) {
    const err: any = new Error("locked");
    err.status = 403;
    throw err;
  }

  return ref;
}

/* ========= GET ========= */
export async function GET(req: NextRequest, ctx: any) {
  const params = await ctx.params; // ★ここ重要
  try {
    const uid = await requireUid(req);

    const ref = adminDb.collection("posts").doc(params.id);
    const snap = await ref.get();

    if (!snap.exists) {
      return NextResponse.json({ ok: true, exists: false });
    }

    const data = snap.data() || {};
    const mine = data.authorUid === uid;

    const editable =
      mine &&
      Number(data.schemaVersion) === 2 &&
      typeof data.startAtMillis === "number" &&
      Date.now() < data.startAtMillis;

    return NextResponse.json({ ok: true, exists: true, mine, editable });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message },
      { status: e?.status ?? 500 }
    );
  }
}

/* ========= PATCH ========= */
export async function PATCH(req: NextRequest, ctx: any) {
  const params = await ctx.params; // ★ここ重要
  try {
    const uid = await requireUid(req);

    const ref = adminDb.collection("posts").doc(params.id);
    const snap = await ref.get();

    if (!snap.exists)
      return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

    const data = snap.data()!;
    if (data.authorUid !== uid)
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

    if (Number(data.schemaVersion) !== 2)
      return NextResponse.json({ ok: false, error: "forbidden" }, { status: 403 });

    if (typeof data.startAtMillis === "number" && Date.now() >= data.startAtMillis)
      return NextResponse.json({ ok: false, error: "locked" }, { status: 403 });

    const body = await req.json().catch(() => null);
    if (!body || typeof body.comment !== "string")
      return NextResponse.json(
        { ok: false, error: "comment required" },
        { status: 400 }
      );

    await ref.update({
      comment: body.comment.slice(0, 2000),
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message },
      { status: e?.status ?? 500 }
    );
  }
}

/* ========= DELETE ========= */
export async function DELETE(req: NextRequest, ctx: any) {
  const params = await ctx.params; // ★ここで Promise → { id } に変換

  try {
    console.log("DELETE id =", params.id);

    const uid = await requireUid(req);

    const ref = await getPostForDelete(uid, params.id);

    await ref.delete();

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("DELETE ERROR:", e);
    return NextResponse.json(
      { ok: false, error: e?.message },
      { status: e?.status ?? 500 }
    );
  }
}
