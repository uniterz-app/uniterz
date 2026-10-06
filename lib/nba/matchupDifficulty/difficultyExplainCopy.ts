/** Pro Insight SCHEDULE の「?」で開く Matchup Difficulty の説明（Web / Native 共通） */
import { L, type LocalizedLang } from "@/lib/i18n/localize";

export type DifficultyExplainCopy = {
  title: string;
  lines: string[];
  helpAria: string;
};

export function difficultyExplainCopy(lang: LocalizedLang): DifficultyExplainCopy {
  return {
    title: L(lang, {
      ja: "試合の厳しさとは",
      en: "What is matchup difficulty?",
      ko: "경기 난이도란?",
      zh: "什么是比赛难度？",
      es: "¿Qué es la dificultad?",
      pt: "O que é a dificuldade?",
      fr: "Qu'est-ce que la difficulté ?",
      de: "Was ist die Schwierigkeit?",
      ar: "ما هي صعوبة المباراة؟",
    }),
    lines: [
      L(lang, {
        ja: "相手の強さ・ホーム/アウェイ・休養から見た、この試合の厳しさの目安（0〜100）。50 が平均的な試合で、自チームの強さは含みません。",
        en: "How tough this game is (0–100) based on opponent, venue, and rest. 50 = an average game. Your own team's strength isn't included.",
        ko: "상대 전력·홈/원정·휴식으로 본 이 경기의 난이도(0~100). 50 = 평균적인 경기이며 자기 팀 전력은 포함하지 않습니다.",
        zh: "根据对手实力、主客场与休息得出的本场难度（0–100）。50 = 平均水平，不含自身实力。",
        es: "Lo exigente del partido (0–100) según rival, sede y descanso. 50 = un partido promedio. No incluye la fuerza del propio equipo.",
        pt: "O quão exigente é o jogo (0–100) por adversário, local e descanso. 50 = um jogo médio. Não inclui a força do próprio time.",
        fr: "Difficulté du match (0–100) selon l'adversaire, le lieu et le repos. 50 = un match moyen. La force de sa propre équipe n'est pas incluse.",
        de: "Wie schwer das Spiel ist (0–100) nach Gegner, Ort und Pause. 50 = durchschnittlich. Die eigene Teamstärke zählt nicht.",
        ar: "مدى صعوبة المباراة (0–100) حسب الخصم والملعب والراحة. 50 = مباراة متوسطة. لا تشمل قوة الفريق نفسه.",
      }),
      L(lang, {
        ja: "相手の強さ: 相手の 1 試合あたり得失点差（今季 8 割 + 直近 10 試合 2 割。序盤は前季の値で補正）。",
        en: "Opponent: their per-game point differential (80% season, 20% last 10; blended with last season early on).",
        ko: "상대 전력: 상대의 경기당 득실차(시즌 80% + 최근 10경기 20%, 초반에는 지난 시즌으로 보정).",
        zh: "对手实力：对手场均净胜分（本季 80% + 近 10 场 20%，赛季初用上季修正）。",
        es: "Rival: su diferencial de puntos por partido (80 % temporada, 20 % últimos 10; al inicio se mezcla con la anterior).",
        pt: "Adversário: saldo de pontos por jogo (80% temporada, 20% últimos 10; no início, mistura com a anterior).",
        fr: "Adversaire : son différentiel de points par match (80 % saison, 20 % 10 derniers ; mêlé à la saison passée en début).",
        de: "Gegner: Punktedifferenz pro Spiel (80 % Saison, 20 % letzte 10; früh mit Vorsaison gemischt).",
        ar: "الخصم: فارق النقاط لكل مباراة (80٪ الموسم، 20٪ آخر 10؛ يُمزج بالموسم السابق في البداية).",
      }),
      L(lang, {
        ja: "ホーム/アウェイ: ホームは約 2 点有利、アウェイは約 2 点不利として換算。",
        en: "Venue: home counts as about +2 points, road about −2.",
        ko: "홈/원정: 홈은 약 2점 유리, 원정은 약 2점 불리로 환산.",
        zh: "主客场：主场约 +2 分，客场约 −2 分。",
        es: "Sede: local cuenta como unos +2 puntos; visitante, unos −2.",
        pt: "Local: em casa vale cerca de +2 pontos; fora, cerca de −2.",
        fr: "Lieu : domicile ≈ +2 points, extérieur ≈ −2.",
        de: "Ort: Heim ≈ +2 Punkte, auswärts ≈ −2.",
        ar: "الملعب: على الأرض ≈ +2 نقطة، خارجها ≈ −2.",
      }),
      L(lang, {
        ja: "休養: B2B・1日・2日・3日以上の差を点差に換算（B2B は約 2.7 点の不利）。",
        en: "Rest: B2B / 1 / 2 / 3+ days converted to points (a B2B costs about 2.7).",
        ko: "휴식: 백투백·1일·2일·3일 이상의 차이를 점수로 환산(백투백은 약 2.7점 불리).",
        zh: "休息：背靠背/1/2/3 天以上的差异折算成分差（背靠背约 −2.7 分）。",
        es: "Descanso: B2B / 1 / 2 / 3+ días en puntos (un B2B resta unos 2,7).",
        pt: "Descanso: B2B / 1 / 2 / 3+ dias em pontos (um B2B tira cerca de 2,7).",
        fr: "Repos : B2B / 1 / 2 / 3+ jours convertis en points (un B2B ≈ −2,7).",
        de: "Pause: B2B / 1 / 2 / 3+ Tage in Punkte umgerechnet (B2B ≈ −2,7).",
        ar: "الراحة: B2B / 1 / 2 / 3+ أيام محوّلة إلى نقاط (B2B ≈ −2.7).",
      }),
      L(lang, {
        ja: "内訳の ± は、それぞれを足したときに厳しさがいくつ動いたか。~ は今季の試合が少ない間の目安です。",
        en: "Each ± in the breakdown is how much that factor moved the number. ~ = early-season estimate.",
        ko: "내역의 ±는 각 요소가 수치를 얼마나 움직였는지입니다. ~ = 시즌 초반 추정치.",
        zh: "拆解中的 ± 表示各因素使数值变化多少。~ = 赛季初估算。",
        es: "Cada ± indica cuánto movió el número ese factor. ~ = estimación de inicio de temporada.",
        pt: "Cada ± mostra quanto aquele fator mexeu no número. ~ = estimativa de início de temporada.",
        fr: "Chaque ± indique de combien ce facteur a fait bouger le chiffre. ~ = estimation de début de saison.",
        de: "Jedes ± zeigt, wie stark der Faktor die Zahl bewegt. ~ = Schätzung zu Saisonbeginn.",
        ar: "كل ± يوضح مقدار تأثير العامل على الرقم. ~ = تقدير بداية الموسم.",
      }),
      L(lang, {
        ja: "今夜の欠場者（けが人）は含みません。INJURY IMPACT で、選手ごとの欠場の影響（過去5シーズンの試合から推定した点数）を足して補正します。",
        en: "Tonight's injuries aren't included here — INJURY IMPACT adds each absent player's impact (points, estimated from five seasons of games).",
        ko: "오늘 결장자(부상)는 포함하지 않습니다. INJURY IMPACT에서 선수별 결장 영향(최근 5시즌 경기로 추정한 점수)을 더해 보정합니다.",
        zh: "此处不含今晚的伤停。INJURY IMPACT 会加上每位缺阵球员的影响（基于近五个赛季比赛估算的分值）来修正。",
        es: "Aquí no se incluyen las bajas de hoy; INJURY IMPACT suma el impacto de cada baja (puntos estimados con cinco temporadas de partidos).",
        pt: "Aqui não entram as baixas de hoje; INJURY IMPACT soma o impacto de cada baixa (pontos estimados com cinco temporadas de jogos).",
        fr: "Les absences du soir ne sont pas incluses ici — INJURY IMPACT ajoute l'impact de chaque absent (points estimés sur cinq saisons de matchs).",
        de: "Heutige Ausfälle sind hier nicht enthalten — INJURY IMPACT addiert den Einfluss jedes Fehlenden (Punkte, geschätzt aus fünf Spielzeiten).",
        ar: "لا تشمل غيابات الليلة هنا — يضيف INJURY IMPACT تأثير كل لاعب غائب (نقاط مقدّرة من مباريات خمسة مواسم).",
      }),
    ],
    helpAria: L(lang, {
      ja: "試合の厳しさの説明",
      en: "About matchup difficulty",
      ko: "경기 난이도 설명",
      zh: "比赛难度说明",
      es: "Sobre la dificultad",
      pt: "Sobre a dificuldade",
      fr: "À propos de la difficulté",
      de: "Zur Schwierigkeit",
      ar: "حول صعوبة المباراة",
    }),
  };
}
