import { NextResponse } from "next/server";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { loadUnitLedgerForUid } from "@/lib/units/unitLedgerServer";

export const runtime = "nodejs";

function unauthorized() {
  return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
}

/** 自分の Unit 獲得・使用履歴 */
export async function GET(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const url = new URL(req.url);
    const language = url.searchParams.get("lang") === "en" ? "en" : "ja";
    const limitRaw = Number(url.searchParams.get("limit") ?? "50");
    const limit = Number.isFinite(limitRaw) ? limitRaw : 50;
    const db = getAdminDb();
    const { balance, entries } = await loadUnitLedgerForUid(db, uid, {
      language,
      limit,
    });
    return NextResponse.json({ ok: true, balance, entries });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return unauthorized();
    }
    console.error("GET /api/me/unit-ledger:", e);
    return NextResponse.json(
      { ok: false, error: "server error" },
      { status: 500 }
    );
  }
}
