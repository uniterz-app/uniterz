// app/component/pro/analysis/summaryRules.ts

/* ============================================================================
 * Types
 * ============================================================================
 */

export type SummaryKey =
  | "winRate"
  | "accuracy"
  | "precision"
  | "upset"
  | "volume";

export type SummaryRule = {
  key: SummaryKey;
  priority: number;         // 大きいほど優先
  tone: "strong" | "weak";  // 強み / 弱み
  texts: string[];          // 複数文言（ランダム選択）
  condition: (params: {
    now: number;            // 今月 percentile
    prev?: number | null;   // 先月 percentile
    percentile: number;
  }) => boolean;
};

/* ============================================================================
 * NBA Percentile 基準（ローテーション約450人想定）
 *
 * 95%+  MVPクラス
 * 90%+  All-NBAクラス
 * 80%+  オールスター級
 * 60%+  上位スターター
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
   * 精度（Accuracy / Brier）
   * ========================= */

  {
    key: "accuracy",
    tone: "strong",
    priority: 95,
    texts: [
      "【精度】上位10%。All-NBA級の再現性があります。",
      "【精度】ブレが少なく、長期的に勝てる分析スタイルです。",
    ],
    condition: ({ percentile }) => percentile >= 90,
  },

  {
    key: "accuracy",
    tone: "strong",
    priority: 80,
    texts: [
      "【精度】オールスター級。安定感のある予想ができています。",
      "【精度】無駄打ちが少なく、試合選別が的確です。",
    ],
    condition: ({ percentile }) => percentile >= 80,
  },

  {
    key: "accuracy",
    tone: "weak",
    priority: 55,
    texts: [
      "【精度】やや不安定で、結果の振れ幅が大きくなっています。",
      "【精度】ムラがあり、条件整理の余地があります。",
    ],
    condition: ({ percentile }) => percentile <= 40,
  },

  /* =========================
   * スコア精度（Precision）
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
   * 投稿量（Volume）
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
 *  - 同じ「月 × 指標」なら必ず同じ文言を返す
 * ============================================================================
 */

function pickTextByMonth(
  texts: string[],
  seed: string
): string {
  let hash = 0;

  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0; // 32bit int に丸める
  }

  const index = Math.abs(hash) % texts.length;
  return texts[index];
}

/* ============================================================================
 * Builder
 *  - 強み 2 + 弱み 1 を最大で抽出
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
  const matched = SUMMARY_RULES.filter(rule =>
    rule.condition({
      now: percentiles[rule.key],
      prev: prevPercentiles?.[rule.key],
      percentile: percentiles[rule.key],
    })
  );

  const strong = matched
    .filter(r => r.tone === "strong")
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 2);

  const weak = matched
    .filter(r => r.tone === "weak")
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 1);

  const picked = [...strong, ...weak];

  return picked.map(rule =>
    pickTextByMonth(
      rule.texts,
      `${month}-${rule.key}`
    )
  );
}

/* ============================================================================
 * Improvement Rules
 *  - 今月の改善ポイント（1〜2行）
 * ============================================================================
 */

export type ImprovementRule = {
  key: SummaryKey;
  priority: number;     // 表示優先度
  texts: string[];      // 改善アドバイス文言
  condition: (params: {
    percentile: number;
  }) => boolean;
};

export const IMPROVEMENT_RULES: ImprovementRule[] = [
  {
    key: "accuracy",
    priority: 100,
    texts: [
      "【精度】ムラがあります。条件を絞ると安定しやすくなります。",
      "【精度】試合選別を厳しくすると、結果が安定しやすくなります。",
    ],
    condition: ({ percentile }) => percentile <= 45,
  },

  {
    key: "winRate",
    priority: 90,
    texts: [
      "【勝率】リスクの高い試合がやや多めです。精度重視に寄せると改善余地があります。",
      "【勝率】期待値の低いピックを減らすと数字が伸びやすくなります。",
    ],
    condition: ({ percentile }) => percentile <= 45,
  },

  {
    key: "upset",
    priority: 80,
    texts: [
      "【Upset】安全寄りの傾向です。勝率が安定してきたら挑戦幅を広げても良さそうです。",
    ],
    condition: ({ percentile }) => percentile <= 35,
  },

  {
    key: "volume",
    priority: 70,
    texts: [
      "【投稿量】試行回数が少なめです。母数を増やすと評価が安定します。",
    ],
    condition: ({ percentile }) => percentile <= 30,
  },
];

/* ============================================================================
 * Builder
 *  - 今月の改善ポイント（最大2行）
 * ============================================================================
 */

export function buildMonthlyImprovement({
  percentiles,
  month,
}: {
  percentiles: Record<SummaryKey, number>;
  month: string;
}): string[] {
  const matched = IMPROVEMENT_RULES
    .filter(rule =>
      rule.condition({
        percentile: percentiles[rule.key],
      })
    )
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 2);

  return matched.map(rule =>
    pickTextByMonth(
      rule.texts,
      `${month}-improve-${rule.key}`
    )
  );
}

