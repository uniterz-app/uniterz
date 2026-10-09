/**
 * シーズン予想ルールモーダル用コピー（順位 / アワード）。
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import { SEASON_PREDICT_SUBMIT_DEADLINE_WHEN } from "@/lib/predict/seasonPredictDeadline";
import {
  SEASON_AWARDS_COUNT,
  SEASON_AWARDS_SCORE,
  SEASON_STANDINGS_SCORE,
} from "@/lib/predict/seasonPredictScoring";
import {
  SEASON_PREDICT_UNIT_MAX_RANK,
  SEASON_PREDICT_UNITS_BY_RANK,
} from "@/lib/units/seasonPredictUnitRewards";

export type SeasonPredictRulesKind = "standings" | "awards";
export type SeasonPredictRulesLang = LocalizedLang;
export const resolveSeasonPredictRulesLang = resolveLocalizedLang;

export type SeasonPredictRulesRow = {
  label: string;
  value: string;
};

export type SeasonPredictRulesSection = {
  title: string;
  /** 大きく強調する 1 行（締切日時など） */
  emphasis?: string;
  /** ラベル／点数の 2 列表 */
  rows?: readonly SeasonPredictRulesRow[];
  bullets: readonly string[];
  /** 表の下の補足（例・満点など） */
  notes?: readonly string[];
};

function unitRankLine(
  lang: SeasonPredictRulesLang,
  from: number,
  to: number,
  amounts: string
): string {
  if (lang === "ja") return `${from}–${to}位  ${amounts}`;
  if (lang === "ko") return `${from}–${to}위  ${amounts}`;
  if (lang === "zh") return `第${from}–${to}名  ${amounts}`;
  if (lang === "es") return `#${from}–#${to}  ${amounts}`;
  if (lang === "pt") return `#${from}–#${to}  ${amounts}`;
  if (lang === "fr") return `#${from}–#${to}  ${amounts}`;
  return `#${from}–#${to}  ${amounts}`;
}

function unitEarnLines(lang: SeasonPredictRulesLang): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < SEASON_PREDICT_UNITS_BY_RANK.length; i += 5) {
    const slice = SEASON_PREDICT_UNITS_BY_RANK.slice(i, i + 5);
    const from = i + 1;
    const to = i + slice.length;
    chunks.push(unitRankLine(lang, from, to, slice.join(" / ")));
  }
  return [
    L(lang, {
      ja: `合計点の上位 ${SEASON_PREDICT_UNIT_MAX_RANK} 人に UNIT を配布`,
      en: `Top ${SEASON_PREDICT_UNIT_MAX_RANK} by total points earn UNIT`,
      ko: `총점 상위 ${SEASON_PREDICT_UNIT_MAX_RANK}명에게 UNIT 지급`,
      zh: `总分前 ${SEASON_PREDICT_UNIT_MAX_RANK} 名可获得 UNIT`,
      es: `Los ${SEASON_PREDICT_UNIT_MAX_RANK} mejores por puntos ganan UNIT`,
      pt: `Os ${SEASON_PREDICT_UNIT_MAX_RANK} melhores em pontos ganham UNIT`,
      fr: `Les ${SEASON_PREDICT_UNIT_MAX_RANK} meilleurs au total gagnent des UNIT`,
    }),
    L(lang, {
      ja: "同点の場合は、最終提出が早い人が上位",
      en: "Ties go to the earlier final submission",
      ko: "동점이면 최종 제출이 빠른 사람이 상위",
      zh: "同分时，最终提交较早者排名靠前",
      es: "En caso de empate, gana el envío final más temprano",
      pt: "Em caso de empate, vence o envio final mais cedo",
      fr: "En cas d’égalité, le dernier envoi le plus tôt l’emporte",
    }),
    ...chunks,
  ];
}

function deadlineSection(
  lang: SeasonPredictRulesLang
): SeasonPredictRulesSection {
  return {
    title: L(lang, {
      ja: "提出期限",
      en: "Deadline",
      ko: "제출 마감",
      zh: "提交截止",
      es: "Plazo de envío",
      pt: "Prazo de envio",
      fr: "Date limite",
    }),
    emphasis: SEASON_PREDICT_SUBMIT_DEADLINE_WHEN,
    bullets: [
      L(lang, {
        ja: "締切までは何度でも修正できます。最後に提出した内容で採点します。",
        en: "You can edit as many times as you like until the deadline. Your last submission is scored.",
        ko: "마감 전까지 몇 번이든 수정할 수 있습니다. 마지막으로 제출한 내용으로 채점합니다.",
        zh: "截止前可随时多次修改，以最后一次提交的内容计分。",
        es: "Puedes editar las veces que quieras hasta el plazo. Se puntúa tu último envío.",
        pt: "Você pode editar quantas vezes quiser até o prazo. O último envio é o que conta.",
        fr: "Modifiable autant de fois que vous voulez jusqu’à la date limite. Le dernier envoi est noté.",
      }),
    ],
  };
}

function scoringTitle(lang: SeasonPredictRulesLang): string {
  return L(lang, {
    ja: "採点",
    en: "Scoring",
    ko: "채점",
    zh: "计分",
    es: "Puntuación",
    pt: "Pontuação",
    fr: "Score",
  });
}

function scoringSection(
  kind: SeasonPredictRulesKind,
  lang: SeasonPredictRulesLang
): SeasonPredictRulesSection {
  if (kind === "standings") {
    const s = SEASON_STANDINGS_SCORE;
    return {
      title: scoringTitle(lang),
      bullets: [
        L(lang, {
          ja: "東西それぞれ 1〜15 位を予想。チームごとに、予想した順位とレギュラーシーズン最終順位を比べて点が入ります。",
          en: "Rank all 15 teams in each conference. Each team scores by how close your rank is to its final regular-season rank.",
          ko: "동·서부 각 1~15위를 예상합니다. 팀별로 예상 순위와 정규 시즌 최종 순위를 비교해 점수를 받습니다.",
          zh: "分别预测东西部 1–15 名。每支球队按预测名次与常规赛最终名次的差距计分。",
          es: "Ordena los 15 equipos de cada conferencia. Cada equipo puntúa según lo cerca que quede de su puesto final.",
          pt: "Classifique os 15 times de cada conferência. Cada time pontua conforme a proximidade da posição final.",
          fr: "Classez les 15 équipes de chaque conférence. Chaque équipe rapporte selon l’écart avec son rang final.",
        }),
      ],
      rows: [
        {
          label: L(lang, {
            ja: "完全一致",
            en: "Exact",
            ko: "정확히 일치",
            zh: "完全一致",
            es: "Exacto",
            pt: "Exato",
            fr: "Exact",
          }),
          value: `+${s.exact}`,
        },
        {
          label: L(lang, {
            ja: "1 つズレ",
            en: "Off by 1",
            ko: "1칸 차이",
            zh: "差 1 名",
            es: "A 1 puesto",
            pt: "Errou por 1",
            fr: "À 1 place",
          }),
          value: `+${s.within1}`,
        },
        {
          label: L(lang, {
            ja: "2 つズレ",
            en: "Off by 2",
            ko: "2칸 차이",
            zh: "差 2 名",
            es: "A 2 puestos",
            pt: "Errou por 2",
            fr: "À 2 places",
          }),
          value: `+${s.within2}`,
        },
        {
          label: L(lang, {
            ja: "3 つ以上ズレ",
            en: "Off by 3+",
            ko: "3칸 이상",
            zh: "差 3 名以上",
            es: "A 3+ puestos",
            pt: "Errou por 3+",
            fr: "À 3+ places",
          }),
          value: "0",
        },
      ],
      notes: [
        L(lang, {
          ja: `例: 3 位と予想して実際は 4 位 → +${s.within1}`,
          en: `e.g. you pick 3rd, they finish 4th → +${s.within1}`,
          ko: `예: 3위로 예상, 실제 4위 → +${s.within1}`,
          zh: `例：预测第 3 名，实际第 4 名 → +${s.within1}`,
          es: `Ej.: eliges 3.º y acaba 4.º → +${s.within1}`,
          pt: `Ex.: você escolhe 3º e termina em 4º → +${s.within1}`,
          fr: `Ex. : vous choisissez 3e, il finit 4e → +${s.within1}`,
        }),
        L(lang, {
          ja: `満点 ${s.maxTotal}（東西 各 ${s.maxPerConference}）`,
          en: `Max ${s.maxTotal} (${s.maxPerConference} per conference)`,
          ko: `만점 ${s.maxTotal} (동·서부 각 ${s.maxPerConference})`,
          zh: `满分 ${s.maxTotal}（东西部各 ${s.maxPerConference}）`,
          es: `Máximo ${s.maxTotal} (${s.maxPerConference} por conferencia)`,
          pt: `Máximo ${s.maxTotal} (${s.maxPerConference} por conferência)`,
          fr: `Max ${s.maxTotal} (${s.maxPerConference} par conférence)`,
        }),
      ],
    };
  }
  const a = SEASON_AWARDS_SCORE;
  return {
    title: scoringTitle(lang),
    bullets: [
      L(lang, {
        ja: `MVP など ${SEASON_AWARDS_COUNT} 部門の受賞者を予想。受賞を逃しても、公式投票で 2 位・3 位なら点が入ります。`,
        en: `Pick the winner of ${SEASON_AWARDS_COUNT} awards, including MVP. You still score if your pick finishes 2nd or 3rd in the official voting.`,
        ko: `MVP 등 ${SEASON_AWARDS_COUNT}개 부문 수상자를 예상합니다. 수상하지 못해도 공식 투표 2위·3위면 점수를 받습니다.`,
        zh: `预测 MVP 等 ${SEASON_AWARDS_COUNT} 个奖项的得主。即使未获奖，只要在官方投票中排第 2 或第 3 名也能得分。`,
        es: `Elige al ganador de ${SEASON_AWARDS_COUNT} premios, incluido el MVP. También puntúas si tu elección queda 2.º o 3.º en la votación oficial.`,
        pt: `Escolha o vencedor de ${SEASON_AWARDS_COUNT} prêmios, incluindo MVP. Você também pontua se sua escolha ficar em 2º ou 3º na votação oficial.`,
        fr: `Choisissez le lauréat de ${SEASON_AWARDS_COUNT} trophées, dont le MVP. Vous marquez aussi si votre choix finit 2e ou 3e du vote officiel.`,
      }),
    ],
    rows: [
      {
        label: L(lang, {
          ja: "完全一致（受賞）",
          en: "Exact (winner)",
          ko: "정확히 일치 (수상)",
          zh: "完全一致（获奖）",
          es: "Exacto (ganador)",
          pt: "Exato (vencedor)",
          fr: "Exact (lauréat)",
        }),
        value: `+${a.exact}`,
      },
      {
        label: L(lang, {
          ja: "投票 2 位",
          en: "2nd in voting",
          ko: "투표 2위",
          zh: "投票第 2 名",
          es: "2.º en la votación",
          pt: "2º na votação",
          fr: "2e du vote",
        }),
        value: `+${a.second}`,
      },
      {
        label: L(lang, {
          ja: "投票 3 位",
          en: "3rd in voting",
          ko: "투표 3위",
          zh: "投票第 3 名",
          es: "3.º en la votación",
          pt: "3º na votação",
          fr: "3e du vote",
        }),
        value: `+${a.third}`,
      },
      {
        label: L(lang, {
          ja: "それ以外",
          en: "Otherwise",
          ko: "그 외",
          zh: "其他",
          es: "Resto",
          pt: "Outros",
          fr: "Sinon",
        }),
        value: "0",
      },
    ],
    notes: [
      L(lang, {
        ja: `満点 ${a.maxTotal}（${SEASON_AWARDS_COUNT} 部門 × ${a.exact}）`,
        en: `Max ${a.maxTotal} (${SEASON_AWARDS_COUNT} awards × ${a.exact})`,
        ko: `만점 ${a.maxTotal} (${SEASON_AWARDS_COUNT}개 부문 × ${a.exact})`,
        zh: `满分 ${a.maxTotal}（${SEASON_AWARDS_COUNT} 个奖项 × ${a.exact}）`,
        es: `Máximo ${a.maxTotal} (${SEASON_AWARDS_COUNT} premios × ${a.exact})`,
        pt: `Máximo ${a.maxTotal} (${SEASON_AWARDS_COUNT} prêmios × ${a.exact})`,
        fr: `Max ${a.maxTotal} (${SEASON_AWARDS_COUNT} trophées × ${a.exact})`,
      }),
    ],
  };
}

function unitsSection(lang: SeasonPredictRulesLang): SeasonPredictRulesSection {
  return {
    title: L(lang, {
      ja: "獲得 UNIT",
      en: "Units",
      ko: "획득 UNIT",
      zh: "获得 UNIT",
      es: "Units",
      pt: "Units",
      fr: "Units",
    }),
    bullets: unitEarnLines(lang),
  };
}

export function seasonPredictRulesSections(
  kind: SeasonPredictRulesKind,
  lang: SeasonPredictRulesLang
): readonly SeasonPredictRulesSection[] {
  return [
    deadlineSection(lang),
    scoringSection(kind, lang),
    unitsSection(lang),
  ];
}
