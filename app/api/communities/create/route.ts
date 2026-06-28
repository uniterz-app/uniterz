import { NextResponse } from "next/server";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  generateInviteCode,
  hashInviteCode,
} from "@/lib/communities/inviteCode";
import {
  countActiveOwnedGroups,
  getEffectivePlan,
  maxOwnedGroupsForPlan,
  pruneStaleGroupMirrors,
} from "@/lib/communities/limits";
import {
  normalizeRankingForPeriod,
  parseCommunityLeague,
  parseCommunityMetric,
  parseCommunityPeriod,
} from "@/lib/communities/types";
import {
  parseRankingTeamIds,
  validateRankingTeamIds,
} from "@/lib/communities/rankingTeams";
import {
  sanitizeGroupDescription,
  sanitizeHeaderImageUrl,
} from "@/lib/communities/validate";
import { DEFAULT_HEADER_IMAGE_POSITION_Y } from "@/lib/communities/headerImagePosition";
import { TIMEZONE_JST, toDateKeyInTimeZone } from "@/lib/time/zonedTime";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const body = await req.json().catch(() => ({}));
    const name = String(body?.name ?? "").trim();
    if (name.length < 1 || name.length > 60) {
      return NextResponse.json(
        { ok: false, error: "invalid_name" },
        { status: 400 }
      );
    }

    const description = sanitizeGroupDescription(body?.description);
    const headerImageUrl = sanitizeHeaderImageUrl(body?.headerImageUrl);
    let rankingMetric = parseCommunityMetric(body?.rankingMetric);
    const rankingLeague = parseCommunityLeague(body?.rankingLeague);
    const rankingTeamIds = parseRankingTeamIds(body?.rankingTeamIds);
    const teamValidation = validateRankingTeamIds(rankingTeamIds, rankingLeague);
    if (!teamValidation.ok) {
      return NextResponse.json(
        { ok: false, error: teamValidation.error },
        { status: 400 }
      );
    }
    if (rankingLeague === "all" && rankingTeamIds.length > 0) {
      return NextResponse.json(
        { ok: false, error: "teams_require_specific_league" },
        { status: 400 }
      );
    }
    const periodType = parseCommunityPeriod("from_now");
    ({ metric: rankingMetric } = normalizeRankingForPeriod(
      rankingMetric,
      periodType
    ));

    const rankingStartInstant = new Date();
    const rankingStartAt = Timestamp.fromDate(rankingStartInstant);
    const rankingStartDateKey = toDateKeyInTimeZone(
      rankingStartInstant,
      TIMEZONE_JST
    );

    const plan = await getEffectivePlan(adminDb, uid);
    const maxOwned = maxOwnedGroupsForPlan(plan);
    await pruneStaleGroupMirrors(adminDb, uid);
    const owned = await countActiveOwnedGroups(adminDb, uid);
    if (owned >= maxOwned) {
      return NextResponse.json(
        {
          ok: false,
          error: "owned_group_limit",
          maxOwned,
          owned,
          plan,
        },
        { status: 403 }
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

      const groupRef = adminDb.collection("groups").doc();
      const batch = adminDb.batch();
      batch.set(groupRef, {
        name,
        description: description ?? null,
        ownerUid: uid,
        inviteCodeHash: hash,
        /** オーナー向け表示用（summary API で owner のみ返却） */
        inviteCode: invitePlain,
        memberCount: 1,
        headerImageUrl: headerImageUrl ?? null,
        headerImagePositionY: DEFAULT_HEADER_IMAGE_POSITION_Y,
        rankingMetric,
        periodType,
        rankingLeague,
        rankingTeamIds,
        rankingStartDateKey,
        rankingStartAt,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      batch.set(groupRef.collection("members").doc(uid), {
        role: "owner",
        joinedAt: FieldValue.serverTimestamp(),
      });
      batch.set(adminDb.doc(`users/${uid}/groups/${groupRef.id}`), {
        groupId: groupRef.id,
        groupName: name,
        description: description ?? null,
        role: "owner",
        memberCount: 1,
        headerImageUrl: headerImageUrl ?? null,
        headerImagePositionY: DEFAULT_HEADER_IMAGE_POSITION_Y,
        rankingMetric,
        periodType,
        rankingLeague,
        rankingTeamIds,
        joinedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();

      return NextResponse.json({
        ok: true,
        groupId: groupRef.id,
        inviteCode: invitePlain,
        rankingMetric,
        periodType,
        rankingLeague,
        rankingTeamIds,
        group: {
          id: groupRef.id,
          name,
          description: description ?? null,
          memberCount: 1,
          headerImageUrl: headerImageUrl ?? null,
          rankingMetric,
          periodType,
          rankingLeague,
          rankingTeamIds,
          role: "owner",
        },
      });
    }

    return NextResponse.json(
      { ok: false, error: "invite_collision" },
      { status: 500 }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "unauthorized") {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }
    console.error("[communities/create]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
