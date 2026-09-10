/**
 * サッカー採点変更モーダル（タグ / リード / ルールブロック）— 7言語。
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";

export type FootballScoringChangeLang = LocalizedLang;
export const resolveFootballScoringChangeLang = resolveLocalizedLang;

export type FootballScoringChangeCopy = {
  tag: string;
  title: string;
  lead: string;
};

export type FootballScoringChangeRuleBlock = {
  tone?: "default" | "highlight" | "warn";
  title?: string;
  lines: string[];
};

export function resolveFootballScoringChangeCopy(
  language: string | null | undefined
): FootballScoringChangeCopy {
  const lang = resolveLocalizedLang(language);
  return {
    tag: L(lang, {
      ja: "採点変更",
      en: "RULE UPDATE",
      ko: "채점 변경",
      zh: "计分更新",
      es: "ACTUALIZACIÓN",
      pt: "ATUALIZAÇÃO",
      fr: "MISE À JOUR",
    }),
    title: L(lang, {
      ja: "サッカーの採点ルールが更新されました",
      en: "Soccer scoring updated",
      ko: "축구 채점 규칙이 업데이트되었습니다",
      zh: "足球计分规则已更新",
      es: "Puntuación de fútbol actualizada",
      pt: "Pontuação de futebol atualizada",
      fr: "Notation football mise à jour",
    }),
    lead: L(lang, {
      ja: "基本点は「勝者＋HOME得点＋AWAY得点＋得失点差」で加点します。勝者予想が合っているときだけ、それぞれの項目が加点対象になります。",
      en: "Base points now use winner + HOME goals + AWAY goals + goal difference. Each part adds points only when your winner pick is correct.",
      ko: "기본점은 승자 + HOME 득점 + AWAY 득점 + 득실차로 가산됩니다. 승자 예상이 맞을 때만 각 항목이 가점됩니다.",
      zh: "基础分现为「胜者 + 主队进球 + 客队进球 + 净胜球」。仅在猜对胜者时各项才计分。",
      es: "Los puntos base usan ganador + goles HOME + goles AWAY + diferencia. Cada parte suma solo si aciertas el ganador.",
      pt: "Pontos base usam vencedor + gols HOME + gols AWAY + diferença. Cada parte soma só se o vencedor estiver certo.",
      fr: "Les points de base = vainqueur + buts HOME + buts AWAY + écart. Chaque partie ne compte que si le vainqueur est juste.",
    }),
  };
}

export function footballScoringChangeRuleBlocks(
  language: string | null | undefined
): FootballScoringChangeRuleBlock[] {
  const lang = resolveLocalizedLang(language);
  return [
    {
      tone: "warn",
      lines: [
        L(lang, {
          ja: "勝者予想が外れた試合は基本点 0点（得点者ボーナスは別枠で加点あり）。",
          en: "Wrong winner → 0 base points (goal scorer bonus is separate).",
          ko: "승자 예상이 틀린 경기는 기본점 0점(득점자 보너스는 별도).",
          zh: "猜错胜者 → 基础分 0（进球者加分单独计）。",
          es: "Ganador incorrecto → 0 puntos base (bonus de goleador aparte).",
          pt: "Vencedor errado → 0 pontos base (bônus de artilheiro separado).",
          fr: "Mauvais vainqueur → 0 point de base (bonus buteur à part).",
        }),
      ],
    },
    {
      lines: [
        L(lang, {
          ja: "採点に使うスコアは規定時間＋延長の結果です。PK戦の本数は含みません。",
          en: "Line score = regulation + extra time (penalty shootout goals not counted).",
          ko: "채점 스코어는 정규+연장 결과입니다. PK 골은 포함하지 않습니다.",
          zh: "计分比分为常规时间+加时，不含点球大战进球。",
          es: "Marcador = tiempo reglamentario + prórroga (sin penales).",
          pt: "Placar = tempo regulamentar + prorrogação (sem pênaltis).",
          fr: "Score = temps réglementaire + prolongation (hors tirs au but).",
        }),
      ],
    },
    {
      tone: "highlight",
      title: L(lang, {
        ja: "勝者が合っているとき（基本点・最大10点）",
        en: "When the winner is correct (base, max 10)",
        ko: "승자가 맞을 때(기본점·최대 10점)",
        zh: "猜对胜者时（基础分，最高 10）",
        es: "Cuando el ganador es correcto (base, máx. 10)",
        pt: "Quando o vencedor está certo (base, máx. 10)",
        fr: "Quand le vainqueur est juste (base, max 10)",
      }),
      lines: [
        L(lang, {
          ja: "勝者 … +4点",
          en: "Winner … +4",
          ko: "승자 … +4점",
          zh: "胜者 … +4",
          es: "Ganador … +4",
          pt: "Vencedor … +4",
          fr: "Vainqueur … +4",
        }),
        L(lang, {
          ja: "HOME得点 … +2点（ホーム得点が完全一致）",
          en: "HOME goals … +2 (exact match)",
          ko: "HOME 득점 … +2점(완전 일치)",
          zh: "主队进球 … +2（完全一致）",
          es: "Goles HOME … +2 (exacto)",
          pt: "Gols HOME … +2 (exato)",
          fr: "Buts HOME … +2 (exact)",
        }),
        L(lang, {
          ja: "AWAY得点 … +2点（アウェイ得点が完全一致）",
          en: "AWAY goals … +2 (exact match)",
          ko: "AWAY 득점 … +2점(완전 일치)",
          zh: "客队进球 … +2（完全一致）",
          es: "Goles AWAY … +2 (exacto)",
          pt: "Gols AWAY … +2 (exato)",
          fr: "Buts AWAY … +2 (exact)",
        }),
        L(lang, {
          ja: "得失点差 … +2点（得点差が完全一致）",
          en: "Goal difference … +2 (exact match)",
          ko: "득실차 … +2점(완전 일치)",
          zh: "净胜球 … +2（完全一致）",
          es: "Diferencia … +2 (exacta)",
          pt: "Diferença … +2 (exata)",
          fr: "Écart … +2 (exact)",
        }),
        L(lang, {
          ja: "例）予想 2–0・結果 2–1 → HOME +2 → 基本点 6点",
          en: "e.g. pick 2–0, result 2–1 → HOME +2 → base 6",
          ko: "예) 예상 2–0·결과 2–1 → HOME +2 → 기본 6점",
          zh: "例）预测 2–0、结果 2–1 → 主队 +2 → 基础 6",
          es: "Ej.: pick 2–0, resultado 2–1 → HOME +2 → base 6",
          pt: "Ex.: palpite 2–0, resultado 2–1 → HOME +2 → base 6",
          fr: "Ex. : pick 2–0, résultat 2–1 → HOME +2 → base 6",
        }),
        L(lang, {
          ja: "例）予想 2–0・結果 2–0 → 4+2+2+2 = 10点",
          en: "e.g. pick 2–0, result 2–0 → 4+2+2+2 = 10",
          ko: "예) 예상 2–0·결과 2–0 → 4+2+2+2 = 10점",
          zh: "例）预测 2–0、结果 2–0 → 4+2+2+2 = 10",
          es: "Ej.: pick 2–0, resultado 2–0 → 4+2+2+2 = 10",
          pt: "Ex.: palpite 2–0, resultado 2–0 → 4+2+2+2 = 10",
          fr: "Ex. : pick 2–0, résultat 2–0 → 4+2+2+2 = 10",
        }),
      ],
    },
    {
      title: L(lang, {
        ja: "ボーナス（基本点に上乗せ）",
        en: "Bonuses (added on top)",
        ko: "보너스(기본점에 가산)",
        zh: "加分（叠加在基础分上）",
        es: "Bonus (sumados al base)",
        pt: "Bônus (somados à base)",
        fr: "Bonus (ajoutés au base)",
      }),
      lines: [
        L(lang, {
          ja: "得点者ボーナス … +2点（W杯・オウンゴール除く）",
          en: "Goal scorer bonus … +2 (WC, own goals excluded)",
          ko: "득점자 보너스 … +2점(월드컵·자책골 제외)",
          zh: "进球者加分 … +2（世界杯，不含乌龙球）",
          es: "Bonus goleador … +2 (Mundial, sin autogoles)",
          pt: "Bônus artilheiro … +2 (Copa, sem gols contra)",
          fr: "Bonus buteur … +2 (Mondial, hors CSC)",
        }),
        L(lang, {
          ja: "アップセットボーナス … +2点",
          en: "Upset bonus … +2",
          ko: "업셋 보너스 … +2점",
          zh: "冷门加分 … +2",
          es: "Bonus upset … +2",
          pt: "Bônus upset … +2",
          fr: "Bonus upset … +2",
        }),
        L(lang, {
          ja: "連勝ボーナス … 3〜4連勝 +1点 / 5〜6連勝 +2点 / 7連勝以上 +3点",
          en: "Win-streak bonus … 3-4 wins +1 / 5-6 wins +2 / 7+ wins +3",
          ko: "연승 보너스 … 3–4연승 +1 / 5–6 +2 / 7+ +3",
          zh: "连胜加分 … 3–4 连胜 +1 / 5–6 +2 / 7+ +3",
          es: "Bonus racha … 3-4 victorias +1 / 5-6 +2 / 7+ +3",
          pt: "Bônus sequência … 3-4 vitórias +1 / 5-6 +2 / 7+ +3",
          fr: "Bonus série … 3-4 victoires +1 / 5-6 +2 / 7+ +3",
        }),
      ],
    },
    {
      lines: [
        L(lang, {
          ja: "総合得点 ＝ 基本点 ＋ ボーナス",
          en: "Total score = base + bonuses",
          ko: "종합득점 = 기본점 + 보너스",
          zh: "总分 = 基础分 + 加分",
          es: "Puntuación total = base + bonus",
          pt: "Pontuação total = base + bônus",
          fr: "Score total = base + bonus",
        }),
      ],
    },
  ];
}
