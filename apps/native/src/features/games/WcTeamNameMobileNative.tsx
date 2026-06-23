/** Web mobile `MatchCard` WC 国名 — 長い名前のみ 2 行 */
import { Text, type StyleProp, type TextStyle } from "react-native";
import { splitWcCountryNameForMobileList } from "../../../../../lib/team-name-split";

type Props = {
  name: string;
  style: StyleProp<TextStyle>;
};

export default function WcTeamNameMobileNative({ name, style }: Props) {
  const split = splitWcCountryNameForMobileList(name);
  if (!split.singleLine) {
    return (
      <>
        <Text style={style} numberOfLines={1} ellipsizeMode="tail">
          {split.line1}
        </Text>
        <Text style={style} numberOfLines={1} ellipsizeMode="tail">
          {split.line2}
        </Text>
      </>
    );
  }
  return (
    <Text style={style} numberOfLines={1} ellipsizeMode="tail">
      {split.text}
    </Text>
  );
}
