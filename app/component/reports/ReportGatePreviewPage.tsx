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

const MODE_LABEL: Record<ReportGatePreviewMode, { ja: string; en: string }> = {
  live: { ja: "ライブ（ゲートなし）", en: "Live (no gate)" },
  free: { ja: "Free ロック", en: "Free lock" },
  waitingMonday: { ja: "月曜待ち", en: "Waiting Monday" },
  waitingMonth: { ja: "月初待ち", en: "Waiting month" },
  insufficientPicks: { ja: "予想不足", en: "Not enough picks" },
  monthlyLocked: { ja: "月次ロック", en: "Monthly lock" },
};

export default function ReportGatePreviewPage() {
  const { fUser } = useFirebaseUser();
  const { language } = useUserLanguage(fUser?.uid ?? null);
  const lang = language === "ja" ? "ja" : "en";
  const isJa = lang === "ja";
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
      subtitle={
        isJa
          ? "ブラー＋説明＋CTA／空状態の見た目確認。Pro でも切替で全パターンを見られます。"
          : "Blur + copy + CTA / empty states. Force any gate even on Pro."
      }
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
              {MODE_LABEL[key][lang]}
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
        {isJa ? `MODE · ${mode}` : `MODE · ${mode}`}
        {` · ?gate=${mode}`}
      </p>

      {gateKind == null ? (
        <div className="space-y-3">
          <p className="text-xs text-white/55">
            {isJa
              ? "ゲートなし。実レポートがそのまま見えます（ここでは週次モック）。"
              : "No gate. Full report as Pro would see it (weekly mock here)."}
          </p>
          <WeeklyReportView report={weekly} language={lang} />
        </div>
      ) : gateKind === "monthlyLocked" ? (
        <ReportGateSurface
          kind={gateKind}
          language={lang}
          preview={<MonthlyReportView report={monthly} language={lang} />}
        />
      ) : gateKind === "free" ? (
        <ReportGateSurface
          kind={gateKind}
          language={lang}
          preview={<WeeklyReportView report={weekly} language={lang} />}
        />
      ) : (
        <ReportGateSurface kind={gateKind} language={lang} />
      )}
    </ProfileCyberPage>
  );
}
