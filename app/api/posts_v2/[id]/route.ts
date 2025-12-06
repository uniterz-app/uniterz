// app/api/posts_v2/[id]/route.ts

export const runtime = "nodejs";

import { NextResponse, NextRequest } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";
import { FieldValue } from "firebase-admin/firestore";

/* ========= 認証 ========= */
async function requireUid(req: NextRequest): Promise<string> {
  const authz = req.headers.get("authorization") || req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

/* ========= 投稿取得 + 編集可能判定 ========= */
async function getPostForEdit(uid: string, postId: string) {
  const ref = adminDb.collection("posts").doc(postId);
  const snap = await ref.get();

  if (!snap.exists) {
    const err: any = new Error("not found");
    err.status = 404;
    throw err;
  }

  const data = snap.data() || {};

  // ✅ v2 のみ許可
  if (data.schemaVersion !== 2) {
    const err: any = new Error("forbidden");
    err.status = 403;
    throw err;
  }

  // ✅ 投稿者本人のみ
  if (data.authorUid !== uid) {
    const err: any = new Error("forbidden");
    err.status = 403;
    throw err;
  }

  // ✅ 試合後ロック
  if (typeof data.startAtMillis === "number" && Date.now() >= data.startAtMillis) {
    const err: any = new Error("locked");
    err.status = 403;
    throw err;
  }

  return { ref, data };
}

/* ========= GET ========= */
export async function GET(req: NextRequest, { params }: any) {
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
      data.schemaVersion === 2 &&
      typeof data.startAtMillis === "number" &&
      Date.now() < data.startAtMillis;

    return NextResponse.json({
      ok: true,
      exists: true,
      mine,
      editable,
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "server error" },
      { status: e?.message === "unauthorized" ? 401 : 500 }
    );
  }
}

/* ========= PATCH（comment のみ編集） ========= */
export async function PATCH(req: NextRequest, { params }: any) {
  try {
    const uid = await requireUid(req);
    const { ref } = await getPostForEdit(uid, params.id);

    const body = await req.json().catch(() => null);
    if (!body || typeof body.comment !== "string") {
      return NextResponse.json({ ok: false, error: "comment required" }, { status: 400 });
    }

    const comment = body.comment.slice(0, 2000);

    await ref.update({
      comment,
      updatedAt: FieldValue.serverTimestamp(),
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "server error" },
      { status: e?.status ?? 500 }
    );
  }
}

/* ========= DELETE ========= */
export async function DELETE(req: NextRequest, { params }: any) {
  try {
    const uid = await requireUid(req);
    const { ref } = await getPostForEdit(uid, params.id);

    await ref.delete();
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message ?? "server error" },
      { status: e?.status ?? 500 }
    );
  }
}
