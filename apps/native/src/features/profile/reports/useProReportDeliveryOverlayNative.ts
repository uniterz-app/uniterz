/**
 * Web `useProReportDeliveryOverlay` 相当（Native / AsyncStorage）。
 */
import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../lib/firebase";
import {
  buildReportDeliveryCandidates,
  type ReportDeliveryCandidate,
} from "../../../../../../lib/reports/reportDelivery";
import {
  markReportOverlaySeenInSet,
  parseReportOverlaySeenIds,
  reportOverlaySeenStorageKey,
  serializeReportOverlaySeenIds,
} from "../../../../../../lib/reports/reportOverlaySeen";
import { parseMonthlyReportDoc } from "../../../../../../lib/reports/parseMonthlyReportDoc";
import { parseWeeklyReportDoc } from "../../../../../../lib/reports/parseWeeklyReportDoc";
import type { MonthlyReport } from "../../../../../../lib/reports/monthlyReportTypes";
import type { WeeklyReport } from "../../../../../../lib/reports/weeklyReportTypes";
import { fetchUserReportsArchive } from "../../../../../../lib/reports/fetchUserReportsArchive";
import type { UserReportListItem } from "../../../../../../lib/reports/partitionUserReports";

export type ActiveReportOverlayNative = {
  candidate: ReportDeliveryCandidate;
  weekly: WeeklyReport | null;
  monthly: MonthlyReport | null;
  preview: boolean;
};

async function readSeen(uid: string): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(reportOverlaySeenStorageKey(uid));
    return parseReportOverlaySeenIds(raw);
  } catch {
    return new Set();
  }
}

async function writeSeen(uid: string, ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(
      reportOverlaySeenStorageKey(uid),
      serializeReportOverlaySeenIds(ids)
    );
  } catch {
    /* ignore */
  }
}

export function useProReportDeliveryOverlayNative(opts: {
  uid: string | null | undefined;
  enabled: boolean;
}): {
  active: ActiveReportOverlayNative | null;
  dismiss: () => void;
} {
  const { uid, enabled } = opts;
  const [queue, setQueue] = useState<ActiveReportOverlayNative[]>([]);
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

      const seen = await readSeen(uid);
      const pending = candidates.filter((c) => !seen.has(c.reportId));
      if (pending.length === 0) {
        if (!cancelled) {
          setQueue([]);
          setIndex(0);
        }
        return;
      }

      const loaded: ActiveReportOverlayNative[] = [];
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
    void (async () => {
      const nextSeen = markReportOverlaySeenInSet(
        await readSeen(uid),
        active.candidate.reportId
      );
      await writeSeen(uid, nextSeen);
      setIndex((i) => i + 1);
    })();
  }, [uid, active]);

  return { active: index < queue.length ? active : null, dismiss };
}

/** Report タブ用: user_reports 一覧（空なら空配列。待機面は UI 側） */
export function useUserReportsArchiveNative(opts: {
  uid: string | undefined;
  enabled: boolean;
}): {
  loading: boolean;
  weeklies: UserReportListItem[];
  monthlies: UserReportListItem[];
} {
  const { uid, enabled } = opts;
  const [loading, setLoading] = useState(enabled && Boolean(uid));
  const [weeklies, setWeeklies] = useState<UserReportListItem[]>([]);
  const [monthlies, setMonthlies] = useState<UserReportListItem[]>([]);

  useEffect(() => {
    if (!enabled || !uid) {
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
      } catch {
        if (!cancelled) {
          setWeeklies([]);
          setMonthlies([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, uid]);

  return { loading, weeklies, monthlies };
}
