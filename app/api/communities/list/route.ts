import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { listUserGroups } from "@/lib/communities/listUserGroups";
import { pruneStaleGroupMirrors } from "@/lib/communities/limits";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    await pruneStaleGroupMirrors(adminDb, uid);
    const groups = await listUserGroups(adminDb, uid);
    return NextResponse.json({ ok: true, groups });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "unauthorized") {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }
    console.error("[communities/list]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
