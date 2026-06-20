import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  where,
} from "firebase/firestore";
import { filterPostsForScope } from "../../../../../lib/profile/profileStreakPostsCompute";
import {
  resolveProfileStreakScopeKey,
  type ProfileStatsStreakContext,
} from "../../../../../lib/profile/profileStreakScope";
import { db } from "../../lib/firebase";

/** Web `useProfileStreakTracker` と同じ */
export const STREAK_TRACKER_LAST_N = 20;

const STREAK_FETCH_LIMIT = 120;

export type StreakTrackerPointNative = {
  postId: string;
  settledAtMs: number;
  isWin: boolean;
  streakAfter: number;
};

function settledAtToMs(v: unknown): number | null {
  if (v == null) return null;
  if (typeof v === "object" && v !== null && "toMillis" in v) {
    const m = (v as { toMillis: () => number }).toMillis();
    return Number.isFinite(m) ? m : null;
  }
  return null;
}

export function useNativeStreakTracker(
  uid: string | undefined,
  enabled: boolean,
  profileStatsContext?: ProfileStatsStreakContext
) {
  const rankingLeague = profileStatsContext?.rankingLeague ?? "worldcup";
  const wcStage = profileStatsContext?.wcStage ?? "overall";
  const scopeKey = resolveProfileStreakScopeKey({ rankingLeague, wcStage });

  const [points, setPoints] = useState<StreakTrackerPointNative[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!enabled || !uid) {
      setPoints([]);
      setLoading(false);
      return;
    }

    let alive = true;

    async function run() {
      setLoading(true);
      try {
        const q = query(
          collection(db, "posts"),
          where("authorUid", "==", uid),
          where("schemaVersion", "==", 2),
          orderBy("settledAt", "desc"),
          limit(STREAK_FETCH_LIMIT)
        );
        const snap = await getDocs(q);

        const rows: {
          postId: string;
          settledAtMs: number;
          isWin: boolean;
          league?: unknown;
          seasonPhase?: unknown;
          wcStage?: unknown;
        }[] = [];
        for (const d of snap.docs) {
          const data = d.data() as Record<string, unknown>;
          const ms = settledAtToMs(data.settledAt);
          if (ms == null) continue;
          const stats = data.stats as Record<string, unknown> | undefined;
          const iw = stats?.isWin;
          if (typeof iw !== "boolean") continue;
          rows.push({
            postId: d.id,
            settledAtMs: ms,
            isWin: iw,
            league: data.league,
            seasonPhase: data.seasonPhase,
            wcStage: data.wcStage,
          });
        }

        const scoped = filterPostsForScope(rows, scopeKey, STREAK_TRACKER_LAST_N);
        scoped.sort((a, b) => a.settledAtMs - b.settledAtMs);

        let streak = 0;
        const out: StreakTrackerPointNative[] = [];
        for (const r of scoped) {
          if (r.isWin) {
            streak = streak > 0 ? streak + 1 : 1;
          } else {
            streak = streak < 0 ? streak - 1 : -1;
          }
          out.push({
            postId: r.postId,
            settledAtMs: r.settledAtMs,
            isWin: r.isWin,
            streakAfter: streak,
          });
        }

        if (alive) setPoints(out);
      } catch {
        if (alive) setPoints([]);
      } finally {
        if (alive) setLoading(false);
      }
    }

    void run();
    return () => {
      alive = false;
    };
  }, [uid, enabled, scopeKey]);

  return { points, loading };
}
