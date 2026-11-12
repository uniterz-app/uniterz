/**
 * 直近に終わった NBA 試合の Pro Insight 展望を採点して `gameProInsights/{gameId}.proInsightAudit` に書く。
 * Firestore だけ（BDL・OpenAI なし）。日次 ingest の最後のステップ。
 */
import { Timestamp, type Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import type { ProInsightOutlookAnalysis } from "@/lib/nba/insights/proInsightFacts/buildOutlookAnalysis";
import { gameProInsightRef } from "@/lib/nba/insights/gameProInsightStore";
import {
  buildProInsightAudit,
  PRO_INSIGHT_AUDIT_VERSION,
  type ProInsightAuditBoxPlayer,
} from "@/lib/nba/insights/proInsightAudit/buildProInsightAudit";

export type RunProInsightAuditsResult = {
  finishedGames: number;
  withPreview: number;
  written: number;
};

export async function runProInsightAudits(
  db: Firestore,
  opts: { seasonKey?: string; lookbackDays?: number; force?: boolean; nowMs?: number } = {}
): Promise<RunProInsightAuditsResult> {
  const nowMs = opts.nowMs ?? Date.now();
  const lookbackDays = opts.lookbackDays ?? 3;
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", opts.seasonKey ?? CURRENT_NBA_SEASON_KEY)
    .where("startAtJst", ">=", Timestamp.fromMillis(nowMs - lookbackDays * 86_400_000))
    .where("startAtJst", "<", Timestamp.fromMillis(nowMs))
    .select("status", "final", "liveStats.box")
    .get();

  const finished = snap.docs.filter((d) => {
    const g = d.data() as { status?: unknown; final?: unknown; liveStats?: { box?: unknown } };
    const box = g.liveStats?.box as { home?: unknown; away?: unknown } | undefined;
    return (g.status === "final" || g.final === true) && Array.isArray(box?.home) && Array.isArray(box?.away);
  });
  if (!finished.length) return { finishedGames: 0, withPreview: 0, written: 0 };

  const insightSnaps = await db.getAll(...finished.map((d) => gameProInsightRef(db, d.id)), {
    fieldMask: ["proInsightFacts.preview.analysis", "proInsightNarrative.preview", "proInsightAudit.v"],
  });

  let withPreview = 0;
  let written = 0;
  for (let i = 0; i < finished.length; i++) {
    const ins = insightSnaps[i]!.data() as
      | {
          proInsightFacts?: { preview?: { analysis?: ProInsightOutlookAnalysis | null } };
          proInsightNarrative?: { preview?: { ja?: string; en?: string } | null };
          proInsightAudit?: { v?: number };
        }
      | undefined;
    const analysis = ins?.proInsightFacts?.preview?.analysis;
    const preview = ins?.proInsightNarrative?.preview;
    if (!analysis?.teams?.length || !preview) continue;
    withPreview += 1;
    if (!opts.force && ins?.proInsightAudit?.v === PRO_INSIGHT_AUDIT_VERSION) continue;
    const box = (finished[i]!.data() as { liveStats: { box: Record<"home" | "away", ProInsightAuditBoxPlayer[]> } })
      .liveStats.box;
    const audit = buildProInsightAudit({
      analysis,
      previewText: [preview.ja ?? "", preview.en ?? ""].join("\n"),
      box: { home: box.home, away: box.away },
      nowMs,
    });
    await gameProInsightRef(db, finished[i]!.id).set(
      { proInsightAudit: audit },
      { mergeFields: ["proInsightAudit"] }
    );
    written += 1;
  }
  return { finishedGames: finished.length, withPreview, written };
}
