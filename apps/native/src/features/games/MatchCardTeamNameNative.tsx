/**
 * 試合カードのチーム名。
 * Android は Text の skewX が効かないため、View に傾きを載せる。
 */
import { Platform, Text, View, type StyleProp, type TextStyle } from "react-native";

const SKEW = [{ skewX: "-6deg" as const }];

type Props = {
  children: string;
  textStyle: StyleProp<TextStyle>;
  numberOfLines?: number;
};

export default function MatchCardTeamNameNative({
  children,
  textStyle,
  numberOfLines = 1,
}: Props) {
  const label = String(children);
  return (
    <View
      collapsable={false}
      renderToHardwareTextureAndroid
      style={{
        alignSelf: "center",
        maxWidth: "100%",
        overflow: "visible",
        transform: SKEW,
        ...(Platform.OS === "android" ? { opacity: 0.999 } : null),
      }}
    >
      <Text style={textStyle} numberOfLines={numberOfLines}>
        {label}
      </Text>
    </View>
  );
}
