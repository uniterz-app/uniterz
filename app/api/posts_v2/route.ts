export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb, getAdminAuth } from "@/lib/firebaseAdmin";
import { resultLeagueFlagPatchForPost } from "@/lib/result/userResultLeagueFlags";
import { resolveWcStageFromGame } from "@/lib/wc/resolveWcStage";
import {
  normalizeWcGoalScorerPick,
  validateWcGoalScorerPickForGame,
  type WcGoalScorerPick,
} from "@/lib/wc/goalScorer";
import { FieldValue, Timestamp } from "firebase-admin/firestore";

/* ========= 型 ========= */
type League = "bj" | "j1" | "nba" | "pl" | "wc";
type Status = "scheduled" | "live" | "final";

type PredictionPayloadV2 = {
  winner: "home" | "away" | "draw";
  score: { home: number; away: number };
  goalScorer?: WcGoalScorerPick;
};

type ParsedOkV2 = {
  ok: true;
  gameId: string;
  prediction: PredictionPayloadV2;
  comment: string;
  rawGoalScorer: unknown;
};
type ParsedNg = { ok: false; error: string };

/* ========= バリデーション ========= */
function sanitizeBodyV2(body: any): ParsedOkV2 | ParsedNg {
  try {
    const gameId = String(body?.gameId ?? "").trim();
    if (!gameId) throw new Error("gameId required");

    const p = body?.prediction ?? {};
    if (!["home", "away", "draw"].includes(p.winner))
      throw new Error("prediction.winner must be home/away/draw");

    const s = p.score ?? {};
    const home = Number(s.home);
    const away = Number(s.away);
    if (
      !Number.isInteger(home) ||
      !Number.isInteger(away) ||
      home < 0 ||
      away < 0
    )
      throw new Error("score invalid");

    const comment = String(body?.comment ?? "").slice(0, 2000);

    return {
      ok: true,
      gameId,
      prediction: {
        winner: p.winner,
        score: { home, away },
      },
      comment,
      rawGoalScorer: p.goalScorer,
    };
  } catch (e: any) {
    return { ok: false, error: e?.message ?? "bad payload" };
  }
}

/* ========= 補助 ========= */
function normalizeLeague(v: any): League {
  const s = String(v ?? "").toLowerCase();

  if (s === "bj" || s === "b1") return "bj";
  if (s === "j1" || s === "j") return "j1";
  if (s === "nba") return "nba";
  if (s === "pl" || s.includes("premier")) return "pl";
  if (s === "wc" || s === "worldcup" || s.includes("world cup") || s === "fifa") return "wc";

  return "bj";
}

function toAdminTimestamp(v: any): Timestamp | null {
  if (v instanceof Timestamp) return v;
  if (v && typeof v.toMillis === "function") {
    try {
      return Timestamp.fromMillis(v.toMillis());
    } catch {}
  }
  if (typeof v === "number" && Number.isFinite(v)) {
    return Timestamp.fromMillis(v);
  }
  if (typeof v === "string") {
    const ms = Date.parse(v);
    if (!Number.isNaN(ms)) return Timestamp.fromMillis(ms);
  }
  return null;
}

async function requireUid(req: Request): Promise<string> {
  const authz =
    req.headers.get("authorization") ||
    req.headers.get("Authorization");

  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");

  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

/* ========= POST /api/posts_v2 ========= */
export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json(
        { ok: false, error: "invalid json" },
        { status: 400 }
      );
    }

    const parsed = sanitizeBodyV2(body);
    if (!parsed.ok) {
      return NextResponse.json(
        { ok: false, error: parsed.error },
        { status: 400 }
      );
    }

    let uid: string;
    try {
      uid = await requireUid(req);
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg === "unauthorized") {
        return NextResponse.json(
          { ok: false, error: "unauthorized" },
          { status: 401 }
        );
      }
      console.error("[POST /api/posts_v2] auth", e);
      return NextResponse.json(
        {
          ok: false,
          error: "auth_config",
          message:
            process.env.NODE_ENV === "development"
              ? msg
              : "サーバー設定を確認してください（Firebase Admin）",
        },
        { status: 500 }
      );
    }

    const adminDb = getAdminDb();

    let authorDisplayName = "ユーザー";
    let authorPhotoURL: string | null = null;
    let authorHandle: string | null = null;

    try {
      const userDoc = await adminDb.collection("users").doc(uid).get();
      if (userDoc.exists) {
        const u = userDoc.data() || {};
        authorDisplayName = u.displayName || authorDisplayName;
        authorPhotoURL = u.photoURL || u.avatarUrl || null;
        authorHandle = u.handle || u.username || u.slug || null;
      }
    } catch {}

    const gameSnap = await adminDb.collection("games").doc(parsed.gameId).get();
    if (!gameSnap.exists) {
      return NextResponse.json(
        { ok: false, error: "game not found" },
        { status: 404 }
      );
    }

    const g = gameSnap.data() as any;
    const league: League = normalizeLeague(g?.league);

    const startAtTs =
      toAdminTimestamp(g?.startAtJst) ??
      toAdminTimestamp(g?.startAt) ??
      null;

    if (!startAtTs) {
      return NextResponse.json(
        { ok: false, error: "invalid game startAt" },
        { status: 500 }
      );
    }

    const startAtMillis = startAtTs.toMillis();
    const startAtIso = new Date(startAtMillis).toISOString();

    if (Date.now() >= startAtMillis) {
      return NextResponse.json(
        { ok: false, error: "locked: game started" },
        { status: 403 }
      );
    }

    const homeTeamId = g?.home?.teamId ?? g?.homeTeamId ?? null;
    const awayTeamId = g?.away?.teamId ?? g?.awayTeamId ?? null;
    const goalScorerPick = normalizeWcGoalScorerPick(parsed.rawGoalScorer);
    if (league === "wc" && parsed.rawGoalScorer != null && !goalScorerPick) {
      return NextResponse.json(
        { ok: false, error: "goalScorer invalid" },
        { status: 400 }
      );
    }
    if (league !== "wc" && goalScorerPick) {
      return NextResponse.json(
        { ok: false, error: "goalScorer only allowed for wc" },
        { status: 400 }
      );
    }
    if (goalScorerPick) {
      const v = validateWcGoalScorerPickForGame(
        goalScorerPick,
        homeTeamId,
        awayTeamId,
        parsed.prediction.score
      );
      if (!v.ok) {
        return NextResponse.json({ ok: false, error: v.error }, { status: 400 });
      }
    }

    const prediction: PredictionPayloadV2 = {
      ...parsed.prediction,
      ...(goalScorerPick ? { goalScorer: goalScorerPick } : {}),
    };

    const dup = await adminDb
      .collection("posts")
      .where("authorUid", "==", uid)
      .where("gameId", "==", parsed.gameId)
      .where("schemaVersion", "==", 2)
      .limit(1)
      .get();

    if (!dup.empty) {
      return NextResponse.json(
        { ok: false, error: "duplicate", existingId: dup.docs[0].id },
        { status: 409 }
      );
    }

    const data = {
      schemaVersion: 2,

      authorUid: uid,
      authorDisplayName,
      authorPhotoURL,
      authorHandle,

      gameId: parsed.gameId,
      league,
      seasonPhase: g?.seasonPhase ?? null,
      seasonRound: g?.playoffRound ?? g?.seasonRound ?? null,
      wcStage: resolveWcStageFromGame(g) ?? g?.wcStage ?? null,
      home: g?.home ?? null,
      away: g?.away ?? null,
      status: (g?.status as Status) || "scheduled",

      startAt: startAtTs,
      startAtMillis,
      startAtIso,

      prediction,
      comment: parsed.comment,

      result: null,
      stats: null as any,

      likeCount: 0,
      saveCount: 0,

      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    };

    try {
      const ref = await adminDb.collection("posts").add(data);
      const leagueFlagPatch = resultLeagueFlagPatchForPost(league);
      if (leagueFlagPatch) {
        try {
          await adminDb
            .collection("users")
            .doc(uid)
            .set(leagueFlagPatch, { merge: true });
        } catch (flagErr) {
          console.error("[POST /api/posts_v2] user league flags", flagErr);
        }
      }
      return NextResponse.json({ ok: true, id: ref.id }, { status: 201 });
    } catch (e: any) {
      console.error("[POST /api/posts_v2]", e?.message ?? e);
      return NextResponse.json(
        { ok: false, error: "write failed" },
        { status: 500 }
      );
    }
  } catch (e: any) {
    console.error("[POST /api/posts_v2] fatal", e);
    return NextResponse.json(
      {
        ok: false,
        error: "server_error",
        message:
          process.env.NODE_ENV === "development"
            ? String(e?.message ?? e)
            : undefined,
      },
      { status: 500 }
    );
  }
}