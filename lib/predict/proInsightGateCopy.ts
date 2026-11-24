/**
 * Free 向け Pro Insight ゲート文面（ReportGate の Insight 版）— 7言語。
 * 中身: 勝つ確率 · 予想スコア · 得点王の候補 · 的中率（アイコンのキーは旧名のまま）。
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";

export type ProInsightGateLang = LocalizedLang;
export const resolveProInsightGateLang = resolveLocalizedLang;

export type ProInsightGateBulletIcon =
  | "matchup"
  | "schedule"
  | "context"
  | "injury";

export type ProInsightGateBullet = {
  icon: ProInsightGateBulletIcon;
  title: string;
  detail: string;
};

export type ProInsightGateCopy = {
  eyebrow: string;
  title: string;
  body: string;
  /** 初回無料が残っているとき（払壁ではなくギフト） */
  firstFreeKicker: string;
  firstFreeTitle: string;
  firstFreeBody: string;
  /** 予想送信直後の案内（次の試合と同じ聞き方） */
  firstFreeAskTitle: string;
  firstFreeAskBody: string;
  firstFreeDeck: string;
  /** タブを開く前の案内モーダルで後回し */
  firstFreeLater: string;
  bullets: readonly ProInsightGateBullet[];
  cta: string;
  /** Native: 無料トライアル誘導のボタン文言 */
  trialCta: string;
  /** ゲート下に出す実画面サンプルの見出し */
  exampleLabel: string;
  /** ゲート下に出すこの試合の伏せ字カードの見出し */
  lockedCardLabel: string;
  proMemberAria: string;
};

/** Pro Insight はプレシーズンを生成しない（ingest の isProInsightEligibleNbaGame と同じ判定） */
export function isProInsightPreseasonPhase(seasonPhase: unknown): boolean {
  const phase = String(seasonPhase ?? "").trim().toLowerCase();
  return phase === "preseason" || phase === "pre";
}

/** プレシーズンの INSIGHT タブ（Free / Pro 共通。Pro 勧誘は出さない） */
export function proInsightPreseasonNotice(language: string | null | undefined): string {
  const lang = resolveLocalizedLang(language);
  return L(lang, {
    ja: "プレシーズンは PRO PICK の対象外です。\nレギュラーシーズン開幕から各試合の PRO PICK をお届けします。",
    en: "PRO PICK isn't available for preseason games.\nIt starts with the regular season.",
    ko: "프리시즌은 PRO PICK 대상이 아닙니다.\n정규시즌 개막부터 경기별 PRO PICK를 제공합니다.",
    zh: "季前赛不提供 PRO PICK。\n常规赛开幕后每场比赛都会提供。",
    es: "PRO PICK no está disponible en pretemporada.\nComienza con la temporada regular.",
    pt: "O PRO PICK não está disponível na pré-temporada.\nComeça com a temporada regular.",
    fr: "PRO PICK n’est pas disponible en présaison.\nIl démarre avec la saison régulière.",
    de: "PRO PICK ist in der Preseason nicht verfügbar.\nEs startet mit der regulären Saison.",
    ar: "PRO PICK غير متاح لمباريات ما قبل الموسم.\nيبدأ مع انطلاق الموسم العادي.",
  });
}

export function proInsightGateCopy(
  language: string | null | undefined
): ProInsightGateCopy {
  const lang = resolveLocalizedLang(language);
  return {
    eyebrow: "PRO PICK",
    firstFreeKicker: L(lang, {
      ja: "初回のみ",
      en: "First look",
      ko: "첫 회만",
      zh: "仅首次",
      es: "Solo la primera",
      pt: "Só a primeira",
      fr: "Première fois",
      de: "Nur beim ersten Mal",
      ar: "للمرة الأولى فقط",
    }),
    firstFreeTitle: L(lang, {
      ja: "この試合の PRO PICK が見られます",
      en: "You can see this game's PRO PICK",
      ko: "이 경기의 PRO PICK을 볼 수 있습니다",
      zh: "可以查看本场 PRO PICK",
      es: "Puedes ver el PRO PICK de este partido",
      pt: "Você pode ver o PRO PICK deste jogo",
      fr: "Tu peux voir le PRO PICK de ce match",
      de: "Du kannst das PRO PICK dieses Spiels sehen",
      ar: "يمكنك مشاهدة PRO PICK لهذه المباراة",
    }),
    firstFreeAskTitle: L(lang, {
      ja: "今予想した試合の PRO PICK を見ますか？",
      en: "See PRO PICK for the game you just picked?",
      ko: "방금 예측한 경기의 PRO PICK을 볼까요?",
      zh: "要看刚才预测的这场 PRO PICK 吗？",
      es: "¿Ves el PRO PICK del partido que acabas de pronosticar?",
      pt: "Ver o PRO PICK do jogo que você acabou de prever?",
      fr: "Voir le PRO PICK du match que tu viens de pronostiquer ?",
      de: "PRO PICK zum Spiel sehen, das du gerade getippt hast?",
      ar: "هل تريد مشاهدة PRO PICK للمباراة التي توقعتها للتو؟",
    }),
    firstFreeAskBody: L(lang, {
      ja: "最初の1試合だけ、広告なしで見られます。",
      en: "The first game is free — no ad.",
      ko: "첫 경기만 광고 없이 볼 수 있습니다.",
      zh: "仅第一场可免广告查看。",
      es: "El primer partido es gratis, sin anuncio.",
      pt: "Só o primeiro jogo é grátis, sem anúncio.",
      fr: "Le premier match est gratuit, sans pub.",
      de: "Nur das erste Spiel ist ohne Werbung kostenlos.",
      ar: "المباراة الأولى فقط مجانًا وبدون إعلان.",
    }),
    firstFreeDeck: L(lang, {
      ja: "今の予想",
      en: "YOUR PICK",
      ko: "방금 예측",
      zh: "刚才的预测",
      es: "TU PALPITE",
      pt: "SEU PALPITE",
      fr: "TON PRONO",
      de: "DEIN TIPP",
      ar: "توقعك الآن",
    }),
    firstFreeLater: L(lang, {
      ja: "あとで",
      en: "Later",
      ko: "나중에",
      zh: "稍后",
      es: "Más tarde",
      pt: "Depois",
      fr: "Plus tard",
      de: "Später",
      ar: "لاحقًا",
    }),
    firstFreeBody: L(lang, {
      ja: "この試合の勝つ確率・予想スコア・得点王を、広告なしで 1 回だけ開けます。",
      en: "Open this game's win chance, projected score and top scorer once — no ad.",
      ko: "이 경기의 승리 확률·예상 스코어·득점왕을 광고 없이 한 번만 엽니다.",
      zh: "本场胜率、预测比分与得分王，可免广告打开一次。",
      es: "Abre una vez la probabilidad, el marcador previsto y el máximo anotador de este partido, sin anuncio.",
      pt: "Abra uma vez a chance de vitória, o placar previsto e o cestinha deste jogo — sem anúncio.",
      fr: "Ouvre une fois la probabilité, le score projeté et le meilleur marqueur de ce match — sans pub.",
      de: "Öffne einmal Siegchance, Prognosescore und Topscorer dieses Spiels — ohne Werbung.",
      ar: "افتح مرة واحدة احتمالية الفوز والنتيجة المتوقعة وأفضل مسجل لهذه المباراة — بدون إعلان.",
    }),
    title: L(lang, {
      ja: "この試合の PRO PICK を見る",
      en: "See this game's PRO PICK",
      ko: "이 경기의 PRO PICK 보기",
      zh: "查看本场 PRO PICK",
      es: "Ver el PRO PICK de este partido",
      pt: "Ver o PRO PICK deste jogo",
      fr: "Voir le PRO PICK de ce match",
    }),
    body: L(lang, {
      ja: "勝つ確率・予想スコア・得点王。広告 1 本でこの試合だけ開きます。",
      en: "Win chance, projected score, top scorer. One ad unlocks this game.",
      ko: "승리 확률·예상 스코어·득점왕. 광고 1편으로 이 경기만 엽니다.",
      zh: "胜率、预测比分、得分王。看一条广告即可打开本场。",
      es: "Probabilidad, marcador previsto y máximo anotador. Un anuncio abre este partido.",
      pt: "Chance de vitória, placar previsto e cestinha. Um anúncio abre este jogo.",
      fr: "Probabilité, score projeté, meilleur marqueur. Une pub ouvre ce match.",
    }),
    bullets: [
      {
        icon: "matchup",
        title: L(lang, {
          ja: "勝つ確率",
          en: "Win chance",
          ko: "승리 확률",
          zh: "胜率",
          es: "Probabilidad de victoria",
          pt: "Chance de vitória",
          fr: "Probabilité de victoire",
        }),
        detail: L(lang, {
          ja: "実力差・ホーム・連戦・欠場で何点ずつ動くかの内訳つき",
          en: "Broken down into strength, home court, rest and absences, in points",
          ko: "전력 차·홈·연전·결장이 몇 점씩 움직이는지 내역 포함",
          zh: "附实力差、主场、连战、缺阵各影响几分的拆解",
          es: "Con desglose en puntos: nivel, localía, descanso y bajas",
          pt: "Com detalhamento em pontos: nível, mando, descanso e baixas",
          fr: "Détaillée en points : niveau, terrain, repos et absences",
        }),
      },
      {
        icon: "schedule",
        title: L(lang, {
          ja: "予想スコア",
          en: "Projected score",
          ko: "예상 스코어",
          zh: "预测比分",
          es: "Marcador previsto",
          pt: "Placar previsto",
          fr: "Score projeté",
        }),
        detail: L(lang, {
          ja: "両チームの点数と合計点、リーグ平均との差",
          en: "Both teams' points, the total, and how it compares to league average",
          ko: "양 팀 점수와 합계, 리그 평균과의 차이",
          zh: "双方得分、总分及与联盟平均的差距",
          es: "Puntos de cada equipo, total y diferencia con la media de la liga",
          pt: "Pontos de cada time, total e diferença para a média da liga",
          fr: "Points de chaque équipe, total et écart avec la moyenne de la ligue",
        }),
      },
      {
        icon: "context",
        title: L(lang, {
          ja: "得点王の候補",
          en: "Top-scorer odds",
          ko: "득점왕 후보",
          zh: "得分王候选",
          es: "Candidatos a máximo anotador",
          pt: "Candidatos a cestinha",
          fr: "Favoris meilleur marqueur",
        }),
        detail: L(lang, {
          ja: "両チームで一番点を取る確率が高い 3 人",
          en: "The three players most likely to lead both teams in points",
          ko: "양 팀에서 최다 득점 확률이 높은 3명",
          zh: "两队中最可能得分最高的 3 人",
          es: "Los tres con más opciones de ser el máximo anotador del partido",
          pt: "Os três com mais chance de ser o cestinha do jogo",
          fr: "Les trois joueurs les plus susceptibles de finir meilleur marqueur",
        }),
      },
      {
        icon: "injury",
        title: L(lang, {
          ja: "的中率を公開",
          en: "Hit rate in the open",
          ko: "적중률 공개",
          zh: "公开命中率",
          es: "Acierto a la vista",
          pt: "Taxa de acerto à mostra",
          fr: "Taux de réussite affiché",
        }),
        detail: L(lang, {
          ja: "終わった試合で予想が当たった割合を毎日更新",
          en: "How often the picks were right, updated daily from finished games",
          ko: "끝난 경기에서 예측이 맞은 비율을 매일 업데이트",
          zh: "每天根据已结束比赛更新预测命中比例",
          es: "Cuántas veces acertó, actualizado a diario con los partidos terminados",
          pt: "Quantas vezes acertou, atualizado diariamente com os jogos encerrados",
          fr: "Fréquence des bons pronostics, mise à jour chaque jour",
        }),
      },
    ],
    cta: "Explore Pro",
    trialCta: L(lang, {
      ja: "7日無料で試す",
      en: "Try 7 days free",
      ko: "7일 무료 체험",
      zh: "免费试用 7 天",
      es: "Prueba 7 días gratis",
      pt: "Teste 7 dias grátis",
      fr: "Essai gratuit 7 jours",
    }),
    exampleLabel: L(lang, {
      ja: "表示イメージ（例）",
      en: "What it looks like (example)",
      ko: "표시 이미지(예시)",
      zh: "显示示意（示例）",
      es: "Así se ve (ejemplo)",
      pt: "Como fica (exemplo)",
      fr: "À quoi ça ressemble (exemple)",
    }),
    lockedCardLabel: L(lang, {
      ja: "この試合の PRO PICK",
      en: "PRO PICK for this game",
      ko: "이 경기의 PRO PICK",
      zh: "本场 PRO PICK",
      es: "PRO PICK de este partido",
      pt: "PRO PICK deste jogo",
      fr: "PRO PICK de ce match",
    }),
    proMemberAria: L(lang, {
      ja: "Pro会員",
      en: "Pro member",
      ko: "Pro 회원",
      zh: "Pro 会员",
      es: "Miembro Pro",
      pt: "Membro Pro",
      fr: "Membre Pro",
    }),
  };
}

/** Free 向け PREVIEW チラ見せの下のロック枠 */
export function proInsightTeaserCopy(language: string | null | undefined): {
  title: string;
  body: string;
  cta: string;
  note: string;
} {
  const lang = resolveLocalizedLang(language);
  return {
    title: L(lang, {
      ja: "続きは PRO で",
      en: "Read the rest with Pro",
      ko: "나머지는 PRO에서",
      zh: "后续内容请升级 PRO",
      es: "Lee el resto con Pro",
      pt: "Leia o resto com o Pro",
      fr: "La suite avec Pro",
    }),
    body: L(lang, {
      ja: "狙い目の選手、ディフィカルティと条件、前回対戦からの注目点まで。MATCHUP・SCHEDULE・CONTEXT・PLAYERS もすべて読めます。",
      en: "Players to target, difficulty and conditions, and what to watch from the last meeting — plus the full MATCHUP, SCHEDULE, CONTEXT and PLAYERS.",
      ko: "노릴 만한 선수, 난이도와 조건, 지난 맞대결에서 볼 포인트까지. MATCHUP·SCHEDULE·CONTEXT·PLAYERS도 모두 볼 수 있습니다.",
      zh: "值得关注的球员、比赛难度与条件、上次交手后的看点，以及完整的 MATCHUP、SCHEDULE、CONTEXT、PLAYERS。",
      es: "Jugadores a seguir, dificultad y condiciones, y qué mirar del último duelo — además de MATCHUP, SCHEDULE, CONTEXT y PLAYERS completos.",
      pt: "Jogadores para ficar de olho, dificuldade e condições, e o que observar do último confronto — além de MATCHUP, SCHEDULE, CONTEXT e PLAYERS completos.",
      fr: "Joueurs à suivre, difficulté et conditions, ce qu’il faut retenir du dernier duel — plus MATCHUP, SCHEDULE, CONTEXT et PLAYERS en entier.",
    }),
    cta: L(lang, {
      ja: "7日無料で続きを読む",
      en: "Read on — 7 days free",
      ko: "7일 무료로 계속 읽기",
      zh: "免费试用 7 天继续阅读",
      es: "Sigue leyendo — 7 días gratis",
      pt: "Continue lendo — 7 dias grátis",
      fr: "Lire la suite — 7 jours gratuits",
    }),
    note: L(lang, {
      ja: "Weekly / Monthly は初回 7 日無料。期間中に解約すれば料金はかかりません。",
      en: "Weekly / Monthly: first 7 days free. Cancel during the trial and you won't be charged.",
      ko: "Weekly / Monthly는 첫 7일 무료. 기간 내 해지하면 요금이 청구되지 않습니다.",
      zh: "Weekly / Monthly 首次 7 天免费，试用期内取消不收费。",
      es: "Weekly / Monthly: primeros 7 días gratis. Si cancelas durante la prueba, no se cobra.",
      pt: "Weekly / Monthly: primeiros 7 dias grátis. Cancele durante o teste e não será cobrado.",
      fr: "Weekly / Monthly : 7 premiers jours offerts. Annulez pendant l’essai, rien n’est facturé.",
    }),
  };
}
