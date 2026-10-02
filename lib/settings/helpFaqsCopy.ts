/**
 * Help FAQ 本文（Q&A・採点ロジック）（7言語）。
 * Web `HelpPage` / Native `helpFaqsNative` 共有。
 */
import { L, Ls, resolveLocalizedLang } from "@/lib/i18n/localize";

export type HelpFaqId = "form" | "stats" | "scoring-logic" | "ranking";

export type HelpScoringSectionId = "winRate" | "totalPoints" | "upsetPoints";

export type HelpTextBlock = {
  kind: "heading" | "body";
  text: string;
};

export type HelpScoringSectionCopy = {
  id: HelpScoringSectionId;
  title: string;
  blocks: readonly HelpTextBlock[];
};

export type HelpFaqFormCopy = {
  id: "form";
  label: string;
  question: string;
  intro: string;
  bullets: readonly string[];
  outro: string;
};

export type HelpFaqStatsCopy = {
  id: "stats";
  label: string;
  question: string;
  bullets: readonly string[];
  outro: string;
};

export type HelpFaqScoringCopy = {
  id: "scoring-logic";
  label: string;
  question: string;
  intro: string;
  sections: readonly HelpScoringSectionCopy[];
};

export type HelpFaqRankingCopy = {
  id: "ranking";
  label: string;
  question: string;
  intro: string;
  bullets: readonly string[];
  outro: string;
  noteTitle: string;
  noteBody: string;
};

export type HelpFaqEntryCopy =
  | HelpFaqFormCopy
  | HelpFaqStatsCopy
  | HelpFaqScoringCopy
  | HelpFaqRankingCopy;

export function helpFaqsCopy(
  language: string | null | undefined
): readonly HelpFaqEntryCopy[] {
  const lang = resolveLocalizedLang(language);

  const scoringSections: HelpScoringSectionCopy[] = [
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
      blocks: [
        {
          kind: "body",
          text: L(lang, {
            ja: "勝敗予想の的中率です（勝ち数 ÷ 投稿数）。",
            en: "Your winner-prediction accuracy (wins ÷ submissions).",
            ko: "승패 예상의 적중률입니다(승수 ÷ 제출 수).",
            zh: "胜负预测的命中率（胜场 ÷ 提交数）。",
            es: "Precisión al predecir el ganador (aciertos ÷ envíos).",
            pt: "Precisão ao prever o vencedor (acertos ÷ envios).",
            fr: "Précision des prédictions de vainqueur (victoires ÷ soumissions).",
          }),
        },
      ],
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
      blocks: [
        {
          kind: "heading",
          text: L(lang, {
            ja: "サッカー（WC など）",
            en: "Football (WC, etc.)",
            ko: "축구(WC 등)",
            zh: "足球（世界杯等）",
            es: "Fútbol (Mundial, etc.)",
            pt: "Futebol (Copa, etc.)",
            fr: "Football (Coupe du monde, etc.)",
          }),
        },
        {
          kind: "body",
          text: L(lang, {
            ja: "勝者的中で +4点。",
            en: "Correct winner: +4 points.",
            ko: "승자 적중 시 +4점.",
            zh: "猜中胜者 +4 分。",
            es: "Ganador correcto: +4 puntos.",
            pt: "Vencedor correto: +4 pontos.",
            fr: "Bon vainqueur : +4 points.",
          }),
        },
        {
          kind: "body",
          text: L(lang, {
            ja: "HOME得点一致 +2点、AWAY得点一致 +2点、得失点差一致 +2点（各完全一致のみ）。",
            en: "HOME goals match +2, AWAY goals match +2, goal difference match +2 (exact match for each).",
            ko: "HOME 득점 일치 +2, AWAY 득점 일치 +2, 득실차 일치 +2(각각 완전 일치).",
            zh: "主队进球一致 +2，客队进球一致 +2，净胜球一致 +2（均需完全一致）。",
            es: "Goles LOCAL +2, goles VISITANTE +2, diferencia de goles +2 (exactos).",
            pt: "Gols CASA +2, gols FORA +2, saldo de gols +2 (exatos).",
            fr: "Buts DOM +2, buts EXT +2, différence de buts +2 (exact).",
          }),
        },
        {
          kind: "body",
          text: L(lang, {
            ja: "基本点は 0 / 4 / 6 / 8 / 10点 など（勝者のみ4点、引き分け＋得失点差で6点、完全一致10点）。",
            en: "Base points: 0 / 4 / 6 / 8 / 10 (winner only 4, draw + matching goal diff 6, exact score 10).",
            ko: "기본점은 0 / 4 / 6 / 8 / 10점 등(승자만 4, 무승부+득실차 일치 6, 완전 일치 10).",
            zh: "基础分 0 / 4 / 6 / 8 / 10（仅猜中胜者 4，平局+净胜球一致 6，完全一致 10）。",
            es: "Base: 0 / 4 / 6 / 8 / 10 (solo ganador 4, empate + diferencia 6, marcador exacto 10).",
            pt: "Base: 0 / 4 / 6 / 8 / 10 (só vencedor 4, empate + saldo 6, placar exato 10).",
            fr: "Base : 0 / 4 / 6 / 8 / 10 (vainqueur seul 4, nul + diff. 6, score exact 10).",
          }),
        },
        {
          kind: "heading",
          text: L(lang, {
            ja: "NBA",
            en: "NBA",
            ko: "NBA",
            zh: "NBA",
            es: "NBA",
            pt: "NBA",
            fr: "NBA",
          }),
        },
        {
          kind: "body",
          text: L(lang, {
            ja: "勝者的中で +4点。得失点差の近さ（Max4点）、合計得点の近さ（Max2点）で加点（すべて一致で基本点10点）。",
            en: "Correct winner: +4. Margin closeness (max 4) and total-score closeness (max 2) add points (all match → 10 base points).",
            ko: "승자 적중 +4. 득실차 근접(최대 4), 합계 득점 근접(최대 2)으로 가점(전부 일치 시 기본 10).",
            zh: "猜中胜者 +4。分差接近度（最高 4）、总分接近度（最高 2）加分（全部一致→基础 10）。",
            es: "Ganador correcto: +4. Cercanía de margen (máx. 4) y de puntos totales (máx. 2) suman (todo exacto → base 10).",
            pt: "Vencedor correto: +4. Proximidade de margem (máx. 4) e de pontos totais (máx. 2) somam (tudo certo → base 10).",
            fr: "Bon vainqueur : +4. Proximité d’écart (max 4) et de score total (max 2) (tout exact → base 10).",
          }),
        },
        {
          kind: "body",
          text: L(lang, {
            ja: "連勝ボーナス：3〜4連勝 +1点、5〜6連勝 +2点、7連勝以上 +3点（2連勝以下は0点）。",
            en: "Win-streak bonus: +1 (3–4 streak), +2 (5–6), +3 (7+), else 0.",
            ko: "연승 보너스: 3–4연승 +1, 5–6연승 +2, 7연승 이상 +3(2연승 이하는 0).",
            zh: "连胜奖励：3–4 连胜 +1，5–6 连胜 +2，7 连胜及以上 +3（2 连胜及以下为 0）。",
            es: "Bonus de racha: +1 (3–4), +2 (5–6), +3 (7+); si no, 0.",
            pt: "Bônus de sequência: +1 (3–4), +2 (5–6), +3 (7+); senão 0.",
            fr: "Bonus de série : +1 (3–4), +2 (5–6), +3 (7+) ; sinon 0.",
          }),
        },
        {
          kind: "heading",
          text: L(lang, {
            ja: "ワールドカップ（同時キックオフ）",
            en: "World Cup (same kickoff)",
            ko: "월드컵(동시 킥오프)",
            zh: "世界杯（同时开球）",
            es: "Mundial (mismo saque)",
            pt: "Copa do Mundo (mesmo horário)",
            fr: "Coupe du monde (même coup d’envoi)",
          }),
        },
        {
          kind: "body",
          text: L(lang, {
            ja: "同じキックオフ時刻の試合は1グループとして連勝を判定します。グループ内で投稿した試合がすべて的中なら試合数ぶん連勝が伸び、1つでも外れると連勝は0になります（未投稿の試合は対象外）。",
            en: "Matches with the same kickoff time are scored as one streak group. If every match you submitted in the group is correct, the streak grows by that count; one miss resets the streak to 0 (unsubmitted matches are ignored).",
            ko: "같은 킥오프 시각의 경기는 1그룹으로 연승을 판정합니다. 그룹 내 제출한 경기가 모두 적중하면 경기 수만큼 연승이 늘고, 하나라도 틀리면 연승은 0이 됩니다(미제출 경기는 제외).",
            zh: "相同开球时间的比赛作为一组判定连胜。组内你提交的比赛全部命中则连胜按场次增加；只要有一场错误连胜归零（未提交的比赛不计）。",
            es: "Los partidos con el mismo saque cuentan como un grupo de racha. Si aciertas todos los que enviaste en el grupo, la racha crece; un fallo la deja en 0 (los no enviados no cuentan).",
            pt: "Jogos com o mesmo horário contam como um grupo de sequência. Se acertar todos os que enviou no grupo, a sequência cresce; um erro zera (não enviados não contam).",
            fr: "Les matchs au même coup d’envoi forment un groupe de série. Si tous ceux que vous avez soumis sont justes, la série augmente ; un échec la remet à 0 (non soumis ignorés).",
          }),
        },
        {
          kind: "body",
          text: L(lang, {
            ja: "アップセットボーナス：あなたの予想が少数派で的中し、かつ試合がアップセットだった場合 +2点。",
            en: "Upset bonus: +2 when your minority pick is correct and the match is an upset.",
            ko: "업셋 보너스: 소수파 예상이 적중하고 경기가 업셋이면 +2점.",
            zh: "冷门奖励：少数派预测命中且比赛为冷门时 +2。",
            es: "Bonus upset: +2 si tu pick minoritario acierta y el partido es un upset.",
            pt: "Bônus upset: +2 se seu pick minoritário acertar e o jogo for um upset.",
            fr: "Bonus upset : +2 si votre pick minoritaire est correct et que le match est un upset.",
          }),
        },
        {
          kind: "body",
          text: L(lang, {
            ja: "※ 勝者予想を外した場合、総合得点は0点です。",
            en: "If you miss the winner, total points are 0.",
            ko: "※ 승자 예상을 틀리면 종합 득점은 0점입니다.",
            zh: "※ 猜错胜者则综合得分为 0。",
            es: "Si fallas el ganador, los puntos totales son 0.",
            pt: "Se errar o vencedor, os pontos totais são 0.",
            fr: "Si vous ratez le vainqueur, les points totaux sont 0.",
          }),
        },
      ],
    },
    {
      id: "upsetPoints",
      title: L(lang, {
        ja: "アップセット得点",
        en: "Upset Points",
        ko: "업셋 득점",
        zh: "冷门得分",
        es: "Puntuación upset",
        pt: "Pontuação upset",
        fr: "Score upset",
      }),
      blocks: [
        {
          kind: "body",
          text: L(lang, {
            ja: "アップセット（番狂わせ）が起きた試合で、あなたが少数派の予想を当てたときに加点される指標です（1試合0〜10点）。",
            en: "A 0–10 metric awarded when an upset happens and your minority pick is correct.",
            ko: "업셋(이변)이 난 경기에서 소수파 예상을 맞혔을 때 가점되는 지표입니다(경기당 0–10점).",
            zh: "在冷门比赛中猜中少数派一方时获得的加分（每场 0–10 分）。",
            es: "Métrica 0–10 cuando hay un upset y aciertas el lado minoritario.",
            pt: "Métrica 0–10 quando há um upset e você acerta o lado minoritário.",
            fr: "Métrique 0–10 lorsqu’un upset a lieu et que votre pick minoritaire est correct.",
          }),
        },
        {
          kind: "body",
          text: L(lang, {
            ja: "あなたの予想側が45%以下の少数派になるとアップセット得点の対象になり、10%以下のような強い少数派に近づくほど10点に近い高得点になります。",
            en: "Your pick qualifies when your side is 45% or lower. Closer to a strong minority (10% or lower) earns closer to 10 points.",
            ko: "예상 측이 45% 이하 소수파가 되면 대상이며, 10% 이하처럼 강한 소수파에 가까울수록 10점에 가까운 고득점이 됩니다.",
            zh: "当所选一方占比 ≤45% 时适用；越接近 ≤10% 的强少数派，得分越接近 10。",
            es: "Califica si tu lado es ≤45%. Cuanto más fuerte la minoría (≤10%), más cerca de 10 puntos.",
            pt: "Vale se o seu lado for ≤45%. Quanto mais forte a minoria (≤10%), mais perto de 10 pontos.",
            fr: "Applicable si votre camp est ≤45 %. Plus la minorité est forte (≤10 %), plus le score approche 10.",
          }),
        },
      ],
    },
  ];

  return [
    {
      id: "form",
      label: "GAMEPLAY",
      question: L(lang, {
        ja: "このアプリでは何を楽しめますか？",
        en: "What can I enjoy in this app?",
        ko: "이 앱에서는 무엇을 즐길 수 있나요?",
        zh: "在本应用中可以做什么？",
        es: "¿Qué puedo disfrutar en esta app?",
        pt: "O que posso aproveitar neste app?",
        fr: "Que puis-je faire dans cette appli ?",
      }),
      intro: L(lang, {
        ja: "Uniterz は、スポーツ予想をベースに楽しむファンタジーゲームです。次のようなプレイができます。",
        en: "Uniterz is a sports-prediction fantasy game. You can:",
        ko: "Uniterz는 스포츠 예상을 기반으로 즐기는 판타지 게임입니다. 다음과 같이 플레이할 수 있습니다.",
        zh: "Uniterz 是一款以体育预测为核心的幻想游戏。你可以：",
        es: "Uniterz es un fantasy de predicción deportiva. Puedes:",
        pt: "Uniterz é um fantasy de previsão esportiva. Você pode:",
        fr: "Uniterz est un fantasy de prédiction sportive. Vous pouvez :",
      }),
      bullets: Ls(lang, [
        {
          ja: "勝敗予想",
          en: "Predict wins and losses",
          ko: "승패 예상",
          zh: "预测胜负",
          es: "Predecir victorias y derrotas",
          pt: "Prever vitórias e derrotas",
          fr: "Prédire victoires et défaites",
        },
        {
          ja: "スコア予想（任意）",
          en: "Predict scores (optional)",
          ko: "스코어 예상(선택)",
          zh: "预测比分（可选）",
          es: "Predecir marcadores (opcional)",
          pt: "Prever placares (opcional)",
          fr: "Prédire les scores (optionnel)",
        },
        {
          ja: "試合ごとの投稿でポイント獲得",
          en: "Earn points from match-by-match submissions",
          ko: "경기별 제출로 포인트 획득",
          zh: "通过每场提交获得积分",
          es: "Ganar puntos con envíos por partido",
          pt: "Ganhar pontos com envios por jogo",
          fr: "Gagner des points match par match",
        },
        {
          ja: "ランキングで他ユーザーと競争",
          en: "Compete with other users in the rankings",
          ko: "랭킹에서 다른 유저와 경쟁",
          zh: "在排行榜与其他用户竞争",
          es: "Competir en los rankings",
          pt: "Competir nos rankings",
          fr: "Concourir dans les classements",
        },
      ]),
      outro: L(lang, {
        ja: "日々の投稿結果はプロフィールやランキングに反映されます。",
        en: "Your daily submission results are reflected on your profile and rankings.",
        ko: "매일의 제출 결과는 프로필과 랭킹에 반영됩니다.",
        zh: "每日提交结果会反映在个人资料和排行榜上。",
        es: "Tus envíos diarios se reflejan en tu perfil y rankings.",
        pt: "Seus envios diários aparecem no perfil e nos rankings.",
        fr: "Vos soumissions quotidiennes s’affichent sur le profil et les classements.",
      }),
    },
    {
      id: "stats",
      label: "METRICS",
      question: L(lang, {
        ja: "どんな成績指標がありますか？",
        en: "What performance metrics are available?",
        ko: "어떤 성적 지표가 있나요?",
        zh: "有哪些成绩指标？",
        es: "¿Qué métricas de rendimiento hay?",
        pt: "Quais métricas de desempenho existem?",
        fr: "Quelles métriques de performance sont disponibles ?",
      }),
      bullets: Ls(lang, [
        {
          ja: "勝率：勝敗予想の的中率",
          en: "Win Rate: accuracy in predicting winners",
          ko: "승률: 승패 예상의 적중률",
          zh: "胜率：胜负预测命中率",
          es: "Win Rate: precisión al predecir ganadores",
          pt: "Win Rate: precisão ao prever vencedores",
          fr: "Win Rate : précision des vainqueurs prédits",
        },
        {
          ja: "アップセット得点：番狂わせを読み切る力",
          en: "Upset Points: ability to read upsets",
          ko: "업셋 득점: 이변을 읽는 힘",
          zh: "冷门得分：洞察冷门的能力",
          es: "Upset Points: capacidad de leer upsets",
          pt: "Upset Points: capacidade de ler upsets",
          fr: "Upset Points : aptitude à lire les upsets",
        },
        {
          ja: "総合得点：各要素を合算したスコア",
          en: "Total Points: combined score from all elements",
          ko: "종합 득점: 각 요소를 합산한 점수",
          zh: "综合得分：各要素合计",
          es: "Total Points: puntuación combinada de todos los elementos",
          pt: "Total Points: pontuação combinada de todos os elementos",
          fr: "Total Points : score combiné de tous les éléments",
        },
      ]),
      outro: L(lang, {
        ja: "プロフィールでは大会・期間ごとに通算成績を確認できます。",
        en: "Your profile shows cumulative stats for each tournament and period.",
        ko: "프로필에서 대회·기간별 통산 성적을 확인할 수 있습니다.",
        zh: "可在个人资料中查看各赛事与时段的累计成绩。",
        es: "Tu perfil muestra stats acumuladas por torneo y periodo.",
        pt: "Seu perfil mostra stats acumuladas por torneio e período.",
        fr: "Votre profil affiche les stats cumulées par tournoi et période.",
      }),
    },
    {
      id: "scoring-logic",
      label: "SCORING",
      question: L(lang, {
        ja: "得点はどう計算されていますか？",
        en: "How are points calculated?",
        ko: "점수는 어떻게 계산되나요?",
        zh: "分数如何计算？",
        es: "¿Cómo se calculan los puntos?",
        pt: "Como os pontos são calculados?",
        fr: "Comment les points sont-ils calculés ?",
      }),
      intro: L(lang, {
        ja: "採点ロジックは下記3項目に分かれています。項目をタップすると詳細が開きます。",
        en: "Scoring logic is split into three sections. Tap a section to expand details.",
        ko: "점수 로직은 아래 3개 항목으로 나뉩니다. 항목을 탭하면 상세가 열립니다.",
        zh: "计分逻辑分为以下三项。点按即可展开详情。",
        es: "La puntuación se divide en tres secciones. Toca una para ver detalles.",
        pt: "A pontuação se divide em três seções. Toque para ver detalhes.",
        fr: "Le scoring est réparti en trois sections. Touchez pour afficher les détails.",
      }),
      sections: scoringSections,
    },
    {
      id: "ranking",
      label: "RANKINGS",
      question: L(lang, {
        ja: "ランキングはどのように表示されますか？",
        en: "How are rankings displayed?",
        ko: "랭킹은 어떻게 표시되나요?",
        zh: "排行榜如何显示？",
        es: "¿Cómo se muestran los rankings?",
        pt: "Como os rankings são exibidos?",
        fr: "Comment les classements s’affichent-ils ?",
      }),
      intro: L(lang, {
        ja: "ランキングは指標ごとに個別に表示されます。",
        en: "Rankings are displayed separately for each metric.",
        ko: "랭킹은 지표별로 개별 표시됩니다.",
        zh: "排行榜按指标分别显示。",
        es: "Los rankings se muestran por separado para cada métrica.",
        pt: "Os rankings são exibidos separadamente para cada métrica.",
        fr: "Les classements s’affichent séparément pour chaque métrique.",
      }),
      bullets: Ls(lang, [
        {
          ja: "勝率ランキング",
          en: "Win Rate ranking",
          ko: "승률 랭킹",
          zh: "胜率排行榜",
          es: "Ranking de Win Rate",
          pt: "Ranking de Win Rate",
          fr: "Classement Win Rate",
        },
        {
          ja: "総合得点ランキング",
          en: "Total Points ranking",
          ko: "종합 득점 랭킹",
          zh: "综合得分排行榜",
          es: "Ranking de Total Points",
          pt: "Ranking de Total Points",
          fr: "Classement Total Points",
        },
        {
          ja: "アップセット得点ランキング",
          en: "Upset Points ranking",
          ko: "업셋 득점 랭킹",
          zh: "冷门得分排行榜",
          es: "Ranking de Upset Points",
          pt: "Ranking de Upset Points",
          fr: "Classement Upset Points",
        },
        {
          ja: "最多得点者的中ランキング",
          en: "Top scorer hit ranking",
          ko: "최다 득점자 적중 랭킹",
          zh: "得分王命中排行榜",
          es: "Ranking de aciertos del máximo goleador",
          pt: "Ranking de acertos do artilheiro",
          fr: "Classement des bons tips de meilleur marqueur",
        },
      ]),
      outro: L(lang, {
        ja: "グローバルランキングは日本時間 16:00 に更新される累積スナップショットです。グループランキングとプロフィールの成績は、試合確定後に随時反映されます。",
        en: "Global rankings use a cumulative snapshot updated daily at 16:00 JST. Group rankings and profile stats update after each settled match.",
        ko: "글로벌 랭킹은 일본 시간 16:00에 갱신되는 누적 스냅샷입니다. 그룹 랭킹과 프로필 성적은 경기 확정 후 수시 반영됩니다.",
        zh: "全球排行榜为日本时间 16:00 更新的累计快照。小组排行与个人资料成绩在比赛结算后随时反映。",
        es: "Los rankings globales usan un snapshot acumulado actualizado a las 16:00 JST. Rankings de grupo y perfil se actualizan tras cada partido cerrado.",
        pt: "Os rankings globais usam um snapshot acumulado atualizado às 16:00 JST. Rankings de grupo e perfil atualizam após cada jogo fechado.",
        fr: "Les classements mondiaux utilisent un snapshot cumulé mis à jour à 16:00 JST. Groupes et profil se mettent à jour après chaque match clos.",
      }),
      noteTitle: L(lang, {
        ja: "同率のときの並び順",
        en: "Tie-break order",
        ko: "동률일 때 정렬",
        zh: "并列时的排序",
        es: "Orden en empates",
        pt: "Ordem em empates",
        fr: "Ordre en cas d’égalité",
      }),
      noteBody: L(lang, {
        ja: "総合得点以外の指標で数値が同じユーザーは、総合得点が高い順に並びます。勝率ランキングでは、勝率が同じ場合は投稿数の多い順を先に比較します。",
        en: "For metrics other than Total Points, users with the same value are sorted by higher Total Points first. In the Win Rate ranking, equal win rates are compared by submission count before Total Points.",
        ko: "종합 득점 외 지표에서 수치가 같은 사용자는 종합 득점이 높은 순으로 정렬됩니다. 승률 랭킹에서는 승률이 같으면 제출 수가 많은 순을 먼저 비교합니다.",
        zh: "除综合得分外，数值相同的用户按综合得分从高到低排序。胜率排行榜在胜率相同时先比较提交次数再比较综合得分。",
        es: "En métricas distintas de Total Points, a igualdad se ordena por mayor Total Points. En Win Rate, a igualdad se compara primero el número de envíos.",
        pt: "Em métricas além de Total Points, empates ordenam por maior Total Points. Em Win Rate, empates comparam primeiro o número de envios.",
        fr: "Hors Total Points, à égalité on trie par Total Points décroissant. Au Win Rate, à égalité on compare d’abord le nombre de soumissions.",
      }),
    },
  ];
}
