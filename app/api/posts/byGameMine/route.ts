// app/api/posts/byGameMine/route.ts
export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

/** 認証して uid を返す */
async function requireUid(req: Request): Promise<string> {
  const authz = req.headers.get("authorization") || req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

/**
 * GET /api/posts/byGameMine?gameId=xxx
 * 戻り値:
 *   { ok:true, exists:false, started:boolean }  … 自分の投稿なし
 *   { ok:true, exists:true, postId, started:boolean, editable:boolean } … 自分の投稿あり
 * 失敗:
 *   400 gameId required / 401 unauthorized / 500 server error
 */
export async function GET(req: Request) {
  try {
    const uid = await requireUid(req);
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get("gameId")?.trim();
    if (!gameId) {
      return NextResponse.json({ ok: false, error: "gameId required" }, { status: 400 });
    }

    // 自分 × その試合 で 1件だけ取得（※複合インデックス必要）
    const q = await adminDb
      .collection("posts")
      .where("authorUid", "==", uid)
      .where("gameId", "==", gameId)
      .limit(1)
      .get();

    // 試合開始判定用に games/{gameId} を読む
    const gameSnap = await adminDb.collection("games").doc(gameId).get();
    const gd = (gameSnap.exists ? gameSnap.data() : {}) as any;
    const startAtMillis: number | null =
      typeof gd?.startAtMillis === "number"
        ? gd.startAtMillis
        : typeof gd?.startAt?.toMillis === "function"
          ? gd.startAt.toMillis()
          : typeof gd?.startAtJst?.toMillis === "function"
            ? gd.startAtJst.toMillis()
            : null;

    const now = Date.now();
    const started = startAtMillis != null ? now >= startAtMillis : false;

    if (q.empty) {
      // 投稿なし：started だけ返す（クライアントで開始後なら /predictions に分岐）
      return NextResponse.json({ ok: true, exists: false, started }, { status: 200 });
    }

    // 投稿あり
    const doc = q.docs[0];
    const pd = doc.data() || {};
    const postStartAtMillis: number | null =
      typeof pd.startAtMillis === "number" ? pd.startAtMillis : startAtMillis;

    const editable =
      postStartAtMillis != null ? now < postStartAtMillis : !started;

    return NextResponse.json(
      {
        ok: true,
        exists: true,
        postId: doc.id,
        started,
        editable,
      },
      { status: 200 }
    );
  } catch (e: any) {
    const status = e?.message === "unauthorized" ? 401 : 500;
    return NextResponse.json({ ok: false, error: e?.message ?? "server error" }, { status });
  }
}
