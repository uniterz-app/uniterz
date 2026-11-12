/**
 * Pro Insight 展望（PREVIEW）の試合後採点。純関数。
 * 展望の材料（`proInsightFacts.preview.analysis`）の主力ごとに、得点レンジ・ポジション別失点の読み・直近の好不調を
 * 試合の box と照合する。集計は scripts/report-pro-insight-audit.ts。
 */
import type {
  OutlookKeyPlayer,
  ProInsightOutlookAnalysis,
} from "@/lib/nba/insights/proInsightFacts/buildOutlookAnalysis";
import { previewShortName } from "@/lib/nba/insights/proInsightFacts/buildPreviewFacts";

export const PRO_INSIGHT_AUDIT_VERSION = 1;

/** formNote が無い旧データで好不調とみなす直近 5 試合と平均の差 */
const LEGACY_FORM_GAP_PTS = 4;

export type ProInsightAuditBoxPlayer = {
  playerId?: string | number | null;
  firstName?: string | null;
  lastName?: string | null;
  min?: number | null;
  pts?: number | null;
};

export type ProInsightAuditPlayer = {
  playerId: string | null;
  name: string;
  team: string;
  ppg: number;
  low: number | null;
  high: number | null;
  played: boolean;
  pts: number | null;
  /** 実得点 − 今季平均 */
  diff: number | null;
  inRange: boolean | null;
  /** 展望の本文で名前が出たか */
  mentioned: boolean;
  /** 相手がその選手のポジションに弱い（weak）/ 堅い（stingy）と材料にあったか */
  posRead: "weak" | "stingy" | null;
  /** weak → 平均超え、stingy → 平均未満なら当たり */
  posHit: boolean | null;
  form: "hot" | "cold" | null;
  /** 好調 → 直近 5 試合平均を下回った / 不調 → 上回った（平均へ戻った） */
  formReverted: boolean | null;
};

export type ProInsightAuditSummary = {
  players: number;
  rangeN: number;
  inRange: number;
  absErrVsAvg: number;
  posN: number;
  posHits: number;
  formN: number;
  formReverted: number;
  mentionedN: number;
  mentionedAboveAvg: number;
};

export type ProInsightAudit = {
  v: number;
  auditedAtMs: number;
  players: ProInsightAuditPlayer[];
  summary: ProInsightAuditSummary;
};

function posReadOf(line: string | undefined): "weak" | "stingy" | null {
  if (!line) return null;
  if (/weakness/.test(line)) return "weak";
  if (/stingi|tough matchup/.test(line)) return "stingy";
  return null;
}

function formOf(kp: OutlookKeyPlayer): "hot" | "cold" | null {
  if (kp.formNote) return kp.formNote.startsWith("hot") ? "hot" : kp.formNote.startsWith("cold") ? "cold" : null;
  if (kp.last5Ppg == null) return null;
  const gap = kp.last5Ppg - kp.ppg;
  return gap >= LEGACY_FORM_GAP_PTS ? "hot" : gap <= -LEGACY_FORM_GAP_PTS ? "cold" : null;
}

function findBoxRow(
  kp: OutlookKeyPlayer,
  box: ProInsightAuditBoxPlayer[]
): ProInsightAuditBoxPlayer | null {
  if (kp.playerId) {
    const byId = box.find((b) => String(b.playerId ?? "") === kp.playerId);
    if (byId) return byId;
  }
  const name = kp.name.toLowerCase();
  return (
    box.find((b) => previewShortName(String(b.firstName ?? ""), String(b.lastName ?? "")).toLowerCase() === name) ??
    null
  );
}

export function buildProInsightAudit(input: {
  analysis: ProInsightOutlookAnalysis;
  /** 展望の本文（ja と en をつないだもの） */
  previewText: string;
  box: { away: ProInsightAuditBoxPlayer[]; home: ProInsightAuditBoxPlayer[] };
  nowMs: number;
}): ProInsightAudit {
  const text = input.previewText.toLowerCase();
  const players: ProInsightAuditPlayer[] = [];
  // analysis.teams は [away, home] の順
  input.analysis.teams.forEach((team, i) => {
    const box = i === 0 ? input.box.away : input.box.home;
    for (const kp of team.keyPlayers) {
      const row = findBoxRow(kp, box);
      const played = !!row && (row.min ?? 0) > 0;
      const pts = played ? Number(row!.pts ?? 0) : null;
      const diff = pts != null ? Math.round((pts - kp.ppg) * 10) / 10 : null;
      const low = kp.pointsRange?.low ?? null;
      const high = kp.pointsRange?.high ?? null;
      const posRead = posReadOf(kp.opponentVsPosition);
      const form = formOf(kp);
      players.push({
        playerId: kp.playerId ?? (row?.playerId != null ? String(row.playerId) : null),
        name: kp.name,
        team: team.team,
        ppg: kp.ppg,
        low,
        high,
        played,
        pts,
        diff,
        inRange: pts != null && low != null && high != null ? pts >= low && pts <= high : null,
        mentioned: text.includes(kp.name.toLowerCase()),
        posRead,
        posHit: diff != null && posRead ? (posRead === "weak" ? diff > 0 : diff < 0) : null,
        form,
        formReverted:
          pts != null && form && kp.last5Ppg != null
            ? form === "hot"
              ? pts < kp.last5Ppg
              : pts > kp.last5Ppg
            : null,
      });
    }
  });

  const playedRows = players.filter((p) => p.played);
  const summary: ProInsightAuditSummary = {
    players: playedRows.length,
    rangeN: playedRows.filter((p) => p.inRange != null).length,
    inRange: playedRows.filter((p) => p.inRange === true).length,
    absErrVsAvg: Math.round(playedRows.reduce((s, p) => s + Math.abs(p.diff ?? 0), 0) * 10) / 10,
    posN: playedRows.filter((p) => p.posHit != null).length,
    posHits: playedRows.filter((p) => p.posHit === true).length,
    formN: playedRows.filter((p) => p.formReverted != null).length,
    formReverted: playedRows.filter((p) => p.formReverted === true).length,
    mentionedN: playedRows.filter((p) => p.mentioned).length,
    mentionedAboveAvg: playedRows.filter((p) => p.mentioned && (p.diff ?? 0) > 0).length,
  };

  return { v: PRO_INSIGHT_AUDIT_VERSION, auditedAtMs: input.nowMs, players, summary };
}
