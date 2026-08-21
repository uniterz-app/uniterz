/**
 * Web `ProfileCyberPage` / 一覧系モバイルページ相当。
 * 中央サイバー題名 · 右はてな（subtitle あり時）。
 * 戻るは右端 BACK タブ（`CyberSubpageShellNative` 既定）。
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
  /** ページ面の塗り（既定はメッシュと同系の近黒） */
  backgroundColor?: string;
  /**
   * MainTab の UNITERZ ブランド棚の下で使うとき true（既定）。
   * 互換のため残す（余白はブランド棚側で確保済み）。
   */
  underBrandShelf?: boolean;
  /** 互換: 常にサイバー題名を使うため無視 */
  cyberTitle?: boolean;
  /** false でヘッダー左の従来戻るを使う（通常は不要） */
  edgeBack?: boolean;
  children: ReactNode;
};

export default function MobilePageShell({
  title,
  onClose,
  onBack,
  subtitle,
  eyebrow = "PROFILE",
  appBackground = false,
  backgroundColor,
  edgeBack = true,
  children,
}: Props) {
  const { width } = useWindowDimensions();
  const backHandler = onBack ?? onClose;

  return (
    <View
      style={[
        styles.root,
        appBackground && styles.rootAppBackground,
        backgroundColor ? { backgroundColor } : null,
        { width },
      ]}
    >
      <CyberSubpageShellNative
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        onBack={backHandler}
        edgeBack={edgeBack}
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
    backgroundColor: "#070708",
  },
  rootAppBackground: {
    backgroundColor: "transparent",
  },
  body: {
    flex: 1,
  },
});
