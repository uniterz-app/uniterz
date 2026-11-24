import { NextResponse } from "next/server";
import type { DocumentData } from "firebase-admin/firestore";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { assertMember } from "@/lib/communities/groupAccess";
import { adminDb } from "@/lib/firebaseAdmin";
import { buildCommunityGroupSummaryPayload } from "@/lib/communities/buildCommunityGroupSummaryPayload";
import { ensureGroupInviteCode } from "@/lib/communities/ensureGroupInviteCode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ groupId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { groupId } = await ctx.params;
    const groupSnap = await assertMember(adminDb, groupId, uid);
    const ensuredInvite = await ensureGroupInviteCode(groupSnap);
    const d: DocumentData = {
      ...(groupSnap.data() ?? {}),
      ...(ensuredInvite ? { inviteCode: ensuredInvite } : {}),
    };

    return NextResponse.json({
      ok: true,
      group: buildCommunityGroupSummaryPayload(groupId, d, uid),
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
    if (status === 404)
      return NextResponse.json({ ok: false, error: msg }, { status: 404 });
    if (status === 403)
      return NextResponse.json({ ok: false, error: msg }, { status: 403 });
    console.error("[communities/summary]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
