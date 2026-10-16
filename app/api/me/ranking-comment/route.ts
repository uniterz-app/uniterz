import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { userDataIsPro } from "@/lib/pro/userPlanActive";
import {
  RANKING_COMMENT_FIELD,
  normalizeRankingComment,
  rankingCommentFromUserDoc,
  validateRankingComment,
} from "@/lib/rankings/rankingComment";
import { revalidateRankingCommentCaches } from "@/lib/rankings/rankingCommentCache";

export const runtime = "nodejs";

function errorResponse(error: string, status: number) {
  return NextResponse.json({ ok: false, error }, { status });
}

/** 自分の PRO LEAGUE ひとこと */
export async function GET(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const snap = await getAdminDb().collection("users").doc(uid).get();
    const data = snap.data();
    return NextResponse.json(
      {
        ok: true,
        comment: rankingCommentFromUserDoc(data) ?? "",
        isPro: userDataIsPro(data ?? {}),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return errorResponse("unauthorized", 401);
    }
    console.error("GET /api/me/ranking-comment:", e);
    return errorResponse("server error", 500);
  }
}

/** 保存（空文字で削除）。Pro のみ */
export async function POST(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const body = (await req.json().catch(() => ({}))) as { comment?: unknown };
    const comment = normalizeRankingComment(body.comment);
    const invalid = validateRankingComment(comment);
    if (invalid) return errorResponse(invalid, 400);

    const ref = getAdminDb().collection("users").doc(uid);
    const snap = await ref.get();
    if (!snap.exists || !userDataIsPro(snap.data() ?? {})) {
      return errorResponse("pro_required", 403);
    }

    await ref.set(
      {
        [RANKING_COMMENT_FIELD]: comment ? comment : FieldValue.delete(),
        rankingCommentUpdatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    revalidateRankingCommentCaches();

    return NextResponse.json({ ok: true, comment });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return errorResponse("unauthorized", 401);
    }
    console.error("POST /api/me/ranking-comment:", e);
    return errorResponse("server error", 500);
  }
}
