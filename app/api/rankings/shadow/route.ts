import { NextResponse } from "next/server";
import { getAdminAuth } from "@/lib/firebaseAdmin";
import { normalizeLanguage, type Language } from "@/lib/i18n/language";
import { isPlayoffRoundKey, type PlayoffRoundKey } from "@/lib/rankings/playoffRound";
import { isRankingPhase, type RankingPhase } from "@/lib/rankings/rankingPhase";
import {
  assertProUser,
  fetchRankShadowAnalysis,
} from "@/lib/rankings/server/fetchRankShadowAnalysis";
import {
  isRankingLeagueSource,
  type RankingLeagueSource,
} from "@/lib/rankings/rankingLeagueSource";
import { isWcRankingStage, type WcRankingStage } from "@/lib/rankings/wcRankingStage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requireUid(req: Request): Promise<string> {
  const authz =
    req.headers.get("authorization") ?? req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) throw new Error("unauthorized");
  const decoded = await getAdminAuth().verifyIdToken(token);
  return decoded.uid;
}

export async function GET(req: Request) {
  try {
    const uid = await requireUid(req);
    const isPro = await assertProUser(uid);
    if (!isPro) {
      return NextResponse.json(
        { ok: false, error: "pro_required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const rawLeague = searchParams.get("league");
    const rankingLeague: RankingLeagueSource = isRankingLeagueSource(rawLeague)
      ? rawLeague
      : "worldcup";

    const rawPhase = searchParams.get("phase");
    const phase: RankingPhase = isRankingPhase(rawPhase) ? rawPhase : "playoffs";

    const rawRound = searchParams.get("round");
    const round: PlayoffRoundKey = isPlayoffRoundKey(rawRound)
      ? rawRound
      : "overall";

    const rawWcStage = searchParams.get("wcStage");
    const wcStage: WcRankingStage | null =
      rankingLeague === "worldcup" && isWcRankingStage(rawWcStage)
        ? rawWcStage
        : rankingLeague === "worldcup"
          ? "main"
          : null;

    const rawLang = searchParams.get("lang");
    const language: Language = normalizeLanguage(rawLang) ?? "ja";

    const analysis = await fetchRankShadowAnalysis({
      uid,
      rankingLeague,
      phase,
      round,
      wcStage,
      language,
    });

    if (!analysis.ok) {
      return NextResponse.json(
        { ok: false, error: analysis.reason },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { ok: true, analysis },
      {
        status: 200,
        headers: { "Cache-Control": "private, max-age=300, stale-while-revalidate=600" },
      }
    );
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    if (msg === "unauthorized") {
      return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    }
    console.error("[rankings/shadow]", e);
    return NextResponse.json(
      { ok: false, error: "internal_error" },
      { status: 500 }
    );
  }
}
