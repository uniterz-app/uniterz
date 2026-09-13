"use client";

/**
 * Report ゲート見た目プレビュー。
 * Free ロック / 月曜待ち / 予想不足 / 月次ロックを切替。
 * Pro でも同じ面を強制表示できる。
 */

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import ReportGateSurface from "@/app/component/reports/ReportGateSurface";
import {
  REPORT_GATE_PREVIEW_MODES,
  type ReportGateKind,
  type ReportGatePreviewMode,
  isReportGatePreviewMode,
} from "@/lib/reports/reportGateTypes";
import { reportGatePreviewCopy } from "@/lib/reports/reportGatePreviewCopy";
import { weeklyReportPreviewClimbed } from "@/lib/reports/weeklyReportPreviewMocks";
import { monthlyReportPreviewTop10 } from "@/lib/reports/monthlyReportPreviewMocks";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { nameOxanium } from "@/lib/fonts";

const WeeklyReportView = dynamic(
  () => import("@/app/component/reports/WeeklyReportView"),
  { ssr: false }
);
const MonthlyReportView = dynamic(
  () => import("@/app/component/reports/MonthlyReportView"),
  { ssr: false }
);

export default function ReportGatePreviewPage() {
  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const copy = reportGatePreviewCopy(language);
  const [mode, setMode] = useState<ReportGatePreviewMode>("free");

  useEffect(() => {
    const q = new URLSearchParams(window.location.search).get("gate");
    if (q && isReportGatePreviewMode(q)) setMode(q);
  }, []);

  const weekly = useMemo(() => weeklyReportPreviewClimbed(), []);
  const monthly = useMemo(() => monthlyReportPreviewTop10(), []);

  const gateKind: ReportGateKind | null =
    mode === "live" ? null : (mode as ReportGateKind);

  return (
    <ProfileCyberPage
      title="REPORT GATE"
      subtitle={copy.subtitle}
      contentClassName="max-w-lg px-3 py-4 sm:px-4"
    >
      <div className="mb-3 flex flex-wrap gap-1.5">
        {REPORT_GATE_PREVIEW_MODES.map((key) => {
          const on = mode === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setMode(key)}
              className={[
                "rounded-lg border px-2.5 py-1.5 text-[11px] font-semibold transition",
                on
                  ? "border-cyan-400/55 bg-cyan-400/14 text-cyan-100"
                  : "border-white/12 bg-white/3 text-white/55 hover:border-white/25 hover:text-white/80",
              ].join(" ")}
            >
              {copy.modeLabel(key)}
            </button>
          );
        })}
      </div>

      <p
        className={[
          nameOxanium.className,
          "mb-3 text-[10px] font-bold uppercase tracking-[0.14em] text-white/40",
        ].join(" ")}
      >
        {`MODE · ${mode} · ?gate=${mode}`}
      </p>

      {gateKind == null ? (
        <div className="space-y-3">
          <p className="text-xs text-white/55">{copy.liveHint}</p>
          <WeeklyReportView report={weekly} language={language} />
        </div>
      ) : gateKind === "monthlyLocked" ? (
        <ReportGateSurface
          kind={gateKind}
          language={language}
          preview={<MonthlyReportView report={monthly} language={language} />}
        />
      ) : gateKind === "free" ? (
        <ReportGateSurface
          kind={gateKind}
          language={language}
          preview={<WeeklyReportView report={weekly} language={language} />}
        />
      ) : (
        <ReportGateSurface kind={gateKind} language={language} />
      )}
    </ProfileCyberPage>
  );
}
