import { NextResponse } from "next/server";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { assertMember } from "@/lib/communities/groupAccess";
import { adminDb } from "@/lib/firebaseAdmin";
import {
  parseCommunityLeague,
  parseCommunityMetric,
  parseCommunityPeriod,
} from "@/lib/communities/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ groupId: string }> };

export async function GET(req: Request, ctx: Ctx) {
  try {
    const uid = await requireUidFromRequest(req);
    const { groupId } = await ctx.params;
    const groupSnap = await assertMember(adminDb, groupId, uid);
    const d = groupSnap.data()!;

    return NextResponse.json({
      ok: true,
      group: {
        id: groupId,
        name: String(d.name ?? ""),
        description:
          typeof d.description === "string" && d.description.trim()
            ? d.description.trim()
            : null,
        ownerUid: String(d.ownerUid ?? ""),
        memberCount: Number(d.memberCount ?? 0),
        headerImageUrl: (d.headerImageUrl as string) ?? null,
        rankingMetric: parseCommunityMetric(d.rankingMetric),
        periodType: parseCommunityPeriod(d.periodType),
        rankingLeague: parseCommunityLeague(d.rankingLeague),
        archived: !!d.archivedAt,
        isOwner: d.ownerUid === uid,
        inviteCode:
          d.ownerUid === uid &&
          typeof d.inviteCode === "string" &&
          d.inviteCode.trim()
            ? d.inviteCode.trim()
            : null,
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
    if (status === 404)
      return NextResponse.json({ ok: false, error: msg }, { status: 404 });
    if (status === 403)
      return NextResponse.json({ ok: false, error: msg }, { status: 403 });
    console.error("[communities/summary]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
