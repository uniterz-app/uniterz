// app/api/bracket-leaderboard/route.ts

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
  error?: string;
};

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

    const bracketsSnap = await adminDb
      .collection("playoffBrackets")
      .where("season", "==", season)
      .get();

    type BracketEntry = {
      uid: string;
      totalScore: number;
      winnerPoints: number;
      gamesPoints: number;
      championPick: string | null;
    };

    const brackets: BracketEntry[] = bracketsSnap.docs
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

    brackets.sort((a, b) => b.totalScore - a.totalScore);

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

    // Firestore getAll は最大 100 件まで。バッチで取得
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
        rank: index + 1,
        championPick: b.championPick,
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
