"use client";

/**
 * Pro 本人がプロフィールを開いたとき、月曜 / 毎月1日に未読レポートをオーバーレイ表示。
 */
import { useCallback, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  buildForcedDeliveryCandidates,
  buildReportDeliveryCandidates,
  type ReportDeliveryCandidate,
  type ReportDeliveryKind,
} from "@/lib/reports/reportDelivery";
import {
  markReportOverlaySeenInSet,
  parseReportOverlaySeenIds,
  reportOverlaySeenStorageKey,
  serializeReportOverlaySeenIds,
} from "@/lib/reports/reportOverlaySeen";
import { parseMonthlyReportDoc } from "@/lib/reports/parseMonthlyReportDoc";
import { parseWeeklyReportDoc } from "@/lib/reports/parseWeeklyReportDoc";
import type { MonthlyReport } from "@/lib/reports/monthlyReportTypes";
import type { WeeklyReport } from "@/lib/reports/weeklyReportTypes";
import { weeklyReportPreviewClimbed } from "@/lib/reports/weeklyReportPreviewMocks";
import { monthlyReportPreviewTop10 } from "@/lib/reports/monthlyReportPreviewMocks";

export type ActiveReportOverlay = {
  candidate: ReportDeliveryCandidate;
  weekly: WeeklyReport | null;
  monthly: MonthlyReport | null;
  preview: boolean;
};

function readSeen(uid: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    return parseReportOverlaySeenIds(
      window.localStorage.getItem(reportOverlaySeenStorageKey(uid))
    );
  } catch {
    return new Set();
  }
}

function writeSeen(uid: string, ids: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      reportOverlaySeenStorageKey(uid),
      serializeReportOverlaySeenIds(ids)
    );
  } catch {
    /* ignore */
  }
}

function forceKindsFromEnv(): ReportDeliveryKind[] | null {
  if (typeof window === "undefined") return null;
  try {
    const q = new URLSearchParams(window.location.search).get("forceReportOverlay");
    if (q === "weekly" || q === "monthly" || q === "both") {
      if (q === "both") return ["monthly", "weekly"];
      return [q];
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function useProReportDeliveryOverlay(opts: {
  uid: string | null;
  enabled: boolean;
}): {
  active: ActiveReportOverlay | null;
  dismiss: () => void;
} {
  const { uid, enabled } = opts;
  const [queue, setQueue] = useState<ActiveReportOverlay[]>([]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!enabled || !uid) {
      setQueue([]);
      setIndex(0);
      return;
    }

    let cancelled = false;
    void (async () => {
      const forced = forceKindsFromEnv();
      const candidates = forced
        ? buildForcedDeliveryCandidates(uid, forced)
        : buildReportDeliveryCandidates(uid);
      if (candidates.length === 0) {
        if (!cancelled) {
          setQueue([]);
          setIndex(0);
        }
        return;
      }

      const seen = readSeen(uid);
      const pending = candidates.filter((c) => !seen.has(c.reportId));
      if (pending.length === 0) {
        if (!cancelled) {
          setQueue([]);
          setIndex(0);
        }
        return;
      }

      const loaded: ActiveReportOverlay[] = [];
      for (const candidate of pending) {
        try {
          const snap = await getDoc(doc(db, "user_reports", candidate.reportId));
          if (candidate.kind === "weekly") {
            const parsed = snap.exists()
              ? parseWeeklyReportDoc(snap.data())
              : null;
            if (parsed) {
              loaded.push({
                candidate,
                weekly: parsed,
                monthly: null,
                preview: false,
              });
            } else if (forced) {
              loaded.push({
                candidate,
                weekly: weeklyReportPreviewClimbed(),
                monthly: null,
                preview: true,
              });
            }
          } else {
            const parsed = snap.exists()
              ? parseMonthlyReportDoc(snap.data())
              : null;
            if (parsed) {
              loaded.push({
                candidate,
                weekly: null,
                monthly: parsed,
                preview: false,
              });
            } else if (forced) {
              loaded.push({
                candidate,
                weekly: null,
                monthly: monthlyReportPreviewTop10(),
                preview: true,
              });
            }
          }
        } catch {
          /* skip */
        }
      }

      // 本番カレンダー日で doc 未作成でも、体験確認用にプレビューを出す（開発時のみ）
      if (
        loaded.length === 0 &&
        pending.length > 0 &&
        process.env.NODE_ENV !== "production"
      ) {
        for (const candidate of pending) {
          if (candidate.kind === "weekly") {
            loaded.push({
              candidate,
              weekly: weeklyReportPreviewClimbed(),
              monthly: null,
              preview: true,
            });
          } else {
            loaded.push({
              candidate,
              weekly: null,
              monthly: monthlyReportPreviewTop10(),
              preview: true,
            });
          }
        }
      }

      if (!cancelled) {
        setQueue(loaded);
        setIndex(0);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, uid]);

  const active = queue[index] ?? null;

  const dismiss = useCallback(() => {
    if (!uid || !active) return;
    const nextSeen = markReportOverlaySeenInSet(
      readSeen(uid),
      active.candidate.reportId
    );
    writeSeen(uid, nextSeen);
    setIndex((i) => i + 1);
  }, [uid, active]);

  return { active: index < queue.length ? active : null, dismiss };
}
