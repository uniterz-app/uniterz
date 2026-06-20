/**
 * Web `SideMenuDrawer` + `SettingsMenu`（モバイル相当）に準拠したサイドメニュー。
 */
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { ADMIN_UID } from "../../../../../lib/constants";
import type { ProfileMobileOverlayKind } from "./mobileScreens/profileMobileOverlayTypes";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import CyberSideMenuPanelNative from "../../ui/CyberSideMenuPanelNative";
import CyberSideMenuSectionTitleNative from "../../ui/CyberSideMenuSectionTitleNative";
import SideMenuItemButtonNative, {
  SideMenuUnreadBadgeNative,
} from "../../ui/SideMenuItemButtonNative";
import LogoutConfirmModalNative from "../../ui/LogoutConfirmModalNative";
import { SIDE_MENU_LABEL_FONT } from "../../ui/cyberSideMenuNative";

type Lang = "ja" | "en";

type Props = {
  visible: boolean;
  onClose: () => void;
  language: Lang;
  /** Web アプリのオリジン（末尾スラッシュなし） */
  apiBase: string | null;
  unreadAnnouncements: number;
  onOpenProfileSettings: () => void;
  /** ログイン中 UID（管理メニュー表示判定） */
  uid: string | null | undefined;
  /** Firestore users.plan と同期した表示用 */
  plan: "free" | "pro";
  /** in-app 画面を開く */
  onOpenInApp: (page:
    | "badges"
    | "announcements"
    | "plan"
    | "subscribe"
    | "guidelines"
    | "help"
    | "terms"
    | "contact"
    | "privacy"
    | "password"
    | "featureRequest"
    | "electronicNotice") => void;
};

const PANEL_W = Math.min(300, Math.max(260, Math.round(Dimensions.get("window").width * 0.46)));

function openUrl(url: string) {
  void Linking.openURL(url).catch(() => {});
}

function menuLabelStyle(isEn: boolean) {
  return isEn
    ? { ...SIDE_MENU_LABEL_FONT, textTransform: "uppercase" as const }
    : SIDE_MENU_LABEL_FONT;
}

export default function ProfileSideMenuModal({
  visible,
  onClose,
  language,
  apiBase,
  unreadAnnouncements,
  onOpenProfileSettings,
  uid,
  plan,
  onOpenInApp,
}: Props) {
  const isJa = language === "ja";
  const isEn = language === "en";
  const labelStyle = menuLabelStyle(isEn);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const slide = useRef(new Animated.Value(-PANEL_W - 24)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  const isAdmin = uid != null && uid === ADMIN_UID;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(slide, {
          toValue: -16,
          friction: 9,
          tension: 68,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(slide, {
          toValue: -PANEL_W - 24,
          duration: 240,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, slide, backdropOpacity]);

  const labels = isJa
    ? {
        main: "メイン",
        subscription: "サブスクリプション",
        support: "サポート",
        admin: "管理",
        profile: "プロフィール編集",
        badges: "バッジパレット",
        announcements: "お知らせ",
        plan: "プランの確認",
        help: "ヘルプ",
        guidelines: "ガイドライン",
        terms: "利用規約",
        contact: "お問い合わせ",
        privacy: "プライバシーポリシー",
        password: "パスワード変更",
        featureRequest: "機能リクエスト",
        electronicNotice: "電子公告",
        logout: "ログアウト",
        needBase: "Web の URL（EXPO_PUBLIC_UNITERZ_API_BASE_URL）が未設定です。",
        adminDash: "管理ダッシュボード",
        grantBadges: "バッジ付与",
        annManage: "お知らせ管理",
        annNew: "お知らせ作成",
        gameImport: "試合インポート",
        planApproval: "プラン承認",
      }
    : {
        main: "MAIN",
        subscription: "SUBSCRIPTION",
        support: "SUPPORT",
        admin: "ADMIN",
        profile: "Edit Profile",
        badges: "Badge Palette",
        announcements: "Announcements",
        plan: "Plan Status",
        help: "Help",
        guidelines: "Community Guidelines",
        terms: "Terms of Service",
        contact: "Contact",
        privacy: "Privacy Policy",
        password: "Change Password",
        featureRequest: "Feature Request",
        electronicNotice: "Electronic Notice",
        logout: "Log out",
        needBase: "Set EXPO_PUBLIC_UNITERZ_API_BASE_URL to open web pages.",
        adminDash: "Admin Dashboard",
        grantBadges: "Grant Badges",
        annManage: "Manage Announcements",
        annNew: "Create Announcement",
        gameImport: "Game Import",
        planApproval: "Plan Approval",
      };

  function web(path: string) {
    if (!apiBase) {
      Alert.alert("", labels.needBase);
      return;
    }
    openUrl(`${apiBase}${path}`);
  }

  function openUserPage(
    page:
      | "badges"
      | "announcements"
      | "plan"
      | "subscribe"
      | "guidelines"
      | "help"
      | "terms"
      | "contact"
      | "privacy"
      | "password"
      | "featureRequest"
      | "electronicNotice"
  ) {
    onClose();
    onOpenInApp(page);
  }

  function confirmLogout() {
    setLogoutOpen(false);
    onClose();
    void signOut(auth);
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="none"
        transparent
        statusBarTranslucent
        onRequestClose={onClose}
      >
        <View style={styles.root} pointerEvents="box-none">
          <Animated.View style={[styles.backdropWrap, { opacity: backdropOpacity }]}>
            {(Platform.OS === "ios" || Platform.OS === "android") && (
              <BlurView
                intensity={Platform.OS === "ios" ? 12 : 8}
                tint="dark"
                {...nativeBlurViewExtraProps()}
                style={StyleSheet.absoluteFillObject}
              />
            )}
            <View style={styles.backdropDim} pointerEvents="none" />
            <Pressable style={StyleSheet.absoluteFillObject} onPress={onClose} accessibilityRole="button" />
          </Animated.View>

          <Animated.View
            style={[
              styles.panelOuter,
              {
                width: PANEL_W,
                transform: [{ translateX: slide }],
              },
            ]}
            pointerEvents="box-none"
          >
            <Pressable style={styles.panelPressable} onPress={(e) => e.stopPropagation()}>
              <CyberSideMenuPanelNative style={styles.panel}>
                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={styles.scrollContent}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  <CyberSideMenuSectionTitleNative first>
                    {labels.main}
                  </CyberSideMenuSectionTitleNative>
                  <View style={styles.itemGroup}>
                    <SideMenuItemButtonNative
                      icon="account-edit-outline"
                      labelStyle={labelStyle}
                      onPress={() => {
                        onClose();
                        onOpenProfileSettings();
                      }}
                    >
                      {labels.profile}
                    </SideMenuItemButtonNative>
                    <SideMenuItemButtonNative
                      icon="trophy-outline"
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("badges")}
                    >
                      {labels.badges}
                    </SideMenuItemButtonNative>
                    <SideMenuItemButtonNative
                      icon="bullhorn-outline"
                      labelStyle={labelStyle}
                      trailing={<SideMenuUnreadBadgeNative count={unreadAnnouncements} />}
                      onPress={() => openUserPage("announcements")}
                    >
                      {labels.announcements}
                    </SideMenuItemButtonNative>
                  </View>

                  <CyberSideMenuSectionTitleNative>{labels.subscription}</CyberSideMenuSectionTitleNative>
                  <View style={styles.itemGroup}>
                    <SideMenuItemButtonNative
                      icon="package-variant"
                      labelStyle={labelStyle}
                      onPress={() => openUserPage(plan === "pro" ? "plan" : "subscribe")}
                    >
                      {labels.plan}
                    </SideMenuItemButtonNative>
                  </View>

                  <CyberSideMenuSectionTitleNative>{labels.support}</CyberSideMenuSectionTitleNative>
                  <View style={styles.itemGroup}>
                    <SideMenuItemButtonNative
                      icon="help-circle-outline"
                      dense
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("help")}
                    >
                      {labels.help}
                    </SideMenuItemButtonNative>
                    <SideMenuItemButtonNative
                      icon="account-group-outline"
                      dense
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("guidelines")}
                    >
                      {labels.guidelines}
                    </SideMenuItemButtonNative>
                    <SideMenuItemButtonNative
                      icon="file-document-outline"
                      dense
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("terms")}
                    >
                      {labels.terms}
                    </SideMenuItemButtonNative>
                    <SideMenuItemButtonNative
                      icon="shield-lock-outline"
                      dense
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("privacy")}
                    >
                      {labels.privacy}
                    </SideMenuItemButtonNative>
                    <SideMenuItemButtonNative
                      icon="key-outline"
                      dense
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("password")}
                    >
                      {labels.password}
                    </SideMenuItemButtonNative>
                    <SideMenuItemButtonNative
                      icon="lightbulb-on-outline"
                      dense
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("featureRequest")}
                    >
                      {labels.featureRequest}
                    </SideMenuItemButtonNative>
                    <SideMenuItemButtonNative
                      icon="email-outline"
                      dense
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("contact")}
                    >
                      {labels.contact}
                    </SideMenuItemButtonNative>
                    <SideMenuItemButtonNative
                      icon="newspaper-variant-multiple-outline"
                      dense
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("electronicNotice")}
                    >
                      {labels.electronicNotice}
                    </SideMenuItemButtonNative>
                  </View>

                  {isAdmin ? (
                    <>
                      <CyberSideMenuSectionTitleNative>{labels.admin}</CyberSideMenuSectionTitleNative>
                      <View style={styles.itemGroup}>
                        <SideMenuItemButtonNative
                          icon="view-dashboard-outline"
                          labelStyle={labelStyle}
                          onPress={() => web("/admin")}
                        >
                          {labels.adminDash}
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="ribbon"
                          labelStyle={labelStyle}
                          onPress={() => web("/admin/badges")}
                        >
                          {labels.grantBadges}
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="newspaper-variant-outline"
                          labelStyle={labelStyle}
                          onPress={() => web("/admin/announcements")}
                        >
                          {labels.annManage}
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="plus-box-outline"
                          labelStyle={labelStyle}
                          onPress={() => web("/admin/announcements/new")}
                        >
                          {labels.annNew}
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="database-import-outline"
                          labelStyle={labelStyle}
                          onPress={() => web("/admin/games-import")}
                        >
                          {labels.gameImport}
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="clipboard-check-multiple-outline"
                          labelStyle={labelStyle}
                          onPress={() => web("/admin/plans")}
                        >
                          {labels.planApproval}
                        </SideMenuItemButtonNative>
                      </View>
                    </>
                  ) : null}

                  <View style={styles.logoutDivider} />
                  <SideMenuItemButtonNative
                    icon="logout-variant"
                    tone="danger"
                    labelStyle={labelStyle}
                    onPress={() => setLogoutOpen(true)}
                  >
                    {labels.logout}
                  </SideMenuItemButtonNative>
                </ScrollView>
              </CyberSideMenuPanelNative>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>

      <LogoutConfirmModalNative
        open={logoutOpen}
        onClose={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
        language={language}
      />
    </>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: "row",
  },
  backdropWrap: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  panelOuter: {
    marginTop: Platform.select({ ios: 16, android: 16, default: 16 }),
    marginBottom: Platform.select({ ios: 16, android: 16, default: 16 }),
    maxHeight: "92%",
    alignSelf: "flex-start",
    paddingRight: 12,
  },
  panelPressable: {
    flex: 1,
    overflow: "hidden",
  },
  panel: {
    maxHeight: Dimensions.get("window").height * 0.92,
  },
  scroll: {
    maxHeight: Dimensions.get("window").height * 0.92,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  itemGroup: {
    gap: 8,
  },
  logoutDivider: {
    marginTop: 16,
    marginBottom: 8,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
});
