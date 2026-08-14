/** Web `LineFrameCard` 相当 — 左寄せラベル + 白パス */
import { type ReactNode } from "react";
import { type StyleProp, type ViewStyle } from "react-native";
import MatchListLineFrameNative from "../games/MatchListLineFrameNative";
import { PROFILE_OVERVIEW_LINE_FRAME_PAINT } from "@/lib/games/matchListLineFrame";

type Props = {
  title: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export default function LineFrameCardNative({ title, children, style }: Props) {
  return (
    <MatchListLineFrameNative
      topLabel={title}
      topLabelAlign="start"
      paint={PROFILE_OVERVIEW_LINE_FRAME_PAINT}
      style={style}
    >
      {children}
    </MatchListLineFrameNative>
  );
}
