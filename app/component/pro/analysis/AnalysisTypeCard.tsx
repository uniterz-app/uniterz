"use client";

import { ANALYSIS_TYPE_META_JA } from "@/shared/analysis/analysisTypeMeta";
import type { AnalysisTypeId } from "@/shared/analysis/types";
import { ANALYSIS_TYPE_COLOR } from "@/shared/analysis/analysisTypeColor";


type Props = {
  analysisTypeId: AnalysisTypeId;
};

export default function AnalysisTypeCard({ analysisTypeId }: Props) {
  const meta = ANALYSIS_TYPE_META_JA[analysisTypeId];

  if (!meta) {
    return null; // 保険（将来ID追加時）
  }

  return (
    <div className="rounded-2xl border border-white/15 bg-[#050814]/80 p-4 shadow-[0_14px_40px_rgba(0,0,0,0.55)]">
      {/* 上段：タイプ */}
      <div className="mb-2">
        <div className="text-xs text-white/60">あなたの分析タイプ</div>
        <div className="flex items-center gap-2">
  <span
    className="h-3 w-3 rounded-sm"
    style={{ backgroundColor: ANALYSIS_TYPE_COLOR[analysisTypeId] }}
  />
  <div className="text-lg font-semibold text-orange-400">
    {meta.label}
  </div>
</div>
      </div>

      {/* 説明文 */}
      <p className="
  whitespace-pre-line
  leading-relaxed
  text-[13px]
  sm:text-sm
  md:text-[15px]
  lg:text-base
  text-white/80
">
  {meta.description}
</p>
    </div>
  );
}
