export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { assertProUser } from "@/lib/pro/assertProUser";
import { getOpenAiApiKey } from "@/lib/openai/openaiEnv";
import {
  resolveNbaAskTimeZone,
  runNbaAsk,
  sanitizeNbaAskTurns,
} from "@/lib/nba/ask/runNbaAsk";
import {
  consumeNbaAskSafetyCaps,
  readNbaAskStatsAllowance,
  recordNbaAskStatsUse,
  refundNbaAskDaily,
} from "@/lib/nba/ask/nbaAskQuota";

async function requireUid(req: Request): Promise<string | null> {
  const authz = req.headers.get("authorization") || req.headers.get("Authorization");
  const token = authz?.startsWith("Bearer ") ? authz.slice(7) : null;
  if (!token) return null;
  try {
    return (await getAdminAuth().verifyIdToken(token)).uid;
  } catch {
    return null;
  }
}

/**
 * GET /api/nba/ask — 今の利用状況（消費しない）。
 * statsFreeRemaining: 無料のスタッツ質問の残り（Pro は null = 無制限）
 */
export async function GET(req: Request) {
  try {
    const uid = await requireUid(req);
    if (!uid) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
    const isPro = await assertProUser(uid);
    const stats = await readNbaAskStatsAllowance(getAdminDb(), uid, isPro);
    return NextResponse.json(
      {
        ok: true,
        isPro,
        statsFreeRemaining: stats.freeRemaining,
        available: Boolean(getOpenAiApiKey()),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    );
  } catch (e: unknown) {
    console.error("[GET /api/nba/ask]", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}

/**
 * POST /api/nba/ask — アプリの使い方と NBA スタッツの質問に答える（Bearer 必須）。
 * body: { messages: [{ role: "user" | "assistant", content }], language?, timeZone? }
 * データは Firestore スナップショットとアプリのヘルプ文言だけ（BDL は叩かない）。
 */
export async function POST(req: Request) {
  try {
    const uid = await requireUid(req);
    if (!uid) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => null)) as {
      messages?: unknown;
      language?: unknown;
      timeZone?: unknown;
    } | null;
    const turns = sanitizeNbaAskTurns(body?.messages);
    if (turns.length === 0 || turns[turns.length - 1].role !== "user") {
      return NextResponse.json({ ok: false, error: "question required" }, { status: 400 });
    }
    if (!getOpenAiApiKey()) {
      return NextResponse.json({ ok: false, error: "not_configured" }, { status: 503 });
    }

    const db = getAdminDb();
    const isPro = await assertProUser(uid);
    const caps = await consumeNbaAskSafetyCaps(db, uid, isPro);
    if (!caps.ok) {
      return NextResponse.json(
        { ok: false, error: caps.reason === "per_minute" ? "slow_down" : "rate_limited" },
        { status: 429 }
      );
    }

    const stats = await readNbaAskStatsAllowance(db, uid, isPro);
    const language = String(body?.language ?? "ja").slice(0, 8);
    const timeZone = resolveNbaAskTimeZone(body?.timeZone, language);
    let result: Awaited<ReturnType<typeof runNbaAsk>> | null = null;
    try {
      result = await runNbaAsk({
        db,
        turns,
        language,
        timeZone,
        allowStats: stats.allowed,
        isPro,
        uid,
      });
    } catch (e) {
      console.error("[POST /api/nba/ask] llm", e);
    }
    if (!result?.answer) {
      await refundNbaAskDaily(db, uid);
      return NextResponse.json({ ok: false, error: "empty_answer" }, { status: 502 });
    }

    let statsFreeRemaining = stats.freeRemaining;
    if (result.usedStats) {
      await recordNbaAskStatsUse(db, uid, isPro);
      if (statsFreeRemaining != null) statsFreeRemaining = Math.max(0, statsFreeRemaining - 1);
    }
    // 実際の費用を測るため（1 質問 1 行）
    console.info(
      "[nba-ask] usage",
      JSON.stringify({
        pro: isPro,
        stats: result.usedStats,
        in: result.promptTokens,
        out: result.completionTokens,
      })
    );
    return NextResponse.json({
      ok: true,
      answer: result.answer,
      statsFreeRemaining,
      opens: result.opens,
    });
  } catch (e: unknown) {
    console.error("[POST /api/nba/ask]", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
