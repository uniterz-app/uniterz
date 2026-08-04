import { NextResponse } from "next/server";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { loadRedemptionById } from "@/lib/redemption/redemptionServer";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

type Ctx = { params: Promise<{ id: string }> };

/** 自分の申請 1 件（進捗） */
export async function GET(_req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(_req);
    const { id } = await ctx.params;
    const db = getAdminDb();
    const request = await loadRedemptionById(db, id);
    if (!request || request.uid !== uid) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    return NextResponse.json({ ok: true, request });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return unauthorized();
    }
    console.error("GET /api/me/redemptions/[id]:", e);
    return NextResponse.json({ ok: false, error: "server error" }, { status: 500 });
  }
}
