/**
 * Pro Insight の表示前チェック（生成 1 回目のあと、出す前の 2 回目）。
 * Web / Native 同じ関数。勝者・推奨スコア・禁止語が混ざっていたら出さない。
 */
import type {
  PredictProBrief,
  ProBriefEdgeItem,
  ProBriefLineItem,
  ProBriefTeamCard,
} from "@/lib/predict/predictProBrief";

const MATCHUP_MAX = 2;
const SCHEDULE_MAX = 3;
const CONTEXT_MAX = 2;

const BANNED: readonly RegExp[] = [
  /勝て[るなよ]/,
  /勝利する/,
  /will win/i,
  /推奨スコア/,
  /鉄板/,
  /絶対に/,
  /guaranteed/i,
  /lock (it|this) in/i,
  /recommended (score|pick)/i,
  /pick (the )?(home|away|winner)/i,
];

function blobOfCard(card: ProBriefTeamCard): string {
  const edges = card.edges.flatMap((e) => [
    e.label,
    e.detailJa ?? "",
    e.detailEn ?? "",
  ]);
  const lines = [...card.schedule, ...card.context].flatMap((l) => [
    l.textJa,
    l.textEn,
  ]);
  return [...edges, ...lines].join("\n");
}

function hasBannedLanguage(brief: PredictProBrief): boolean {
  const text = `${blobOfCard(brief.home)}\n${blobOfCard(brief.away)}`;
  return BANNED.some((re) => re.test(text));
}

function clipEdges(edges: ProBriefEdgeItem[]): ProBriefEdgeItem[] {
  return edges.slice(0, MATCHUP_MAX);
}

function clipLines(lines: ProBriefLineItem[], max: number): ProBriefLineItem[] {
  return lines.slice(0, max);
}

function clipCard(card: ProBriefTeamCard): ProBriefTeamCard {
  return {
    edges: clipEdges(card.edges),
    schedule: clipLines(card.schedule, SCHEDULE_MAX),
    context: clipLines(card.context, CONTEXT_MAX),
  };
}

/** 表示してよい brief。禁止表現なら null（データ準備中扱い）。 */
export function sanitizeProBriefForDisplay(
  brief: PredictProBrief | null | undefined
): PredictProBrief | null {
  if (!brief) return null;
  if (hasBannedLanguage(brief)) return null;
  return {
    home: clipCard(brief.home),
    away: clipCard(brief.away),
    phase: brief.phase,
    sampleNoteJa: brief.sampleNoteJa,
    sampleNoteEn: brief.sampleNoteEn,
    gamesPlayed: brief.gamesPlayed,
    generatedAtMs: brief.generatedAtMs,
    patchedAtMs: brief.patchedAtMs,
  };
}
