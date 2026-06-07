import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { hashInviteCode, normalizeInviteCode } from "@/lib/communities/inviteCode";
import {
  getEffectivePlan,
  maxMembershipsForPlan,
  MAX_MEMBERS_PER_GROUP,
} from "@/lib/communities/limits";
import {
  parseCommunityLeague,
  parseCommunityMetric,
  parseCommunityPeriod,
} from "@/lib/communities/types";
import { readRankingTeamIds } from "@/lib/communities/rankingTeams";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const code = normalizeInviteCode(String(body?.inviteCode ?? ""));
    if (code.length < 4) {
      return NextResponse.json(
        { ok: false, error: "invalid_code" },
        { status: 400 }
      );
    }

    const hash = hashInviteCode(code);
    const q = await adminDb
      .collection("groups")
      .where("inviteCodeHash", "==", hash)
      .limit(1)
      .get();

    if (q.empty) {
      return NextResponse.json(
        { ok: false, error: "group_not_found" },
        { status: 404 }
      );
    }

    const groupDoc = q.docs[0];
    const gdata = groupDoc.data();
    if (gdata?.archivedAt) {
      return NextResponse.json(
        { ok: false, error: "group_archived" },
        { status: 410 }
      );
    }

    const gid = groupDoc.id;
    const memberRef = groupDoc.ref.collection("members").doc(uid);
    const existing = await memberRef.get();
    if (existing.exists) {
      return NextResponse.json({
        ok: true,
        groupId: gid,
        alreadyMember: true,
      });
    }

    const memberCount = Number(gdata?.memberCount ?? 0);
    if (memberCount >= MAX_MEMBERS_PER_GROUP) {
      return NextResponse.json(
        {
          ok: false,
          error: "group_full",
          memberCount,
          maxMembersPerGroup: MAX_MEMBERS_PER_GROUP,
        },
        { status: 403 }
      );
    }

    const plan = await getEffectivePlan(adminDb, uid);
    const maxMem = maxMembershipsForPlan(plan);
    const userGroups = await adminDb.collection(`users/${uid}/groups`).get();
    if (userGroups.size >= maxMem) {
      return NextResponse.json(
        {
          ok: false,
          error: "membership_limit",
          maxMemberships: maxMem,
          currentMemberships: userGroups.size,
          plan,
        },
        { status: 403 }
      );
    }

    const batch = adminDb.batch();
    batch.set(memberRef, {
      role: "member",
      joinedAt: FieldValue.serverTimestamp(),
    });
    batch.update(groupDoc.ref, {
      memberCount: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const nextCount = memberCount + 1;
    const rankingMetric = parseCommunityMetric(gdata?.rankingMetric);
    const periodType = parseCommunityPeriod(gdata?.periodType);
    const rankingLeague = parseCommunityLeague(gdata?.rankingLeague);
    const rankingTeamIds = readRankingTeamIds(gdata);

    const description =
      typeof gdata?.description === "string" && gdata.description.trim()
        ? gdata.description.trim()
        : null;

    batch.set(adminDb.doc(`users/${uid}/groups/${gid}`), {
      groupId: gid,
      groupName: String(gdata?.name ?? ""),
      description,
      role: "member",
      memberCount: nextCount,
      headerImageUrl: gdata?.headerImageUrl ?? null,
      rankingMetric,
      periodType,
      rankingLeague,
      rankingTeamIds,
      joinedAt: FieldValue.serverTimestamp(),
    });
    await batch.commit();

    return NextResponse.json({ ok: true, groupId: gid });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "unauthorized") {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }
    console.error("[communities/join]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
