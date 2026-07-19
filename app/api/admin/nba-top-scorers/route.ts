export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import {
  normalizeNbaLeadingScorers,
  normalizeNbaTopScorerCandidates,
  type NbaLeadingScorer,
  type NbaTopScorerCandidate,
} from "@/lib/nba/topScorer";
import {
  leadingScorersPayload,
  resettleNbaTopScorerBonusesForGame,
} from "@/lib/nba/resettleTopScorerBonus";
import { FieldValue } from "firebase-admin/firestore";

function gameSummary(id: string, data: Record<string, unknown>) {
  const home = (data.home as Record<string, unknown> | undefined) ?? {};
  const away = (data.away as Record<string, unknown> | undefined) ?? {};
  return {
    id,
    status: (data.status as string | undefined) ?? "scheduled",
    final: Boolean(data.final),
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
    topScorerCandidates: normalizeNbaTopScorerCandidates(
      data.topScorerCandidates
    ),
    leadingScorers: normalizeNbaLeadingScorers(data.leadingScorers),
  };
}

/** GET: NBA 試合の最多得点者候補・確定リーダー */
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
      return NextResponse.json({
        ok: true,
        game: gameSummary(snap.id, snap.data() as Record<string, unknown>),
      });
    }

    const snap = await db
      .collection("games")
      .where("league", "==", "nba")
      .orderBy("startAt", "desc")
      .limit(40)
      .get();

    return NextResponse.json({
      ok: true,
      games: snap.docs.map((d) =>
        gameSummary(d.id, d.data() as Record<string, unknown>)
      ),
    });
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    return NextResponse.json(
      { ok: false, error: err?.message ?? "error" },
      { status: err?.status ?? 500 }
    );
  }
}

/** PATCH: candidates / leadingScorers を更新。leading 更新時は再採点 */
export async function PATCH(req: Request) {
  try {
    await requireAdminUid(req);
    const body = (await req.json().catch(() => null)) as {
      gameId?: string;
      topScorerCandidates?: NbaTopScorerCandidate[];
      leadingScorers?: NbaLeadingScorer[];
      resettle?: boolean;
    } | null;

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
    const data = snap.data() as Record<string, unknown>;
    if (String(data.league ?? "").toLowerCase() !== "nba") {
      return NextResponse.json(
        { ok: false, error: "not an nba game" },
        { status: 400 }
      );
    }

    const patch: Record<string, unknown> = {
      updatedAt: FieldValue.serverTimestamp(),
    };

    if (body?.topScorerCandidates !== undefined) {
      patch.topScorerCandidates = normalizeNbaTopScorerCandidates(
        body.topScorerCandidates
      );
    }
    let leaders: NbaLeadingScorer[] | null = null;
    if (body?.leadingScorers !== undefined) {
      leaders = normalizeNbaLeadingScorers(body.leadingScorers);
      patch.leadingScorers = leadingScorersPayload(leaders);
    }

    await ref.update(patch);

    let resettled = 0;
    if (leaders && body?.resettle !== false) {
      const r = await resettleNbaTopScorerBonusesForGame(gameId, leaders);
      resettled = r.updated;
    }

    const after = (await ref.get()).data() as Record<string, unknown>;
    return NextResponse.json({
      ok: true,
      resettled,
      game: gameSummary(gameId, after),
    });
  } catch (e: unknown) {
    const err = e as { status?: number; message?: string };
    return NextResponse.json(
      { ok: false, error: err?.message ?? "error" },
      { status: err?.status ?? 500 }
    );
  }
}
