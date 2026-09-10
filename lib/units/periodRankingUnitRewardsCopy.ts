/**
 * 個人ランキング Unit 獲得表シート用コピー。
 * 配布量の正: periodRankingUnitRewards.ts / docs/unit-reward-design.md §3
 */
import { L, resolveLocalizedLang, type LocalizedLang } from "@/lib/i18n/localize";
import {
  listPeriodRankingUnitRows,
  PERIOD_RANKING_UNIT_MONTHLY_DEPARTMENT_MAX_RANK,
  PERIOD_RANKING_UNIT_MONTHLY_OVERALL_MAX_RANK,
  PERIOD_RANKING_UNIT_OVERALL_METRIC,
  PERIOD_RANKING_UNIT_WEEKLY_OVERALL_MAX_RANK,
  PERIOD_WIN_RATE_PICKUP_PARTICIPATION_RATE,
  type PeriodRankingUnitMetric,
} from "@/lib/units/periodRankingUnitRewards";

export type PeriodRankingUnitRewardsLang = LocalizedLang;
export const resolvePeriodRankingUnitRewardsLang = resolveLocalizedLang;

export type PeriodRankingUnitRewardsTab =
  | "weekly"
  | "monthlyOverall"
  | "monthlyDepartment";

export const PERIOD_RANKING_UNIT_REWARDS_TABS: readonly PeriodRankingUnitRewardsTab[] =
  ["weekly", "monthlyOverall", "monthlyDepartment"] as const;

export type PeriodRankingUnitRewardsSection = {
  title: string;
  bullets: readonly string[];
};

function unitRankLine(
  lang: PeriodRankingUnitRewardsLang,
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

function chunkUnitLines(
  lang: PeriodRankingUnitRewardsLang,
  period: "weekly" | "monthly",
  metric: PeriodRankingUnitMetric
): string[] {
  const rows = listPeriodRankingUnitRows(period, metric);
  const chunks: string[] = [];
  for (let i = 0; i < rows.length; i += 5) {
    const slice = rows.slice(i, i + 5);
    const from = slice[0]!.rank;
    const to = slice[slice.length - 1]!.rank;
    chunks.push(
      unitRankLine(lang, from, to, slice.map((r) => String(r.units)).join(" / "))
    );
  }
  return chunks;
}

function topNLine(lang: PeriodRankingUnitRewardsLang, n: number): string {
  return L(lang, {
    ja: `上位 ${n} 人`,
    en: `Top ${n}`,
    ko: `상위 ${n}명`,
    zh: `前 ${n} 名`,
    es: `Top ${n}`,
    pt: `Top ${n}`,
    fr: `Top ${n}`,
  });
}

export function periodRankingUnitRewardsUiCopy(
  lang: PeriodRankingUnitRewardsLang
): {
  titleEn: string;
  subtitle: string;
  close: string;
  chipAria: string;
  chipLabel: string;
  tabWeekly: string;
  tabMonthlyOverall: string;
  tabMonthlyDepartment: string;
} {
  return {
    titleEn: "UNIT REWARDS",
    subtitle: L(lang, {
      ja: "獲得 UNIT 表",
      en: "How many Units you can earn",
      ko: "획득 UNIT 표",
      zh: "可获得 UNIT 表",
      es: "Units que puedes ganar",
      pt: "Units que você pode ganhar",
      fr: "Units que vous pouvez gagner",
    }),
    close: L(lang, {
      ja: "とじる",
      en: "Close",
      ko: "닫기",
      zh: "关闭",
      es: "Cerrar",
      pt: "Fechar",
      fr: "Fermer",
    }),
    chipAria: L(lang, {
      ja: "Unit 獲得表を開く",
      en: "Open Unit rewards table",
      ko: "Unit 획득 표 열기",
      zh: "打开 Unit 奖励表",
      es: "Abrir tabla de Units",
      pt: "Abrir tabela de Units",
      fr: "Ouvrir le tableau des Units",
    }),
    chipLabel: L(lang, {
      ja: "unit表",
      en: "Unit table",
      ko: "unit표",
      zh: "unit表",
      es: "Tabla Unit",
      pt: "Tabela Unit",
      fr: "Table Unit",
    }),
    tabWeekly: L(lang, {
      ja: "週間",
      en: "Weekly",
      ko: "주간",
      zh: "周榜",
      es: "Semanal",
      pt: "Semanal",
      fr: "Hebdo",
    }),
    tabMonthlyOverall: L(lang, {
      ja: "月間スコア",
      en: "Monthly score",
      ko: "월간 점수",
      zh: "月榜总分",
      es: "Mensual score",
      pt: "Mensal score",
      fr: "Mensuel score",
    }),
    tabMonthlyDepartment: L(lang, {
      ja: "月間部門",
      en: "Monthly dept",
      ko: "월간 부문",
      zh: "月榜分项",
      es: "Mensual dept",
      pt: "Mensal dept",
      fr: "Mensuel dept",
    }),
  };
}

export function periodRankingUnitRewardsTabLabel(
  tab: PeriodRankingUnitRewardsTab,
  lang: PeriodRankingUnitRewardsLang
): string {
  const ui = periodRankingUnitRewardsUiCopy(lang);
  if (tab === "weekly") return ui.tabWeekly;
  if (tab === "monthlyOverall") return ui.tabMonthlyOverall;
  return ui.tabMonthlyDepartment;
}

function notesSection(
  lang: PeriodRankingUnitRewardsLang,
  tab: PeriodRankingUnitRewardsTab
): PeriodRankingUnitRewardsSection {
  const pct = Math.round(PERIOD_WIN_RATE_PICKUP_PARTICIPATION_RATE * 100);
  const common = [
    L(lang, {
      ja: "付与は Pick Up（standard）のみ。PRO LEAGUE は対象外。",
      en: "Paid on Pick Up (standard) only — not PRO LEAGUE.",
      ko: "지급은 Pick Up(standard)만. PRO LEAGUE 제외.",
      zh: "仅 Pick Up（standard）发放，不含 PRO LEAGUE。",
      es: "Solo Pick Up (standard). No PRO LEAGUE.",
      pt: "Só Pick Up (standard). Sem PRO LEAGUE.",
      fr: "Uniquement Pick Up (standard). Pas PRO LEAGUE.",
    }),
    L(lang, {
      ja: "Free / Pro で配布量に差はない。",
      en: "Free and Pro earn the same amounts.",
      ko: "Free / Pro 지급량 동일.",
      zh: "Free / Pro 发放量相同。",
      es: "Free y Pro reciben lo mismo.",
      pt: "Free e Pro recebem o mesmo.",
      fr: "Free et Pro : mêmes montants.",
    }),
    L(lang, {
      ja: "同点は同順位・同 Unit。",
      en: "Ties share rank and Units.",
      ko: "동점은 동순위·동 Unit.",
      zh: "同分同排名、同 Unit。",
      es: "Empates comparten puesto y Units.",
      pt: "Empates dividem posição e Units.",
      fr: "Ex æquo : même rang et Units.",
    }),
  ];

  if (tab === "weekly") {
    return {
      title: L(lang, {
        ja: "注意",
        en: "Notes",
        ko: "안내",
        zh: "说明",
        es: "Notas",
        pt: "Notas",
        fr: "Notes",
      }),
      bullets: [
        L(lang, {
          ja: "週間はスコア（総合）のみ付与。部門の週間付与はない。",
          en: "Weekly pays Score (overall) only — no department weekly Units.",
          ko: "주간은 점수(종합)만. 부문 주간 지급 없음.",
          zh: "周榜只发总分（Score），无分项周奖励。",
          es: "Semanal: solo Score (general). Sin depts semanales.",
          pt: "Semanal: só Score (geral). Sem depts semanais.",
          fr: "Hebdo : Score (général) seul. Pas de depts hebdo.",
        }),
        L(lang, {
          ja: "シーズンタブには Unit 付与がない（週 / 月のみ）。",
          en: "Season board has no Unit payout (weekly / monthly only).",
          ko: "시즌 탭에는 Unit 지급 없음 (주/월만).",
          zh: "赛季榜不发 Unit（仅周/月）。",
          es: "Season no paga Units (solo semanal / mensual).",
          pt: "Season não paga Units (só semanal / mensal).",
          fr: "Season ne paie pas de Units (hebdo / mensuel seulement).",
        }),
        ...common,
      ],
    };
  }

  if (tab === "monthlyOverall") {
    return {
      title: L(lang, {
        ja: "注意",
        en: "Notes",
        ko: "안내",
        zh: "说明",
        es: "Notas",
        pt: "Notas",
        fr: "Notes",
      }),
      bullets: [
        L(lang, {
          ja: "月間スコアは上位への付与。部門は別タブの表。",
          en: "Monthly Score pays this table. Departments use the other tab.",
          ko: "월간 점수는 이 표. 부문은 다른 탭.",
          zh: "月榜总分用本表；分项见另一页签。",
          es: "Score mensual: esta tabla. Depts: otra pestaña.",
          pt: "Score mensal: esta tabela. Depts: outra aba.",
          fr: "Score mensuel : ce tableau. Depts : autre onglet.",
        }),
        ...common,
      ],
    };
  }

  return {
    title: L(lang, {
      ja: "注意",
      en: "Notes",
      ko: "안내",
      zh: "说明",
      es: "Notas",
      pt: "Notas",
      fr: "Notes",
    }),
    bullets: [
      L(lang, {
        ja: "勝率 / アップセット / 得点者で同じ表。指標ごとに付与（合算可）。",
        en: "Same table for Win% / Upset / Scorer. Paid per metric (stackable).",
        ko: "승률 / 업셋 / 득점자 동일 표. 지표별 지급(합산 가능).",
        zh: "胜率 / 爆冷 / 射手共用本表；分项各自发放（可叠加）。",
        es: "Misma tabla Win% / Upset / Scorer. Por métrica (sumable).",
        pt: "Mesma tabela Win% / Upset / Scorer. Por métrica (somável).",
        fr: "Même table Win% / Upset / Scorer. Par métrique (cumulable).",
      }),
      L(lang, {
        ja: `勝率部門は、その時点までの Pick Up 試合の ${pct}% 以上に予想が必要。`,
        en: `Win% needs tips on at least ${pct}% of Pick Up games tipped so far.`,
        ko: `승률 부문은 현재까지 Pick Up 경기의 ${pct}% 이상 예상 필요.`,
        zh: `胜率分项需至少预测迄今 Pick Up 场次的 ${pct}%。`,
        es: `Win% exige tips en ≥${pct}% de Pick Up hasta ahora.`,
        pt: `Win% exige tips em ≥${pct}% dos Pick Up até agora.`,
        fr: `Win% : tips sur ≥${pct}% des Pick Up à ce jour.`,
      }),
      ...common,
    ],
  };
}

function rewardsSection(
  lang: PeriodRankingUnitRewardsLang,
  tab: PeriodRankingUnitRewardsTab
): PeriodRankingUnitRewardsSection {
  if (tab === "weekly") {
    return {
      title: L(lang, {
        ja: "週間 · スコア",
        en: "Weekly · Score",
        ko: "주간 · 점수",
        zh: "周榜 · 总分",
        es: "Semanal · Score",
        pt: "Semanal · Score",
        fr: "Hebdo · Score",
      }),
      bullets: [
        topNLine(lang, PERIOD_RANKING_UNIT_WEEKLY_OVERALL_MAX_RANK),
        ...chunkUnitLines(lang, "weekly", PERIOD_RANKING_UNIT_OVERALL_METRIC),
      ],
    };
  }
  if (tab === "monthlyOverall") {
    return {
      title: L(lang, {
        ja: "月間 · スコア",
        en: "Monthly · Score",
        ko: "월간 · 점수",
        zh: "月榜 · 总分",
        es: "Mensual · Score",
        pt: "Mensal · Score",
        fr: "Mensuel · Score",
      }),
      bullets: [
        topNLine(lang, PERIOD_RANKING_UNIT_MONTHLY_OVERALL_MAX_RANK),
        ...chunkUnitLines(lang, "monthly", PERIOD_RANKING_UNIT_OVERALL_METRIC),
      ],
    };
  }
  return {
    title: L(lang, {
      ja: "月間 · 部門（勝率 / UPSET / 得点者）",
      en: "Monthly · Dept (Win% / Upset / Scorer)",
      ko: "월간 · 부문 (승률 / UPSET / 득점자)",
      zh: "月榜 · 分项（胜率 / 爆冷 / 射手）",
      es: "Mensual · Dept (Win% / Upset / Scorer)",
      pt: "Mensal · Dept (Win% / Upset / Scorer)",
      fr: "Mensuel · Dept (Win% / Upset / Scorer)",
    }),
    bullets: [
      topNLine(lang, PERIOD_RANKING_UNIT_MONTHLY_DEPARTMENT_MAX_RANK),
      ...chunkUnitLines(lang, "monthly", "winRate"),
    ],
  };
}

export function periodRankingUnitRewardsSections(
  tab: PeriodRankingUnitRewardsTab,
  lang: PeriodRankingUnitRewardsLang
): readonly PeriodRankingUnitRewardsSection[] {
  return [rewardsSection(lang, tab), notesSection(lang, tab)];
}

/** 現在のランキング period から初期タブを決める */
export function defaultPeriodRankingUnitRewardsTab(
  rankingPeriod: "season" | "weekly" | "monthly" | string | null | undefined
): PeriodRankingUnitRewardsTab {
  if (rankingPeriod === "monthly") return "monthlyOverall";
  if (rankingPeriod === "weekly") return "weekly";
  return "weekly";
}
