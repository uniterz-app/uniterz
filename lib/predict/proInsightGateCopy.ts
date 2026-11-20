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
    title: L(lang, {
      ja: "この試合の勝つ確率・予想スコア・得点王は PRO PICK で見られます",
      en: "See this game's win chance, projected score and top scorer with PRO PICK",
      ko: "이 경기의 승리 확률·예상 스코어·득점왕은 PRO PICK에서 볼 수 있습니다",
      zh: "本场的胜率、预测比分与得分王，在 PRO PICK 中查看",
      es: "La probabilidad de victoria, el marcador previsto y el máximo anotador de este partido, en PRO PICK",
      pt: "A chance de vitória, o placar previsto e o cestinha deste jogo no PRO PICK",
      fr: "Probabilité de victoire, score projeté et meilleur marqueur de ce match dans PRO PICK",
    }),
    body: L(lang, {
      ja: "全試合ぶんを、試合前日の 20:00 ごろに出します。",
      en: "Out for every game around 8 PM (JST) the day before.",
      ko: "모든 경기를 경기 전날 20:00(JST)쯤 공개합니다.",
      zh: "每场比赛都会在赛前一天 20:00（日本时间）左右发布。",
      es: "Para todos los partidos, hacia las 20:00 (JST) del día anterior.",
      pt: "Para todos os jogos, por volta das 20:00 (JST) do dia anterior.",
      fr: "Pour chaque match, vers 20 h (JST) la veille.",
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
