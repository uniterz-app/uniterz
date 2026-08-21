/**
 * Web `SquadBattleLaunchPromptHost` 相当 — アプリ起動時に開催モーダルを一度表示
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import SquadBattleLaunchOverlayNative from "./SquadBattleLaunchOverlayNative";
import { readSquadBattleLaunchSeenBattleIdNative, markSquadBattleLaunchSeenNative } from "./squadBattleLaunchSeenNative";
import { fetchCurrentGroupBattleNative } from "./groupBattleApiNative";
import { auth } from "../../lib/firebase";
import type { MainTabParamList } from "../../navigation/types";
import {
  formatSquadBattleRecruitDeadlineLabel,
  shouldShowSquadBattleLaunch,
} from "../../../../../lib/squads/squadBattleLaunchGate";
import {
  getTutorialWelcomeChromeHidden,
  subscribeTutorialWelcomeChromeHidden,
} from "../../../../../lib/tutorial/tutorialWelcomeChrome";

export default function SquadBattleLaunchPromptHostNative() {
  const navigation =
    useNavigation<BottomTabNavigationProp<MainTabParamList>>();
  const [open, setOpen] = useState(false);
  const [battleId, setBattleId] = useState<string | null>(null);
  const [deadlineLabel, setDeadlineLabel] = useState<string | null>(null);
  const decidedRef = useRef(false);

  const evaluate = useCallback(async () => {
    if (decidedRef.current) return;
    if (getTutorialWelcomeChromeHidden()) return;
    try {
      const token = await auth.currentUser?.getIdToken().catch(() => null);
      const current = await fetchCurrentGroupBattleNative({ idToken: token });
      const battle = current?.battle;
      const seen = await readSquadBattleLaunchSeenBattleIdNative();
      if (
        !shouldShowSquadBattleLaunch({
          battleId: battle?.id,
          phase: battle?.phase,
          seenBattleId: seen,
        })
      ) {
        decidedRef.current = true;
        return;
      }
      decidedRef.current = true;
      await markSquadBattleLaunchSeenNative(battle!.id);
      setBattleId(battle!.id);
      setDeadlineLabel(
        formatSquadBattleRecruitDeadlineLabel(battle!.recruitEndAtMs)
      );
      setOpen(true);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => {
      void evaluate();
    }, 1100);
    const unsub = subscribeTutorialWelcomeChromeHidden(() => {
      void evaluate();
    });
    return () => {
      clearTimeout(t);
      unsub();
    };
  }, [evaluate]);

  return (
    <SquadBattleLaunchOverlayNative
      visible={open}
      battleId={battleId}
      deadlineLabel={deadlineLabel}
      onClose={() => setOpen(false)}
      onEnter={() => {
        setOpen(false);
        navigation.navigate("LeaderboardsTab", {
          screen: "SquadBattle",
        });
      }}
    />
  );
}
