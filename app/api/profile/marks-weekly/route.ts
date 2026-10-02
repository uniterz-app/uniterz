/**
 * MARK LIST 用。週次スナップショット 1 本 + users getAll で
 * 人数分の user-stats を避ける。
 */
import { NextResponse } from "next/server";

import { getAdminDb } from "@/lib/firebaseAdmin";
import { MAX_MARKS_PRO } from "@/lib/marks/markTypes";
import { currentRankingPeriodLabel } from "@/lib/rankings/rankingPeriod";
import { periodRankingSnapshotDocId } from "@/lib/rankings/rankingDivision";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function isValidUid(value: string): boolean {
  return (
    value.length > 0 &&
    value.length <= 128 &&
    !value.includes("/")
  );
}

function parseUids(raw: string | null): string[] {
  if (!raw) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of raw.split(",")) {
    const uid = part.trim();
    if (!isValidUid(uid) || seen.has(uid)) continue;
    seen.add(uid);
    out.push(uid);
    if (out.length >= MAX_MARKS_PRO) break;
  }
  return out;
}

function readNum(raw: unknown): number | null {
  const n = typeof raw === "number" ? raw : Number(raw);
  return Number.isFinite(n) ? n : null;
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const uids = parseUids(url.searchParams.get("uids"));
    if (uids.length === 0) {
      return NextResponse.json({ ok: true, label: "", board: {} });
    }

    const label = currentRankingPeriodLabel("weekly");
    const db = getAdminDb();
    const snapRef = db
      .collection("period_ranking_snapshots")
      .doc(
        periodRankingSnapshotDocId({
          division: "standard",
          period: "weekly",
          label,
          metric: "totalPoints",
        })
      );
    const userRefs = uids.map((uid) => db.collection("users").doc(uid));
    const [snap, userSnaps] = await Promise.all([
      snapRef.get(),
      db.getAll(...userRefs),
    ]);

    const data = snap.exists ? snap.data() : null;
    const ranks =
      data?.ranks && typeof data.ranks === "object"
        ? (data.ranks as Record<string, unknown>)
        : {};
    const pointsByUid = new Map<string, number>();
    if (Array.isArray(data?.rows)) {
      for (const row of data.rows) {
        if (!row || typeof row !== "object") continue;
        const rec = row as Record<string, unknown>;
        const uid = typeof rec.uid === "string" ? rec.uid.trim() : "";
        const points = readNum(rec.totalPoints);
        if (uid && points != null) pointsByUid.set(uid, points);
      }
    }

    const board: Record<
      string,
      { rank: number | null; points: number | null; isPro: boolean }
    > = {};
    uids.forEach((uid, i) => {
      const rank = readNum(ranks[uid]);
      const userData = userSnaps[i]?.exists
        ? (userSnaps[i].data() as Record<string, unknown>)
        : null;
      board[uid] = {
        rank: rank != null && rank > 0 ? Math.floor(rank) : null,
        points: pointsByUid.get(uid) ?? null,
        isPro: userData?.plan === "pro",
      };
    });

    return NextResponse.json({ ok: true, label, board });
  } catch (error) {
    console.error("[profile/marks-weekly] GET failed", error);
    return NextResponse.json({ ok: false, error: "internal_error" }, { status: 500 });
  }
}
