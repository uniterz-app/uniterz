// app/api/bracket-leaderboard/route.ts

import { NextResponse } from "next/server";
import type { DocumentSnapshot } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const LIMIT_DEFAULT = 30;
const LIMIT_MAX = 50;

export type BracketLeaderboardRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  plan: "free" | "pro";
  totalScore: number;
  winnerPoints: number;
  gamesPoints: number;
  rank: number;
  /** 優勝予想（TEAM_SHORT 略称、例: LAL） */
  championPick: string | null;
};

type ApiResponse = {
  ok: boolean;
  season?: string;
  count?: number;
  rows?: BracketLeaderboardRow[];
  /** 次ページがある */
  hasMore?: boolean;
  /** 次リクエストに `cursor` として渡す opaque文字列 */
  nextCursor?: string | null;
  error?: string;
};

/** Cursor = last row's playoffBrackets document id (opaque base64url JSON). */
function encodeCursor(docId: string): string {
  return Buffer.from(JSON.stringify({ i: docId }), "utf8").toString("base64url");
}

function decodeCursor(raw: string): { i: string } | null {
  try {
    const j = JSON.parse(
      Buffer.from(raw, "base64url").toString("utf8")
    ) as unknown;
    if (
      j &&
      typeof j === "object" &&
      "i" in j &&
      typeof (j as { i: unknown }).i === "string"
    ) {
      return { i: (j as { i: string }).i };
    }
  } catch {
    /* ignore */
  }
  return null;
}

export async function GET(req: Request) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(req.url);
    const season = searchParams.get("season") ?? "";

    if (!season || !/^\d{4}$/.test(season)) {
      return NextResponse.json(
        { ok: false, error: "season is required (YYYY)" },
        { status: 400 }
      );
    }

    let limit = LIMIT_DEFAULT;
    const limitRaw = searchParams.get("limit");
    if (limitRaw) {
      const n = parseInt(limitRaw, 10);
      if (Number.isFinite(n)) {
        limit = Math.min(LIMIT_MAX, Math.max(1, n));
      }
    }

    let startRank = 1;
    const startRankRaw = searchParams.get("startRank");
    if (startRankRaw) {
      const r = parseInt(startRankRaw, 10);
      if (Number.isFinite(r) && r >= 1) startRank = r;
    }

    const cursorRaw = searchParams.get("cursor")?.trim() ?? "";
    let cursorSnap: DocumentSnapshot | null = null;
    if (cursorRaw) {
      const cursorDecoded = decodeCursor(cursorRaw);
      if (!cursorDecoded?.i) {
        return NextResponse.json(
          { ok: false, error: "invalid cursor" } satisfies ApiResponse,
          { status: 400 }
        );
      }
      const cur = await adminDb
        .collection("playoffBrackets")
        .doc(cursorDecoded.i)
        .get();
      if (!cur.exists) {
        return NextResponse.json(
          { ok: false, error: "invalid cursor" } satisfies ApiResponse,
          { status: 400 }
        );
      }
      const cs = cur.data()?.season;
      if (String(cs ?? "") !== season) {
        return NextResponse.json(
          { ok: false, error: "invalid cursor" } satisfies ApiResponse,
          { status: 400 }
        );
      }
      cursorSnap = cur;
    }

    const fetchCap = Math.min(limit + 1, LIMIT_MAX + 1);

    let query = adminDb
      .collection("playoffBrackets")
      .where("season", "==", season)
      .orderBy("totalScore", "desc")
      .limit(fetchCap);

    if (cursorSnap) {
      query = query.startAfter(cursorSnap);
    }

    const snap = await query.get();
    const docs = snap.docs;
    const hasMore = docs.length > limit;
    const pageDocs = hasMore ? docs.slice(0, limit) : docs;

    type BracketEntry = {
      uid: string;
      totalScore: number;
      winnerPoints: number;
      gamesPoints: number;
      championPick: string | null;
    };

    const brackets: BracketEntry[] = pageDocs
      .map((doc) => {
        const d = doc.data() as {
          uid?: string;
          totalScore?: unknown;
          winnerPoints?: unknown;
          gamesPoints?: unknown;
          championPick?: unknown;
          bracket?: { FINALS?: { winner?: unknown } };
        };
        const uid = typeof d.uid === "string" ? d.uid.trim() : "";
        if (!uid) return null;
        const raw =
          typeof d.championPick === "string" && d.championPick.trim()
            ? d.championPick.trim()
            : typeof d.bracket?.FINALS?.winner === "string" &&
                d.bracket.FINALS.winner.trim()
              ? d.bracket.FINALS.winner.trim()
              : null;
        return {
          uid,
          totalScore: Number(d.totalScore ?? 0),
          winnerPoints: Number(d.winnerPoints ?? 0),
          gamesPoints: Number(d.gamesPoints ?? 0),
          championPick: raw,
        };
      })
      .filter((b): b is BracketEntry => b !== null);

    const uids = [...new Set(brackets.map((b) => b.uid))];
    const userMap = new Map<
      string,
      {
        displayName: string;
        handle: string | null;
        photoURL: string | null;
        plan: "free" | "pro";
      }
    >();

    const BATCH_SIZE = 100;
    for (let i = 0; i < uids.length; i += BATCH_SIZE) {
      const batch = uids.slice(i, i + BATCH_SIZE);
      const refs = batch.map((uid) => adminDb.collection("users").doc(uid));
      const snaps = await adminDb.getAll(...refs);

      snaps.forEach((snap, idx) => {
        const uid = batch[idx];
        if (!uid) return;
        const u = snap.data() as
          | {
              displayName?: string;
              handle?: string;
              photoURL?: string;
              avatarUrl?: string;
              plan?: string;
            }
          | undefined;
        userMap.set(uid, {
          displayName: u?.displayName?.trim() ?? "User",
          handle: u?.handle?.trim() ?? null,
          photoURL: u?.photoURL ?? u?.avatarUrl ?? null,
          plan: u?.plan === "pro" ? "pro" : "free",
        });
      });
    }

    const rows: BracketLeaderboardRow[] = brackets.map((b, index) => {
      const user = userMap.get(b.uid);
      return {
        uid: b.uid,
        displayName: user?.displayName ?? "User",
        handle: user?.handle ?? null,
        photoURL: user?.photoURL ?? null,
        plan: user?.plan ?? "free",
        totalScore: b.totalScore,
        winnerPoints: b.winnerPoints,
        gamesPoints: b.gamesPoints,
        rank: startRank + index,
        championPick: b.championPick,
      };
    });

    const lastDoc = pageDocs[pageDocs.length - 1];
    const nextCursor =
      hasMore && lastDoc ? encodeCursor(lastDoc.id) : null;

    return NextResponse.json(
      {
        ok: true,
        season,
        count: rows.length,
        rows,
        hasMore,
        nextCursor,
      } satisfies ApiResponse,
      { status: 200 }
    );
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "unexpected error";
    return NextResponse.json(
      { ok: false, error: message } satisfies ApiResponse,
      { status: 500 }
    );
  }
}
