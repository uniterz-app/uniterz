import type { ReactNode } from "react";
import Animated from "react-native-reanimated";
import { useReducedMotion } from "react-native-reanimated";
import { podiumEntranceStepForRank } from "../../../../../lib/rankings/podiumEntrance";
import { useRankingsPodiumCardEntrance } from "./useRankingsPodiumCardEntrance";
import { useRankingsPodiumFirstGlow } from "./useRankingsPodiumFirstGlow";

type Props = {
  rank: 1 | 2 | 3;
  entranceKey: string | number;
  children: ReactNode;
};

/** Top3 行 — 3→2→1 の順で入場、1位はグロー */
export default function RankingsPodiumEntranceRowNative({
  rank,
  entranceKey,
  children,
}: Props) {
  const reduced = useReducedMotion() ?? false;
  const pageKey = String(entranceKey);
  const stepIndex = podiumEntranceStepForRank(rank);
  const { cardStyle } = useRankingsPodiumCardEntrance(stepIndex, pageKey, reduced);
  const { glowStyle } = useRankingsPodiumFirstGlow(rank === 1, pageKey, reduced);

  return (
    <Animated.View style={[cardStyle, rank === 1 ? glowStyle : null]}>
      {children}
    </Animated.View>
  );
}
