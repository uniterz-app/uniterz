import type {
  MobileMetric,
  RankingRowWithCountry,
} from "../../app/component/rankings/_data/mockRows";
import { formatMetricDecimals, roundMetricDecimals } from "../format/metricDecimals";

export function metricNum(r: RankingRowWithCountry, metric: MobileMetric) {
  if (metric === "totalScore") {
    return {
      n: roundMetricDecimals(r.totalScore ?? 0, 1),
      d: 1,
    };
  }

  if (metric === "marginPrecision") {
    return {
      n: roundMetricDecimals(r.marginPrecisionScore ?? 0, 1),
      d: 1,
    };
  }

  if (metric === "upsetScore") {
    return {
      n: roundMetricDecimals(r.upsetScore ?? 0, 1),
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
    return `avg ${formatMetricDecimals(r.avgTotalScore ?? 0, 1)}`;
  }

  if (metric === "marginPrecision") {
    return `avg ${formatMetricDecimals(r.avgMarginPrecision ?? 0, 1)}`;
  }

  if (metric === "upsetScore") {
    return `avg ${formatMetricDecimals(r.avgUpsetScore ?? 0, 1)}`;
  }

  return lang === "en" ? `Posts ${r.posts ?? 0}` : `投稿 ${r.posts ?? 0}`;
}