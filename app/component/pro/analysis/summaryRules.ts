// app/component/pro/analysis/summaryRules.ts

/* ============================================================================
 * Types
 * ============================================================================
 */

export type SummaryKey =
  | "winRate"
  | "precision"
  | "pointsV3"
  | "upset"
  | "volume";

export type SummaryRule = {
  key: SummaryKey;
  priority: number;
  tone: "strong" | "weak";
  texts: string[];
  condition: (params: {
    now: number;
    prev?: number | null;
    percentile: number;
  }) => boolean;
};

/* ============================================================================
 * SUMMARY RULES
 * ============================================================================
 */

export const SUMMARY_RULES: SummaryRule[] = [
  /* =========================
   * 勝率
   * ========================= */
  {
    key: "winRate",
    tone: "strong",
    priority: 100,
    texts: [
      "【勝率】全体で上位5%。MVPクラスの数字です。",
      "【勝率】リーグ最上位帯に位置し、チームの軸になれる水準です。",
      "【勝率】MVP級。結果を出し続ける分析ができています。",
    ],
    condition: ({ percentile }) => percentile >= 95,
  },
  {
    key: "winRate",
    tone: "strong",
    priority: 90,
    texts: [
      "【勝率】上位10%に位置。All-NBAクラスの安定感です。",
      "【勝率】リーグでも明確なエース級の水準にあります。",
      "【勝率】この数字があればPO常連クラスと言えます。",
    ],
    condition: ({ percentile }) => percentile >= 90,
  },
  {
    key: "winRate",
    tone: "weak",
    priority: 60,
    texts: [
      "【勝率】平均を下回っており、ピック精度の改善余地があります。",
      "【勝率】結果が伸び悩んでおり、判断基準の見直しが必要です。",
    ],
    condition: ({ percentile }) => percentile <= 40,
  },

  /* =========================
   * スコア精度
   * ========================= */
  {
    key: "precision",
    tone: "strong",
    priority: 75,
    texts: [
      "【スコア精度】上位20%。試合展開を読む力が高いです。",
      "【スコア精度】点差感覚が鋭く、展開予測に強みがあります。",
    ],
    condition: ({ percentile }) => percentile >= 80,
  },
  {
    key: "precision",
    tone: "weak",
    priority: 52,
    texts: [
      "【スコア精度】展開読みはやや不安定で、点差感覚に改善余地があります。",
      "【スコア精度】勝敗は取れていても、細かい試合展開の読みはまだ伸ばせます。",
    ],
    condition: ({ percentile }) => percentile <= 40,
  },

  /* =========================
   * 総合得点
   * ========================= */
  {
    key: "pointsV3",
    tone: "strong",
    priority: 85,
    texts: [
      "【総合得点】上位帯。勝敗・点差・合計点を総合して高水準です。",
      "【総合得点】総合力が高く、完成度のある予想ができています。",
      "【総合得点】トータルで強く、安定したハイレベル分析です。",
    ],
    condition: ({ percentile }) => percentile >= 85,
  },
  {
    key: "pointsV3",
    tone: "weak",
    priority: 58,
    texts: [
      "【総合得点】部分的には当てられていても、全体の完成度には改善余地があります。",
      "【総合得点】勝敗以外の細部を詰めると、総合値を伸ばしやすい状態です。",
    ],
    condition: ({ percentile }) => percentile <= 40,
  },

  /* =========================
   * Upset
   * ========================= */
  {
    key: "upset",
    tone: "strong",
    priority: 70,
    texts: [
      "【Upset】オールスター級。下馬評を覆す分析が得意です。",
      "【Upset】リスクを取り切る判断ができ、期待値が高いです。",
    ],
    condition: ({ percentile }) => percentile >= 80,
  },
  {
    key: "upset",
    tone: "weak",
    priority: 50,
    texts: [
      "【Upset】控えめで、堅実寄りの分析傾向です。",
      "【Upset】安全サイドの予想が多く、爆発力はやや控えめです。",
    ],
    condition: ({ percentile }) => percentile <= 35,
  },

  /* =========================
   * 投稿量
   * ========================= */
  {
    key: "volume",
    tone: "strong",
    priority: 65,
    texts: [
      "【投稿量】上位水準。シーズンを通して戦える分析量です。",
      "【投稿量】継続的なアウトプットができており、評価母数も十分です。",
    ],
    condition: ({ percentile }) => percentile >= 85,
  },
  {
    key: "volume",
    tone: "weak",
    priority: 45,
    texts: [
      "【投稿量】少なめで、評価の安定性に欠けています。",
      "【投稿量】試行回数が少なく、実力を測り切れていない可能性があります。",
    ],
    condition: ({ percentile }) => percentile <= 30,
  },
];

/* ============================================================================
 * Utils
 * ============================================================================
 */

function pickTextByMonth(texts: string[], seed: string): string {
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }

  const index = Math.abs(hash) % texts.length;
  return texts[index];
}

/* ============================================================================
 * Builder
 * ============================================================================
 */

export function buildMonthlySummary({
  percentiles,
  prevPercentiles,
  month,
}: {
  percentiles: Record<SummaryKey, number>;
  prevPercentiles?: Record<SummaryKey, number> | null;
  month: string;
}): string[] {
  const matched = SUMMARY_RULES.filter((rule) =>
    rule.condition({
      now: percentiles[rule.key],
      prev: prevPercentiles?.[rule.key],
      percentile: percentiles[rule.key],
    })
  );

  const strong = matched
    .filter((r) => r.tone === "strong")
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 2);

  const weak = matched
    .filter((r) => r.tone === "weak")
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 1);

  const picked = [...strong, ...weak];

  return picked.map((rule) =>
    pickTextByMonth(rule.texts, `${month}-${rule.key}`)
  );
}
