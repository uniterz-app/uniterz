// app/api/posts_v2/byGameMine/route.ts

export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebaseAdmin";

async function requireUid(req: Request): Promise<string> {
  const token = req.headers.get("authorization")?.replace("Bearer ", "");
  if (!token) throw new Error("unauthorized");
  const decoded = await adminAuth.verifyIdToken(token);
  return decoded.uid;
}

export async function GET(req: Request) {
  try {
    const uid = await requireUid(req);
    const { searchParams } = new URL(req.url);
    const gameId = searchParams.get("gameId")?.trim();

    if (!gameId) {
      return NextResponse.json({ ok: false, error: "gameId required" }, { status: 400 });
    }

    // 該当する v2 投稿を探す
    const q = await adminDb
      .collection("posts")
      .where("authorUid", "==", uid)
      .where("gameId", "==", gameId)
      .where("schemaVersion", "==", 2)
      .limit(1)
      .get();

    // 試合開始時刻取得
    const gameSnap = await adminDb.collection("games").doc(gameId).get();
    const g = gameSnap.exists ? gameSnap.data() : {};
    const startAtMillis: number | null =
      typeof g?.startAtMillis === "number"
        ? g.startAtMillis
        : typeof g?.startAt?.toMillis === "function"
        ? g.startAt.toMillis()
        : typeof g?.startAtJst?.toMillis === "function"
        ? g.startAtJst.toMillis()
        : null;

    const now = Date.now();
    const started = startAtMillis != null ? now >= startAtMillis : false;

    // 投稿なし
    if (q.empty) {
      return NextResponse.json({ ok: true, exists: false, started }, { status: 200 });
    }

    const doc = q.docs[0];
    const data = doc.data();

    const editable =
      typeof data.startAtMillis === "number"
        ? now < data.startAtMillis
        : !started;

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
    return NextResponse.json(
      { ok: false, error: e?.message ?? "server error" },
      { status: e?.message === "unauthorized" ? 401 : 500 }
    );
  }
}
