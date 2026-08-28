export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import type { PredictProBrief } from "@/lib/predict/predictProBrief";
import { sanitizeProBriefForDisplay } from "@/lib/predict/validateProBrief";

/**
 * GET /api/nba/matchup-insight?gameId=
 * Firestore games/{id}.proBrief を読むだけ（ライブ生成しない）。
 */
export async function GET(req: Request) {
  try {
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
          "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
        },
      }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
