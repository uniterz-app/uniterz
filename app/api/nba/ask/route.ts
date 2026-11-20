export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin";
import { getNbaPublicReadDb } from "@/lib/nba/nbaPublicReadDb";
import { assertProUser } from "@/lib/pro/assertProUser";
import { getOpenAiApiKey } from "@/lib/openai/openaiEnv";
import {
  resolveNbaAskTimeZone,
  runNbaAsk,
  sanitizeNbaAskTurns,
} from "@/lib/nba/ask/runNbaAsk";
import {
  nbaAskAnswerLeaksInternal,
  nbaAskPrivateRefusal,
  nbaAskRedactedRefusal,
  nbaAskTurnIsPrivate,
} from "@/lib/nba/ask/nbaAskPrivate";
import {
  consumeNbaAskSafetyCaps,
  readNbaAskStatsAllowance,
  refundNbaAskDaily,
  releaseNbaAskStatsReservation,
  reserveNbaAskStatsUse,
} from "@/lib/nba/ask/nbaAskQuota";
import { writeNbaAskQuestionLog } from "@/lib/nba/ask/nbaAskQuestionLog";

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
    const language = String(body?.language ?? "ja").slice(0, 8);
    if (nbaAskTurnIsPrivate(turns)) {
      const isPro = await assertProUser(uid);
      const stats = await readNbaAskStatsAllowance(getAdminDb(), uid, isPro);
      return NextResponse.json({
        ok: true,
        answer: nbaAskPrivateRefusal(language, turns),
        statsFreeRemaining: stats.freeRemaining,
        opens: [],
        board: null,
      });
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

    const stats = await reserveNbaAskStatsUse(db, uid, isPro);
    const timeZone = resolveNbaAskTimeZone(body?.timeZone, language);
    let result: Awaited<ReturnType<typeof runNbaAsk>> | null = null;
    try {
      result = await runNbaAsk({
        db: getNbaPublicReadDb(),
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
      if (stats.reserved) await releaseNbaAskStatsReservation(db, uid);
      return NextResponse.json({ ok: false, error: "empty_answer" }, { status: 502 });
    }

    let statsFreeRemaining = stats.freeRemaining;
    if (stats.reserved && !result.usedStats) {
      await releaseNbaAskStatsReservation(db, uid);
      if (statsFreeRemaining != null) statsFreeRemaining += 1;
    }
    const leaked = nbaAskAnswerLeaksInternal(result.answer);
    const answer = leaked ? nbaAskRedactedRefusal(language) : result.answer;
    const question = turns[turns.length - 1]!.content;
    // 実際の費用を測るため（1 質問 1 行）
    console.info(
      "[nba-ask] usage",
      JSON.stringify({
        pro: isPro,
        stats: result.usedStats,
        leaked,
        fast: result.fast,
        kind: result.intent.kind,
        query: result.intent.query,
        in: result.promptTokens,
        out: result.completionTokens,
        cached: result.cachedTokens,
      })
    );
    // 改良用ログ（答え全文は残さない・失敗しても返答は返す）
    void writeNbaAskQuestionLog(db, {
      uid,
      question,
      language,
      isPro,
      usedStats: result.usedStats,
      fast: result.fast,
      leaked,
      intent: result.intent,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      cachedTokens: result.cachedTokens,
    }).catch((e) => console.error("[nba-ask] question-log", e));
    return NextResponse.json({
      ok: true,
      answer,
      statsFreeRemaining,
      opens: leaked ? [] : result.opens,
      board: leaked ? null : result.board,
      games: leaked ? null : result.games,
      moves: leaked ? null : result.moves,
      view: leaked ? null : result.view,
    });
  } catch (e: unknown) {
    console.error("[POST /api/nba/ask]", e);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
}
