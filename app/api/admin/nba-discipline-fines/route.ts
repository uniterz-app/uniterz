export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { loadTeamRostersSnapshot } from "@/lib/nba/teamRosters/loadTeamRostersSnapshot";
import {
  listDisciplineFines,
  loadNbaDisciplineSnapshot,
  NBA_DISCIPLINE_FINES_COLLECTION,
  rebuildNbaDisciplineSnapshot,
} from "@/lib/nba/discipline/nbaDisciplineSnapshot";
import { normalizeNbaPersonName } from "@/lib/nba/discipline/parseBdlPlaysDiscipline";
import { revalidateNbaDisciplineApiCache } from "@/lib/nba/discipline/nbaDisciplineApiCache";
import type { NbaDisciplineFineDoc } from "@/lib/nba/discipline/disciplineTypes";
import { translateDisciplineReasons } from "@/lib/nba/discipline/translateDisciplineReason";

/**
 * 罰金の手入力（管理画面）。書き込み後に `nbaDiscipline/{season}` を作り直す。
 *
 * GET    ?season=2026-27            → 罰金一覧
 * GET    ?season=2026-27&q=green    → 選手候補（ロスター / 規律スナップショット）
 * POST   { seasonKey, seasonType, playerId, playerName, teamId, amountUsd, date, reason }
 *        出場停止は { kind: "suspension", games, onCourt, salaryUsd? }（金額は集計時に年俸から計算）
 *        取り消しは { kind: "rescind", rescindKind: "tech"|"flag"|"eject", date: 試合日 }
 * DELETE ?id=xxx
 */

function seasonFrom(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  return /^\d{4}-\d{2}$/.test(s) ? s : CURRENT_NBA_SEASON_KEY;
}

function errorResponse(e: unknown, tag: string) {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg === "unauthorized" || msg === "forbidden") {
    return NextResponse.json({ ok: false, error: msg }, { status: 401 });
  }
  console.error(`[nba-discipline-fines] ${tag}`, e);
  return NextResponse.json({ ok: false, error: msg }, { status: 500 });
}

type Candidate = { playerId: string; playerName: string; teamId: string };

async function searchCandidates(season: string, q: string): Promise<Candidate[]> {
  const db = getAdminDb();
  const needle = normalizeNbaPersonName(q);
  if (!needle) return [];
  const out = new Map<string, Candidate>();
  const rosters = await loadTeamRostersSnapshot(db, season);
  for (const team of Object.values(rosters.bundle.teams)) {
    for (const p of team.players) {
      const name = `${p.firstName} ${p.lastName}`.trim();
      if (normalizeNbaPersonName(name).includes(needle)) {
        out.set(String(p.id), {
          playerId: String(p.id),
          playerName: name,
          teamId: team.teamId,
        });
      }
    }
  }
  const snapshot = await loadNbaDisciplineSnapshot(db, season);
  for (const [id, p] of Object.entries(snapshot?.players ?? {})) {
    if (out.has(id) || !p.teamId) continue;
    if (normalizeNbaPersonName(p.name).includes(needle)) {
      out.set(id, { playerId: id, playerName: p.name, teamId: p.teamId });
    }
  }
  return [...out.values()].slice(0, 20);
}

export async function GET(req: Request) {
  try {
    await requireAdminUid(req);
    const url = new URL(req.url);
    const season = seasonFrom(url.searchParams.get("season"));
    const q = url.searchParams.get("q");
    if (q != null) {
      return NextResponse.json({
        ok: true,
        season,
        candidates: await searchCandidates(season, q),
      });
    }
    const fines = await listDisciplineFines(getAdminDb(), season);
    return NextResponse.json({ ok: true, season, fines });
  } catch (e) {
    return errorResponse(e, "GET");
  }
}

export async function POST(req: Request) {
  try {
    await requireAdminUid(req);
    const body = (await req.json().catch(() => ({}))) as Partial<NbaDisciplineFineDoc>;
    const seasonKey = seasonFrom(body.seasonKey);
    const playerId = String(body.playerId ?? "").trim();
    const teamId = String(body.teamId ?? "").trim();
    const kind =
      body.kind === "suspension" || body.kind === "rescind" ? body.kind : "fine";
    const rescindKind =
      body.rescindKind === "tech" || body.rescindKind === "flag" || body.rescindKind === "eject"
        ? body.rescindKind
        : null;
    const amountUsd = kind === "fine" ? Number(body.amountUsd) : 0;
    const games = Math.trunc(Number(body.games));
    const date = String(body.date ?? "").trim();
    if (!playerId || !teamId) {
      return NextResponse.json({ ok: false, error: "player_required" }, { status: 400 });
    }
    if (kind === "fine" && (!Number.isFinite(amountUsd) || amountUsd <= 0)) {
      return NextResponse.json({ ok: false, error: "amount_invalid" }, { status: 400 });
    }
    if (kind === "suspension" && (!Number.isFinite(games) || games <= 0)) {
      return NextResponse.json({ ok: false, error: "games_invalid" }, { status: 400 });
    }
    if (kind === "rescind" && !rescindKind) {
      return NextResponse.json({ ok: false, error: "rescind_kind_invalid" }, { status: 400 });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json({ ok: false, error: "date_invalid" }, { status: 400 });
    }
    const doc: NbaDisciplineFineDoc = {
      seasonKey,
      seasonType: body.seasonType === "playoffs" ? "playoffs" : "regular",
      kind,
      ...(kind === "suspension" ? { games, onCourt: body.onCourt === true } : {}),
      ...(kind === "suspension" && body.withholdingServices === true
        ? { withholdingServices: true }
        : {}),
      ...(kind === "suspension" && Math.trunc(Number(body.totalGames)) > games
        ? { totalGames: Math.trunc(Number(body.totalGames)) }
        : {}),
      ...(kind === "suspension" && Number(body.salaryUsd) > 0
        ? { salaryUsd: Math.round(Number(body.salaryUsd)) }
        : {}),
      ...(kind === "rescind" && rescindKind ? { rescindKind } : {}),
      playerId,
      playerName: String(body.playerName ?? "").trim() || `Player ${playerId}`,
      teamId,
      amountUsd: Math.round(amountUsd),
      date,
      reason: String(body.reason ?? "").trim().slice(0, 200),
      createdAtMs: Date.now(),
    };
    const db = getAdminDb();
    if (doc.reason && kind !== "rescind") {
      const i18n = await translateDisciplineReasons(db, [doc.reason]).catch((e) => {
        console.error("[nba-discipline-fines] translate", e);
        return null;
      });
      const hit = i18n?.get(doc.reason);
      if (hit) doc.reasonI18n = hit;
    }
    const ref = await db.collection(NBA_DISCIPLINE_FINES_COLLECTION).add(doc);
    await rebuildNbaDisciplineSnapshot(db, seasonKey);
    revalidateNbaDisciplineApiCache();
    return NextResponse.json({ ok: true, id: ref.id });
  } catch (e) {
    return errorResponse(e, "POST");
  }
}

export async function DELETE(req: Request) {
  try {
    await requireAdminUid(req);
    const id = new URL(req.url).searchParams.get("id")?.trim();
    if (!id) {
      return NextResponse.json({ ok: false, error: "id_required" }, { status: 400 });
    }
    const db = getAdminDb();
    const ref = db.collection(NBA_DISCIPLINE_FINES_COLLECTION).doc(id);
    const snap = await ref.get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "not_found" }, { status: 404 });
    }
    const seasonKey = (snap.data() as NbaDisciplineFineDoc).seasonKey;
    await ref.delete();
    await rebuildNbaDisciplineSnapshot(db, seasonKey);
    revalidateNbaDisciplineApiCache();
    return NextResponse.json({ ok: true });
  } catch (e) {
    return errorResponse(e, "DELETE");
  }
}
