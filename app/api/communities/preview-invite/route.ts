import { NextResponse } from "next/server";
import type { DocumentData } from "firebase-admin/firestore";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { hashInviteCode, normalizeInviteCode } from "@/lib/communities/inviteCode";
import {
  parseCommunityLeague,
  parseCommunityMetric,
  parseCommunityPeriod,
} from "@/lib/communities/types";
import { readRankingTeamIds } from "@/lib/communities/rankingTeams";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function pickOwnerDisplayName(data: DocumentData | undefined): string {
  if (!data) return "—";
  if (typeof data.displayName === "string" && data.displayName.trim()) {
    return data.displayName.trim();
  }
  if (typeof data.name === "string" && data.name.trim()) {
    return data.name.trim();
  }
  for (const key of ["handle", "slug", "username"] as const) {
    const v = data[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "—";
}

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
    const ownerUid = String(gdata?.ownerUid ?? "");
    const ownerSnap = ownerUid
      ? await adminDb.doc(`users/${ownerUid}`).get()
      : null;
    const memberSnap = await groupDoc.ref.collection("members").doc(uid).get();

    const description =
      typeof gdata?.description === "string" && gdata.description.trim()
        ? gdata.description.trim()
        : null;

    return NextResponse.json({
      ok: true,
      inviteCode: code,
      alreadyMember: memberSnap.exists,
      group: {
        id: gid,
        name: String(gdata?.name ?? ""),
        description,
        ownerUid,
        ownerDisplayName: pickOwnerDisplayName(ownerSnap?.data()),
        memberCount: Number(gdata?.memberCount ?? 0),
        headerImageUrl: (gdata?.headerImageUrl as string) ?? null,
        rankingMetric: parseCommunityMetric(gdata?.rankingMetric),
        periodType: parseCommunityPeriod(gdata?.periodType),
        rankingLeague: parseCommunityLeague(gdata?.rankingLeague),
        rankingTeamIds: readRankingTeamIds(gdata),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "unauthorized") {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }
    console.error("[communities/preview-invite]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
