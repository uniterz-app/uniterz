import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import {
  parseCommunityMetric,
  parseCommunityPeriod,
} from "@/lib/communities/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const mine = await adminDb.collection(`users/${uid}/groups`).get();
    if (mine.empty) {
      return NextResponse.json({ ok: true, groups: [] });
    }

    const groupRefs = mine.docs.map((d) =>
      adminDb.doc(`groups/${d.id}`)
    );
    const snaps = await adminDb.getAll(...groupRefs);

    const groups: {
      id: string;
      name: string;
      memberCount: number;
      headerImageUrl: string | null;
      rankingMetric: string;
      periodType: string;
      role: string;
      archived: boolean;
    }[] = [];

    for (let i = 0; i < mine.docs.length; i++) {
      const m = mine.docs[i];
      const gSnap = snaps[i];
      if (!gSnap?.exists) continue;
      const gd = gSnap.data()!;
      if (gd.archivedAt) continue;

      const mirror = m.data();
      groups.push({
        id: m.id,
        name: String(gd.name ?? mirror?.groupName ?? ""),
        memberCount: Number(
          gd.memberCount ?? mirror?.memberCount ?? 0
        ),
        headerImageUrl:
          (gd.headerImageUrl as string) ??
          (mirror?.headerImageUrl as string) ??
          null,
        rankingMetric: parseCommunityMetric(
          gd.rankingMetric ?? mirror?.rankingMetric
        ),
        periodType: parseCommunityPeriod(
          gd.periodType ?? mirror?.periodType
        ),
        role: String(mirror?.role ?? "member"),
        archived: false,
      });
    }

    groups.sort((a, b) => a.name.localeCompare(b.name, "ja"));

    return NextResponse.json({ ok: true, groups });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "error";
    if (msg === "unauthorized") {
      return NextResponse.json(
        { ok: false, error: "unauthorized" },
        { status: 401 }
      );
    }
    console.error("[communities/list]", e);
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
