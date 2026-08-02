import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";

/** 各 futuristic 背景の共通 props */
export type ProfileBgProps = {
  width?: number;
  height?: number;
  style?: StyleProp<ViewStyle>;
  children?: ReactNode;
};
