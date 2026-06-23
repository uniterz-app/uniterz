import { StyleSheet, Text, View } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import CountryFlagNative from "../games/CountryFlagNative";
import PredictOverlayChamferedFrameNative from "../games/PredictOverlayChamferedFrameNative";
import { PREDICT_OVERLAY_GOAL_BOX_CUT } from "../games/matchListCyberClipPath";
import {
  MOBILE_RESULT_STAT_LABEL_W,
  MOBILE_RESULT_STAT_ROW_GAP,
  MOBILE_RESULT_STAT_VALUE_W,
} from "./resultMobileUiNative";
import type { WcGoalScorerResultInfo } from "./useWcGoalScorerResultNative";

type Props = {
  label: string;
  info: WcGoalScorerResultInfo;
  /** 予想オーバーレイ：選手名を角切り HUD 箱で表示 */
  cyberValue?: boolean;
};

/** Web `WcGoalScorerResultRow` compact 相当 */
export default function WcGoalScorerResultRowNative({
  label,
  info,
  cyberValue = false,
}: Props) {
  const valueInner = (
    <>
      <View style={styles.flagWrap}>
        <CountryFlagNative teamId={info.teamId} variant="inline" />
      </View>
      <Text style={styles.playerName} numberOfLines={1}>
        {info.playerName}
      </Text>
    </>
  );

  return (
    <View style={styles.row}>
      <Text style={styles.label} numberOfLines={1}>
        {label}
      </Text>
      {cyberValue ? (
        <PredictOverlayChamferedFrameNative
          cut={PREDICT_OVERLAY_GOAL_BOX_CUT}
          gradientColors={["rgba(0,245,255,0.04)", "rgba(0,245,255,0.04)"]}
          borderColor="rgba(0,245,255,0.18)"
          style={styles.cyberValueFrame}
          contentStyle={styles.cyberValueInner}
          cornerMaskColor="rgba(10,14,22,1)"
        >
          <View style={styles.valueSlot}>{valueInner}</View>
        </PredictOverlayChamferedFrameNative>
      ) : (
        <View style={styles.valueSlot}>{valueInner}</View>
      )}
      <View style={styles.iconSlot}>
        {info.hit === true ? (
          <MaterialCommunityIcons
            name="check"
            size={18}
            color="#34d399"
            accessibilityLabel="correct"
          />
        ) : info.hit === false ? (
          <MaterialCommunityIcons
            name="close"
            size={18}
            color="#fb7185"
            accessibilityLabel="incorrect"
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: MOBILE_RESULT_STAT_ROW_GAP,
    paddingVertical: 2,
  },
  label: {
    width: MOBILE_RESULT_STAT_LABEL_W,
    flexShrink: 0,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
  },
  valueSlot: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cyberValueFrame: {
    flex: 1,
    minWidth: 0,
  },
  cyberValueInner: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  flagWrap: {
    marginRight: 2,
  },
  playerName: {
    flex: 1,
    minWidth: 0,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.92)",
  },
  iconSlot: {
    width: MOBILE_RESULT_STAT_VALUE_W,
    flexShrink: 0,
    alignItems: "flex-end",
    justifyContent: "center",
  },
});
