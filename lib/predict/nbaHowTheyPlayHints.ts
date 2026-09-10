/**
 * HUSTLE / TRACKING の説明文（7言語）。
 * チーム詳細とプレイヤー詳細で同じ文言を使うので 1 か所に置く。
 */
import type { UiStrings } from "@/lib/i18n/ui";

export const HOW_THEY_PLAY_HUSTLE_HINTS = {
  deflections: {
    ja: "パスを触って崩す回数。スティールの手前。",
    en: "Deflections. The step before a steal.",
    ko: "패스를 건드려 흐트러뜨린 횟수. 스틸 직전 단계.",
    zh: "碰到传球破坏进攻的次数。抢断的前一步。",
    es: "Desvíos. El paso previo al robo.",
    pt: "Desvios. O passo antes do roubo de bola.",
    fr: "Déviations. L’étape avant l’interception.",
  },
  charges: {
    ja: "チャージングを誘った回数。体を張った守備。",
    en: "Charges drawn. Taking a hit to stop the drive.",
    ko: "차징 파울을 유도한 횟수. 몸을 던진 수비.",
    zh: "造成对手带球撞人的次数。用身体挡住突破。",
    es: "Cargas provocadas. Poner el cuerpo para frenar la penetración.",
    pt: "Faltas de ataque provocadas. Colocar o corpo para parar o drive.",
    fr: "Fautes offensives provoquées. Encaisser le choc pour stopper la pénétration.",
  },
  looseBalls: {
    ja: "ルーズボール。拾えば攻撃、拾われれば失点。",
    en: "Loose balls recovered. Extra possessions, fewer giveaways.",
    ko: "루즈볼 획득. 잡으면 공격, 놓치면 실점.",
    zh: "争抢到的球。拿到就是进攻，丢掉就是失分。",
    es: "Balones sueltos recuperados. Posesiones extra, menos regalos.",
    pt: "Bolas soltas recuperadas. Posses extra, menos presentes.",
    fr: "Ballons perdus récupérés. Possessions bonus, moins de cadeaux.",
  },
  screenAst: {
    ja: "スクリーンから味方が決めた数。オフボールの仕事。",
    en: "Screen assists. Off-ball work that creates a make.",
    ko: "스크린으로 동료 득점을 만든 횟수. 오프볼에서의 일.",
    zh: "通过掩护帮助队友得分的次数。无球端的功劳。",
    es: "Asistencias de bloqueo. Trabajo sin balón que genera canasta.",
    pt: "Assistências de bloqueio. Trabalho sem bola que gera cesta.",
    fr: "Passes décisives sur écran. Le travail sans ballon qui crée un panier.",
  },
  contestedShots: {
    ja: "相手シュートに手を出した数。クローズアウト。",
    en: "Contested shots. Closeouts that bother the shooter.",
    ko: "상대 슈팅을 방해한 횟수. 클로즈아웃.",
    zh: "干扰对手出手的次数。补防封盖。",
    es: "Tiros disputados. Closeouts que incomodan al tirador.",
    pt: "Arremessos contestados. Closeouts que incomodam o arremessador.",
    fr: "Tirs contestés. Les closeouts qui gênent le shooteur.",
  },
} as const satisfies Record<string, UiStrings>;

export const HOW_THEY_PLAY_TRACKING_HINTS = {
  drives: {
    ja: "ゴールへ仕掛ける回数と、ドライブからの1試合平均得点。",
    en: "Drives per game, and points per game from those drives.",
    ko: "골밑으로 파고드는 횟수와 드라이브 경기당 득점.",
    zh: "冲击篮筐的次数与场均突破得分。",
    es: "Penetraciones por partido y los puntos que producen.",
    pt: "Drives por jogo e os pontos que geram.",
    fr: "Pénétrations par match et les points qui en découlent.",
  },
  catchAndShoot: {
    ja: "止まって受けるシュート。成功率と、そこからの1試合平均得点。",
    en: "Catch-and-shoot FG%, and points per game from those looks.",
    ko: "멈춰서 받아 쏘는 슈팅. 성공률과 경기당 득점.",
    zh: "接球即投。命中率与由此产生的场均得分。",
    es: "FG% en catch-and-shoot y los puntos por partido que aporta.",
    pt: "FG% em catch-and-shoot e os pontos por jogo que rende.",
    fr: "FG% en catch-and-shoot et les points par match associés.",
  },
  pullUp: {
    ja: "ドリブルから自分で打つ精度と、そこからの1試合平均得点。",
    en: "Pull-up FG%, and points per game created off the dribble.",
    ko: "드리블 후 스스로 쏘는 성공률과 경기당 득점.",
    zh: "自主运球出手的命中率与场均得分。",
    es: "FG% en pull-up y los puntos por partido creados desde el bote.",
    pt: "FG% em pull-up e os pontos por jogo criados no drible.",
    fr: "FG% en pull-up et les points par match créés en dribble.",
  },
  passes: {
    ja: "ボールを動かす手数。",
    en: "Passes per game. How much the ball moves.",
    ko: "경기당 패스 횟수. 볼이 얼마나 도는지.",
    zh: "场均传球次数。球的转移程度。",
    es: "Pases por partido. Cuánto se mueve el balón.",
    pt: "Passes por jogo. Quanto a bola circula.",
    fr: "Passes par match. À quel point le ballon circule.",
  },
  speed: {
    ja: "コート上の平均スピード。",
    en: "Average speed on the floor.",
    ko: "코트에서의 평균 스피드.",
    zh: "场上平均移动速度。",
    es: "Velocidad media en pista.",
    pt: "Velocidade média em quadra.",
    fr: "Vitesse moyenne sur le terrain.",
  },
  paintTouches: {
    ja: "ペイントに触れた回数と、ペイントタッチからの1試合平均得点。",
    en: "Paint touches, and points per game from those touches.",
    ko: "페인트존 터치 횟수와 그로부터의 경기당 득점.",
    zh: "禁区触球次数与由此产生的场均得分。",
    es: "Toques en la zona y los puntos por partido que generan.",
    pt: "Toques no garrafão e os pontos por jogo que geram.",
    fr: "Ballons touchés dans la raquette et les points par match associés.",
  },
} as const satisfies Record<string, UiStrings>;

/** SCORING タブの得点源ラベル（7言語） */
export const HOW_THEY_PLAY_SCORING_LABELS = {
  threes: {
    ja: "3P",
    en: "Threes",
    ko: "3점",
    zh: "三分",
    es: "Triples",
    pt: "Bolas de 3",
    fr: "3 points",
  },
  paint: {
    ja: "ペイント",
    en: "Paint",
    ko: "페인트존",
    zh: "禁区",
    es: "Zona",
    pt: "Garrafão",
    fr: "Raquette",
  },
  midRange: {
    ja: "ミッドレンジ",
    en: "Mid-range",
    ko: "미드레인지",
    zh: "中距离",
    es: "Media distancia",
    pt: "Média distância",
    fr: "Mi-distance",
  },
  freeThrows: {
    ja: "FT",
    en: "Free throws",
    ko: "자유투",
    zh: "罚球",
    es: "Tiros libres",
    pt: "Lances livres",
    fr: "Lancers francs",
  },
  fastBreak: {
    ja: "ファストブレイク",
    en: "Fast break",
    ko: "속공",
    zh: "快攻",
    es: "Contragolpe",
    pt: "Contra-ataque",
    fr: "Contre-attaque",
  },
} as const satisfies Record<string, UiStrings>;
