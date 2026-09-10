/**
 * 期間ランキング Unit 付与の獲得演出文言（Web / Native / Functions 同期用）
 */

import {
  periodRankingUnitMetricLabel,
  type PeriodRankingUnitMetric,
  type PeriodRankingUnitPeriod,
} from "@/lib/units/periodRankingUnitRewards";
import { L, type LocalizedLang } from "@/lib/i18n/localize";
import { DATE_LOCALE } from "@/lib/i18n/language";

function isPeriodMetric(raw: string): raw is PeriodRankingUnitMetric {
  return (
    raw === "totalPoints" ||
    raw === "winRate" ||
    raw === "totalUpset" ||
    raw === "totalGoalScorerHits"
  );
}

/** weekly label YYYY-MM-DD / monthly YYYY-MM → 字幕用 */
export function formatPeriodRankingUnitEarnLabel(
  period: PeriodRankingUnitPeriod,
  label: string,
  language: LocalizedLang
): string {
  if (period === "monthly") {
    const m = /^(\d{4})-(\d{2})$/.exec(label);
    if (m) {
      const y = Number(m[1]);
      const mo = Number(m[2]);
      if (language === "ja") return `${y}年${mo}月 · NBA`;
      if (language === "ko") return `${y}년 ${mo}월 · NBA`;
      if (language === "zh") return `${y}年${mo}月 · NBA`;
      const d = new Date(Date.UTC(y, mo - 1, 1));
      const monthName = d.toLocaleString(DATE_LOCALE[language], {
        month: "short",
        timeZone: "UTC",
      });
      return `${monthName} ${y} · NBA`;
    }
  }
  const w = /^(\d{4})-(\d{2})-(\d{2})$/.exec(label);
  if (w) {
    const y = Number(w[1]);
    const mo = Number(w[2]);
    const d = Number(w[3]);
    return L(language, {
      ja: `${y}/${mo}/${d}週 · NBA`,
      en: `Week of ${mo}/${d}/${y} · NBA`,
      ko: `${y}/${mo}/${d} 주간 · NBA`,
      zh: `${y}/${mo}/${d} 当周 · NBA`,
      es: `Semana del ${d}/${mo}/${y} · NBA`,
      pt: `Semana de ${d}/${mo}/${y} · NBA`,
      fr: `Semaine du ${d}/${mo}/${y} · NBA`,
    });
  }
  return `${label} · NBA`;
}

export function formatPeriodRankingUnitEarnTitle(
  period: PeriodRankingUnitPeriod,
  metric: string | undefined,
  rank: number,
  language: LocalizedLang
): string {
  const r = Math.max(1, Math.floor(rank));
  const metricLabel =
    metric && isPeriodMetric(metric)
      ? periodRankingUnitMetricLabel(metric, language)
      : null;
  const isOverall = !metric || metric === "totalPoints";

  if (period === "weekly") {
    return L(language, {
      ja: `週間ランキング ${r}位`,
      en: `Weekly rank #${r}`,
      ko: `주간 랭킹 ${r}위`,
      zh: `周榜第 ${r} 名`,
      es: `Ranking semanal #${r}`,
      pt: `Ranking semanal #${r}`,
      fr: `Classement hebdo #${r}`,
    });
  }

  if (isOverall || !metricLabel) {
    return L(language, {
      ja: `月間ランキング ${r}位`,
      en: `Monthly rank #${r}`,
      ko: `월간 랭킹 ${r}위`,
      zh: `月榜第 ${r} 名`,
      es: `Ranking mensual #${r}`,
      pt: `Ranking mensal #${r}`,
      fr: `Classement mensuel #${r}`,
    });
  }

  return L(language, {
    ja: `月間${metricLabel} ${r}位`,
    en: `Monthly ${metricLabel} #${r}`,
    ko: `월간 ${metricLabel} ${r}위`,
    zh: `月度${metricLabel}第 ${r} 名`,
    es: `${metricLabel} mensual #${r}`,
    pt: `${metricLabel} mensal #${r}`,
    fr: `${metricLabel} mensuel #${r}`,
  });
}

export function buildPeriodRankingUnitEarnCopy(input: {
  period: PeriodRankingUnitPeriod;
  label: string;
  metric?: string;
  rank: number;
}): {
  titleJa: string;
  titleEn: string;
  subtitleJa: string;
  subtitleEn: string;
} {
  return {
    titleJa: formatPeriodRankingUnitEarnTitle(
      input.period,
      input.metric,
      input.rank,
      "ja"
    ),
    titleEn: formatPeriodRankingUnitEarnTitle(
      input.period,
      input.metric,
      input.rank,
      "en"
    ),
    subtitleJa: formatPeriodRankingUnitEarnLabel(
      input.period,
      input.label,
      "ja"
    ),
    subtitleEn: formatPeriodRankingUnitEarnLabel(
      input.period,
      input.label,
      "en"
    ),
  };
}
