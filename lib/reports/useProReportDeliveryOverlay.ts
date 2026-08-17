"use client";

/**
 * Pro 本人がプロフィールを開いたとき、直近の未読週次/月次をオーバーレイ表示。
 */
import { useCallback, useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  buildReportDeliveryCandidates,
  type ReportDeliveryCandidate,
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
      const candidates = buildReportDeliveryCandidates(uid);
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
            }
          }
        } catch {
          /* skip */
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
