/**
 * Web `SeasonPredictCrowdLaunchHost` 相当 — 締切前に 1 回だけ「みんなの予想」解放を知らせる。
 * 提出済みユーザーだけ。その起動で他の起動時モーダルが出ていたら今回は見送る。
 */
import { useCallback, useEffect, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../../../../lib/firebase";
import { useFirebaseUser } from "../../../../auth/FirebaseUserProvider";
import { useNativeUserLanguageFromAuth } from "../../../../i18n/useNativeUserLanguageFromAuth";
import { navigationRef } from "../../../../navigation/navigationRef";
import {
  isTabTransitionBusy,
  runAfterTabTransition,
} from "../../../../navigation/tabTransitionLockNative";
import SeasonPredictCrowdLaunchCardNative from "./SeasonPredictCrowdLaunchCardNative";
import {
  resolveSeasonPredictCrowdLaunchVariant,
  seasonPredictCrowdLaunchAction,
  seasonPredictCrowdLaunchStorageKey,
  SEASON_PREDICT_CROWD_LAUNCH_DELAY_MS,
  type SeasonPredictCrowdLaunchVariant,
} from "../../../../../../../lib/predict/seasonPredictCrowdLaunch";
import { isSeasonPredictSubmitOpen } from "../../../../../../../lib/predict/seasonPredictDeadline";
import { CURRENT_NBA_SEASON_KEY } from "../../../../../../../lib/rankings/nbaSeason";
import {
  claimLaunchPromptSlot,
  hasOtherLaunchPromptShown,
  isLaunchPromptSlotFree,
  releaseLaunchPromptSlot,
} from "../../../../../../../lib/launch/launchPromptSlot";
import { getTutorialWelcomeChromeHidden } from "../../../../../../../lib/tutorial/tutorialWelcomeChrome";

const SLOT_ID = "season-predict-crowd-launch";

export default function SeasonPredictCrowdLaunchHostNative() {
  const { fUser } = useFirebaseUser();
  const uid = fUser?.uid ?? "";
  const { language } = useNativeUserLanguageFromAuth();
  const [variant, setVariant] = useState<SeasonPredictCrowdLaunchVariant | null>(null);
  const waitingRef = useRef<SeasonPredictCrowdLaunchVariant | null>(null);
  const doneRef = useRef(false);

  const tryShow = useCallback(() => {
    const next = waitingRef.current;
    if (!next || doneRef.current || !uid) return;
    if (!isSeasonPredictSubmitOpen()) return;
    if (
      getTutorialWelcomeChromeHidden() ||
      hasOtherLaunchPromptShown(SLOT_ID) ||
      !isLaunchPromptSlotFree()
    ) {
      waitingRef.current = null;
      doneRef.current = true;
      return;
    }
    if (isTabTransitionBusy()) {
      runAfterTabTransition(tryShow);
      return;
    }
    if (!claimLaunchPromptSlot(SLOT_ID)) return;
    waitingRef.current = null;
    doneRef.current = true;
    void AsyncStorage.setItem(seasonPredictCrowdLaunchStorageKey(uid), "1").catch(() => {});
    setVariant(next);
  }, [uid]);

  useEffect(() => {
    if (!uid || !isSeasonPredictSubmitOpen()) return;
    let cancelled = false;
    const t = setTimeout(() => {
      void (async () => {
        try {
          if (await AsyncStorage.getItem(seasonPredictCrowdLaunchStorageKey(uid))) return;
          const id = `${CURRENT_NBA_SEASON_KEY}_${uid}`;
          const [awards, standings] = await Promise.all([
            getDoc(doc(db, "seasonAwardsPredictions", id)),
            getDoc(doc(db, "seasonStandingsPredictions", id)),
          ]);
          if (cancelled) return;
          const next = resolveSeasonPredictCrowdLaunchVariant({
            awards: awards.exists(),
            standings: standings.exists(),
          });
          if (!next) return;
          waitingRef.current = next;
          tryShow();
        } catch {
          /* 次回起動で再試行 */
        }
      })();
    }, SEASON_PREDICT_CROWD_LAUNCH_DELAY_MS);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [uid, tryShow]);


  const close = useCallback(() => {
    setVariant(null);
    releaseLaunchPromptSlot(SLOT_ID);
  }, []);

  const onPrimary = useCallback(() => {
    if (!variant) return;
    const action = seasonPredictCrowdLaunchAction(variant);
    close();
    if (!navigationRef.isReady()) return;
    navigationRef.navigate("Main", {
      screen: "GamesTab",
      params: {
        screen: "SeasonPredict",
        params: { mode: action.mode, view: "crowd" },
      },
    });
  }, [close, variant]);

  return (
    <SeasonPredictCrowdLaunchCardNative
      variant={variant}
      language={language}
      onPrimary={onPrimary}
      onClose={close}
    />
  );
}
