// lib/analysis/analysisTypeMeta.ts
import { AnalysisTypeId, AnalysisTypeMeta } from "@/shared/analysis/types";

export const ANALYSIS_TYPE_META_JA: Record<
  AnalysisTypeId,
  AnalysisTypeMeta
> = {
  COMPLETE_PLAYER: {
    label: "Complete Player",
    nbaArchetype: "LeBron James (2018)",
    description:
      "勝率・精度・読み、すべての指標が高水準なオールラウンダー。\n\
派手さも完成度も殿堂入り、王道を極めた分析スタイル。\n\
2018年のLeBron Jamesを思わせる、完成された分析者。",
  },

  ELITE_ANALYST: {
    label: "All-Around Brain",
    nbaArchetype: "Nikola Jokic",
    description:
      "あらゆる指標を高水準で理解し、全体最適を導く分析タイプ。\n\
判断が試合を動かし、必要なことだけを正確にこなす。\n\
コート全体を支配する、Nikola Jokicのような分析者。",
  },

  BALANCED_PRO: {
    label: "Two-Way Star",
    nbaArchetype: "Kawhi Leonard",
    description:
      "隙がなく、安定した判断を出し続ける分析タイプ。\n\
どんなチームにもフィットし、仕事を確実にこなす。\n\
静かに支配する、2019年のKawhi Leonardを思わせる分析者。",
  },

  CONSISTENT_VET: {
    label: "Reliable Veteran",
    nbaArchetype: "Tim Duncan",
    description:
      "毎試合、同じ水準の判断を積み重ねる分析タイプ。\n\
派手さはないが、安定感で試合を支える。\n\
常勝チームの土台となった、Tim Duncanを思わせる分析者。",
  },

  /* ===== 勝率系 ===== */
  CLOSER: {
    label: "Closer",
    nbaArchetype: "Jimmy Butler",
    description:
      "内容よりも結果を選ぶ、勝負師タイプ。\n\
苦しい展開でも、最後に勝ちをもぎ取る。\n\
2023年にチームをFinalsへ導いた、Jimmy Butlerのような分析者。",
  },

  FAVORITE_PUNISHER: {
    label: "Favorite Punisher",
    nbaArchetype: "Shai Gilgeous-Alexander",
    description:
      "有利な試合を、淡々と勝ち切る分析タイプ。\n\
期待値を落とさず、順当な結果を積み上げる。\n\
強者の仕事を外さない、SGAのような分析者。",
  },

  /* ===== 精度系 ===== */
  BOX_SCORE_ARTIST: {
    label: "Box Score Artist",
    nbaArchetype: "Luka Dončić",
    description:
      "スコアと展開を、最初から具体的に描ける分析タイプ。\n\
勝敗だけでなく、点差や試合の終わり方まで当てにいく。\n\
自ら試合を作る、Luka Dončićのような分析者。",
  },

  ANALYTICS_FIRST: {
    label: "Analytics Brain",
    nbaArchetype: "Daryl Morey（思考）",
    description:
      "感覚に頼らず、期待値で判断する分析タイプ。\n\
一貫したロジックで、ブレない選択を積み上げる。\n\
数字を信じて勝ちに行く、Daryl Moreyを思わせる分析者。",
  },

  EFFICIENCY_FREAK: {
    label: "Efficiency Freak",
    nbaArchetype: "Stephen Curry",
    description:
      "当てる確率を最優先する、効率重視の分析タイプ。\n\
無駄を削ぎ落とし、成功率で差をつける。\n\
一本の価値を最大化する、Stephen Curryのような分析者。",
  },

  /* ===== Upset 系 ===== */
  GIANT_KILLER: {
    label: "Giant Killer",
    nbaArchetype: "Trae Young (2021)",
    description:
      "番狂わせを狙い撃つ、一点突破型の分析タイプ。\n\
格上相手でも、勝ち筋を見つけて仕留めにいく。\n\
Upsetで東を揺るがした、2021年のTrae Youngを思わせる分析者。",
  },

  CHAOS_CREATOR: {
    label: "Chaos Creator",
    nbaArchetype: "Russell Westbrook",
    description:
      "結果は読めないが、波乱は必ず起こすタイプ。\n\
当たるか外れるか、振れ幅は最大。\n\
カオスだが目が離せない、Russell Westbrookを彷彿とさせる分析者。",
  },

  /* ===== Volume 系 ===== */
  IRON_MAN: {
    label: "Iron Man",
    nbaArchetype: "Mikal Bridges",
    description:
      "打席数で期待値を作る、継続特化の分析タイプ。\n\
毎試合出続けることで、結果を積み上げていく。\n\
稼働率そのものが武器となる、Mikal Bridgesのような分析者。",
  },

  GRIND_ANALYST: {
    label: "Gym Rat Analyst",
    nbaArchetype: "Pre-Breakout Giannis Antetokounmpo",
    description:
      "派手さはないが、反復で力を伸ばす成長型。\n\
試行回数を重ね、少しずつ当たる形を作っていく。\n\
積み上げの先で覚醒した、若き日のGiannisのような分析者。",
  },

  /* ===== 感覚・直感 ===== */
  HEAT_CHECK: {
    label: "Heat Check Shooter",
    nbaArchetype: "Klay Thompson",
    description:
      "一度当たると、流れを一気に自分のものにする。\n\
火がついた瞬間、1人で試合をひっくり返す。\n\
止まらない爆発力を持つ、Klay Thompsonのような分析者。",
  },

  WILD_CARD: {
    label: "Wild Card",
    nbaArchetype: "Cooper Flagg",
    description:
      "まだ型に収まらない、未定義の分析タイプ。\n\
強みも方向性も、これから形作られていく。\n\
どんな選手にもなり得る、Cooper Flaggのような分析者。",
  },
};
