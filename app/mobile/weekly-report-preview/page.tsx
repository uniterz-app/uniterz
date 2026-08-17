"use client";

// 週次レポートプレビュー。Firestore 実データ優先、なければ mock。

import { useEffect, useMemo, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { db } from "@/lib/firebase";
import WeeklyReportView from "@/app/component/reports/WeeklyReportView";
import {
  weeklyReportPreviewBigClimb,
  weeklyReportPreviewClimbed,
  weeklyReportPreviewDropped,
  weeklyReportPreviewFirstWeek,
  weeklyReportPreviewLive,
} from "@/lib/reports/weeklyReportPreviewMocks";
import type { WeeklyReport } from "@/lib/reports/weeklyReportTypes";
import {
  parseWeeklyReportDoc,
  weeklyReportDocId,
} from "@/lib/reports/parseWeeklyReportDoc";
import { resolveRankingWeekStartDateKey } from "@/lib/rankings/rankingPeriod";
import { nameOxanium } from "@/lib/fonts";

const CASES = [
  { key: "live", label: "進行中", build: weeklyReportPreviewLive },
  { key: "climbed", label: "上昇した週", build: weeklyReportPreviewClimbed },
  { key: "bigclimb", label: "28人抜き", build: weeklyReportPreviewBigClimb },
  { key: "dropped", label: "下降した週", build: weeklyReportPreviewDropped },
  { key: "first", label: "初参戦", build: weeklyReportPreviewFirstWeek },
] as const;

type CaseKey = (typeof CASES)[number]["key"];
type SourceMode = "firestore" | "mock";

export default function WeeklyReportPreviewPage() {
  const { fUser } = useFirebaseUser();
  const [caseKey, setCaseKey] = useState<CaseKey>("climbed");
  const [source, setSource] = useState<SourceMode>("firestore");
  const [liveReport, setLiveReport] = useState<WeeklyReport | null>(null);
  const [liveLoading, setLiveLoading] = useState(false);
  const [liveError, setLiveError] = useState<string | null>(null);
  const weekLabel = useMemo(() => resolveRankingWeekStartDateKey(), []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const c = q.get("case");
    if (c && CASES.some((x) => x.key === c)) setCaseKey(c as CaseKey);
    if (q.get("source") === "mock") setSource("mock");
  }, []);

  useEffect(() => {
    if (source !== "firestore" || !fUser?.uid) {
      setLiveReport(null);
      setLiveLoading(false);
      setLiveError(null);
      return;
    }
    let cancelled = false;
    setLiveLoading(true);
    setLiveError(null);
    void (async () => {
      try {
        const snap = await getDoc(
          doc(db, "user_reports", weeklyReportDocId(fUser.uid, weekLabel))
        );
        if (cancelled) return;
        if (!snap.exists()) {
          setLiveReport(null);
          setLiveError(`doc なし: ${weeklyReportDocId(fUser.uid, weekLabel)}`);
          return;
        }
        const parsed = parseWeeklyReportDoc(snap.data());
        setLiveReport(parsed);
        setLiveError(parsed ? null : "doc 形式が不正です");
      } catch (e) {
        if (!cancelled) {
          setLiveReport(null);
          setLiveError(e instanceof Error ? e.message : String(e));
        }
      } finally {
        if (!cancelled) setLiveLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [fUser?.uid, source, weekLabel]);

  const mockReport = useMemo(
    () => CASES.find((c) => c.key === caseKey)!.build(),
    [caseKey]
  );

  const usingFirestore = source === "firestore" && liveReport != null;
  const report = usingFirestore ? liveReport : mockReport;
  const fallbackNote =
    source === "firestore" && !liveLoading && !liveReport
      ? "実データなし → mock を表示中"
      : null;

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
        Firestore 実データ優先（今週 {weekLabel}）。無い場合は mock。手動:
        rebuildWeeklyReportsManualV2
      </p>

      <div className="mt-4 flex flex-wrap gap-1.5">
        {(
          [
            ["firestore", "実データ"],
            ["mock", "Mock"],
          ] as const
        ).map(([k, label]) => (
          <button
            key={k}
            type="button"
            onClick={() => setSource(k)}
            className={[
              "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
              source === k
                ? "border-emerald-400/50 bg-emerald-400/12 text-emerald-200"
                : "border-white/12 bg-white/3 text-white/55 hover:border-white/25",
            ].join(" ")}
          >
            {label}
          </button>
        ))}
      </div>

      {source === "mock" || !usingFirestore ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {CASES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => {
                setSource("mock");
                setCaseKey(c.key);
              }}
              className={[
                "rounded-lg border px-3 py-1.5 text-xs font-semibold transition",
                caseKey === c.key && source === "mock"
                  ? "border-cyan-400/50 bg-cyan-400/12 text-cyan-200"
                  : "border-white/12 bg-white/3 text-white/55 hover:border-white/25",
              ].join(" ")}
            >
              {c.label}
            </button>
          ))}
        </div>
      ) : null}

      {liveLoading ? (
        <p className="mt-3 text-xs text-white/45">Firestore 読み込み中…</p>
      ) : null}
      {fallbackNote ? (
        <p className="mt-3 text-xs text-amber-200/80">
          {fallbackNote}
          {liveError ? `（${liveError}）` : ""}
          {!fUser?.uid ? " — ログインが必要です" : ""}
        </p>
      ) : null}
      {usingFirestore ? (
        <p className="mt-3 text-xs text-emerald-200/80">
          実データ表示中 · status={liveReport.status} · rank={liveReport.rank}
        </p>
      ) : null}

      <div className="mt-5">
        <WeeklyReportView report={report} language="ja" />
      </div>
    </main>
  );
}
