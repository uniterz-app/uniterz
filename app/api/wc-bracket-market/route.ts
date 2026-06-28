import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebaseAdmin";
import { WC_KNOCKOUT_SEASON } from "@/lib/wc/wc-knockout-bracket";
import type { WcBracketState } from "@/lib/wc/wc-knockout-bracket";
import {
  aggregateWcBracketMarketFromBrackets,
  type WcBracketMarketData,
} from "@/lib/wc/wc-bracket-market-aggregate";
import { loadWcKnockoutAdvancement } from "@/lib/wc/wc-knockout-advancement-server";
import { loadWcOfficialWinners } from "@/lib/wc/wc-bracket-results-server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ApiResponse = {
  ok: boolean;
  market?: WcBracketMarketData;
  error?: string;
};

export async function GET(req: Request) {
  try {
    const adminDb = getAdminDb();
    const { searchParams } = new URL(req.url);
    const season = (searchParams.get("season") ?? WC_KNOCKOUT_SEASON).trim();

    if (!season) {
      return NextResponse.json(
        { ok: false, error: "season is required" } satisfies ApiResponse,
        { status: 400 }
      );
    }

    const snap = await adminDb
      .collection("wcBrackets")
      .where("season", "==", season)
      .get();

    const brackets: WcBracketState[] = [];
    for (const doc of snap.docs) {
      const data = doc.data();
      if (data.isSubmitted === false) continue;
      const bracket = data.bracket as WcBracketState | undefined;
      if (!bracket || typeof bracket !== "object") continue;
      brackets.push(bracket);
    }

    const advancement = await loadWcKnockoutAdvancement(season);
    const officialWinners = await loadWcOfficialWinners(season);
    const market = aggregateWcBracketMarketFromBrackets(
      brackets,
      season,
      advancement,
      officialWinners
    );

    return NextResponse.json(
      { ok: true, market } satisfies ApiResponse,
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
