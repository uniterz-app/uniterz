// 月次レポート用・分析タイプ説明文（docs/pro-subscription-plan.md ドラフト確定尺）

import type { AnalysisTypeId } from "@/shared/analysis/types";

export type MonthlyReportAnalysisTypeCopy = {
  label: string;
  /** 改行区切りの本文 */
  description: string;
};

/**
 * V1 19 種。未移行の旧 ID は nearest にエイリアスして参照する。
 */
export const MONTHLY_REPORT_ANALYSIS_TYPE_COPY: Record<
  string,
  MonthlyReportAnalysisTypeCopy
> = {
  PROSPECT: {
    label: "Prospect",
    description:
      "まだ特定の分析スタイルに固定されていない、伸びしろ優先のタイプです。\n\
ピックアップへの参加が半分未満か、5軸のどれもまだ「強み」まで届いていない状態。型がないのではなく、これから作る途中にいます。\n\
まずはピックアップの半分以上に参加し、手応えのある軸を1つ選んで強みラインまで押し上げましょう。参加が足りない月は、質より先に量の土台です。\n\
何者にもなれる可能性を秘めた Prospect。",
  },
  GOAT: {
    label: "GOAT",
    description:
      "5軸すべてが強みの、月間における最高到達点のタイプです。\n\
勝敗・得点者・波乱・参加量・安定のどれにも穴がなく、総合力で一段上にいます。\n\
次に足すものより、この水準を翌月も落とさない運用がテーマ。参加のムラや連敗の傷に注意し、5軸のバランスを維持しましょう。\n\
すべてを兼ね備えた頂点は、まさに GOAT。",
  },
  COMPLETE_PLAYER: {
    label: "Complete Player",
    description:
      "5軸中4つが強みの、ほぼ完成形の総合タイプです。\n\
致命的な穴はなく、残る1軸だけが強みライン未達。いわば GOAT の一歩手前です。\n\
来月は全部を均等に伸ばすより、未達の1軸だけを単一目標にして押し上げましょう。それが埋まれば GOAT 圏に届きます。\n\
高い完成度で戦うスタイルは、まさに Complete Player。",
  },
  ALL_ROUNDER: {
    label: "All-Rounder",
    description:
      "5軸中3つが強みの、多面的に戦えるタイプです。\n\
ひとつの武器に依存せず、複数の勝ち筋を同時に持てるのが強み。過半数がすでに機能しています。\n\
さらに上を目指すなら、未達の2軸のうち優先の1本だけを伸ばしましょう。次の到達点は Complete Player（強み4）です。\n\
局面を選ばず機能する総合力は、まさに All-Rounder。",
  },
  FINISHER: {
    label: "Finisher",
    description:
      "WIN が唯一の強みの、勝敗予想に特化したタイプです。\n\
試合の勝ち負けを高い水準で取り切る力が、今月の軸になっています。\n\
さらに伸ばすなら SCORER か CONSISTENCY を足し、勝ちを得点と安定につなげましょう。次の二軸到達点は Two-Way Player か High Floor です。\n\
最後に勝負を決める決定力は、まさに Finisher。",
  },
  LASER: {
    label: "Laser",
    description:
      "SCORER が唯一の強みの、得点者予想に特化したタイプです。\n\
細部を射抜く精度が、今月の差別化ポイントになっています。\n\
さらに伸ばすなら WIN か ACTIVITY を足し、的中を総得点に変えましょう。次の二軸到達点は Two-Way Player か Deep Bag です。\n\
一点を狙う判断の鋭さは、まさに Laser。",
  },
  CHAOS_TAKER: {
    label: "Chaos Taker",
    description:
      "UPSET が唯一の強みの、波乱攻略に特化したタイプです。\n\
番狂わせを拾う読みが、今月の得点源になっています。\n\
さらに伸ばすなら WIN か CONSISTENCY を足し、波乱を安定した勝ちにつなげましょう。次の二軸到達点は Big-Game Hunter か Chaos Anchor です。\n\
カオスを恐れず価値に変える勝負勘は、まさに Chaos Taker。",
  },
  HIGH_MOTOR: {
    label: "High-Motor",
    description:
      "ACTIVITY が唯一の強みの、参加量に特化したタイプです。\n\
手数と関与量で試合に入り続ける力が、今月の土台になっています。\n\
さらに伸ばすなら WIN か SCORER を足し、量を質と結果に変えましょう。次の二軸到達点は Walking Bucket か Deep Bag です。\n\
止まらず動き続ける推進力は、まさに High-Motor。",
  },
  IRON_MAN: {
    label: "Iron Man",
    description:
      "CONSISTENCY が唯一の強みの、安定運用に特化したタイプです。\n\
大崩れしにくく、長い期間で水準を維持できるのが武器です。\n\
さらに伸ばすなら WIN か SCORER を足し、安定を勝ちと的中に直結させましょう。次の二軸到達点は High Floor か Sharpshooter です。\n\
最後まで強度を落とさない持久力は、まさに Iron Man。",
  },
  TWO_WAY_PLAYER: {
    label: "Two-Way Player",
    description:
      "WIN と SCORER が強みの、二刀流タイプです。\n\
勝敗も得点者も高い水準で両立し、本筋の予想で差を作れます。\n\
さらに上を目指すなら ACTIVITY か CONSISTENCY を伸ばし、再現の幅を広げましょう。次の到達点は All-Rounder（強み3）です。\n\
攻守両面で試合を作る力は、まさに Two-Way Player。",
  },
  BIG_GAME_HUNTER: {
    label: "Big-Game Hunter",
    description:
      "WIN と UPSET が強みの、大勝負タイプです。\n\
勝ち切る力と波乱を突く力を持ち、難局で流れを変えられます。\n\
さらに上を目指すなら SCORER か CONSISTENCY を伸ばし、一撃を継続得点にしましょう。次の到達点は All-Rounder（強み3）です。\n\
大舞台で獲物を仕留める勝負強さは、まさに Big-Game Hunter。",
  },
  WALKING_BUCKET: {
    label: "Walking Bucket",
    description:
      "WIN と ACTIVITY が強みの、量産タイプです。\n\
手数を出しながら勝ちを積み、総量で差を作れます。\n\
さらに上を目指すなら SCORER か UPSET を伸ばし、1試合あたりの上限を上げましょう。次の到達点は All-Rounder（強み3）です。\n\
点を取り続ける攻撃力は、まさに Walking Bucket。",
  },
  HIGH_FLOOR: {
    label: "High Floor",
    description:
      "WIN と CONSISTENCY が強みの、下限の高いタイプです。\n\
勝ちを積みつつ大崩れしにくく、月間の床が高いのが特徴です。\n\
さらに上を目指すなら SCORER か UPSET を伸ばし、天井も押し上げましょう。次の到達点は All-Rounder（強み3）です。\n\
落ちにくい強さは、まさに High Floor。",
  },
  CLUTCH: {
    label: "Clutch",
    description:
      "SCORER と UPSET が強みの、勝負どころタイプです。\n\
細部の精度と波乱の読みで、価値の高い一手を通せます。\n\
さらに上を目指すなら WIN か ACTIVITY を伸ばし、決定機を増やしましょう。次の到達点は All-Rounder（強み3）です。\n\
ここ一番で決め切る力は、まさに Clutch。",
  },
  DEEP_BAG: {
    label: "Deep Bag",
    description:
      "SCORER と ACTIVITY が強みの、手札の多いタイプです。\n\
手数を出しても得点者の質を落としにくく、長期で差が開きます。\n\
さらに上を目指すなら WIN か CONSISTENCY を伸ばし、勝ちと安定を足しましょう。次の到達点は All-Rounder（強み3）です。\n\
多彩な選択肢で優位を広げるスタイルは、まさに Deep Bag。",
  },
  SHARPSHOOTER: {
    label: "Sharpshooter",
    description:
      "SCORER と CONSISTENCY が強みの、精密安定タイプです。\n\
得点者予想をブレにくく継続でき、再現性の高い判断が武器です。\n\
さらに上を目指すなら WIN か UPSET を伸ばし、勝ち筋の幅を広げましょう。次の到達点は All-Rounder（強み3）です。\n\
狙いを外さない再現性は、まさに Sharpshooter。",
  },
  CHAOS_RUNNER: {
    label: "Chaos Runner",
    description:
      "UPSET と ACTIVITY が強みの、展開攻略タイプです。\n\
手数で機会を広げながら波乱を拾い、得点機会を増やせます。\n\
さらに上を目指すなら WIN か SCORER を伸ばし、拾った流れを本筋の勝ちに変えましょう。次の到達点は All-Rounder（強み3）です。\n\
カオスを得点に変える推進力は、まさに Chaos Runner。",
  },
  CHAOS_ANCHOR: {
    label: "Chaos Anchor",
    description:
      "UPSET と CONSISTENCY が強みの、波乱を支えるタイプです。\n\
荒れた局面でも粘り強く価値を拾い続け、崩れにくいのが武器です。\n\
さらに上を目指すなら WIN か SCORER を伸ばし、波乱を安定した勝ちに接続しましょう。次の到達点は All-Rounder（強み3）です。\n\
カオスの中でも沈まない軸は、まさに Chaos Anchor。",
  },
  SPARK_PLUG: {
    label: "Spark Plug",
    description:
      "ACTIVITY と CONSISTENCY が強みの、推進力タイプです。\n\
高い稼働を長く維持でき、試合数が増えるほど存在感が出ます。\n\
さらに上を目指すなら WIN か SCORER を伸ばし、エンジンを得点に変えましょう。次の到達点は All-Rounder（強み3）です。\n\
チームに火をつけ続けるエネルギーは、まさに Spark Plug。",
  },
};

/** 旧タイプ ID → V1 コピー ID */
const LEGACY_ANALYSIS_TYPE_ALIAS: Partial<Record<AnalysisTypeId, string>> = {
  CHEAT_CODE: "GOAT",
  ELITE_ALLROUNDER: "ALL_ROUNDER",
  GIANT_SLAYER: "BIG_GAME_HUNTER",
  HOT_HAND: "CHAOS_RUNNER",
  UNICORN: "CLUTCH",
  ASSASSIN: "SHARPSHOOTER",
  KILLER_INSTINCT: "WALKING_BUCKET",
  SWISS_ARMY_KNIFE: "ALL_ROUNDER",
  TECHNICIAN: "CHAOS_ANCHOR",
  IRON_ENGINE: "SPARK_PLUG",
  BULLDOG: "HIGH_FLOOR",
  SCRAPPER: "CHAOS_ANCHOR",
};

export function resolveMonthlyReportAnalysisTypeCopy(
  id: AnalysisTypeId
): MonthlyReportAnalysisTypeCopy {
  const mapped = LEGACY_ANALYSIS_TYPE_ALIAS[id] ?? id;
  return (
    MONTHLY_REPORT_ANALYSIS_TYPE_COPY[mapped] ??
    MONTHLY_REPORT_ANALYSIS_TYPE_COPY.PROSPECT
  );
}
