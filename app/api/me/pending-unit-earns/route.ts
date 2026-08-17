import { NextResponse } from "next/server";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import {
  claimPendingUnitEarns,
  loadUnclaimedPendingUnitEarns,
} from "@/lib/units/pendingUnitEarnServer";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

/** 未再生の Unit 獲得演出 */
export async function GET(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const db = getAdminDb();
    const entries = await loadUnclaimedPendingUnitEarns(db, uid);
    return NextResponse.json({ ok: true, entries });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return unauthorized();
    }
    console.error("GET /api/me/pending-unit-earns:", e);
    return NextResponse.json(
      { ok: false, error: "server error" },
      { status: 500 }
    );
  }
}

/** 獲得演出を既読にする */
export async function POST(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const body = (await req.json().catch(() => ({}))) as { ids?: unknown };
    const ids = Array.isArray(body.ids)
      ? body.ids.filter((id): id is string => typeof id === "string")
      : [];
    const db = getAdminDb();
    const claimed = await claimPendingUnitEarns(db, uid, ids);
    return NextResponse.json({ ok: true, claimed });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return unauthorized();
    }
    console.error("POST /api/me/pending-unit-earns:", e);
    return NextResponse.json(
      { ok: false, error: "server error" },
      { status: 500 }
    );
  }
}
