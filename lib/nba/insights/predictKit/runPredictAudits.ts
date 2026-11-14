/**
 * 終わった試合の「予想の材料」（predictKit・本番）・平均得失点差のままの版（predictKitRaw）・裏のシミュレーション（simShadow）を採点して
 * `gameProInsights/{gameId}.predictAudit` に書く。シミュの点差の残差は `nbaPredictShadowMeta/{season}` に溜め、
 * 次の試合のばらつき（simShockSd）を合わせ直す。本番の勝敗と得点王の 1 番手の当たり外れは同じ doc の `kitResults`
 * （試合 ID ごと・何度採点しても 1 件）に入れ、次の予想の材料の「今季の成績」になる。Firestore だけ（BDL・OpenAI なし）。日次 ingest の最後。
 */
import { FieldValue, Timestamp, type Firestore } from "firebase-admin/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import { gameProInsightRef } from "@/lib/nba/insights/gameProInsightStore";
import { normalizeNbaLeadingScorers } from "@/lib/nba/topScorer";
import {
  sanitizeProInsightPredictKit,
  type ProInsightPredictKit,
} from "@/lib/nba/insights/predictKit/predictKitTypes";
import {
  PREDICT_SHADOW_META_COLLECTION,
  simShockSdOf,
  type PredictShadowMeta,
  type SimShadow,
} from "@/lib/nba/insights/predictKit/refreshPredictKits";

export const PREDICT_AUDIT_VERSION = 1;
const SIM_RESIDUALS_KEEP = 400;

/** 1 エンジンぶんの採点。誤差は 実際 − 予想（ホーム視点の点差・合計） */
export type PredictAuditEngine = {
  homeWinPct: number;
  /** 確率が 50% ちょうどのときは null */
  pickedRight: boolean | null;
  brier: number;
  marginPred: number;
  marginErr: number;
  totalPred: number;
  totalErr: number;
  inBand: boolean;
};

export type PredictAudit = {
  v: number;
  actual: { homeMargin: number; total: number };
  /** 本番に出した予想の材料 */
  kit: PredictAuditEngine | null;
  /** 本番の実力差の出どころ（cleanSos = ガベージタイム抜き + 相手補正 / raw = 平均得失点差） */
  kitBasis?: "cleanSos" | "raw";
  /** 平均得失点差のままの版（裏の比較用） */
  kitRaw?: PredictAuditEngine | null;
  sim: PredictAuditEngine | null;
  /** 得点王の候補の 1 番手（pick・確率 %）が当たったか / 上位 3 人に得点王がいたか */
  scorer?: { pick: string; pct: number; hit: boolean; top3: boolean };
};

export type RunPredictAuditsResult = {
  finishedGames: number;
  written: number;
  withKit: number;
  withSim: number;
  simShockSd: number | null;
};

const r1 = (x: number) => Math.round(x * 10) / 10;

export function scorePredictEngine(
  p: { homeWinPct: number; homeMargin: number; total: number; low: number; high: number },
  actual: { homeMargin: number; total: number }
): PredictAuditEngine {
  const won = actual.homeMargin > 0 ? 1 : 0;
  const prob = p.homeWinPct / 100;
  return {
    homeWinPct: r1(p.homeWinPct),
    pickedRight: p.homeWinPct === 50 ? null : (p.homeWinPct > 50) === (won === 1),
    brier: Math.round((prob - won) ** 2 * 1000) / 1000,
    marginPred: r1(p.homeMargin),
    marginErr: r1(actual.homeMargin - p.homeMargin),
    totalPred: r1(p.total),
    totalErr: r1(actual.total - p.total),
    inBand: actual.total >= p.low && actual.total <= p.high,
  };
}

function scoreKit(kit: ProInsightPredictKit, actual: { homeMargin: number; total: number }): PredictAuditEngine {
  const homeFavored = kit.favoredTeamId === kit.teams[0].teamId;
  return scorePredictEngine(
    {
      homeWinPct: homeFavored ? kit.winPct : 100 - kit.winPct,
      homeMargin: homeFavored ? kit.margin : -kit.margin,
      total: kit.score.total,
      low: kit.score.low,
      high: kit.score.high,
    },
    actual
  );
}

export async function runPredictAudits(
  db: Firestore,
  opts: { seasonKey?: string; lookbackDays?: number; force?: boolean; nowMs?: number } = {}
): Promise<RunPredictAuditsResult> {
  const seasonKey = opts.seasonKey ?? CURRENT_NBA_SEASON_KEY;
  const nowMs = opts.nowMs ?? Date.now();
  const lookbackDays = opts.lookbackDays ?? 3;
  const snap = await db
    .collection("games")
    .where("league", "==", "nba")
    .where("season", "==", seasonKey)
    .where("startAtJst", ">=", Timestamp.fromMillis(nowMs - lookbackDays * 86_400_000))
    .where("startAtJst", "<", Timestamp.fromMillis(nowMs))
    .select("status", "final", "homeScore", "awayScore", "leadingScorers", "startAtJst")
    .get();
  const finished = snap.docs.filter((d) => {
    const g = d.data();
    return (g.status === "final" || g.final === true) && Number(g.homeScore) > 0 && Number(g.awayScore) > 0;
  });
  const empty = { finishedGames: finished.length, written: 0, withKit: 0, withSim: 0, simShockSd: null };
  if (!finished.length) return empty;

  const insightSnaps = await db.getAll(...finished.map((d) => gameProInsightRef(db, d.id)), {
    fieldMask: ["predictKit", "predictKitRaw", "simShadow", "predictAudit.v"],
  });

  let written = 0;
  let withKit = 0;
  let withSim = 0;
  const newPairs: Array<{ p: number; a: number }> = [];
  const kitResults: NonNullable<PredictShadowMeta["kitResults"]> = {};
  for (let i = 0; i < finished.length; i++) {
    const ins = insightSnaps[i]!.data() as
      | { predictKit?: unknown; predictKitRaw?: unknown; simShadow?: SimShadow; predictAudit?: { v?: number } }
      | undefined;
    const kit = sanitizeProInsightPredictKit(ins?.predictKit);
    const kitRaw = sanitizeProInsightPredictKit(ins?.predictKitRaw);
    const sim = ins?.simShadow && typeof ins.simShadow.homeWinPct === "number" ? ins.simShadow : null;
    if (!kit && !sim) continue;
    if (kit) withKit += 1;
    if (sim) withSim += 1;
    const audited = ins?.predictAudit?.v === PREDICT_AUDIT_VERSION;
    if (audited && !opts.force) continue;

    const g = finished[i]!.data();
    const actual = {
      homeMargin: Number(g.homeScore) - Number(g.awayScore),
      total: Number(g.homeScore) + Number(g.awayScore),
    };
    const leaders = normalizeNbaLeadingScorers(g.leadingScorers);
    const scorer =
      kit?.scorers?.length && leaders.length
        ? {
            pick: kit.scorers[0]!.playerId,
            pct: kit.scorers[0]!.pct,
            hit: leaders.some((l) => l.playerId === kit.scorers![0]!.playerId),
            top3: kit.scorers.some((s) => leaders.some((l) => l.playerId === s.playerId)),
          }
        : null;
    const kitScore = kit ? scoreKit(kit, actual) : null;
    if (kit && kitScore?.pickedRight != null) {
      kitResults[finished[i]!.id] = {
        p: kit.winPct,
        h: kitScore.pickedRight ? 1 : 0,
        ...(scorer ? { s: scorer.hit ? (1 as const) : (0 as const) } : {}),
        ...(g.startAtJst instanceof Timestamp ? { t: g.startAtJst.toMillis() } : {}),
      };
    }
    const audit: PredictAudit = {
      v: PREDICT_AUDIT_VERSION,
      actual,
      kit: kitScore,
      ...(scorer ? { scorer } : {}),
      kitBasis: kit?.strengthBasis ?? "raw",
      kitRaw: kitRaw ? scoreKit(kitRaw, actual) : null,
      sim: sim
        ? scorePredictEngine(
            {
              homeWinPct: sim.homeWinPct,
              homeMargin: sim.marginP50,
              total: sim.total.p50,
              low: sim.total.p25,
              high: sim.total.p75,
            },
            actual
          )
        : null,
    };
    await gameProInsightRef(db, finished[i]!.id).set(
      { predictAudit: { ...audit, auditedAtMs: nowMs } },
      { mergeFields: ["predictAudit"] }
    );
    written += 1;
    if (sim && !audited) newPairs.push({ p: sim.marginP50, a: actual.homeMargin });
  }

  if (Object.keys(kitResults).length) {
    await db
      .collection(PREDICT_SHADOW_META_COLLECTION)
      .doc(seasonKey)
      .set({ kitResults }, { merge: true });
  }

  let simShockSd: number | null = null;
  if (newPairs.length) {
    const metaRef = db.collection(PREDICT_SHADOW_META_COLLECTION).doc(seasonKey);
    simShockSd = await db.runTransaction(async (tx) => {
      const meta = ((await tx.get(metaRef)).data() as PredictShadowMeta | undefined) ?? {};
      const pairs = [...(meta.simResidualPairs ?? []), ...newPairs].slice(-SIM_RESIDUALS_KEEP);
      const sd = r1(simShockSdOf({ simResidualPairs: pairs }));
      tx.set(
        metaRef,
        { simResidualPairs: pairs, simShockSd: sd, updatedAt: FieldValue.serverTimestamp() },
        { merge: true }
      );
      return sd;
    });
  }
  return { finishedGames: finished.length, written, withKit, withSim, simShockSd };
}
