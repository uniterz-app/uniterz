import type { ReactNode } from "react";
import { Text, View, type TextStyle, type ViewStyle } from "react-native";
import { MATCH_CARD_SCORE_FONT } from "../games/matchCardTypography";
import { resolveWcTeamFlagMeta } from "../../../../../lib/wc/wcTeamFlagMeta";

type Props = {
  teamId: string | null | undefined;
  children: ReactNode;
  knockout?: boolean;
};

export default function WcTeamFlagWithMetaNative({
  teamId,
  children,
  knockout = false,
}: Props) {
  const meta = resolveWcTeamFlagMeta(teamId, { knockout });

  return (
    <View style={styles.stack}>
      <View style={styles.metaSlot}>
        {meta ? (
          <Text
            style={[
              styles.metaText,
              meta.kind === "pot"
                ? {
                    color: meta.potColor.nativeColor,
                    textShadowColor: meta.potColor.nativeTextShadowColor,
                  }
                : styles.qualText,
            ]}
          >
            {meta.label}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = {
  stack: {
    alignItems: "center",
  } satisfies ViewStyle,
  metaSlot: {
    minHeight: 13,
    marginBottom: 1,
    justifyContent: "flex-end",
    alignItems: "center",
  } satisfies ViewStyle,
  metaText: {
    fontSize: 11,
    fontWeight: "900",
    fontFamily: MATCH_CARD_SCORE_FONT,
    fontVariant: ["tabular-nums"],
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  } satisfies TextStyle,
  qualText: {
    color: "rgba(207,250,254,0.88)",
    textShadowColor: "rgba(34, 211, 238, 0.35)",
  } satisfies TextStyle,
};
