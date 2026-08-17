/**
 * 予想オーバーレイ Insight（Pro Brief）プレビュー用モック。
 * 後で本番 brief API に差し替え。
 */

import type { PredictProBrief } from "@/lib/predict/predictProBrief";

function matchupKey(homeTeamId: string, awayTeamId: string): string {
  return `${homeTeamId.trim()}|${awayTeamId.trim()}`;
}

/** 2026-27 開幕 Celtics @ Pistons — Injury / Stats モックと揃える */
const PISTONS_CELTICS_OPENING_BRIEF: PredictProBrief = {
  home: {
    edges: [
      {
        label: "HOME COURT",
        detailJa: "前季ホーム 33-8 · NetRtg #3",
        detailEn: "Last season home 33-8 · NetRtg #3",
      },
      {
        label: "PAINT ATTACK",
        detailJa: "ペイント得点 #4 · Duren OUT でサイズ減",
        detailEn: "Paint PPG #4 · Duren OUT thins the frontcourt",
      },
    ],
    schedule: [
      {
        textJa: "開幕戦 · 休養十分（プレシーズン最終から 4日）",
        textEn: "Opener · 4 days rest after last preseason",
      },
      {
        textJa: "ホーム開幕 · 移動なし",
        textEn: "Home opener · no travel",
      },
    ],
    context: [
      {
        textJa: "前季 EAST 上位とのホームは 7-3",
        textEn: "7-3 at home vs East top-6 last season",
      },
      {
        textJa: "Ausar が Questionable · 守備ローテが薄くなる",
        textEn: "Ausar Questionable · wing defense thins out",
      },
    ],
  },
  away: {
    edges: [
      {
        label: "3-POINT VOLUME",
        detailJa: "3PA率 #3 · 相手被3Pは中位",
        detailEn: "3PA rate #3 · Opp 3PA allowed mid-pack",
      },
      {
        label: "HALFCOURT SPACING",
        detailJa: "ORTG #6 · Tatum Probable で作成力は残る",
        detailEn: "ORTG #6 · Tatum Probable keeps creation intact",
      },
    ],
    schedule: [
      {
        textJa: "開幕アウェイ · BOS→DET 約1時間フライト",
        textEn: "Road opener · BOS→DET ~1hr flight",
      },
      {
        textJa: "プレシーズン最終から 5日空き",
        textEn: "5 days since last preseason game",
      },
    ],
    context: [
      {
        textJa: "前季アウェイの強豪戦は 25-16",
        textEn: "25-16 on the road last season",
      },
      {
        textJa: "George が Questionable · デビュー戦は負荷管理",
        textEn: "George Questionable · debut minutes may be managed",
      },
    ],
  },
};

/** homeTeamId|awayTeamId */
export const NBA_PRO_BRIEF_BY_MATCHUP: Record<string, PredictProBrief> = {
  "nba-pistons|nba-celtics": PISTONS_CELTICS_OPENING_BRIEF,
};

export function proBriefForMatchup(
  homeTeamId: string | undefined,
  awayTeamId: string | undefined
): PredictProBrief | null {
  if (!homeTeamId || !awayTeamId) return null;
  return NBA_PRO_BRIEF_BY_MATCHUP[matchupKey(homeTeamId, awayTeamId)] ?? null;
}
