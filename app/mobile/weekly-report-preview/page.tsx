"use client";

// 週次レポート dev プレビュー（mock）。3 パターン（上昇 / 下降 / 初参戦）を切り替え確認。

import { useEffect, useMemo, useState } from "react";
import WeeklyReportView from "@/app/component/reports/WeeklyReportView";
import {
  weeklyReportPreviewBigClimb,
  weeklyReportPreviewClimbed,
  weeklyReportPreviewDropped,
  weeklyReportPreviewFirstWeek,
  weeklyReportPreviewLive,
} from "@/lib/reports/weeklyReportPreviewMocks";
import { nameOxanium } from "@/lib/fonts";

const CASES = [
  { key: "live", label: "進行中", build: weeklyReportPreviewLive },
  { key: "climbed", label: "上昇した週", build: weeklyReportPreviewClimbed },
  { key: "bigclimb", label: "28人抜き", build: weeklyReportPreviewBigClimb },
  { key: "dropped", label: "下降した週", build: weeklyReportPreviewDropped },
  { key: "first", label: "初参戦", build: weeklyReportPreviewFirstWeek },
] as const;

type CaseKey = (typeof CASES)[number]["key"];

export default function WeeklyReportPreviewPage() {
  const [caseKey, setCaseKey] = useState<CaseKey>("climbed");

  // ヘッドレス確認用: ?case=dropped 等で初期ケースを指定
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
        Weekly Report Preview
      </h1>
      <p className="mt-1 text-xs leading-relaxed text-white/50">
        Pro 向け週次レポートのプレビュー。データは builder 実装前の mock。
      </p>

      <div className="mt-4 flex gap-1.5">
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
        <WeeklyReportView report={report} language="ja" />
      </div>
    </main>
  );
}
