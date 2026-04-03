import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { assertOwner } from "@/lib/communities/groupAccess";
import {
  generateInviteCode,
  hashInviteCode,
} from "@/lib/communities/inviteCode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ groupId: string }> };

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

    for (let attempt = 0; attempt < 8; attempt++) {
      const invitePlain = generateInviteCode();
      const hash = hashInviteCode(invitePlain);
      const clash = await adminDb
        .collection("groups")
        .where("inviteCodeHash", "==", hash)
        .limit(1)
        .get();
      if (!clash.empty) continue;

      await groupSnap.ref.update({
        inviteCodeHash: hash,
        updatedAt: FieldValue.serverTimestamp(),
      });

      return NextResponse.json({ ok: true, inviteCode: invitePlain });
    }

    return NextResponse.json(
      { ok: false, error: "invite_collision" },
      { status: 500 }
    );
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
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
