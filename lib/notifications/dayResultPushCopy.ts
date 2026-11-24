import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";

/** 的中の「今日 / 昨日」。住んでいる場所の暦。 */
export type ResultDayWord = "today" | "yesterday";

/** 次の予想の「今日 / 明日」。次の試合日がその土地でまだ今日なら today。 */
export type NextPickDayWord = "today" | "tomorrow";

export type DayResultPushCopy = { title: string; body: string };

function n(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.floor(value));
}

/** 的中だけの 16:00 通知。順位の幅は書かない。 */
export function buildHitResultPushCopy(
  language: LocalizedLang | string,
  input: { day: ResultDayWord; posts: number; wins: number }
): DayResultPushCopy {
  const lang = resolveLocalizedLang(language);
  const posts = n(input.posts);
  const wins = Math.min(n(input.wins), posts);
  const today = input.day === "today";
  return {
    title: today
      ? L(lang, {
          ja: "今日の結果",
          en: "Today's results",
          ko: "오늘 결과",
          zh: "今天的结果",
          es: "Resultados de hoy",
          pt: "Resultados de hoje",
          fr: "Résultats d'aujourd'hui",
        })
      : L(lang, {
          ja: "昨日の結果",
          en: "Yesterday's results",
          ko: "어제 결과",
          zh: "昨天的结果",
          es: "Resultados de ayer",
          pt: "Resultados de ontem",
          fr: "Résultats d'hier",
        }),
    body: today
      ? L(lang, {
          ja: `今日の予想は${posts}試合中${wins}試合的中`,
          en: `You hit ${wins} of ${posts} picks today`,
          ko: `오늘 예측 ${posts}경기 중 ${wins}경기 적중`,
          zh: `今天 ${posts} 场预测中猜中 ${wins} 场`,
          es: `Hoy acertaste ${wins} de ${posts} tips`,
          pt: `Hoje você acertou ${wins} de ${posts} tips`,
          fr: `Aujourd'hui, ${wins} tips réussis sur ${posts}`,
        })
      : L(lang, {
          ja: `昨日の予想は${posts}試合中${wins}試合的中`,
          en: `You hit ${wins} of ${posts} picks yesterday`,
          ko: `어제 예측 ${posts}경기 중 ${wins}경기 적중`,
          zh: `昨天 ${posts} 场预测中猜中 ${wins} 场`,
          es: `Ayer acertaste ${wins} de ${posts} tips`,
          pt: `Ontem você acertou ${wins} de ${posts} tips`,
          fr: `Hier, ${wins} tips réussis sur ${posts}`,
        }),
  };
}

/**
 * 3 / 7 / 30 を跨いだ日の連続通知。
 * 的中も渡したときは、次の予想のあとに的中の文を足す。
 */
export function buildStreakNudgePushCopy(
  language: LocalizedLang | string,
  input: {
    streakDays: number;
    nextPick: NextPickDayWord;
    hits?: { day: ResultDayWord; posts: number; wins: number };
  }
): DayResultPushCopy {
  const lang = resolveLocalizedLang(language);
  const days = Math.max(1, n(input.streakDays));
  const nextIsToday = input.nextPick === "today";
  const status = L(lang, {
    ja: `現在、${days}日連続予想中。`,
    en: `You're on a ${days}-day streak.`,
    ko: `현재 ${days}일 연속 예측 중.`,
    zh: `当前已连续预测 ${days} 天。`,
    es: `Llevas ${days} días seguidos.`,
    pt: `Você está em ${days} dias seguidos.`,
    fr: `Série de ${days} jours en cours.`,
  });
  const nextLine = nextIsToday
    ? L(lang, {
        ja: "今日の予想で記録を伸ばそう",
        en: "Pick today to keep it going",
        ko: "오늘 예측으로 기록을 이어가세요",
        zh: "用今天的预测延续记录",
        es: "Predice hoy para seguir",
        pt: "Preveja hoje para continuar",
        fr: "Tippez aujourd'hui pour continuer",
      })
    : L(lang, {
        ja: "明日の予想で記録を伸ばそう",
        en: "Pick tomorrow to keep it going",
        ko: "내일 예측으로 기록을 이어가세요",
        zh: "用明天的预测延续记录",
        es: "Predice mañana para seguir",
        pt: "Preveja amanhã para continuar",
        fr: "Tippez demain pour continuer",
      });
  const hits = input.hits
    ? buildHitResultPushCopy(lang, input.hits).body
    : "";
  const lines = hits ? [status, nextLine, hits] : [status, nextLine];
  return {
    title: L(lang, {
      ja: `${days}日連続予想中`,
      en: `${days}-day streak`,
      ko: `${days}일 연속 예측 중`,
      zh: `连续预测 ${days} 天`,
      es: `Racha de ${days} días`,
      pt: `Sequência de ${days} dias`,
      fr: `Série de ${days} jours`,
    }),
    body: lines.join("\n"),
  };
}
