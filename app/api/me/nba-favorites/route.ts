export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import {
  isValidNbaFavoritePlayerId,
  isValidNbaFavoriteTeamId,
  isValidNbaFanSinceSeason,
  parseNbaFavorites,
  replaceNbaFavoritePlayer,
  toggleNbaFavoritePlayer,
  toggleNbaFavoriteTeam,
  type NbaFavoritePlayer,
} from "@/lib/profile/nbaFavorites";

async function requireUid(req: Request): Promise<string> {
  const authz =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

type Body =
  | {
      action: "toggleTeam";
      teamId: string;
      fanSinceSeason?: string | null;
    }
  | {
      action: "togglePlayer";
      playerId: string;
      displayName?: string;
      teamId?: string;
    }
  | {
      action: "replacePlayer";
      removePlayerId: string;
      playerId: string;
      displayName?: string;
      teamId?: string;
    };

/**
 * 本人の NBA お気に入りをトグル保存（Admin merge）。
 * チーム最大 1・選手最大 1。公開プロフィールフィールド。
 */
export async function POST(req: Request) {
  try {
    const uid = await requireUid(req);
    const body = (await req.json().catch(() => null)) as Body | null;
    if (!body || typeof body !== "object" || !("action" in body)) {
      return NextResponse.json({ error: "invalid json" }, { status: 400 });
    }

    const ref = getAdminDb().doc(`users/${uid}`);
    const snap = await ref.get();
    const current = parseNbaFavorites(
      snap.exists ? (snap.data() as Record<string, unknown>) : null
    );

    if (body.action === "toggleTeam") {
      const teamId =
        typeof body.teamId === "string" ? body.teamId.trim() : "";
      if (!isValidNbaFavoriteTeamId(teamId)) {
        return NextResponse.json({ error: "invalid_team" }, { status: 400 });
      }
      const rawSince =
        typeof body.fanSinceSeason === "string"
          ? body.fanSinceSeason.trim()
          : null;
      if (rawSince && !isValidNbaFanSinceSeason(rawSince)) {
        return NextResponse.json({ error: "invalid_season" }, { status: 400 });
      }
      const next = toggleNbaFavoriteTeam(current, teamId, rawSince);
      await ref.set(
        {
          favoriteNbaTeamId: next.favoriteNbaTeamId,
          favoriteNbaTeamFanSinceSeason: next.favoriteNbaTeamFanSinceSeason,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return NextResponse.json({ ok: true, favorites: next });
    }

    if (body.action === "togglePlayer" || body.action === "replacePlayer") {
      const playerId =
        typeof body.playerId === "string" ? body.playerId.trim() : "";
      if (!isValidNbaFavoritePlayerId(playerId)) {
        return NextResponse.json({ error: "invalid_player" }, { status: 400 });
      }
      const displayName =
        typeof body.displayName === "string"
          ? body.displayName.trim().slice(0, 80)
          : "";
      const teamId =
        typeof body.teamId === "string" ? body.teamId.trim().slice(0, 40) : "";
      const player: NbaFavoritePlayer = {
        playerId,
        displayName: displayName || `#${playerId}`,
        teamId: isValidNbaFavoriteTeamId(teamId) ? teamId : "",
      };

      if (body.action === "replacePlayer") {
        const removePlayerId =
          typeof body.removePlayerId === "string"
            ? body.removePlayerId.trim()
            : "";
        if (!isValidNbaFavoritePlayerId(removePlayerId)) {
          return NextResponse.json(
            { error: "invalid_remove_player" },
            { status: 400 }
          );
        }
        const result = replaceNbaFavoritePlayer(
          current,
          removePlayerId,
          player
        );
        if (!result.ok) {
          return NextResponse.json(
            { error: result.reason, favorites: result.next },
            { status: 400 }
          );
        }
        await ref.set(
          {
            favoriteNbaPlayers: result.next.favoriteNbaPlayers,
            updatedAt: FieldValue.serverTimestamp(),
          },
          { merge: true }
        );
        return NextResponse.json({ ok: true, favorites: result.next });
      }

      const result = toggleNbaFavoritePlayer(current, player);
      if (!result.ok) {
        return NextResponse.json(
          { error: result.reason, favorites: result.next },
          { status: result.reason === "max_players" ? 409 : 400 }
        );
      }
      await ref.set(
        {
          favoriteNbaPlayers: result.next.favoriteNbaPlayers,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
      return NextResponse.json({ ok: true, favorites: result.next });
    }

    return NextResponse.json({ error: "invalid_action" }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "server error";
    if (msg === "unauthorized") {
      return NextResponse.json({ error: msg }, { status: 401 });
    }
    console.error("POST /api/me/nba-favorites:", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
