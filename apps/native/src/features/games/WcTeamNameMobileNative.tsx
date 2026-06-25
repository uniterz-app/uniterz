/** Web mobile `MatchCard` WC 国名 — 長い名前のみ 2 行 */
import {
  Text,
  View,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { splitWcCountryNameForMobileList } from "../../../../../lib/team-name-split";

type Props = {
  name: string;
  style: StyleProp<TextStyle>;
  /** リザルトカード向け: 2 行を縮小フィット（省略記号なし） */
  fit?: boolean;
  containerStyle?: StyleProp<ViewStyle>;
};

export default function WcTeamNameMobileNative({
  name,
  style,
  fit = false,
  containerStyle,
}: Props) {
  const split = splitWcCountryNameForMobileList(name);

  if (!split.singleLine) {
    const lineProps = fit
      ? {
          numberOfLines: 1 as const,
          adjustsFontSizeToFit: true,
          minimumFontScale: 0.62,
        }
      : {
          numberOfLines: 1 as const,
          ellipsizeMode: "tail" as const,
        };

    return (
      <View style={containerStyle}>
        <Text style={style} {...lineProps}>
          {split.line1}
        </Text>
        <Text style={style} {...lineProps}>
          {split.line2}
        </Text>
      </View>
    );
  }

  return (
    <Text
      style={style}
      numberOfLines={1}
      {...(fit
        ? { adjustsFontSizeToFit: true, minimumFontScale: 0.72 }
        : { ellipsizeMode: "tail" as const })}
    >
      {split.text}
    </Text>
  );
}
