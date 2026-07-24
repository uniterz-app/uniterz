"use client";

// 月次レポート dev プレビュー（mock・たたき台）。
// 表紙 + 既存 Pro Stats カード群 + ハイライト + 締めの構成確認用。

import { useMemo } from "react";
import MonthlyReportView from "@/app/component/reports/MonthlyReportView";
import {
  monthlyReportPreviewAnalysisProps,
  monthlyReportPreviewCover,
  monthlyReportPreviewHighlights,
} from "@/lib/reports/monthlyReportPreviewMocks";
import { nameOxanium } from "@/lib/fonts";

export default function MonthlyReportPreviewPage() {
  const cover = useMemo(monthlyReportPreviewCover, []);
  const highlights = useMemo(monthlyReportPreviewHighlights, []);
  const analysisProps = useMemo(monthlyReportPreviewAnalysisProps, []);

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
        Pro 向け月次レポートのたたき台。分析カード群は既存 Pro Stats を流用。データは
        mock。
      </p>

      <div className="mt-5">
        <MonthlyReportView
          cover={cover}
          highlights={highlights}
          analysisProps={analysisProps}
          language="ja"
        />
      </div>
    </main>
  );
}
