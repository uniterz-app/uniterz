import { ReactNode } from "react";
import { useNavigation } from "@react-navigation/native";
import type { StyleProp, ViewStyle } from "react-native";
import CyberSubpageShellNative from "../../ui/CyberSubpageShellNative";

type Props = {
  title: string;
  description?: string;
  updatedAt?: string;
  lastUpdatedLabel?: string;
  eyebrow?: string;
  contentStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
};

/** Web `LegalPageLayout`（mobile variant）相当 — 左戻る / 中央題名 / 右? */
export default function LegalPageLayoutNative({
  title,
  description,
  updatedAt,
  lastUpdatedLabel = "最終更新: ",
  eyebrow = "PROFILE",
  contentStyle,
  children,
}: Props) {
  const navigation = useNavigation();
  const helpText = [description, updatedAt ? `${lastUpdatedLabel}${updatedAt}` : null]
    .filter(Boolean)
    .join("\n");

  return (
    <CyberSubpageShellNative
      eyebrow={eyebrow}
      title={title}
      subtitle={helpText || undefined}
      onBack={() => navigation.goBack()}
      contentStyle={contentStyle}
    >
      {children}
    </CyberSubpageShellNative>
  );
}
