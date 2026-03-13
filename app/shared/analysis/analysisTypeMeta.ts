// lib/analysis/analysisTypeMeta.ts
import { AnalysisTypeId, AnalysisTypeMeta } from "@/shared/analysis/types";

export const ANALYSIS_TYPE_META_JA: Record<
  AnalysisTypeId,
  AnalysisTypeMeta
> = {
  COMPLETE_PLAYER: {
    label: "Complete Player",
    description:
      "すべての指標が高水準で揃った、完成度の最上位タイプ。\n\
勝率・精度・読み・継続力のいずれにも偏りがなく、判断の再現性が非常に高い。\n\
環境や相手が変わっても崩れにくい分析スタイルは、まさにComplete Player。",
  },

  ELITE_ALLROUNDER: {
    label: "Elite All-Rounder",
    description:
      "複数の指標で明確な強みを持ち、全体水準も高い上位タイプ。\n\
突出した軸を中心にしながら、致命的な弱点を作らない。\n\
完成一歩手前のバランス型で、オールラウンドな分析スタイル。",
  },

  // ===== S=3 =====

  ELITE_CLOSER: {
    label: "Elite Closer",
    description:
      "勝率・精度・安定感が同時に高い点が最大の強み。\n\
重要な局面でも判断がブレにくいタイプ。\n\
勝ち筋を正確に捉え、結果に結びつける力が数値に表れている。\n\
勝ち切ることを最優先にした頼れるクローザーのような分析スタイル。",
  },

  RELIABLE_PRO: {
    label: "Reliable Pro",
    description:
      "安定した精度と勝率を継続できる点が強み。\n\
大きな失敗が少なく、結果を積み上げるタイプ。\n\
派手さはないが、再現性の高さが数値に出ている。\n\
長期的に信頼できる堅実な分析スタイル。",
  },

  IRON_RUNNER: {
    label: "Iron Runner",
    description:
      "試行回数が多くても質が落ちにくい点が強み。\n\
稼働量そのものを武器にできるタイプ。\n\
量を重ねるほど優位性がはっきり数値に表れる。\n\
継続力と耐久性で勝負する鉄人のような分析スタイル。",
  },

  PRECISE_CLOSER: {
    label: "Precise Closer",
    description:
      "勝率・スコア精度・予測精度が高い点が強み。\n\
当てるだけでなく、自信度の置き方まで正確なタイプ。\n\
無理のない判断で取りこぼしを減らし、安定して勝ち切る力が数値に表れている。\n\
精密さで締め切るクローザー型の分析スタイル。",
  },

  CONFIDENT_FINISHER: {
    label: "Confident Finisher",
    description:
      "勝率・耐性・予測精度が噛み合っている点が強み。\n\
流れの中でも自信度を崩さず、判断を保てるタイプ。\n\
短期的な勢いだけではなく、確率感覚の正しさが結果に表れている。\n\
自信と安定感を両立したフィニッシャー型の分析スタイル。",
  },

  DATA_GRINDER: {
    label: "Data Grinder",
    description:
      "精度と試行回数を積み上げられる点が強み。\n\
反復によって判断の形を作っていくタイプ。\n\
徐々にブレが減っていく過程が数値に表れる。\n\
地道な積み上げを重視する分析スタイル。",
  },

  PROBABILITY_READER: {
    label: "Probability Reader",
    description:
      "スコア精度・投稿量・予測精度が高い点が強み。\n\
データの読みと確率感覚の両方に優れ、量をこなしても判断が崩れにくいタイプ。\n\
一貫した選択と自信度の正しさが安定した数値として表れている。\n\
確率を読む力に秀でたロジカルな分析スタイル。",
  },

  STABLE_ANALYST: {
    label: "Stable Analyst",
    description:
      "大きな上下動が少ない点が強み。\n\
無理な勝負を避ける傾向のタイプ。\n\
安定した成績が長期指標に表れている。\n\
リスク管理を重視する安定感のある分析スタイル。",
  },

  GIANT_SLAYER: {
    label: "Giant Slayer",
    description:
      "Upsetを狙いながらも結果を出せる点が強み。\n\
番狂わせを条件付きで成立させるタイプ。\n\
Upset指標と勝率の両方に強さが表れている。\n\
破壊力と再現性を両立した分析スタイル。",
  },

  SHARP_UPSETTER: {
    label: "Sharp Upsetter",
    description:
      "逆転要素を精密に読み取れる点が強み。\n\
荒れる試合を選別して踏み込むタイプ。\n\
Upsetの成功率に鋭さが表れている。\n\
精度寄りのUpset分析スタイル。",
  },

  CHAOS_ENGINE: {
    label: "Chaos Engine",
    description:
      "荒れる展開に積極的に踏み込める点が強み。\n\
振れ幅の大きさを許容するタイプ。\n\
Upsetや結果のばらつきが数値に表れている。\n\
波乱前提のカオスな分析スタイル。",
  },

  ACCURACY_CONTROLLER: {
    label: "Accuracy Controller",
    description:
      "予測精度・投稿量・耐性が高い点が強み。\n\
数をこなしながらも、自信度の置き方が崩れにくいタイプ。\n\
確率感覚の正しさと継続力が安定した数値として表れている。\n\
精度運用をコントロールできる分析スタイル。",
  },

  CONSISTENT_PRODUCER: {
    label: "Consistent Producer",
    description:
      "予測精度・勝率・投稿量を高水準で両立している点が強み。\n\
量を出しながらも当て続け、自信度も適切に置けるタイプ。\n\
大崩れしにくい成績が長期指標に表れている。\n\
安定生産型の分析スタイル。",
  },

  // ===== S=2 =====

  SHARP_EXECUTOR: {
    label: "Sharp Executor",
    description:
      "勝率と精度の両方が強みとして出ている。\n\
判断そのものの質が高く、当てにいく力があるタイプ。\n\
無駄の少ない選択が数値に表れている。\n\
精密さを軸にした分析スタイル。",
  },

  MOMENTUM_EDGE: {
    label: "Momentum Edge",
    description:
      "勢いに乗ったときの強さが最大の強み。\n\
流れを掴むと連続して結果を出しやすいタイプ。\n\
streak 指標にその特徴が表れている。\n\
モメンタム重視の分析スタイル。",
  },

  RELENTLESS_OUTPUT: {
    label: "Relentless Output",
    description:
      "勝率と試行回数の両立が強み。\n\
回転数を落とさず結果を積み上げるタイプ。\n\
量を打ちながら一定の成果を出している。\n\
量と質どちらも強い分析スタイル。",
  },

  CONFIDENCE_DOMINANCE: {
    label: "Confidence Dominance",
    description:
      "勝率と予測精度の両立が強み。\n\
当てる力だけでなく、自信度の置き方も正確なタイプ。\n\
安定した勝率と確率感覚の良さが数値に表れている。\n\
確信を正しく結果につなげる分析スタイル。",
  },

  HIGH_RISK_READER: {
    label: "High Risk Reader",
    description:
      "勝率は高い一方で、自信度の振れ幅が大きい点が特徴。\n\
当てる力はあるが、確率の置き方に粗さが残るタイプ。\n\
勝率と accuracy 指標のギャップがはっきり表れている。\n\
高リスク寄りの読みを持つ分析スタイル。",
  },

  DATA_FORGE: {
    label: "Data Forge",
    description:
      "精度と試行回数を組み合わせられる点が強み。\n\
数をこなしながら判断を鍛えているタイプ。\n\
precision と volume に安定感が出ている。\n\
精度に秀でた分析スタイル。",
  },

  RHYTHM_BLADE: {
    label: "Rhythm Blade",
    description:
      "精度と流れが噛み合ったときの鋭さが強み。\n\
当たる期間と外れる期間がはっきり出やすいタイプ。\n\
streak 指標に波が表れている。\n\
リズム重視の分析スタイル。",
  },

  PROBABILITY_COMMANDER: {
    label: "Probability Commander",
    description:
      "スコア精度と予測精度の両方が強み。\n\
読みの質だけでなく、自信度の運用も整っているタイプ。\n\
precision と accuracy に安定感が表れている。\n\
確率を基準に判断を組み立てる分析スタイル。",
  },

  VOLATILE_READER: {
    label: "Volatile Reader",
    description:
      "スコアを読む力はある一方で、自信度の振れ幅が大きい点が特徴。\n\
読みの鋭さはあるが、確率の置き方にムラがあるタイプ。\n\
accuracy 指標と精度指標のズレが数値に表れている。\n\
不安定さを含んだ読み型の分析スタイル。",
  },

  BOLD_STRIKER: {
    label: "Bold Striker",
    description:
      "Upsetを狙いながら結果を出せている点が強み。\n\
思い切った選択を取れるタイプ。\n\
upset 指標と勝率に特徴が表れている。\n\
強気に踏み込む分析スタイル。",
  },

  EDGE_HUNTER: {
    label: "Edge Hunter",
    description:
      "Upsetの成立条件を見抜く力が強み。\n\
荒れる試合を選別して狙うタイプ。\n\
precision と upset 指標に鋭さが表れている。\n\
エッジの効いた分析スタイル。",
  },

  CHAOS_SURGE: {
    label: "Chaos Surge",
    description:
      "荒れる流れに乗ったときの爆発力が強み。\n\
結果の振れ幅を許容するタイプ。\n\
upset と streak 指標に波が表れている。\n\
カオス寄りの分析スタイル。",
  },

  BOLD_READER: {
    label: "Bold Reader",
    description:
      "Upsetを狙う姿勢が強く、自信度の運用にも振れ幅が出やすい点が特徴。\n\
思い切った読みを通しにいくタイプ。\n\
upset 指標と accuracy 指標の荒さに特徴が表れている。\n\
大胆さを前面に出す分析スタイル。",
  },

  ENDURANCE_CORE: {
    label: "Endurance Core",
    description:
      "継続力と安定感を併せ持つ点が強み。\n\
長く回し続けることができるタイプ。\n\
volume と streak 指標に強さが表れている。\n\
持久力を武器とする分析スタイル。",
  },

  ACCURACY_ENGINE: {
    label: "Accuracy Engine",
    description:
      "投稿量が多く、なおかつ予測精度も高い点が強み。\n\
量を回しても自信度の質が落ちにくいタイプ。\n\
accuracy と volume の両方に安定感が表れている。\n\
精度運用を量産できる分析スタイル。",
  },

  RISK_ENGINE: {
    label: "Risk Engine",
    description:
      "投稿量は多い一方で、自信度の運用に振れ幅が出やすい点が特徴。\n\
数を回しながら試行錯誤を続けるタイプ。\n\
volume は強いが accuracy に課題が表れている。\n\
冒険心のある分析スタイル。",
  },

  // ===== S=1 =====

  CLEAN_HIT: {
    label: "Clean Hit",
    description:
      "勝率だけが明確な強みとして出ている。\n\
細かい精度よりも、結果を当てにいく傾向がある。\n\
シンプルな勝ち負け判断が数値に表れている。\n\
直球勝負の分析スタイル。",
  },

  SHARP_EYE: {
    label: "Sharp Eye",
    description:
      "精度の高さが最も目立つ強み。\n\
細かい条件や数値を読み取る力がある。\n\
勝率には直結しきっていないが、precision に特徴が出ている。\n\
読み重視の分析スタイル。",
  },

  CHAOS_TAKER: {
    label: "Chaos Taker",
    description:
      "Upsetを狙う姿勢が強みとして出ている。\n\
荒れる展開に積極的に踏み込む傾向がある。\n\
結果は安定しないが、upset 指標に特徴が表れている。\n\
波乱志向の分析スタイル。",
  },

  HIGH_ACTIVITY: {
    label: "High Activity",
    description:
      "試行回数の多さが最大の強み。\n\
結果よりも参加頻度が先に立つ傾向がある。\n\
volume 指標に明確な特徴が表れている。\n\
回転重視の分析スタイル。",
  },

  HOT_PHASE: {
    label: "Hot Phase",
    description:
      "短期的な好調さが強みとして出ている。\n\
当たる期間と外れる期間の差が大きい。\n\
streak 指標に強さが表れている。\n\
流れ依存の分析スタイル。",
  },

  ACCURACY_PATH: {
    label: "Accuracy Path",
    description:
      "予測精度の高さが明確な強みとして出ている。\n\
自信度の置き方が安定しており、無理な確信が少ないタイプ。\n\
accuracy 指標に特徴がはっきり表れている。\n\
確率感覚を武器にする分析スタイル。",
  },

  VOLATILE_PATH: {
    label: "Volatile Path",
    description:
      "自信度の運用に振れ幅があり、その不安定さが特徴として出ている。\n\
当たり外れだけでなく、確率の置き方にも波があるタイプ。\n\
accuracy 指標に明確な課題が表れている。\n\
粗さを残した分析スタイル。",
  },

  // ===== S=0 =====

  RAW: {
    label: "Raw",
    description:
      "全体的に指標がまだ整っていない段階。\n\
試行や判断の方向性が定まりきっていない。\n\
数値のばらつきが大きく、評価はこれから。\n\
探索途中の分析スタイル。",
  },

  UNSTABLE: {
    label: "Unstable",
    description:
      "指標ごとのブレが大きい点が特徴。\n\
当たる試合と外れる試合の差が出やすい。\n\
W 指標が目立ち、安定性に課題が残る。\n\
方向性模索中の分析スタイル。",
  },

  FOUNDATION: {
    label: "Foundation",
    description:
      "平均的な水準を複数の指標で保てている。\n\
大きな弱点は少なく、土台はできている。\n\
あと一軸伸びれば評価が大きく変わる状態。\n\
基礎固め段階の分析スタイル。",
  },

  BASELINE: {
    label: "Baseline",
    description:
      "全体的に平均付近でまとまっている。\n\
突出した強みはないが、大崩れもしにくい。\n\
安定した基準値として数値が出ている。\n\
標準型の分析スタイル。",
  },

  // ===== fallback =====

  WILD_CARD: {
    label: "Wild Card",
    description:
      "指標の組み合わせが想定外の状態。\n\
特定の型に分類しきれないケース。\n\
データ不足や例外的な数値が原因となる。\n\
一時的な保留扱いの分析スタイル。",
  },
};