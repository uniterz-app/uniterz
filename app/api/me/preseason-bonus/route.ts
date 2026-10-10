import { NextResponse } from "next/server";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { autoGrantPreseasonBonus } from "@/lib/units/preseasonBonusServer";

export const runtime = "nodejs";

/** アプリ起動時に呼ぶ。開幕前なら 50 Unit を 1 回だけ付与（付与済みは何もしない） */
export async function POST(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const granted = await autoGrantPreseasonBonus(getAdminDb(), uid);
    return NextResponse.json({ ok: true, granted });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === "unauthorized") {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }
    console.error("POST /api/me/preseason-bonus:", e);
    return NextResponse.json(
      { ok: false, error: "server error" },
      { status: 500 }
    );
  }
}
