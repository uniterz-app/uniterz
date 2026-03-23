// app/api/bracket-leaderboard/route.ts

import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export type BracketLeaderboardRow = {
  uid: string;
  displayName: string;
  handle: string | null;
  photoURL: string | null;
  totalScore: number;
  winnerPoints: number;
  gamesPoints: number;
  rank: number;
};

type ApiResponse = {
  ok: boolean;
  season?: string;
  count?: number;
  rows?: BracketLeaderboardRow[];
  error?: string;
};

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const season = searchParams.get("season") ?? "";

    if (!season || !/^\d{4}$/.test(season)) {
      return NextResponse.json(
        { ok: false, error: "season is required (YYYY)" },
        { status: 400 }
      );
    }

    const bracketsSnap = await adminDb
      .collection("playoffBrackets")
      .where("season", "==", season)
      .get();

    type BracketEntry = {
      uid: string;
      totalScore: number;
      winnerPoints: number;
      gamesPoints: number;
    };

    const brackets: BracketEntry[] = bracketsSnap.docs
      .map((doc) => {
        const d = doc.data();
        if (d.alive !== true) return null;
        return {
          uid: d.uid as string,
          totalScore: Number(d.totalScore ?? 0),
          winnerPoints: Number(d.winnerPoints ?? 0),
          gamesPoints: Number(d.gamesPoints ?? 0),
        };
      })
      .filter((b): b is BracketEntry => b !== null);

    brackets.sort((a, b) => b.totalScore - a.totalScore);

    const uids = [...new Set(brackets.map((b) => b.uid))];
    const userMap = new Map<string, { displayName: string; handle: string | null; photoURL: string | null }>();

    for (const uid of uids) {
      const userSnap = await adminDb.collection("users").doc(uid).get();
      const u = userSnap.data() as { displayName?: string; handle?: string; photoURL?: string; avatarUrl?: string } | undefined;
      userMap.set(uid, {
        displayName: u?.displayName?.trim() ?? "User",
        handle: u?.handle?.trim() ?? null,
        photoURL: u?.photoURL ?? u?.avatarUrl ?? null,
      });
    }

    const rows: BracketLeaderboardRow[] = brackets.map((b, index) => {
      const user = userMap.get(b.uid);
      return {
        uid: b.uid,
        displayName: user?.displayName ?? "User",
        handle: user?.handle ?? null,
        photoURL: user?.photoURL ?? null,
        totalScore: b.totalScore,
        winnerPoints: b.winnerPoints,
        gamesPoints: b.gamesPoints,
        rank: index + 1,
      };
    });

    return NextResponse.json(
      {
        ok: true,
        season,
        count: rows.length,
        rows,
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
