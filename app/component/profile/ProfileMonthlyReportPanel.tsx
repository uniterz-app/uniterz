"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { MonthlyReport } from "@/lib/reports/monthlyReportTypes";
import type { WeeklyReport } from "@/lib/reports/weeklyReportTypes";
import {
  parseWeeklyReportDoc,
  weeklyReportDocId,
} from "@/lib/reports/parseWeeklyReportDoc";
import { resolveRankingWeekStartDateKey } from "@/lib/rankings/rankingPeriod";
import { CYBER_GLASS_PANEL } from "@/lib/ui/matchOverlayGlass";

const MonthlyReportView = dynamic(
  () => import("@/app/component/reports/MonthlyReportView"),
  {
    ssr: false,
    loading: () => <div className="h-72 animate-pulse rounded-2xl bg-white/5" aria-hidden />,
  }
);

const WeeklyReportView = dynamic(
  () => import("@/app/component/reports/WeeklyReportView"),
  {
    ssr: false,
    loading: () => <div className="h-56 animate-pulse rounded-2xl bg-white/5" aria-hidden />,
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
 * Report タブ入口。旧 ProAnalysis / user_stats_v2_monthly は読まない。
 * 週次・月次とも user_reports から実データ。
 */
export default function ProfileMonthlyReportPanel({
  uid,
  language,
  canViewReport,
  showUpgrade,
}: Props) {
  const [tab, setTab] = useState<Tab>("weekly");
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [weekly, setWeekly] = useState<WeeklyReport | null>(null);
  const [loading, setLoading] = useState(canViewReport && Boolean(uid));

  useEffect(() => {
    if (!canViewReport || !uid) {
      setMonthly(null);
      setWeekly(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void (async () => {
      try {
        const weekLabel = resolveRankingWeekStartDateKey();
        const [monthlySnap, weeklySnap] = await Promise.all([
          getDocs(query(collection(db, "user_reports"), where("uid", "==", uid))),
          getDoc(doc(db, "user_reports", weeklyReportDocId(uid, weekLabel))),
        ]);
        if (cancelled) return;

        const latestMonthly = monthlySnap.docs
          .map((entry) => entry.data())
          .filter(
            (entry): entry is MonthlyReport =>
              entry?.league === "nba" && typeof entry?.monthKey === "string"
          )
          .sort((a, b) => b.monthKey.localeCompare(a.monthKey))[0];
        setMonthly(latestMonthly ?? null);

        setWeekly(
          weeklySnap.exists() ? parseWeeklyReportDoc(weeklySnap.data()) : null
        );
      } catch {
        if (!cancelled) {
          setMonthly(null);
          setWeekly(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [canViewReport, uid]);

  const isJa = language === "ja";

  if (!canViewReport) {
    return (
      <div className={`${CYBER_GLASS_PANEL} space-y-3 p-6 text-center`}>
        <h2 className="text-base font-bold text-white">
          {isJa ? "レポート" : "Reports"}
        </h2>
        <p className="text-sm leading-relaxed text-white/65">
          {showUpgrade
            ? isJa
              ? "週次・月次レポートで成績を振り返れます。"
              : "Review your week and month with Pro reports."
            : isJa
              ? "レポートは Pro メンバー向けです。"
              : "Reports are available to Pro members."}
        </p>
        {showUpgrade ? (
          <div className="flex flex-wrap justify-center gap-2">
            <Link
              href="/mobile/weekly-report-preview"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/18"
            >
              {isJa ? "週次を見る" : "Weekly"}
            </Link>
            <Link
              href="/mobile/monthly-report-preview"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-cyan-300/35 bg-cyan-300/10 px-4 text-sm font-semibold text-cyan-100 transition hover:bg-cyan-300/18"
            >
              {isJa ? "月次を見る" : "Monthly"}
            </Link>
          </div>
        ) : null}
      </div>
    );
  }

  if (loading) {
    return <div className="h-72 animate-pulse rounded-2xl bg-white/5" aria-hidden />;
  }

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

      {tab === "weekly" ? (
        weekly ? (
          <WeeklyReportView report={weekly} language={isJa ? "ja" : "en"} />
        ) : (
          <div className={`${CYBER_GLASS_PANEL} space-y-2 p-6 text-center`}>
            <h2 className="text-base font-bold text-white">
              {isJa ? "週次レポート" : "Weekly Report"}
            </h2>
            <p className="text-sm leading-relaxed text-white/65">
              {isJa
                ? "今週のレポートはまだありません。毎朝更新されます。"
                : "No weekly report yet. It updates every morning."}
            </p>
          </div>
        )
      ) : monthly ? (
        <MonthlyReportView report={monthly} language={isJa ? "ja" : "en"} />
      ) : (
        <div className={`${CYBER_GLASS_PANEL} space-y-2 p-6 text-center`}>
          <h2 className="text-base font-bold text-white">
            {isJa ? "月次レポート" : "Monthly Report"}
          </h2>
          <p className="text-sm leading-relaxed text-white/65">
            {isJa
              ? "最初のレポートは毎月1日に作成されます。"
              : "Your first report is built on the 1st of each month."}
          </p>
        </div>
      )}
    </div>
  );
}
