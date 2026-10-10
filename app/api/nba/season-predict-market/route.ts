export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  isSeasonPredictSubmitOpen,
  SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS,
} from "@/lib/predict/seasonPredictDeadline";
import { loadSeasonPredictMarketDoc } from "@/lib/predict/seasonPredictMarketServer";
import { requireUidFromRequest } from "@/lib/communities/serverAuth";
import { seasonStandingsDocRef } from "@/lib/predict/seasonStandingsServer";
import { seasonAwardsDocRef } from "@/lib/predict/seasonAwardsServer";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" } as const;

/**
 * 締切前の途中集計 — その種目を提出済みの本人だけに返す（提出前に見て合わせるのを防ぐ）。
 */
async function previewForSubmitter(
  req: Request,
  season: string,
  kind: "standings" | "awards"
) {
  let uid: string;
  try {
    uid = await requireUidFromRequest(req);
  } catch {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401, headers: PRIVATE_HEADERS }
    );
  }
  const db = getAdminDb();
  const subRef =
    kind === "standings"
      ? seasonStandingsDocRef(db, season, uid)
      : seasonAwardsDocRef(db, season, uid);
  const [sub, doc] = await Promise.all([
    subRef.get(),
    loadSeasonPredictMarketDoc(db, season),
  ]);
  const submitted = sub.exists && sub.get("isSubmitted") === true;
  const base = {
    ok: true,
    season,
    locked: false,
    preview: true,
    deadlineAtMs: SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS,
  };
  if (!submitted || !doc) {
    return NextResponse.json(
      {
        ...base,
        pending: true,
        standings: null,
        awards: null,
        message: submitted ? "market_pending" : "not_submitted",
      },
      { headers: PRIVATE_HEADERS }
    );
  }
  return NextResponse.json(
    {
      ...base,
      pending: false,
      builtAtMs: doc.builtAtMs,
      standings: kind === "standings" ? doc.standings : null,
      awards: kind === "awards" ? doc.awards : null,
    },
    { headers: PRIVATE_HEADERS }
  );
}

/**
 * GET /api/nba/season-predict-market?season=2026-27&kind=standings|awards|all
 * Firestore `seasonPredictMarkets/{season}` の読み取り口（締切後マーケット）。
 * 締切前は `preview=1` + Bearer で、その種目の提出者だけ途中集計を読める。
 */
export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const seasonRaw = url.searchParams.get("season")?.trim() ?? "";
    const season = seasonRaw || CURRENT_NBA_SEASON_KEY;
    const kindRaw = url.searchParams.get("kind")?.trim().toLowerCase() ?? "all";
    const kind =
      kindRaw === "standings" || kindRaw === "awards" ? kindRaw : "all";

    if (isSeasonPredictSubmitOpen()) {
      if (url.searchParams.get("preview") === "1" && kind !== "all") {
        return previewForSubmitter(req, season, kind);
      }
      return NextResponse.json(
        {
          ok: true,
          season,
          locked: false,
          pending: false,
          deadlineAtMs: SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS,
          standings: null,
          awards: null,
          message: "submit_still_open",
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120",
          },
        }
      );
    }

    const cached = unstable_cache(
      async () => loadSeasonPredictMarketDoc(getAdminDb(), season),
      ["season-predict-market", season],
      { revalidate: 300, tags: ["season-predict-market", `season-predict-market:${season}`] }
    );

    const doc = await cached();
    if (!doc) {
      return NextResponse.json(
        {
          ok: true,
          season,
          locked: true,
          pending: true,
          deadlineAtMs: SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS,
          standings: null,
          awards: null,
          message: "market_pending",
        },
        {
          headers: {
            "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
          },
        }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        season: doc.season,
        locked: true,
        pending: false,
        deadlineAtMs: SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS,
        builtAtMs: doc.builtAtMs,
        standings: kind === "awards" ? null : doc.standings,
        awards: kind === "standings" ? null : doc.awards,
      },
      {
        headers: {
          "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600",
        },
      }
    );
  } catch (e: unknown) {
    console.error("[api/nba/season-predict-market]", e);
    return NextResponse.json({ ok: false, error: "internal" }, { status: 500 });
  }
}
