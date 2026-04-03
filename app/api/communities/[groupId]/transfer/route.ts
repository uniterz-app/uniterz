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
    if (groupSnap.data()?.archivedAt) {
      return NextResponse.json(
        { ok: false, error: "group_archived" },
        { status: 410 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const targetUid = String(body?.targetUid ?? "").trim();
    if (!targetUid || targetUid === uid) {
      return NextResponse.json(
        { ok: false, error: "invalid_target" },
        { status: 400 }
      );
    }

    const targetMem = await adminDb
      .doc(`groups/${groupId}/members/${targetUid}`)
      .get();
    if (!targetMem.exists) {
      return NextResponse.json(
        { ok: false, error: "target_not_member" },
        { status: 400 }
      );
    }

    const gname = String(groupSnap.data()?.name ?? "");
    const batch = adminDb.batch();

    batch.update(groupSnap.ref, {
      ownerUid: targetUid,
      updatedAt: FieldValue.serverTimestamp(),
    });

    batch.update(adminDb.doc(`groups/${groupId}/members/${uid}`), {
      role: "member",
    });
    batch.update(adminDb.doc(`groups/${groupId}/members/${targetUid}`), {
      role: "owner",
    });

    batch.set(
      adminDb.doc(`users/${uid}/groups/${groupId}`),
      {
        groupId,
        groupName: gname,
        role: "member",
        joinedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    batch.set(
      adminDb.doc(`users/${targetUid}/groups/${groupId}`),
      {
        groupId,
        groupName: gname,
        role: "owner",
        joinedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

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
    console.error("[communities/transfer]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
