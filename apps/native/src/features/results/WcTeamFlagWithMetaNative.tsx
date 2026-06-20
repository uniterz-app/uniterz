import type { ReactNode } from "react";
import { Text, View, type TextStyle, type ViewStyle } from "react-native";
import { MATCH_CARD_SCORE_FONT } from "../games/matchCardTypography";
import { formatWcDrawPotLabel, getWcDrawPot, resolveWcDrawPotColor } from "../../../../../lib/wc/drawPots";

type Props = {
  teamId: string | null | undefined;
  children: ReactNode;
};

/** 国旗の上 — 抽選ポット（Pot 1 など）+ 国旗 */
export default function WcTeamFlagWithMetaNative({ teamId, children }: Props) {
  const pot = getWcDrawPot(teamId);
  const potLabel = pot != null ? formatWcDrawPotLabel(pot) : null;
  const potColor = pot != null ? resolveWcDrawPotColor(pot) : null;

  return (
    <View style={styles.stack}>
      {potLabel && potColor ? (
        <Text
          style={[
            styles.potText,
            {
              color: potColor.nativeColor,
              textShadowColor: potColor.nativeTextShadowColor,
            },
          ]}
        >
          {potLabel}
        </Text>
      ) : null}
      {children}
    </View>
  );
}

const styles = {
  stack: {
    alignItems: "center",
  } satisfies ViewStyle,
  potText: {
    marginBottom: 2,
    fontSize: 11,
    fontWeight: "900",
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontVariant: ["tabular-nums"],
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  } satisfies TextStyle,
};
