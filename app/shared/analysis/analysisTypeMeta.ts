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
環境や相手が変わっても崩れにくい分析スタイルは、まさにComplete Player。"
},

ELITE_ALLROUNDER: {
  label: "Elite All-Rounder",
  description:
    "複数の指標で明確な強みを持ち、全体水準も高い上位タイプ。\n\
突出した軸を中心にしながら、致命的な弱点を作らない。\n\
完成一歩手前のバランス型で、オールラウンドな分析スタイル。"
},

// ===== S=3 =====

ELITE_CLOSER: {
  label: "Elite Closer",
  description:
    "勝率・精度・安定感が同時に高い点が最大の強み。\n\
重要な局面でも判断がブレにくいタイプ。\n\
勝ち筋を正確に捉え、結果に結びつける力が数値に表れている。\n\
勝ち切ることを最優先にした頼れるクローザーのような分析スタイル。"
},

RELIABLE_PRO: {
  label: "Reliable Pro",
  description:
    "安定した精度と勝率を継続できる点が強み。\n\
大きな失敗が少なく、結果を積み上げるタイプ。\n\
派手さはないが、再現性の高さが数値に出ている。\n\
長期的に信頼できる堅実な分析スタイル。"
},

IRON_RUNNER: {
  label: "Iron Runner",
  description:
    "試行回数が多くても質が落ちにくい点が強み。\n\
稼働量そのものを武器にできるタイプ。\n\
量を重ねるほど優位性がはっきり数値に表れる。\n\
継続力と耐久性で勝負する鉄人のような分析スタイル。"
},

SAFE_CLOSER: {
  label: "Safe Closer",
  description:
    "勝てる条件を見極め、確実に拾える点が強み。\n\
リスクを抑えた判断を選びやすいタイプ。\n\
取りこぼしの少なさが勝率として表れている。\n\
安定志向で勝ち切る分析スタイル。"
},

Hot_Hand: {
  label: "Hot Hand",
  description:
    "好調な流れを掴んだときの伸びが強み。\n\
状態の良し悪しが結果に直結するタイプ。\n\
連勝や短期的な上振れが数値に出やすい。\n\
1度当たると止まらないホットハンド型の分析スタイル。"
},

DATA_GRINDER: {
  label: "Data Grinder",
  description:
    "精度と試行回数を積み上げられる点が強み。\n\
反復によって判断の形を作っていくタイプ。\n\
徐々にブレが減っていく過程が数値に表れる。\n\
地道な積み上げを重視する分析スタイル。"
},

MODEL_FOLLOWER: {
  label: "Model Follower",
  description:
    "データやモデルに忠実な判断が強み。\n\
感情に左右されにくいタイプ。\n\
一貫した選択が安定した数値として表れている。\n\
ロジック重視の分析スタイル。"
},

STABLE_ANALYST: {
  label: "Stable Analyst",
  description:
    "大きな上下動が少ない点が強み。\n\
無理な勝負を避ける傾向のタイプ。\n\
安定した成績が長期指標に表れている。\n\
リスク管理を重視する安定感のある分析スタイル。"
},

GIANT_SLAYER: {
  label: "Giant Slayer",
  description:
    "Upsetを狙いながらも結果を出せる点が強み。\n\
番狂わせを条件付きで成立させるタイプ。\n\
Upset指標と勝率の両方に強さが表れている。\n\
破壊力と再現性を両立した分析スタイル。"
},

SHARP_UPSETTER: {
  label: "Sharp Upsetter",
  description:
    "逆転要素を精密に読み取れる点が強み。\n\
荒れる試合を選別して踏み込むタイプ。\n\
Upsetの成功率に鋭さが表れている。\n\
精度寄りのUpset分析スタイル。"
},

CHAOS_ENGINE: {
  label: "Chaos Engine",
  description:
    "荒れる展開に積極的に踏み込める点が強み。\n\
振れ幅の大きさを許容するタイプ。\n\
Upsetや結果のばらつきが数値に表れている。\n\
波乱前提のカオスな分析スタイル。"
},

PUBLIC_CONTROLLER: {
  label: "Public Controller",
  description:
    "大衆予想の流れを把握できる点が強み。\n\
市場全体を俯瞰して判断するタイプ。\n\
順当寄りの安定した結果が数値に表れている。\n\
全体最適を意識した分析スタイル。"
},

SAFE_PRODUCER: {
  label: "Safe Producer",
  description:
    "堅実な選択を継続できる点が強み。\n\
派手さより安定感を優先するタイプ。\n\
大崩れしない成績が長期指標に表れている。\n\
安定運用に特化した分析スタイル。"
},

// ===== S=2 =====

SHARP_EXECUTOR: {
  label: "Sharp Executor",
  description:
    "勝率と精度の両方が強みとして出ている。\n\
判断そのものの質が高く、当てにいく力があるタイプ。\n\
無駄の少ない選択が数値に表れている。\n\
精密さを軸にした分析スタイル。"
},

MOMENTUM_EDGE: {
  label: "Momentum Edge",
  description:
    "勢いに乗ったときの強さが最大の強み。\n\
流れを掴むと連続して結果を出しやすいタイプ。\n\
streak 指標にその特徴が表れている。\n\
モメンタム重視の分析スタイル。"
},

RELENTLESS_OUTPUT: {
  label: "Relentless Output",
  description:
    "勝率と試行回数の両立が強み。\n\
回転数を落とさず結果を積み上げるタイプ。\n\
量を打ちながら一定の成果を出している。\n\
量と質どちらも強い分析スタイル。"
},

SAFE_DOMINANCE: {
  label: "Safe Dominance",
  description:
    "順当な条件で強さを発揮できる点が強み。\n\
大きなリスクを避けた判断が多いタイプ。\n\
安定した勝率が数値に表れている。\n\
危険を侵さずに積み上げていく分析スタイル。"
},

CROWD_BREAKER: {
  label: "Crowd Breaker",
  description:
    "大衆予想と異なる選択で結果を出せる点が強み。\n\
流れに流されず判断するタイプ。\n\
market 指標と勝率に特徴が表れている。\n\
市場を割りにいく分析スタイル。"
},

DATA_FORGE: {
  label: "Data Forge",
  description:
    "精度と試行回数を組み合わせられる点が強み。\n\
数をこなしながら判断を鍛えているタイプ。\n\
precision と volume に安定感が出ている。\n\
精度に秀でた分析スタイル。"
},

RHYTHM_BLADE: {
  label: "Rhythm Blade",
  description:
    "精度と流れが噛み合ったときの鋭さが強み。\n\
当たる期間と外れる期間がはっきり出やすいタイプ。\n\
streak 指標に波が表れている。\n\
リズム重視の分析スタイル。"
},

MODEL_COMMANDER: {
  label: "Model Commander",
  description:
    "モデルや数値基準を軸に判断できる点が強み。\n\
感情に左右されにくいタイプ。\n\
precision と market 指標に特徴が表れている。\n\
ロジック主導の分析スタイル。"
},

LINE_CUTTER: {
  label: "Line Cutter",
  description:
    "市場の歪みを見つけて切り込める点が強み。\n\
順当から外れたラインを狙うタイプ。\n\
market 指標と精度に鋭さが表れている。\n\
市場のギリギリを狙い結果をだす分析スタイル。"
},

BOLD_STRIKER: {
  label: "Bold Striker",
  description:
    "Upsetを狙いながら結果を出せている点が強み。\n\
思い切った選択を取れるタイプ。\n\
upset 指標と勝率に特徴が表れている。\n\
強気に踏み込む分析スタイル。"
},

EDGE_HUNTER: {
  label: "Edge Hunter",
  description:
    "Upsetの成立条件を見抜く力が強み。\n\
荒れる試合を選別して狙うタイプ。\n\
precision と upset 指標に鋭さが表れている。\n\
エッジの効いた分析スタイル。"
},

CHAOS_SURGE: {
  label: "Chaos Surge",
  description:
    "荒れる流れに乗ったときの爆発力が強み。\n\
結果の振れ幅を許容するタイプ。\n\
upset と streak 指標に波が表れている。\n\
カオス寄りの分析スタイル。"
},

FADE_ASSASSIN: {
  label: "Fade Assassin",
  description:
    "大衆の逆を突く判断が強み。\n\
少数派を狙う選択が多いタイプ。\n\
market 指標と upset に特徴が表れている。\n\
大衆に迎合しない分析スタイル。"
},

ENDURANCE_CORE: {
  label: "Endurance Core",
  description:
    "継続力と安定感を併せ持つ点が強み。\n\
長く回し続けることができるタイプ。\n\
volume と streak 指標に強さが表れている。\n\
持久力を武器とする分析スタイル。"
},

PUBLIC_ENGINE: {
  label: "Public Engine",
  description:
    "順当な流れを量で処理できる点が強み。\n\
大衆予想に沿った判断を積み重ねるタイプ。\n\
market と volume 指標に特徴が表れている。\n\
順当回転型の分析スタイル。"
},

DARK_ENGINE: {
  label: "Dark Engine",
  description:
    "逆方向の選択を量で回せる点が強み。\n\
少数派を試し続けるタイプ。\n\
market と volume 指標に振れ幅が表れている。\n\
冒険心のある分析スタイル。"
},

// ===== S=1 =====

CLEAN_HIT: {
  label: "Clean Hit",
  description:
    "勝率だけが明確な強みとして出ている。\n\
細かい精度よりも、結果を当てにいく傾向がある。\n\
シンプルな勝ち負け判断が数値に表れている。\n\
直球勝負の分析スタイル。"
},

SHARP_EYE: {
  label: "Sharp Eye",
  description:
    "精度の高さが最も目立つ強み。\n\
細かい条件や数値を読み取る力がある。\n\
勝率には直結しきっていないが、precision に特徴が出ている。\n\
読み重視の分析スタイル。"
},

CHAOS_TAKER: {
  label: "Chaos Taker",
  description:
    "Upsetを狙う姿勢が強みとして出ている。\n\
荒れる展開に積極的に踏み込む傾向がある。\n\
結果は安定しないが、upset 指標に特徴が表れている。\n\
波乱志向の分析スタイル。"
},

HIGH_ACTIVITY: {
  label: "High Activity",
  description:
    "試行回数の多さが最大の強み。\n\
結果よりも参加頻度が先に立つ傾向がある。\n\
volume 指標に明確な特徴が表れている。\n\
回転重視の分析スタイル。"
},

HOT_PHASE: {
  label: "Hot Phase",
  description:
    "短期的な好調さが強みとして出ている。\n\
当たる期間と外れる期間の差が大きい。\n\
streak 指標に強さが表れている。\n\
流れ依存の分析スタイル。"
},

PUBLIC_PATH: {
  label: "Public Path",
  description:
    "順当な選択を好む傾向が強みとして出ている。\n\
大衆予想に沿った判断が多い。\n\
market 指標が安定している。\n\
安全寄りの分析スタイル。"
},

CROWD_FADE: {
  label: "Crowd Fade",
  description:
    "大衆とは逆を選ぶ姿勢が強みとして出ている。\n\
少数派を狙う判断が多い。\n\
market 指標に明確な特徴が表れている。\n\
逆張り志向の分析スタイル。"
},

// ===== S=0 =====

RAW: {
  label: "Raw",
  description:
    "全体的に指標がまだ整っていない段階。\n\
試行や判断の方向性が定まりきっていない。\n\
数値のばらつきが大きく、評価はこれから。\n\
探索途中の分析スタイル。"
},

UNSTABLE: {
  label: "Unstable",
  description:
    "指標ごとのブレが大きい点が特徴。\n\
当たる試合と外れる試合の差が出やすい。\n\
W 指標が目立ち、安定性に課題が残る。\n\
方向性模索中の分析スタイル。"
},

FOUNDATION: {
  label: "Foundation",
  description:
    "平均的な水準を複数の指標で保てている。\n\
大きな弱点は少なく、土台はできている。\n\
あと一軸伸びれば評価が大きく変わる状態。\n\
基礎固め段階の分析スタイル。"
},

BASELINE: {
  label: "Baseline",
  description:
    "全体的に平均付近でまとまっている。\n\
突出した強みはないが、大崩れもしにくい。\n\
安定した基準値として数値が出ている。\n\
標準型の分析スタイル。"
},

// ===== fallback =====

WILD_CARD: {
  label: "Wild Card",
  description:
    "指標の組み合わせが想定外の状態。\n\
特定の型に分類しきれないケース。\n\
データ不足や例外的な数値が原因となる。\n\
一時的な保留扱いの分析スタイル。"
},
};
