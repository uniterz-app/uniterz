import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { assertMember } from "@/lib/communities/groupAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ groupId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { groupId } = await ctx.params;
    const groupSnap = await assertMember(adminDb, groupId, uid);
    const d = groupSnap.data()!;

    if (d.ownerUid === uid) {
      return NextResponse.json(
        { ok: false, error: "owner_must_transfer_or_archive" },
        { status: 400 }
      );
    }

    const batch = adminDb.batch();
    batch.delete(adminDb.doc(`groups/${groupId}/members/${uid}`));
    batch.update(groupSnap.ref, {
      memberCount: FieldValue.increment(-1),
      updatedAt: FieldValue.serverTimestamp(),
    });
    batch.delete(adminDb.doc(`users/${uid}/groups/${groupId}`));
    await batch.commit();

    return NextResponse.json({ ok: true });
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
    console.error("[communities/leave]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
