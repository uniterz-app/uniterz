import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  generateInviteCode,
  hashInviteCode,
} from "@/lib/communities/inviteCode";
import {
  getEffectivePlan,
  maxOwnedGroupsForPlan,
} from "@/lib/communities/limits";
import {
  normalizeRankingForPeriod,
  parseCommunityMetric,
  parseCommunityPeriod,
} from "@/lib/communities/types";
import { sanitizeHeaderImageUrl } from "@/lib/communities/validate";

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

    const headerImageUrl = sanitizeHeaderImageUrl(body?.headerImageUrl);
    let rankingMetric = parseCommunityMetric(body?.rankingMetric);
    let periodType = parseCommunityPeriod(body?.periodType);
    ({ metric: rankingMetric, period: periodType } = normalizeRankingForPeriod(
      rankingMetric,
      periodType
    ));

    const plan = await getEffectivePlan(adminDb, uid);
    const maxOwned = maxOwnedGroupsForPlan(plan);
    const mine = await adminDb.collection(`users/${uid}/groups`).get();
    const owned = mine.docs.filter((d) => d.data()?.role === "owner").length;
    if (owned >= maxOwned) {
      return NextResponse.json(
        { ok: false, error: "owned_group_limit", maxOwned, plan },
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
        ownerUid: uid,
        inviteCodeHash: hash,
        memberCount: 1,
        headerImageUrl: headerImageUrl ?? null,
        rankingMetric,
        periodType,
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
        role: "owner",
        memberCount: 1,
        headerImageUrl: headerImageUrl ?? null,
        rankingMetric,
        periodType,
        joinedAt: FieldValue.serverTimestamp(),
      });
      await batch.commit();

      return NextResponse.json({
        ok: true,
        groupId: groupRef.id,
        inviteCode: invitePlain,
        rankingMetric,
        periodType,
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
