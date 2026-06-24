import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { assertOwner } from "@/lib/communities/groupAccess";
import { DEFAULT_HEADER_IMAGE_POSITION_Y } from "@/lib/communities/headerImagePosition";
import {
  sanitizeGroupDescription,
  sanitizeHeaderImageUrl,
  sanitizeHeaderImagePositionY,
} from "@/lib/communities/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ groupId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { groupId } = await ctx.params;
    const groupSnap = await assertOwner(adminDb, groupId, uid);
    const data = groupSnap.data();

    if (data?.archivedAt) {
      return NextResponse.json(
        { ok: false, error: "group_archived" },
        { status: 410 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const name =
      body?.name !== undefined
        ? String(body.name).trim()
        : String(data?.name ?? "").trim();
    if (name.length < 1 || name.length > 60) {
      return NextResponse.json(
        { ok: false, error: "invalid_name" },
        { status: 400 }
      );
    }

    const description =
      body?.description !== undefined
        ? sanitizeGroupDescription(body.description)
        : (data?.description as string | null | undefined) ?? null;
    const headerImageUrl =
      body?.headerImageUrl === undefined
        ? data?.headerImageUrl ?? null
        : sanitizeHeaderImageUrl(body?.headerImageUrl);
    const headerImagePositionY =
      body?.headerImagePositionY === undefined
        ? sanitizeHeaderImagePositionY(data?.headerImagePositionY)
        : sanitizeHeaderImagePositionY(body?.headerImagePositionY);
    const nextHeaderPositionY =
      headerImageUrl == null ? DEFAULT_HEADER_IMAGE_POSITION_Y : headerImagePositionY;

    const batch = adminDb.batch();
    batch.update(groupSnap.ref, {
      name,
      description: description ?? null,
      headerImageUrl: headerImageUrl ?? null,
      headerImagePositionY: nextHeaderPositionY,
      updatedAt: FieldValue.serverTimestamp(),
    });

    const membersSnap = await adminDb.collection(`groups/${groupId}/members`).get();
    for (const mem of membersSnap.docs) {
      batch.update(adminDb.doc(`users/${mem.id}/groups/${groupId}`), {
        groupName: name,
        description: description ?? null,
        headerImageUrl: headerImageUrl ?? null,
        headerImagePositionY: nextHeaderPositionY,
      });
    }

    await batch.commit();

    return NextResponse.json({
      ok: true,
      group: {
        id: groupId,
        name,
        description: description ?? null,
        headerImageUrl: headerImageUrl ?? null,
        headerImagePositionY: nextHeaderPositionY,
      },
    });
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
    console.error("[communities/update]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
