export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireAdminUid } from "@/lib/admin/requireAdminUid";
import { checkJobSecret } from "@/lib/security/assertJobSecret";
import { revalidateNbaDocCache } from "@/lib/nba/nbaPublicReadDb";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  loadNbaTradeBuzzSnapshot,
  writeNbaTradeBuzzSnapshot,
} from "@/lib/nba/tradeBuzz/nbaTradeBuzzSnapshot";

function seasonFrom(raw: string | null | undefined): string {
  const s = (raw ?? "").trim();
  return /^\d{4}-\d{2}$/.test(s) ? s : CURRENT_NBA_SEASON_KEY;
}

function errorResponse(e: unknown, tag: string) {
  const msg = e instanceof Error ? e.message : String(e);
  const status = Number((e as { status?: unknown } | null)?.status);
  if (msg === "unauthorized" || msg === "forbidden") {
    return NextResponse.json({ ok: false, error: msg }, { status: 401 });
  }
  if (Number.isInteger(status) && status >= 400 && status < 500) {
    return NextResponse.json({ ok: false, error: msg }, { status });
  }
  console.error(`[nba-trade-buzz] ${tag}`, e);
  return NextResponse.json({ ok: false, error: msg }, { status: 500 });
}

/**
 * GET /api/admin/nba-trade-buzz?season=2026-27
 * POST { seasonKey?, asOfJst?, items?, confirmed?, seed?: true }
 */
export async function GET(req: Request) {
  try {
    await requireAdminUid(req);
    const url = new URL(req.url);
    const season = seasonFrom(url.searchParams.get("season"));
    const doc = await loadNbaTradeBuzzSnapshot(getAdminDb(), season);
    return NextResponse.json({
      ok: true,
      season,
      asOfJst: doc?.asOfJst ?? null,
      updatedAtMs: doc?.updatedAtMs ?? null,
      items: doc?.items ?? [],
      confirmed: doc?.confirmed ?? [],
    });
  } catch (e) {
    return errorResponse(e, "GET");
  }
}

export async function POST(req: Request) {
  try {
    if (!checkJobSecret(req)) {
      await requireAdminUid(req);
    }
    const body = (await req.json().catch(() => ({}))) as {
      seasonKey?: string;
      asOfJst?: string;
      items?: unknown;
      confirmed?: unknown;
      seed?: boolean;
    };
    const seasonKey = seasonFrom(body.seasonKey);
    const doc = await writeNbaTradeBuzzSnapshot(getAdminDb(), {
      seasonKey,
      asOfJst: body.asOfJst,
      items: body.items,
      confirmed: body.confirmed,
      seed: body.seed === true,
    });
    revalidateNbaDocCache(["nbaTradeBuzz"]);
    return NextResponse.json({
      ok: true,
      season: doc.seasonKey,
      asOfJst: doc.asOfJst,
      updatedAtMs: doc.updatedAtMs,
      itemCount: doc.items.length,
      confirmedCount: doc.confirmed.length,
    });
  } catch (e) {
    return errorResponse(e, "POST");
  }
}
