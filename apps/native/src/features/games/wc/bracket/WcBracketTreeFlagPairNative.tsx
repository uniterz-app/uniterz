/** Web `WcBracketTreeFlagPair` 相当 */
import { StyleSheet, View } from "react-native";
import {
  WC_TREE_FLAG_GAP,
  WC_TREE_FLAG_H,
  WC_TREE_FLAG_W,
  WC_TREE_SLOT_H,
  WC_TREE_SLOT_W,
} from "@/lib/wc/wc-bracket-tree-layout";
import CountryFlagNative from "../../CountryFlagNative";

type Slot = { teamId: string | null; label: string };

type Props = {
  home: Slot;
  away: Slot;
  pickedWinner: string | null;
};

function FlagDot({
  teamId,
  selected = false,
  dimmed = false,
}: {
  teamId: string;
  selected?: boolean;
  dimmed?: boolean;
}) {
  return (
    <View
      style={[
        styles.flagWrap,
        dimmed && styles.flagDimmed,
      ]}
    >
      <CountryFlagNative teamId={teamId} variant="bracketTree" />
      {selected ? <View style={styles.flagRingInset} pointerEvents="none" /> : null}
    </View>
  );
}

export function WcBracketTreeWinnerFlagNative({ teamId }: { teamId: string }) {
  return (
    <View style={styles.flagWrap}>
      <CountryFlagNative teamId={teamId} variant="bracketTree" />
      <View style={styles.flagRingInset} pointerEvents="none" />
    </View>
  );
}

export default function WcBracketTreeFlagPairNative({
  home,
  away,
  pickedWinner,
}: Props) {
  const empty = !home.teamId && !away.teamId;

  if (empty) {
    return <View style={styles.emptySlot} />;
  }

  return (
    <View style={styles.slot}>
      {home.teamId ? (
        <View style={styles.homeFlag}>
          <FlagDot
            teamId={home.teamId}
            selected={pickedWinner === home.teamId}
            dimmed={Boolean(pickedWinner && pickedWinner !== home.teamId)}
          />
        </View>
      ) : (
        <View style={styles.flagSpacer} />
      )}
      {away.teamId ? (
        <FlagDot
          teamId={away.teamId}
          selected={pickedWinner === away.teamId}
          dimmed={Boolean(pickedWinner && pickedWinner !== away.teamId)}
        />
      ) : (
        <View style={styles.flagSpacer} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {
    width: WC_TREE_SLOT_W,
    height: WC_TREE_SLOT_H,
    alignItems: "center",
  },
  homeFlag: {
    marginBottom: WC_TREE_FLAG_GAP,
  },
  emptySlot: {
    width: WC_TREE_SLOT_W,
    height: WC_TREE_SLOT_H,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(34,211,238,0.15)",
    borderRadius: 2,
  },
  flagWrap: {
    width: WC_TREE_FLAG_W,
    height: WC_TREE_FLAG_H,
    overflow: "hidden",
    borderRadius: 2,
  },
  flagRingInset: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 2,
    borderWidth: 2,
    borderColor: "rgba(34,211,238,0.9)",
  },
  flagDimmed: {
    opacity: 0.35,
  },
  flagSpacer: {
    width: WC_TREE_FLAG_W,
    height: WC_TREE_FLAG_H,
  },
});
