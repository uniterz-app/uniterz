export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import {
  normalizeWcGameGoalScorers,
  resolveWcGameGoalScorers,
  validateWcGoalScorerPickForGame,
  type WcGameGoalScorer,
} from "@/lib/wc/goalScorer";
import { getWcSquad } from "@/lib/wc/squads";
import { resettleWcGoalScorerBonusesForGame } from "@/lib/wc/resettleGoalScorerBonus";
import { FieldValue } from "firebase-admin/firestore";

function gameSummary(id: string, data: Record<string, unknown>) {
  const home = (data.home as Record<string, unknown> | undefined) ?? {};
  const away = (data.away as Record<string, unknown> | undefined) ?? {};
  const homeTeamId =
    (home.teamId as string | undefined) ??
    (data.homeTeamId as string | undefined) ??
    null;
  const awayTeamId =
    (away.teamId as string | undefined) ??
    (data.awayTeamId as string | undefined) ??
    null;
  const startAtJst = data.startAtJst as { toMillis?: () => number } | undefined;
  const startAt = data.startAt as { toMillis?: () => number } | undefined;
  return {
    id,
    status: (data.status as string | undefined) ?? "scheduled",
    final: Boolean(data.final),
    roundLabel: (data.roundLabel as string | null | undefined) ?? null,
    startAtMillis: startAtJst?.toMillis?.() ?? startAt?.toMillis?.() ?? null,
    home: {
      teamId:
        (home.teamId as string | undefined) ??
        (data.homeTeamId as string | undefined) ??
        null,
      name:
        (home.nameJa as string | undefined) ??
        (home.name as string | undefined) ??
        "",
    },
    away: {
      teamId:
        (away.teamId as string | undefined) ??
        (data.awayTeamId as string | undefined) ??
        null,
      name:
        (away.nameJa as string | undefined) ??
        (away.name as string | undefined) ??
        "",
    },
    homeScore: (data.homeScore as number | null | undefined) ?? null,
    awayScore: (data.awayScore as number | null | undefined) ?? null,
    goalScorers: normalizeWcGameGoalScorers(data.goalScorers, {
      homeTeamId,
      awayTeamId,
    }),
  };
}

/** GET: WC 試合一覧（goalScorers 付き） */
export async function GET(req: Request) {
  try {
    await requireAdminUid(req);
    const url = new URL(req.url);
    const gameId = url.searchParams.get("gameId")?.trim();

    const db = getAdminDb();

    if (gameId) {
      const snap = await db.collection("games").doc(gameId).get();
      if (!snap.exists) {
        return NextResponse.json(
          { ok: false, error: "game not found" },
          { status: 404 }
        );
      }
      const data = snap.data()!;
      if (String(data.league ?? "").toLowerCase() !== "wc") {
        return NextResponse.json(
          { ok: false, error: "not a wc game" },
          { status: 400 }
        );
      }
      const homeTeamId = data.home?.teamId ?? data.homeTeamId ?? null;
      const awayTeamId = data.away?.teamId ?? data.awayTeamId ?? null;
      return NextResponse.json({
        ok: true,
        game: gameSummary(snap.id, data),
        squads: {
          home: homeTeamId ? getWcSquad(homeTeamId) ?? [] : [],
          away: awayTeamId ? getWcSquad(awayTeamId) ?? [] : [],
        },
      });
    }

    const snap = await db.collection("games").where("league", "==", "wc").get();

    const games = snap.docs
      .map((d) => gameSummary(d.id, d.data()))
      .sort((a, b) => (a.startAtMillis ?? 0) - (b.startAtMillis ?? 0));

    return NextResponse.json({ ok: true, games });
  } catch (e: unknown) {
    const err = e as Error & { status?: number };
    return NextResponse.json(
      { ok: false, error: err.message ?? "error" },
      { status: err.status ?? 500 }
    );
  }
}

/** PUT: 試合の得点者リストを更新 */
export async function PUT(req: Request) {
  try {
    await requireAdminUid(req);
    const body = await req.json().catch(() => null);
    const gameId = String(body?.gameId ?? "").trim();
    if (!gameId) {
      return NextResponse.json(
        { ok: false, error: "gameId required" },
        { status: 400 }
      );
    }

    const db = getAdminDb();
    const ref = db.collection("games").doc(gameId);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json(
        { ok: false, error: "game not found" },
        { status: 404 }
      );
    }
    const data = snap.data()!;
    if (String(data.league ?? "").toLowerCase() !== "wc") {
      return NextResponse.json(
        { ok: false, error: "not a wc game" },
        { status: 400 }
      );
    }

    const homeTeamId = data.home?.teamId ?? data.homeTeamId ?? null;
    const awayTeamId = data.away?.teamId ?? data.awayTeamId ?? null;

    const resolved = resolveWcGameGoalScorers(body?.goalScorers, {
      homeTeamId,
      awayTeamId,
    });
    if (!resolved.ok) {
      return NextResponse.json(
        { ok: false, error: resolved.error },
        { status: 400 }
      );
    }
    const goalScorers = resolved.scorers;

    for (const g of goalScorers) {
      const v = validateWcGoalScorerPickForGame(g, homeTeamId, awayTeamId);
      if (!v.ok) {
        return NextResponse.json(
          { ok: false, error: v.error },
          { status: 400 }
        );
      }
    }

    const payload: WcGameGoalScorer[] = goalScorers.map((g) => ({
      playerId: g.playerId,
      teamId: g.teamId,
      ...(g.minute != null ? { minute: g.minute } : {}),
      ...(g.ownGoal ? { ownGoal: true } : {}),
    }));

    await ref.set(
      {
        goalScorers: payload,
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    let postsResettled = 0;
    if (Boolean(data.final)) {
      const result = await resettleWcGoalScorerBonusesForGame(
        db,
        gameId,
        payload,
        homeTeamId,
        awayTeamId
      );
      postsResettled = result.updated;
    }

    return NextResponse.json({
      ok: true,
      goalScorers: payload,
      postsResettled,
    });
  } catch (e: unknown) {
    const err = e as Error & { status?: number };
    return NextResponse.json(
      { ok: false, error: err.message ?? "error" },
      { status: err.status ?? 500 }
    );
  }
}
