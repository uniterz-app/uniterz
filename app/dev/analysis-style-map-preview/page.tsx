"use client";

import AnalysisStyleMap from "@/app/component/pro/analysis/AnalysisStyleMap";

export default function AnalysisStyleMapPreviewPage() {
  return (
    <div className="min-h-screen bg-[#020617] p-6 space-y-6">
      <div className="text-sm font-semibold text-white">
        AnalysisStyleMap Preview（dev）
      </div>

      {/* 単点（最新1ヶ月） */}
      <AnalysisStyleMap
        points={[
          {
            homeAwayBias: 0.45, // Home寄り
            marketBias: -0.25,  // 順当寄り
            winRate: 0.80,      // 高勝率
            key: "2026-01",
          },
        ]}
      />

      {/* 時系列（過去3ヶ月） */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <AnalysisStyleMap
          points={[
            {
              homeAwayBias: -0.6,
              marketBias: 0.6,
              winRate: 0.48,
              key: "2025-11",
            },
            {
              homeAwayBias: -0.2,
              marketBias: 0.2,
              winRate: 0.52,
              key: "2025-12",
            },
            {
              homeAwayBias: 0.15,
              marketBias: -0.1,
              winRate: 0.58,
              key: "2026-01",
            },
          ]}
        />

        {/* 中央寄り */}
        <AnalysisStyleMap
          points={[
            {
              homeAwayBias: 0.05,
              marketBias: 0.05,
              winRate: 0.55,
              key: "center",
            },
          ]}
        />
      </div>
    </div>
  );
}
