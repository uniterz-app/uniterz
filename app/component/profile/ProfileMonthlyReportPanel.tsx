"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  partitionUserReportDocs,
  type UserReportListItem,
} from "@/lib/reports/partitionUserReports";
import { formatReportPeriodLabel } from "@/lib/reports/reportDelivery";
import { weeklyReportPreviewClimbed } from "@/lib/reports/weeklyReportPreviewMocks";
import { monthlyReportPreviewTop10 } from "@/lib/reports/monthlyReportPreviewMocks";
import {
  REPORT_GATE_PREVIEW_MODES,
  type ReportGateKind,
  type ReportGatePreviewMode,
} from "@/lib/reports/reportGateTypes";
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

const GATE_CHIP: Record<ReportGatePreviewMode, { ja: string; en: string }> = {
  live: { ja: "ライブ", en: "Live" },
  free: { ja: "Free", en: "Free" },
  waitingMonday: { ja: "月曜待ち", en: "Monday" },
  waitingMonth: { ja: "月初待ち", en: "Month wait" },
  insufficientPicks: { ja: "予想不足", en: "No picks" },
  monthlyLocked: { ja: "月次ロック", en: "Monthly lock" },
};

/**
 * Report タブ入口。週次・月次を user_reports から一覧。
 * 見た目確認用にゲート強制切替あり（Pro でも Free / ロック面を表示可）。
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
  const [forceGate, setForceGate] = useState<ReportGatePreviewMode>("live");

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
        const snap = await getDocs(
          query(collection(db, "user_reports"), where("uid", "==", uid))
        );
        if (cancelled) return;
        const { weeklies: w, monthlies: m } = partitionUserReportDocs(
          snap.docs.map((d) => ({ id: d.id, data: d.data() }))
        );
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

  const effectiveGate: ReportGateKind | null = useMemo(() => {
    if (forceGate !== "live") return forceGate;
    if (!canViewReport) return "free";
    return null;
  }, [forceGate, canViewReport]);

  const gateSwitcher = (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <p
          className={[
            nameOxanium.className,
            "text-[9px] font-bold uppercase tracking-[0.16em] text-white/40",
          ].join(" ")}
        >
          {isJa ? "GATE PREVIEW" : "GATE PREVIEW"}
        </p>
        <Link
          href="/mobile/report-gate-preview"
          className="text-[10px] font-semibold text-cyan-200/70 underline-offset-2 hover:text-cyan-100 hover:underline"
        >
          {isJa ? "専用ページ" : "Full page"}
        </Link>
      </div>
      <div className="flex flex-wrap gap-1">
        {REPORT_GATE_PREVIEW_MODES.map((key) => {
          const on = forceGate === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setForceGate(key)}
              className={[
                "rounded-md border px-2 py-1 text-[10px] font-semibold transition",
                on
                  ? "border-cyan-400/55 bg-cyan-400/14 text-cyan-100"
                  : "border-white/12 bg-white/3 text-white/50 hover:border-white/25",
              ].join(" ")}
            >
              {GATE_CHIP[key][lang]}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderGate = (kind: ReportGateKind) => {
    if (kind === "free") {
      return (
        <ReportGateSurface
          kind="free"
          language={lang}
          ctaHref={showUpgrade || forceGate === "free" ? undefined : null}
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

  if (effectiveGate) {
    return (
      <div className="space-y-3">
        {gateSwitcher}
        {renderGate(effectiveGate)}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {gateSwitcher}
        <div className="h-72 animate-pulse rounded-2xl bg-white/5" aria-hidden />
      </div>
    );
  }

  const list = tab === "weekly" ? weeklies : monthlies;

  return (
    <div className="space-y-3">
      {gateSwitcher}

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
