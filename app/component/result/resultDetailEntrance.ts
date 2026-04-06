/** リザルト詳細（Web / モバイル / オーバーレイ共通）のフェードアップ＋ドーナツ描画のタイミング */

export const RESULT_DETAIL_ENTRANCE = {
  duration: 0.5,
  ease: [0.22, 1, 0.36, 1] as const,
  y: 20,
  delayHeader: 0,
  delayMarket: 0.08,
  delayDistribution: 0.17,
  delayStats: 0.28,
  /** マーケットカードのフェードに合わせて円弧の dash 描画を開始 */
  donutDrawDelayMs: 320,
} as const;
