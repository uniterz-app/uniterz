import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { PredictProBrief } from "@/lib/predict/predictProBrief";
import { sanitizeProBriefForDisplay } from "@/lib/predict/validateProBrief";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { assertProUser } from "@/lib/pro/assertProUser";

/**
 * GET /api/nba/matchup-insight?gameId=
 * Firestore games/{id}.proBrief — Pro 限定。
 */
export async function GET(req: Request) {
  try {
    let uid: string;
    try {
      uid = await requireUidFromRequest(req);
    } catch {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }

    const isPro = await assertProUser(uid);
    if (!isPro) {
      return NextResponse.json(
        { ok: false, error: "pro_required", locked: true },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const gameId = (searchParams.get("gameId") ?? "").trim();
    if (!gameId) {
      return NextResponse.json(
        { ok: false, error: "gameId_required" },
        { status: 400 }
      );
    }

    const snap = await getAdminDb().collection("games").doc(gameId).get();
    if (!snap.exists) {
      return NextResponse.json(
        { ok: false, error: "not_found" },
        { status: 404 }
      );
    }

    const data = snap.data() as Record<string, unknown>;
    if (String(data.league ?? "").toLowerCase() !== "nba") {
      return NextResponse.json(
        { ok: false, error: "not_nba" },
        { status: 404 }
      );
    }

    const brief = sanitizeProBriefForDisplay(
      data.proBrief as PredictProBrief | null | undefined
    );

    return NextResponse.json(
      {
        ok: true,
        gameId,
        brief,
        updatedAt:
          data.proBriefUpdatedAt &&
          typeof (data.proBriefUpdatedAt as { toDate?: () => Date }).toDate ===
            "function"
            ? (data.proBriefUpdatedAt as { toDate: () => Date })
                .toDate()
                .toISOString()
            : null,
      },
      {
        headers: {
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
