/**
 * サイドメニューから開くフルスクリーン in-app ページ群。
 */
import { useMemo } from "react";
import { Alert, Linking, Modal, Platform, StyleSheet, Text, View } from "react-native";
import type { ProfileMobileOverlayKind } from "./profileMobileOverlayTypes";
import MobileBadgesScreen from "./MobileBadgesScreen";
import MobileAnnouncementsScreen from "./MobileAnnouncementsScreen";
import MobilePlanStatusScreen from "./MobilePlanStatusScreen";
import MobileProSubscribeScreen from "./MobileProSubscribeScreen";
import MobileCommunityGuidelinesScreen from "./MobileCommunityGuidelinesScreen";
import MobileLegalWebViewScreen from "./MobileLegalWebViewScreen";

type Props = {
  kind: ProfileMobileOverlayKind;
  onClose: () => void;
  /** プラン画面から「アップグレード」など同一モーダル内の遷移 */
  onNavigate: (next: ProfileMobileOverlayKind) => void;
  language: "ja" | "en";
  uid: string | undefined;
  authReady: boolean;
  plan: "free" | "pro";
  apiBase: string | null;
  readIds: Set<string>;
};

export default function ProfileMobileStackModal({
  kind,
  onClose,
  onNavigate,
  language,
  uid,
  authReady,
  plan,
  apiBase,
  readIds,
}: Props) {
  const visible = kind != null;

  const openWebPath = useMemo(
    () => (path: string) => {
      if (!apiBase) {
        Alert.alert("", language === "ja" ? "Web URL が未設定です。" : "Web URL is not configured.");
        return;
      }
      void Linking.openURL(`${apiBase.replace(/\/$/, "")}${path}`).catch(() => {});
    },
    [apiBase, language]
  );

  const webviewPath = kind && typeof kind === "object" && "webview" in kind ? kind.webview : null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle={Platform.OS === "ios" ? "fullScreen" : undefined}
      onRequestClose={onClose}
    >
      <View style={styles.fill}>
        {kind === "badges" ? (
          <MobileBadgesScreen language={language} uid={uid} onClose={onClose} />
        ) : kind === "announcements" ? (
          <MobileAnnouncementsScreen
            language={language}
            uid={uid}
            authReady={authReady}
            apiBase={apiBase}
            readIds={readIds}
            onClose={onClose}
          />
        ) : kind === "plan" ? (
          <MobilePlanStatusScreen
            language={language}
            uid={uid}
            onClose={onClose}
            onUpgrade={() => onNavigate("subscribe")}
            apiBase={apiBase}
            onNavigate={() => {}}
          />
        ) : kind === "subscribe" ? (
          <MobileProSubscribeScreen language={language} onClose={onClose} />
        ) : kind === "guidelines" ? (
          <MobileCommunityGuidelinesScreen language={language} onClose={onClose} />
        ) : webviewPath && apiBase ? (
          <MobileLegalWebViewScreen
            apiBase={apiBase}
            path={webviewPath}
            title={webviewTitle(webviewPath, language)}
            onClose={onClose}
          />
        ) : webviewPath && !apiBase ? (
          <View style={styles.missing}>
            <Text style={styles.missingText}>
              {language === "ja" ? "Web URL が未設定です。" : "Web URL is not configured."}
            </Text>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function webviewTitle(path: string, language: "ja" | "en"): string {
  if (path.includes("help")) return language === "ja" ? "ヘルプ" : "Help";
  if (path.includes("terms")) return language === "ja" ? "利用規約" : "Terms";
  return language === "ja" ? "お問い合わせ" : "Contact";
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0A1118" },
  missing: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  missingText: { color: "rgba(248,250,252,0.7)", fontSize: 15, textAlign: "center" },
});
