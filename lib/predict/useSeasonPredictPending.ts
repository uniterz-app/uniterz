/**
 * シーズン予想（アワード / 順位）の未提出マーク用。Web / Native 共有。
 * 提出 doc は提出時のみ作られる（公開 read）。締切後は常に false。
 */
import { useEffect, useState } from "react";
import { doc, onSnapshot, type Firestore } from "firebase/firestore";
import { CURRENT_NBA_SEASON_KEY } from "@/lib/rankings/nbaSeason";
import {
  SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS,
  isSeasonPredictSubmitOpen,
} from "@/lib/predict/seasonPredictDeadline";

const SEASON_AWARDS_COLLECTION = "seasonAwardsPredictions";
const SEASON_STANDINGS_COLLECTION = "seasonStandingsPredictions";

export type SeasonPredictPending = {
  awards: boolean;
  standings: boolean;
};

const NONE: SeasonPredictPending = { awards: false, standings: false };

function useSeasonPredictSubmitOpen(): boolean {
  const [open, setOpen] = useState(() => isSeasonPredictSubmitOpen());
  useEffect(() => {
    if (!open) return;
    const ms = SEASON_PREDICT_SUBMIT_DEADLINE_AT_MS - Date.now();
    if (ms <= 0) {
      setOpen(false);
      return;
    }
    /** setTimeout は 2^31-1 ms 超で即発火する */
    const t = setTimeout(
      () => setOpen(isSeasonPredictSubmitOpen()),
      Math.min(ms + 500, 2_147_000_000)
    );
    return () => clearTimeout(t);
  }, [open]);
  return open;
}

export function useSeasonPredictPending(
  db: Firestore,
  uid: string | null | undefined
): SeasonPredictPending {
  const open = useSeasonPredictSubmitOpen();
  const [state, setState] = useState<SeasonPredictPending>(NONE);

  useEffect(() => {
    setState(NONE);
    if (!uid || !open) return;
    const docId = `${CURRENT_NBA_SEASON_KEY}_${uid}`;
    const unsubAwards = onSnapshot(
      doc(db, SEASON_AWARDS_COLLECTION, docId),
      (snap) => setState((prev) => ({ ...prev, awards: !snap.exists() })),
      () => setState((prev) => ({ ...prev, awards: false }))
    );
    const unsubStandings = onSnapshot(
      doc(db, SEASON_STANDINGS_COLLECTION, docId),
      (snap) => setState((prev) => ({ ...prev, standings: !snap.exists() })),
      () => setState((prev) => ({ ...prev, standings: false }))
    );
    return () => {
      unsubAwards();
      unsubStandings();
    };
  }, [db, uid, open]);

  return open && uid ? state : NONE;
}
