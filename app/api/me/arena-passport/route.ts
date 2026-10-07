export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import {
  isArenaPassportId,
  parseVisitedArenaIds,
  toggleVisitedArenaId,
} from "@/lib/profile/arenaPassport";

async function requireUid(req: Request): Promise<string> {
  const authz =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

/** 本人の訪問済みアリーナを 1 件トグル（公開プロフィールフィールド） */
export async function POST(req: Request) {
  try {
    const uid = await requireUid(req);
    const body = (await req.json().catch(() => null)) as {
      arenaId?: unknown;
    } | null;
    const arenaId = body?.arenaId;
    if (!isArenaPassportId(arenaId)) {
      return NextResponse.json({ error: "invalid_arena" }, { status: 400 });
    }

    const db = getAdminDb();
    const ref = db.doc(`users/${uid}`);
    const visitedArenaIds = await db.runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const current = parseVisitedArenaIds(
        snap.exists ? (snap.data() as Record<string, unknown>) : null
      );
      const next = toggleVisitedArenaId(current, arenaId);
      tx.set(
        ref,
        { visitedArenaIds: next, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      return next;
    });

    return NextResponse.json({ ok: true, visitedArenaIds });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "server error";
    if (msg === "unauthorized") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error("POST /api/me/arena-passport:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
