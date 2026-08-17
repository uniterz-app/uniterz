"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { db } from "@/lib/firebase";
import { fetchUserReportsArchive } from "@/lib/reports/fetchUserReportsArchive";
import type { UserReportListItem } from "@/lib/reports/partitionUserReports";
import { formatReportPeriodLabel } from "@/lib/reports/reportDelivery";
import { weeklyReportPreviewClimbed } from "@/lib/reports/weeklyReportPreviewMocks";
import { monthlyReportPreviewTop10 } from "@/lib/reports/monthlyReportPreviewMocks";
import type { ReportGateKind } from "@/lib/reports/reportGateTypes";
import ReportGateSurface from "@/app/component/reports/ReportGateSurface";
import { nameOxanium } from "@/lib/fonts";

const MonthlyReportView = dynamic(
  () => import("@/app/component/reports/MonthlyReportView"),
  {
    ssr: false,
    loading: () => (
      <div className="h-72 animate-pulse rounded-2xl bg-white/5" aria-hidden />
    ),
  }
);

const WeeklyReportView = dynamic(
  () => import("@/app/component/reports/WeeklyReportView"),
  {
    ssr: false,
    loading: () => (
      <div className="h-56 animate-pulse rounded-2xl bg-white/5" aria-hidden />
    ),
  }
);

type Props = {
  uid: string | null;
  language: string;
  canViewReport: boolean;
  showUpgrade: boolean;
};

type Tab = "weekly" | "monthly";

/**
 * Report タブ入口。週次・月次を user_reports から一覧。
 */
export default function ProfileMonthlyReportPanel({
  uid,
  language,
  canViewReport,
  showUpgrade,
}: Props) {
  const [tab, setTab] = useState<Tab>("weekly");
  const [weeklies, setWeeklies] = useState<UserReportListItem[]>([]);
  const [monthlies, setMonthlies] = useState<UserReportListItem[]>([]);
  const [selectedWeeklyId, setSelectedWeeklyId] = useState<string | null>(null);
  const [selectedMonthlyId, setSelectedMonthlyId] = useState<string | null>(
    null
  );
  const [loading, setLoading] = useState(canViewReport && Boolean(uid));

  const isJa = language === "ja";
  const lang = isJa ? "ja" : "en";

  const mockWeekly = useMemo(() => weeklyReportPreviewClimbed(), []);
  const mockMonthly = useMemo(() => monthlyReportPreviewTop10(), []);

  useEffect(() => {
    if (!canViewReport || !uid) {
      setWeeklies([]);
      setMonthlies([]);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const { weeklies: w, monthlies: m } = await fetchUserReportsArchive(
          db,
          uid
        );
        if (cancelled) return;
        setWeeklies(w);
        setMonthlies(m);
        setSelectedWeeklyId(w[0]?.id ?? null);
        setSelectedMonthlyId(m[0]?.id ?? null);
      } catch {
        if (!cancelled) {
          setWeeklies([]);
          setMonthlies([]);
          setSelectedWeeklyId(null);
          setSelectedMonthlyId(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canViewReport, uid]);

  const selectedWeekly = useMemo(() => {
    const hit = weeklies.find((x) => x.id === selectedWeeklyId) ?? weeklies[0];
    return hit?.kind === "weekly" ? hit : null;
  }, [weeklies, selectedWeeklyId]);
  const selectedMonthly = useMemo(() => {
    const hit =
      monthlies.find((x) => x.id === selectedMonthlyId) ?? monthlies[0];
    return hit?.kind === "monthly" ? hit : null;
  }, [monthlies, selectedMonthlyId]);

  const renderGate = (kind: ReportGateKind) => {
    if (kind === "free") {
      return (
        <ReportGateSurface
          kind="free"
          language={lang}
          ctaHref={showUpgrade ? undefined : null}
          preview={<WeeklyReportView report={mockWeekly} language={lang} />}
        />
      );
    }
    if (kind === "monthlyLocked") {
      return (
        <ReportGateSurface
          kind="monthlyLocked"
          language={lang}
          preview={<MonthlyReportView report={mockMonthly} language={lang} />}
        />
      );
    }
    return <ReportGateSurface kind={kind} language={lang} />;
  };

  if (!canViewReport) {
    return renderGate("free");
  }

  if (loading) {
    return (
      <div className="h-72 animate-pulse rounded-2xl bg-white/5" aria-hidden />
    );
  }

  const list = tab === "weekly" ? weeklies : monthlies;

  return (
    <div className="space-y-3">
      <div className="flex gap-1.5">
        {(
          [
            ["weekly", isJa ? "週次" : "Weekly"],
            ["monthly", isJa ? "月次" : "Monthly"],
          ] as const
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={[
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
              tab === key
                ? "border-cyan-400/50 bg-cyan-400/12 text-cyan-200"
                : "border-white/12 bg-white/3 text-white/55 hover:border-white/25",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "monthly" && list.length > 1 ? (
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {list.map((item) => {
            const selected = item.id === selectedMonthly?.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedMonthlyId(item.id)}
                className={[
                  nameOxanium.className,
                  "shrink-0 rounded-md border px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wide transition",
                  selected
                    ? "border-cyan-400/55 bg-cyan-400/14 text-cyan-100"
                    : "border-white/12 bg-white/4 text-white/55 hover:border-white/25",
                ].join(" ")}
              >
                {formatReportPeriodLabel(item.kind, item.periodKey, lang)}
              </button>
            );
          })}
        </div>
      ) : null}

      {tab === "weekly" ? (
        selectedWeekly ? (
          selectedWeekly.report.totalPosts === 0 ? (
            renderGate("insufficientPicks")
          ) : (
            <WeeklyReportView
              report={selectedWeekly.report}
              language={lang}
              periods={weeklies.map((w) => ({
                id: w.id,
                label: formatReportPeriodLabel("weekly", w.periodKey, lang),
              }))}
              selectedPeriodId={selectedWeekly.id}
              onSelectPeriod={setSelectedWeeklyId}
            />
          )
        ) : (
          renderGate("waitingMonday")
        )
      ) : selectedMonthly ? (
        <MonthlyReportView report={selectedMonthly.report} language={lang} />
      ) : (
        renderGate("waitingMonth")
      )}
    </div>
  );
}
