import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { assertOwner } from "@/lib/communities/groupAccess";
import { rotateGroupInviteCode } from "@/lib/communities/ensureGroupInviteCode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ groupId: string }> };

/** オーナーが招待コードを再発行（紛失・漏洩時・平文未保存の救済） */
export async function POST(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { groupId } = await ctx.params;
    const groupSnap = await assertOwner(adminDb, groupId, uid);
    if (groupSnap.data()?.archivedAt) {
      return NextResponse.json(
        { ok: false, error: "group_archived" },
        { status: 410 }
      );
    }

    const inviteCode = await rotateGroupInviteCode(groupSnap);
    if (!inviteCode) {
      return NextResponse.json(
        { ok: false, error: "invite_collision" },
        { status: 503 }
      );
    }

    return NextResponse.json({ ok: true, inviteCode });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    const status = (e as { status?: number }).status;
    if (msg === "unauthorized") {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }
    if (status === 403)
      return NextResponse.json({ ok: false, error: msg }, { status: 403 });
    if (status === 404)
      return NextResponse.json({ ok: false, error: msg }, { status: 404 });
    console.error("[communities/rotate-invite]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
