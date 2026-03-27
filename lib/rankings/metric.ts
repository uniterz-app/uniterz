import type {
  MobileMetric,
  RankingRowWithCountry,
}from "@/app/component/rankings/_data/mockRows";

export function metricNum(r: RankingRowWithCountry, metric: MobileMetric) {
  if (metric === "totalScore") {
    return {
      n: r.totalScore ?? 0,
      d: 1,
    };
  }

  if (metric === "marginPrecision") {
    return {
      n: r.marginPrecisionScore ?? 0,
      d: 1,
    };
  }

  if (metric === "upsetScore") {
    return {
      n: r.upsetScore ?? 0,
      d: 1,
    };
  }

  if (metric === "winRate") {
    return {
      n: Math.round((r.winRate ?? 0) * 100),
      d: 0,
    };
  }

  return {
    n: r.streak ?? 0,
    d: 0,
  };
}

export function getMetricSubText(
  r: RankingRowWithCountry,
  metric: MobileMetric,
  lang: "ja" | "en" = "ja"
) {
  if (metric === "totalScore") {
    return `avg ${(r.avgTotalScore ?? 0).toFixed(1)}`;
  }

  if (metric === "marginPrecision") {
    return `avg ${(r.avgMarginPrecision ?? 0).toFixed(1)}`;
  }

  if (metric === "upsetScore") {
    return `avg ${(r.avgUpsetScore ?? 0).toFixed(1)}`;
  }

  return lang === "en" ? `Posts ${r.posts ?? 0}` : `投稿 ${r.posts ?? 0}`;
}