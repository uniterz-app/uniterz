/**
 * Web `ProfileCyberPage` / 一覧系モバイルページ相当。
 * 左戻る · 中央サイバー題名 · 右はてな（subtitle あり時）。
 */
import { ReactNode } from "react";
import { StyleSheet, View, useWindowDimensions } from "react-native";
import CyberSubpageShellNative from "../../../ui/CyberSubpageShellNative";

type Props = {
  title: string;
  onClose: () => void;
  /** 詳細などで左上に戻るだけのとき */
  onBack?: () => void;
  /** 右上 ? の説明 */
  subtitle?: string;
  eyebrow?: string;
  /** Web ルート `AppPageBackground` を背面に見せる */
  appBackground?: boolean;
  /**
   * MainTab の UNITERZ ブランド棚の下で使うとき true（既定）。
   * 互換のため残す（余白はブランド棚側で確保済み）。
   */
  underBrandShelf?: boolean;
  /** 互換: 常にサイバー題名を使うため無視 */
  cyberTitle?: boolean;
  children: ReactNode;
};

export default function MobilePageShell({
  title,
  onClose,
  onBack,
  subtitle,
  eyebrow = "PROFILE",
  appBackground = false,
  children,
}: Props) {
  const { width } = useWindowDimensions();
  const backHandler = onBack ?? onClose;

  return (
    <View
      style={[
        styles.root,
        appBackground && styles.rootAppBackground,
        { width },
      ]}
    >
      <CyberSubpageShellNative
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        onBack={backHandler}
        scroll={false}
        contentStyle={styles.body}
      >
        {children}
      </CyberSubpageShellNative>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0A1118",
  },
  rootAppBackground: {
    backgroundColor: "transparent",
  },
  body: {
    flex: 1,
  },
});
