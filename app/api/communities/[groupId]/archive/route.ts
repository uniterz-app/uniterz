import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { assertOwner } from "@/lib/communities/groupAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ groupId: string }> };

export async function POST(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { groupId } = await ctx.params;
    const groupSnap = await assertOwner(adminDb, groupId, uid);

    const batch = adminDb.batch();
    batch.update(groupSnap.ref, {
      archivedAt: FieldValue.serverTimestamp(),
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
    console.error("[communities/archive]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
