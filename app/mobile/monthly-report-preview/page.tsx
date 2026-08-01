"use client";

// 月次レポート dev プレビュー（mock）。
// 順位帯・上昇/下降・初月などで切り替え、ヒーロー色と数字バーの変化を確認する。

import { useEffect, useMemo, useState } from "react";
import MonthlyReportView from "@/app/component/reports/MonthlyReportView";
import {
  monthlyReportPreviewAboveTop10,
  monthlyReportPreviewBelowMedian,
  monthlyReportPreviewClimbed,
  monthlyReportPreviewDropped,
  monthlyReportPreviewField,
  monthlyReportPreviewFirstMonth,
  monthlyReportPreviewTop10,
  monthlyReportPreviewTop20,
  monthlyReportPreviewTop100,
} from "@/lib/reports/monthlyReportPreviewMocks";
import { nameOxanium } from "@/lib/fonts";

const CASES = [
  { key: "top10", label: "TOP10↑", build: monthlyReportPreviewTop10 },
  { key: "above", label: "上位10%超え", build: monthlyReportPreviewAboveTop10 },
  { key: "top20", label: "TOP20", build: monthlyReportPreviewTop20 },
  { key: "climbed", label: "大きく上昇", build: monthlyReportPreviewClimbed },
  { key: "dropped", label: "下降", build: monthlyReportPreviewDropped },
  { key: "top100", label: "TOP100", build: monthlyReportPreviewTop100 },
  { key: "field", label: "圏外", build: monthlyReportPreviewField },
  { key: "first", label: "初月", build: monthlyReportPreviewFirstMonth },
  { key: "below", label: "中央値割れ", build: monthlyReportPreviewBelowMedian },
] as const;

type CaseKey = (typeof CASES)[number]["key"];

export default function MonthlyReportPreviewPage() {
  const [caseKey, setCaseKey] = useState<CaseKey>("top10");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("case");
    if (q && CASES.some((c) => c.key === q)) setCaseKey(q as CaseKey);
  }, []);

  const report = useMemo(
    () => CASES.find((c) => c.key === caseKey)!.build(),
    [caseKey]
  );

  return (
    <main className="mx-auto min-h-dvh max-w-lg bg-[#07090f] px-4 py-6 text-white">
      <h1
        className={[
          nameOxanium.className,
          "text-lg font-extrabold uppercase tracking-[0.08em]",
        ].join(" ")}
      >
        Monthly Report Preview
      </h1>
      <p className="mt-1 text-xs leading-relaxed text-white/50">
        順位帯カラー・前月比・レンジバーの見え方をケース切替で確認。データは mock。
        {` `}?case=dropped なども可。
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {CASES.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setCaseKey(c.key)}
            className={[
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
              caseKey === c.key
                ? "border-cyan-400/50 bg-cyan-400/12 text-cyan-200"
                : "border-white/12 bg-white/3 text-white/55 hover:border-white/25 hover:text-white/80",
            ].join(" ")}
          >
            {c.label}
          </button>
        ))}
      </div>

      <div className="mt-5">
        <MonthlyReportView report={report} language="ja" />
      </div>
    </main>
  );
}
