import type { ReactNode } from "react";
import Animated from "react-native-reanimated";
import { useReducedMotion } from "react-native-reanimated";
import { podiumEntranceStepForRank } from "../../../../../lib/rankings/podiumEntrance";
import { useRankingsPodiumCardEntrance } from "./useRankingsPodiumCardEntrance";

type Props = {
  rank: 1 | 2 | 3;
  entranceKey: string | number;
  children: ReactNode;
  active?: boolean;
};

/** Top3 行 — 3→2→1 の順で入場 */
export default function RankingsPodiumEntranceRowNative({
  rank,
  entranceKey,
  children,
  active = true,
}: Props) {
  const reduced = useReducedMotion() ?? false;
  const pageKey = String(entranceKey);
  const stepIndex = podiumEntranceStepForRank(rank);
  const { cardStyle } = useRankingsPodiumCardEntrance(
    stepIndex,
    pageKey,
    reduced,
    active
  );

  return (
    <Animated.View style={cardStyle}>
      {children}
    </Animated.View>
  );
}
