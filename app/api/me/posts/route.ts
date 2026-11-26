export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { clientErrorResponse } from "@/lib/security/clientErrorResponse";
import { normalizeLanguage, type Language } from "@/lib/i18n/language";
import { RESULT_LIST_LEAGUE_TABS } from "@/lib/result/result-page-data";
import { isWcRankingStage } from "@/lib/rankings/wcRankingStage";
import {
  loadLatestSettledAtMs,
  loadMyPostsForGameIds,
  loadMyResultPosts,
  loadRecentWinFlags,
  loadSettledTodayPosts,
  MINE_MAX_IDS,
} from "@/lib/posts/loadMyPosts";

const RESULT_MAX_LIMIT = 20;
const RECENT_WINS_MAX = 20;
const NO_STORE = { headers: { "Cache-Control": "private, no-store" } } as const;

function parseLimit(raw: string | null, fallback: number, max: number): number {
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.min(max, Math.floor(n));
}

function parseLanguage(raw: string | null): Language {
  return normalizeLanguage(raw) ?? "ja";
}

export async function GET(req: Request) {
  try {
    const uid = await requireUidFromRequest(req);
    const url = new URL(req.url);
    const view = (url.searchParams.get("view") ?? "result").trim();
    const db = getAdminDb();

    if (view === "result") {
      const league = url.searchParams.get("league")?.trim() ?? "";
      if (
        !RESULT_LIST_LEAGUE_TABS.includes(
          league as (typeof RESULT_LIST_LEAGUE_TABS)[number]
        )
      ) {
        return NextResponse.json({ ok: false, error: "league required" }, { status: 400 });
      }
      const fillDays = parseLimit(url.searchParams.get("fillDays"), 0, 8);
      const beforeRaw = url.searchParams.get("beforeMs");
      const beforeMs =
        beforeRaw && Number.isFinite(Number(beforeRaw))
          ? Number(beforeRaw)
          : undefined;
      const data = await loadMyResultPosts(db, {
        uid,
        league,
        pageLimit: parseLimit(url.searchParams.get("limit"), 10, RESULT_MAX_LIMIT),
        beforeMs,
        fillDays: fillDays > 0 ? fillDays : undefined,
        language: parseLanguage(url.searchParams.get("lang")),
      });
      return NextResponse.json(
        { ok: true, ...data },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    if (view === "mine") {
      const gameIds = (url.searchParams.get("gameIds") ?? "")
        .split(",")
        .map((id) => id.trim())
        .filter(Boolean)
        .slice(0, MINE_MAX_IDS);
      const posts = await loadMyPostsForGameIds(db, uid, gameIds);
      return NextResponse.json({ ok: true, posts }, NO_STORE);
    }

    if (view === "latestSettled") {
      const settledAtMs = await loadLatestSettledAtMs(db, uid);
      return NextResponse.json(
        { ok: true, settledAtMs },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    if (view === "recentWins") {
      const sinceMs = Number(url.searchParams.get("sinceMs"));
      if (!Number.isFinite(sinceMs) || sinceMs <= 0) {
        return NextResponse.json({ ok: false, error: "sinceMs required" }, { status: 400 });
      }
      const wins = await loadRecentWinFlags(
        db,
        uid,
        sinceMs,
        parseLimit(url.searchParams.get("limit"), 20, RECENT_WINS_MAX)
      );
      return NextResponse.json(
        { ok: true, wins },
        { headers: { "Cache-Control": "private, no-store" } }
      );
    }

    if (view === "settledToday") {
      const slate = url.searchParams.get("slate")?.trim() ?? "";
      if (!/^\d{4}-\d{2}-\d{2}$/.test(slate)) {
        return NextResponse.json({ ok: false, error: "slate required" }, { status: 400 });
      }
      const wcStageRaw = url.searchParams.get("wcStage")?.trim();
      const posts = await loadSettledTodayPosts(db, uid, slate, {
        rankingLeague: "nba",
        wcStage:
          wcStageRaw && isWcRankingStage(wcStageRaw) ? wcStageRaw : undefined,
      });
      return NextResponse.json({ ok: true, posts }, NO_STORE);
    }

    return NextResponse.json({ ok: false, error: "unknown view" }, { status: 400 });
  } catch (e: unknown) {
    return clientErrorResponse(e, "GET /api/me/posts");
  }
}
