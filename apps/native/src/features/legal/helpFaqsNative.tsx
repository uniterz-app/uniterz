import { ReactNode } from "react";
import {
  L,
  resolveLocalizedLang,
  type LocalizedLang,
} from "../../../../../lib/i18n/localize";
import HelpScoringLogicNative from "./HelpScoringLogicNative";
import { HelpAnswerText, HelpBulletList, HelpFaqItemNative } from "./HelpAccordionItemNative";

function scoringLogic(lang: LocalizedLang): ReactNode {
  return (
    <HelpScoringLogicNative
      intro={L(lang, {
        ja: "採点ロジックは下記3項目に分かれています。項目をタップすると詳細が開きます。",
        en: "Scoring is split into three sections below. Tap a section to expand details.",
        ko: "점수 로직은 아래 3개 항목으로 나뉩니다. 항목을 탭하면 상세가 열립니다.",
        zh: "计分逻辑分为以下三项。点按即可展开详情。",
        es: "La puntuación se divide en tres secciones. Toca una para ver detalles.",
        pt: "A pontuação se divide em três seções. Toque para ver detalhes.",
        fr: "Le scoring est réparti en trois sections. Touchez pour afficher les détails.",
      })}
      defaultOpenId="totalPoints"
      sections={[
        {
          id: "winRate",
          title: L(lang, {
            ja: "勝率",
            en: "Win Rate",
            ko: "승률",
            zh: "胜率",
            es: "Porcentaje de aciertos",
            pt: "Taxa de acerto",
            fr: "Taux de réussite",
          }),
          content: L(lang, {
            ja: "勝敗予想の的中率です（勝ち数 ÷ 投稿数）。",
            en: "Your winner-prediction accuracy (wins ÷ submissions).",
            ko: "승패 예상의 적중률입니다(승수 ÷ 제출 수).",
            zh: "胜负预测的命中率（胜场 ÷ 提交数）。",
            es: "Precisión al predecir el ganador (aciertos ÷ envíos).",
            pt: "Precisão ao prever o vencedor (acertos ÷ envios).",
            fr: "Précision des prédictions de vainqueur (victoires ÷ soumissions).",
          }),
        },
        {
          id: "totalPoints",
          title: L(lang, {
            ja: "総合得点",
            en: "Total Points",
            ko: "종합 득점",
            zh: "综合得分",
            es: "Puntos totales",
            pt: "Pontos totais",
            fr: "Points totaux",
          }),
          content: L(lang, {
            ja: "【サッカー（WC など）】勝者的中 +4点。HOME得点一致 +2点、AWAY得点一致 +2点、得失点差一致 +2点（各完全一致のみ）。基本点は0/4/6/8/10点など（例：引き分け＋得失点差一致で6点、完全一致10点）。【NBA】勝者的中 +4点。得失点差の近さ（Max4点）と合計得点の近さ（Max2点）で加点（すべて一致で基本点10点）。連勝ボーナス：3〜4連勝 +1点、5〜6連勝 +2点、7連勝以上 +3点。アップセットボーナス：少数派予想が的中し試合がアップセットだった場合 +2点。※ 勝者予想を外した場合、総合得点は0点です。",
            en: "[Football (WC, etc.)] Correct winner: +4. HOME goals match: +2, AWAY goals match: +2, goal difference match: +2 (exact for each). Base points: 0/4/6/8/10 (e.g. draw + matching goal diff = 6, exact score = 10). [NBA] Correct winner: +4. Margin closeness (max 4) and total-score closeness (max 2) add points (all match → 10 base). Win streak bonus: +1 for 3–4 wins, +2 for 5–6, +3 for 7+. Upset bonus: +2 when your minority pick wins in an upset match. If you miss the winner, total points are 0.",
            ko: "[축구(WC 등)] 승자 적중 +4. HOME 득점 일치 +2, AWAY 득점 일치 +2, 득실차 일치 +2(각각 완전 일치). 기본점 0/4/6/8/10(예: 무승부+득실차 일치=6, 완전 일치=10). [NBA] 승자 적중 +4. 득실차 근접(최대 4)과 합계 득점 근접(최대 2)으로 가점(전부 일치 시 기본 10). 연승 보너스: 3–4연승 +1, 5–6연승 +2, 7연승 이상 +3. 업셋 보너스: 소수파 예상이 적중하고 경기가 업셋이면 +2. ※ 승자 예상을 틀리면 종합 득점은 0점입니다.",
            zh: "【足球（世界杯等）】猜中胜者 +4。主队进球一致 +2，客队进球一致 +2，净胜球一致 +2（均需完全一致）。基础分 0/4/6/8/10（例：平局+净胜球一致=6，完全一致=10）。【NBA】猜中胜者 +4。分差接近度（最高4）与总分接近度（最高2）加分（全部一致→基础10）。连胜奖励：3–4连胜 +1，5–6连胜 +2，7连胜及以上 +3。冷门奖励：少数派预测命中且比赛为冷门时 +2。※ 猜错胜者则综合得分为 0。",
            es: "[Fútbol (Mundial, etc.)] Ganador correcto: +4. Goles LOCAL: +2, goles VISITANTE: +2, diferencia de goles: +2 (exactos). Base: 0/4/6/8/10 (p. ej. empate + diferencia = 6, marcador exacto = 10). [NBA] Ganador correcto: +4. Cercanía de margen (máx. 4) y de puntos totales (máx. 2) suman (todo exacto → base 10). Racha: +1 por 3–4, +2 por 5–6, +3 por 7+. Bonus upset: +2 si tu pick minoritario acierta en un upset. Si fallas el ganador, total = 0.",
            pt: "[Futebol (Copa, etc.)] Vencedor correto: +4. Gols CASA: +2, gols FORA: +2, saldo de gols: +2 (exatos). Base: 0/4/6/8/10 (ex.: empate + saldo = 6, placar exato = 10). [NBA] Vencedor correto: +4. Proximidade de margem (máx. 4) e de pontos totais (máx. 2) somam (tudo certo → base 10). Sequência: +1 por 3–4, +2 por 5–6, +3 por 7+. Bônus upset: +2 se seu pick minoritário acertar em um upset. Se errar o vencedor, total = 0.",
            fr: "[Football (Coupe du monde, etc.)] Bon vainqueur : +4. Buts DOM : +2, buts EXT : +2, différence de buts : +2 (exact). Base : 0/4/6/8/10 (ex. nul + diff. = 6, score exact = 10). [NBA] Bon vainqueur : +4. Proximité d’écart (max 4) et de score total (max 2) (tout exact → base 10). Série : +1 pour 3–4, +2 pour 5–6, +3 pour 7+. Bonus upset : +2 si votre pick minoritaire gagne un upset. Si vous ratez le vainqueur, total = 0.",
          }),
        },
        {
          id: "upsetPoints",
          title: L(lang, {
            ja: "アップセット得点",
            en: "Upset Score",
            ko: "업셋 득점",
            zh: "冷门得分",
            es: "Puntuación upset",
            pt: "Pontuação upset",
            fr: "Score upset",
          }),
          content: L(lang, {
            ja: "アップセット（番狂わせ）が起きた試合で、少数派の予想を当てたときに加点される指標です（1試合0〜10点）。予想側が45%以下の少数派になると対象になり、10%以下の強い少数派に近づくほど10点に近い高得点になります。",
            en: "Points earned when you correctly pick the minority side in an upset match (0–10 per match). Applies when your side is 45% or below; stronger minority (10% or below) earns closer to 10 points.",
            ko: "업셋(이변)이 난 경기에서 소수파 예상을 맞혔을 때 가점되는 지표입니다(경기당 0–10점). 예상 측이 45% 이하일 때 대상이며, 10% 이하로 갈수록 10점에 가까워집니다.",
            zh: "在冷门比赛中猜中少数派一方时获得的加分（每场 0–10 分）。当所选一方占比 ≤45% 时适用；越接近 ≤10% 的强少数派，得分越接近 10。",
            es: "Puntos por acertar el lado minoritario en un upset (0–10 por partido). Aplica si tu lado es ≤45%; cuanto más fuerte la minoría (≤10%), más cerca de 10 puntos.",
            pt: "Pontos por acertar o lado minoritário em um upset (0–10 por jogo). Vale se o seu lado for ≤45%; quanto mais forte a minoria (≤10%), mais perto de 10 pontos.",
            fr: "Points gagnés en choisissant correctement le camp minoritaire lors d’un upset (0–10 par match). Applicable si votre camp est ≤45 % ; plus la minorité est forte (≤10 %), plus le score approche 10.",
          }),
        },
      ]}
    />
  );
}

export function getHelpFaqsNative(
  language: string | null | undefined
): HelpFaqItemNative[] {
  const lang = resolveLocalizedLang(language);

  return [
    {
      id: "form",
      label: L(lang, {
        ja: "ゲームの遊び方",
        en: "How to play",
        ko: "게임 플레이",
        zh: "如何游玩",
        es: "Cómo jugar",
        pt: "Como jogar",
        fr: "Comment jouer",
      }),
      question: L(lang, {
        ja: "このアプリでは何を楽しめますか？",
        en: "What can I enjoy in this app?",
        ko: "이 앱에서는 무엇을 즐길 수 있나요?",
        zh: "在本应用中可以做什么？",
        es: "¿Qué puedo disfrutar en esta app?",
        pt: "O que posso aproveitar neste app?",
        fr: "Que puis-je faire dans cette appli ?",
      }),
      icon: "gamepad-variant",
      answer: (
        <>
          <HelpAnswerText>
            {L(lang, {
              ja: "Uniterz は、スポーツ予想をベースに楽しむファンタジーゲームです。次のようなプレイができます。",
              en: "Uniterz is a sports-prediction fantasy game. You enjoy it by making predictions for matches. You can:",
              ko: "Uniterz는 스포츠 예상을 기반으로 즐기는 판타지 게임입니다. 다음과 같이 플레이할 수 있습니다.",
              zh: "Uniterz 是一款以体育预测为核心的幻想游戏。你可以：",
              es: "Uniterz es un fantasy de predicción deportiva. Puedes:",
              pt: "Uniterz é um fantasy de previsão esportiva. Você pode:",
              fr: "Uniterz est un fantasy de prédiction sportive. Vous pouvez :",
            })}
          </HelpAnswerText>
          <HelpBulletList
            items={[
              L(lang, {
                ja: "勝敗予想",
                en: "Predict wins and losses.",
                ko: "승패 예상",
                zh: "预测胜负",
                es: "Predecir victorias y derrotas.",
                pt: "Prever vitórias e derrotas.",
                fr: "Prédire victoires et défaites.",
              }),
              L(lang, {
                ja: "スコア予想（任意）",
                en: "Predict scores (optional).",
                ko: "스코어 예상(선택)",
                zh: "预测比分（可选）",
                es: "Predecir marcadores (opcional).",
                pt: "Prever placares (opcional).",
                fr: "Prédire les scores (optionnel).",
              }),
              L(lang, {
                ja: "試合ごとの投稿でポイント獲得",
                en: "Earn points from match-by-match submissions.",
                ko: "경기별 제출로 포인트 획득",
                zh: "通过每场提交获得积分",
                es: "Ganar puntos con envíos por partido.",
                pt: "Ganhar pontos com envios por jogo.",
                fr: "Gagner des points match par match.",
              }),
              L(lang, {
                ja: "ランキングで他ユーザーと競争",
                en: "Compete with other users in the rankings.",
                ko: "랭킹에서 다른 유저와 경쟁",
                zh: "在排行榜与其他用户竞争",
                es: "Competir en los rankings.",
                pt: "Competir nos rankings.",
                fr: "Concourir dans les classements.",
              }),
            ]}
          />
          <HelpAnswerText>
            {L(lang, {
              ja: "日々の投稿結果はプロフィールやランキングに反映されます。",
              en: "Your daily submission results are reflected on your profile and rankings.",
              ko: "매일의 제출 결과는 프로필과 랭킹에 반영됩니다.",
              zh: "每日提交结果会反映在个人资料和排行榜上。",
              es: "Tus envíos diarios se reflejan en tu perfil y rankings.",
              pt: "Seus envios diários aparecem no perfil e nos rankings.",
              fr: "Vos soumissions quotidiennes s’affichent sur le profil et les classements.",
            })}
          </HelpAnswerText>
        </>
      ),
    },
    {
      id: "stats",
      label: L(lang, {
        ja: "スコア計算",
        en: "Scoring",
        ko: "점수 계산",
        zh: "计分",
        es: "Puntuación",
        pt: "Pontuação",
        fr: "Score",
      }),
      question: L(lang, {
        ja: "どんな成績指標がありますか？",
        en: "What performance metrics are available?",
        ko: "어떤 성적 지표가 있나요?",
        zh: "有哪些成绩指标？",
        es: "¿Qué métricas de rendimiento hay?",
        pt: "Quais métricas de desempenho existem?",
        fr: "Quelles métriques de performance sont disponibles ?",
      }),
      icon: "chart-bar",
      answer: (
        <>
          <HelpBulletList
            items={[
              L(lang, {
                ja: "勝率：勝敗予想の的中率",
                en: "Win Rate: your accuracy in predicting winners.",
                ko: "승률: 승패 예상의 적중률",
                zh: "胜率：胜负预测命中率",
                es: "Win Rate: precisión al predecir ganadores.",
                pt: "Win Rate: precisão ao prever vencedores.",
                fr: "Win Rate : précision des vainqueurs prédits.",
              }),
              L(lang, {
                ja: "Upsetスコア：番狂わせを読み切る力",
                en: "Upset Score: your ability to read upsets.",
                ko: "Upset 스코어: 이변을 읽는 힘",
                zh: "Upset 得分：洞察冷门的能力",
                es: "Upset Score: capacidad de leer upsets.",
                pt: "Upset Score: capacidade de ler upsets.",
                fr: "Upset Score : aptitude à lire les upsets.",
              }),
              L(lang, {
                ja: "総合得点：各指標を合算したスコア",
                en: "Total Points: the combined score from all metrics.",
                ko: "종합 득점: 각 지표를 합산한 점수",
                zh: "综合得分：各指标合计",
                es: "Total Points: puntuación combinada de todas las métricas.",
                pt: "Total Points: pontuação combinada de todas as métricas.",
                fr: "Total Points : score combiné de toutes les métriques.",
              }),
            ]}
          />
          <HelpAnswerText>
            {L(lang, {
              ja: "各指標は、7日間・30日間・通算で集計されます。",
              en: "Each metric is aggregated for the last 7 days, last 30 days, and all-time.",
              ko: "각 지표는 최근 7일·30일·통산으로 집계됩니다.",
              zh: "各项指标按近 7 天、近 30 天与生涯汇总。",
              es: "Cada métrica se agrega a 7 días, 30 días y histórico.",
              pt: "Cada métrica é agregada em 7 dias, 30 dias e histórico.",
              fr: "Chaque métrique est agrégée sur 7 jours, 30 jours et depuis le début.",
            })}
          </HelpAnswerText>
        </>
      ),
    },
    {
      id: "scoring-logic",
      label: L(lang, {
        ja: "採点ロジック",
        en: "Scoring logic",
        ko: "채점 로직",
        zh: "计分逻辑",
        es: "Lógica de puntuación",
        pt: "Lógica de pontuação",
        fr: "Logique de scoring",
      }),
      question: L(lang, {
        ja: "得点はどう計算されていますか？",
        en: "How are points calculated?",
        ko: "점수는 어떻게 계산되나요?",
        zh: "分数如何计算？",
        es: "¿Cómo se calculan los puntos?",
        pt: "Como os pontos são calculados?",
        fr: "Comment les points sont-ils calculés ?",
      }),
      icon: "function-variant",
      answer: scoringLogic(lang),
    },
    {
      id: "ranking",
      label: L(lang, {
        ja: "ランキング",
        en: "Rankings",
        ko: "랭킹",
        zh: "排行榜",
        es: "Rankings",
        pt: "Rankings",
        fr: "Classements",
      }),
      question: L(lang, {
        ja: "ランキングはどのように表示されますか？",
        en: "How are rankings displayed?",
        ko: "랭킹은 어떻게 표시되나요?",
        zh: "排行榜如何显示？",
        es: "¿Cómo se muestran los rankings?",
        pt: "Como os rankings são exibidos?",
        fr: "Comment les classements s’affichent-ils ?",
      }),
      icon: "trophy",
      answer: (
        <>
          <HelpAnswerText>
            {L(lang, {
              ja: "ランキングは指標ごとに個別に表示されます。",
              en: "Rankings are displayed separately for each metric:",
              ko: "랭킹은 지표별로 개별 표시됩니다.",
              zh: "排行榜按指标分别显示：",
              es: "Los rankings se muestran por separado para cada métrica:",
              pt: "Os rankings são exibidos separadamente para cada métrica:",
              fr: "Les classements s’affichent séparément pour chaque métrique :",
            })}
          </HelpAnswerText>
          <HelpBulletList
            items={[
              L(lang, {
                ja: "勝率ランキング",
                en: "Win Rate rankings",
                ko: "승률 랭킹",
                zh: "胜率排行榜",
                es: "Rankings de Win Rate",
                pt: "Rankings de Win Rate",
                fr: "Classements Win Rate",
              }),
              L(lang, {
                ja: "総合得点ランキング",
                en: "Total Points rankings",
                ko: "종합 득점 랭킹",
                zh: "综合得分排行榜",
                es: "Rankings de Total Points",
                pt: "Rankings de Total Points",
                fr: "Classements Total Points",
              }),
              L(lang, {
                ja: "Upsetスコアランキング",
                en: "Upset Score rankings",
                ko: "Upset 스코어 랭킹",
                zh: "Upset 得分排行榜",
                es: "Rankings de Upset Score",
                pt: "Rankings de Upset Score",
                fr: "Classements Upset Score",
              }),
            ]}
          />
          <HelpAnswerText>
            {L(lang, {
              ja: "期間ごとの順位変化を見ながらプレイを継続できます。",
              en: "You can keep playing while watching how your rank changes over time.",
              ko: "기간별 순위 변화를 보며 계속 플레이할 수 있습니다.",
              zh: "可一边查看各时段名次变化一边继续游玩。",
              es: "Puedes seguir jugando mientras ves cómo cambia tu puesto.",
              pt: "Você pode continuar jogando enquanto acompanha a mudança de posição.",
              fr: "Vous pouvez continuer à jouer en suivant l’évolution de votre rang.",
            })}
          </HelpAnswerText>
        </>
      ),
    },
  ];
}

export function getHelpPageCopy(language: string | null | undefined) {
  const lang = resolveLocalizedLang(language);
  return {
    title: L(lang, {
      ja: "ヘルプ・ガイド",
      en: "Help & Guide",
      ko: "도움말·가이드",
      zh: "帮助与指南",
      es: "Ayuda y guía",
      pt: "Ajuda e guia",
      fr: "Aide et guide",
    }),
    description: L(lang, {
      ja: "Uniterz の使い方とスコアリングについて",
      en: "Learn how to use Uniterz and how scoring works.",
      ko: "Uniterz 사용법과 스코어링에 대해",
      zh: "了解 Uniterz 用法与计分方式",
      es: "Cómo usar Uniterz y cómo funciona la puntuación.",
      pt: "Como usar o Uniterz e como funciona a pontuação.",
      fr: "Utilisation d’Uniterz et fonctionnement du scoring.",
    }),
    lastUpdatedLabel: L(lang, {
      ja: "最終更新: ",
      en: "Last updated: ",
      ko: "최종 업데이트: ",
      zh: "最后更新：",
      es: "Última actualización: ",
      pt: "Última atualização: ",
      fr: "Dernière mise à jour : ",
    }),
  };
}
