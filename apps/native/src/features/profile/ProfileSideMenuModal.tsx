/**
 * Web `SideMenuDrawer` + `SettingsMenu`（モバイル相当）に準拠したサイドメニュー。
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  Animated, Dimensions, Easing, Image, Linking, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { ADMIN_UID } from "../../../../../lib/constants";
import type { ProfileMobileOverlayKind } from "./mobileScreens/profileMobileOverlayTypes";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import { setTutorialRestartCover } from "../../../../../lib/tutorial/tutorialRestartCover";
import { setTutorialWelcomeChromeHidden } from "../../../../../lib/tutorial/tutorialWelcomeChrome";
import CyberSideMenuPanelNative from "../../ui/CyberSideMenuPanelNative";
import CyberSideMenuSectionTitleNative from "../../ui/CyberSideMenuSectionTitleNative";
import SideMenuItemButtonNative, {
  SideMenuUnreadBadgeNative,
} from "../../ui/SideMenuItemButtonNative";
import LogoutConfirmModalNative from "../../ui/LogoutConfirmModalNative";
import { sideMenuLabelStyle } from "../../ui/cyberSideMenuNative";
import ProCyberBadgeNative from "./kinetik/ProCyberBadgeNative";

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
  /** 表示名（最下部アイデンティティ） */
  displayName?: string;
  /** ハンドル（最下部アイデンティティ） */
  handle?: string;
  /** アバター URL（最下部アイデンティティ） */
  avatarUrl?: string;
  /** ゲーム内通貨残高（サイドメニュー先頭ウォレット） */
  unitBalance?: number;
  /** in-app 画面を開く */
  onOpenInApp: (page:
    | "badges"
    | "invite"
    | "unitLedger"
    | "redeem"
    | "announcements"
    | "plan"
    | "subscribe"
    | "proSkin"
    | "deleteAccount"
    | "guidelines"
    | "help"
    | "terms"
    | "contact"
    | "privacy"
    | "password"
    | "notifications"
    | "featureRequest"
    | "electronicNotice"
    | "notificationDev"
    | "restartTutorial"
    | "seasonPreview"
    | "futuristicBgPreview"
    | "titleSkinPreview"
    | "waveProSkinPreview"
    | "rankingListProSkinPreview"
    | "proSkinUnlockPreview"
    | "referralStampCelebratePreview"
    | "unitEarnCelebratePreview"
    | "careerFlipButtonPreview"
    | "careerPlacementPreview"
    | "unitEarnModalDesignPreview"
    | "unitEarnOverlayAnimPreview"
    | "unitEarnOverlayFontPreview"
    | "uniterzLogoTypePreview"
    | "uniterzLogo3dPreview"
    | "uniterzProBadgePreview"
    | "proBadgeComparePreview"
    | "resultCardDesignPreview"
    | "resultBadgeDesignPreview"
    | "resultStampDesignPreview"
    | "resultStreakTagDesignPreview"
    | "navBarDesignPreview"
    | "buttonDesignPreview"
    | "hexLightDesignPreview"
    | "splashLogoPreview"
    | "liveGameStatsPreview"
    | "profileKinetikMetricsPreview") => void;
};

const PANEL_W = Math.min(288, Math.max(248, Math.round(Dimensions.get("window").width * 0.44)));

function openUrl(url: string) {
  void Linking.openURL(url).catch(() => {});
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
  displayName = "",
  handle = "",
  avatarUrl = "",
  unitBalance = 0,
  onOpenInApp,
}: Props) {
  const isJa = language === "ja";
  const labelStyle = sideMenuLabelStyle(language);
  const identityName =
    displayName.trim() || (isJa ? "ユーザー" : "User");
  const identityInitial = identityName.charAt(0).toUpperCase() || "?";
  const planLabel = plan === "pro" ? "PRO" : "FREE";
  const identitySub = handle.trim()
    ? `@${handle.trim()}`
    : "OPERATOR";
  const [logoutOpen, setLogoutOpen] = useState(false);
  const slide = useRef(new Animated.Value(PANEL_W + 24)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();
  /** 左端密着 — 内側だけ safe area */
  const contentPad = useMemo(
    () => ({
      paddingTop: insets.top + 12,
      paddingBottom: Math.max(insets.bottom, 12),
    }),
    [insets.top, insets.bottom]
  );

  const isAdmin = uid != null && uid === ADMIN_UID;

  useEffect(() => {
    if (!visible) {
      setLogoutOpen(false);
    }
  }, [visible]);

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
          toValue: 0,
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
          toValue: PANEL_W + 24,
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
        invite: "招待",
        unitHistory: "Unit 履歴",
        unitRedeem: "商品交換",
        announcements: "お知らせ",
        plan: "プランの確認",
        proSkin: "Pro Skin",
        help: "ヘルプ",
        guidelines: "ガイドライン",
        terms: "利用規約",
        contact: "お問い合わせ",
        privacy: "プライバシーポリシー",
        password: "パスワード変更",
        notifications: "通知設定",
        featureRequest: "機能リクエスト",
        electronicNotice: "電子公告",
        deleteAccount: "アカウント削除",
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
        invite: "Invite",
        unitHistory: "Unit History",
        unitRedeem: "Redeem Units",
        announcements: "Announcements",
        plan: "Plan Status",
        proSkin: "Pro Skin",
        help: "Help",
        guidelines: "Community Guidelines",
        terms: "Terms of Service",
        contact: "Contact",
        privacy: "Privacy Policy",
        password: "Change Password",
        notifications: "Notifications",
        featureRequest: "Feature Request",
        electronicNotice: "Electronic Notice",
        deleteAccount: "Delete Account",
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
      cyberAlert("", labels.needBase);
      return;
    }
    openUrl(`${apiBase}${path}`);
  }

  function openUserPage(
    page:
      | "badges"
      | "invite"
      | "unitLedger"
      | "redeem"
      | "announcements"
      | "plan"
      | "subscribe"
      | "proSkin"
      | "deleteAccount"
      | "guidelines"
      | "help"
      | "terms"
      | "contact"
      | "privacy"
      | "password"
      | "notifications"
      | "featureRequest"
      | "electronicNotice"
      | "notificationDev"
      | "restartTutorial"
      | "seasonPreview"
      | "futuristicBgPreview"
      | "titleSkinPreview"
      | "waveProSkinPreview"
      | "rankingListProSkinPreview"
      | "proSkinUnlockPreview"
      | "referralStampCelebratePreview"
      | "unitEarnCelebratePreview"
      | "careerFlipButtonPreview"
    | "careerPlacementPreview"
      | "unitEarnModalDesignPreview"
      | "unitEarnOverlayAnimPreview"
      | "unitEarnOverlayFontPreview"
      | "uniterzLogoTypePreview"
      | "uniterzLogo3dPreview"
    | "uniterzProBadgePreview"
    | "proBadgeComparePreview"
      | "resultCardDesignPreview"
      | "resultBadgeDesignPreview"
      | "resultStampDesignPreview"
      | "resultStreakTagDesignPreview"
      | "navBarDesignPreview"
      | "buttonDesignPreview"
      | "hexLightDesignPreview"
      | "splashLogoPreview"
      | "liveGameStatsPreview"
      | "profileKinetikMetricsPreview"
  ) {
    if (page === "restartTutorial") {
      setTutorialRestartCover(true);
      setTutorialWelcomeChromeHidden(true);
    }
    onClose();
    onOpenInApp(page);
  }

  async function confirmLogout() {
    setLogoutOpen(false);
    onClose();
    try {
      await signOut(auth);
    } catch {
      cyberAlert("", isJa ? "ログアウトに失敗しました。" : "Failed to log out.");
    }
  }

  return (
    <>
      <Modal
        visible={visible}
        animationType="none"
        transparent
        statusBarTranslucent
        onRequestClose={() => {
          if (logoutOpen) {
            setLogoutOpen(false);
            return;
          }
          onClose();
        }}
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
              <CyberSideMenuPanelNative
                fillHeight
                edgeAttach
                edgeSide="right"
                style={styles.panel}
              >
                <ScrollView
                  style={styles.scroll}
                  contentContainerStyle={[styles.scrollContent, contentPad]}
                  showsVerticalScrollIndicator={false}
                  bounces={false}
                >
                  {uid ? (
                    <Pressable
                      style={styles.unitWallet}
                      onPress={() => openUserPage("unitLedger")}
                      accessibilityRole="button"
                      accessibilityLabel={
                        isJa
                          ? `保有 Unit ${unitBalance.toLocaleString("ja-JP")} · 履歴を開く`
                          : `${unitBalance.toLocaleString("en-US")} Units · Open history`
                      }
                    >
                      <View style={styles.unitWalletMark}>
                        <MaterialCommunityIcons
                          name="hexagon-outline"
                          size={30}
                          color="#f6c344"
                          style={styles.unitWalletHex}
                        />
                        <Text style={styles.unitWalletU}>U</Text>
                      </View>
                      <View style={styles.unitWalletMeta}>
                        <Text style={styles.unitWalletLabel}>UNITS</Text>
                        <Text style={styles.unitWalletValue}>
                          {unitBalance.toLocaleString("en-US")}
                        </Text>
                      </View>
                    </Pressable>
                  ) : null}

                  <CyberSideMenuSectionTitleNative first>
                    {labels.main}
                  </CyberSideMenuSectionTitleNative>
                  <View style={styles.itemGroup}>
                    <SideMenuItemButtonNative
                      icon="account-edit-outline"
                      labelStyle={labelStyle}
                      onPress={() => {
                        // メニューは親側で設定表示後に閉じる（プロフィールが一瞬見えるのを防ぐ）
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
                      icon="account-multiple-plus-outline"
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("invite")}
                    >
                      {labels.invite}
                    </SideMenuItemButtonNative>
                    <SideMenuItemButtonNative
                      icon="history"
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("unitLedger")}
                    >
                      {labels.unitHistory}
                    </SideMenuItemButtonNative>
                    <SideMenuItemButtonNative
                      icon="shopping-outline"
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("redeem")}
                    >
                      {labels.unitRedeem}
                    </SideMenuItemButtonNative>
                    <SideMenuItemButtonNative
                      icon="bullhorn-outline"
                      labelStyle={labelStyle}
                      trailing={<SideMenuUnreadBadgeNative count={unreadAnnouncements} />}
                      onPress={() => openUserPage("announcements")}
                    >
                      {labels.announcements}
                    </SideMenuItemButtonNative>
                    <SideMenuItemButtonNative
                      icon="bell-outline"
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("notifications")}
                    >
                      {labels.notifications}
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
                    <SideMenuItemButtonNative
                      icon="star-four-points"
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("proSkin")}
                    >
                      {labels.proSkin}
                    </SideMenuItemButtonNative>
                  </View>

                  <CyberSideMenuSectionTitleNative>{labels.support}</CyberSideMenuSectionTitleNative>
                  <View style={styles.itemGroup}>
                    <SideMenuItemButtonNative
                      icon="school-outline"
                      dense
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("restartTutorial")}
                    >
                      {language === "ja" ? "チュートリアル" : "Tutorial"}
                    </SideMenuItemButtonNative>
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

                  {__DEV__ ? (
                    <>
                      <CyberSideMenuSectionTitleNative>DEV</CyberSideMenuSectionTitleNative>
                      <View style={styles.itemGroup}>
                        <SideMenuItemButtonNative
                          icon="bell-ring-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("notificationDev")}
                        >
                          通知テスト
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="trophy-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("seasonPreview")}
                        >
                          シーズン予想プレビュー
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="palette-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("futuristicBgPreview")}
                        >
                          Futuristic BG プレビュー
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="crown-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("titleSkinPreview")}
                        >
                          称号スキン プレビュー
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="palette-swatch-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("waveProSkinPreview")}
                        >
                          Wave 13 スキンプレビュー
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="format-list-bulleted"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("rankingListProSkinPreview")}
                        >
                          ランキング行 Pro Skin
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="lock-open-variant-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("proSkinUnlockPreview")}
                        >
                          Skin解放モーダル
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="stamper"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("referralStampCelebratePreview")
                          }
                        >
                          招待スタンプ演出
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="circle-multiple-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("unitEarnCelebratePreview")
                          }
                        >
                          Unit 獲得演出
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="rotate-3d-variant"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("careerFlipButtonPreview")
                          }
                        >
                          CAREER フリップ配置案
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="view-column-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("careerPlacementPreview")
                          }
                        >
                          CAREER 載せ場所案
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="view-dashboard-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("unitEarnModalDesignPreview")
                          }
                        >
                          Unit 獲得モーダル案
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="movie-open-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("unitEarnOverlayAnimPreview")
                          }
                        >
                          Unit 獲得アニメ案
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="format-letter-case"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("unitEarnOverlayFontPreview")
                          }
                        >
                          Unit 獲得フォント案
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="format-font"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("uniterzLogoTypePreview")
                          }
                        >
                          UNITERZ Logo
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="shield-star-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("uniterzProBadgePreview")
                          }
                        >
                          UNITERZ PRO バッジ
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="compare"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("proBadgeComparePreview")
                          }
                        >
                          Pro バッジ比較
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="card-bulleted-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("resultCardDesignPreview")
                          }
                        >
                          リザルトカード案
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="bookmark-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("resultBadgeDesignPreview")
                          }
                        >
                          リザルトバッジ案
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="certificate-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("resultStampDesignPreview")
                          }
                        >
                          リザルトスタンプ案
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="fire"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("resultStreakTagDesignPreview")
                          }
                        >
                          連勝タグ案
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="view-grid-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("profileKinetikMetricsPreview")
                          }
                        >
                          プロフィール 2x2 案
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="tab"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("navBarDesignPreview")}
                        >
                          Nav Bar 案
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="cube-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("uniterzLogo3dPreview")}
                        >
                          Logo 3D
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="gesture-tap-button"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("buttonDesignPreview")}
                        >
                          ボタン系統カタログ
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="hexagon-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("hexLightDesignPreview")}
                        >
                          六角ライト案
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="flash-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("splashLogoPreview")}
                        >
                          スプラッシュ Logo
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="scoreboard-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("liveGameStatsPreview")}
                        >
                          ライブ試合スタッツ
                        </SideMenuItemButtonNative>
                      </View>
                    </>
                  ) : null}

                  <View style={styles.logoutDivider} />
                  <SideMenuItemButtonNative
                    icon="trash-can-outline"
                    tone="danger"
                    dense
                    labelStyle={labelStyle}
                    onPress={() => openUserPage("deleteAccount")}
                  >
                    {labels.deleteAccount}
                  </SideMenuItemButtonNative>
                  <View style={{ height: 8 }} />
                  <SideMenuItemButtonNative
                    icon="logout-variant"
                    tone="danger"
                    labelStyle={labelStyle}
                    onPress={() => setLogoutOpen(true)}
                  >
                    {labels.logout}
                  </SideMenuItemButtonNative>

                  {/* 一番下: HUD アイデンティティ（アイコン・名前・プラン） */}
                  {uid ? (
                    <Pressable
                      onPress={() => {
                        onOpenProfileSettings();
                      }}
                      style={({ pressed }) => [
                        styles.identity,
                        plan === "pro" && styles.identityPro,
                        pressed && styles.identityPressed,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${identityName} · ${planLabel}`}
                    >
                      <View
                        style={[
                          styles.identityAvatar,
                          plan === "pro" && styles.identityAvatarPro,
                        ]}
                      >
                        {avatarUrl.trim().length > 0 ? (
                          <Image
                            source={{ uri: avatarUrl.trim() }}
                            style={styles.identityImg}
                          />
                        ) : (
                          <Text style={styles.identityInitial} allowFontScaling={false}>
                            {identityInitial}
                          </Text>
                        )}
                      </View>

                      <View style={styles.identityMeta}>
                        <View style={styles.identityNameRow}>
                          <Text style={styles.identityName} numberOfLines={1}>
                            {identityName}
                          </Text>
                          {plan === "pro" ? (
                            <ProCyberBadgeNative compact />
                          ) : (
                            <View style={styles.identityBadge}>
                              <Text
                                style={styles.identityBadgeText}
                                allowFontScaling={false}
                              >
                                FREE
                              </Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.identitySubRow}>
                          <View style={styles.identityDot} />
                          <Text style={styles.identitySub} numberOfLines={1} allowFontScaling={false}>
                            {identitySub}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.identityCaret} allowFontScaling={false}>
                        ▸
                      </Text>
                    </Pressable>
                  ) : null}
                </ScrollView>
              </CyberSideMenuPanelNative>
            </Pressable>
          </Animated.View>

          <LogoutConfirmModalNative
            embedded
            open={logoutOpen}
            onClose={() => setLogoutOpen(false)}
            onConfirm={() => void confirmLogout()}
            language={language}
          />
        </View>
      </Modal>
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
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
  },
  panelPressable: {
    flex: 1,
    overflow: "hidden",
  },
  panel: {
    flex: 1,
    height: "100%",
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  unitWallet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(246,195,68,0.55)",
    backgroundColor: "rgba(28,20,6,0.9)",
    shadowColor: "#f6c344",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  unitWalletMark: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  unitWalletHex: {
    position: "absolute",
  },
  unitWalletU: {
    fontFamily: "Oxanium_800ExtraBold",
    fontSize: 13,
    fontWeight: "800",
    color: "#fff8e1",
  },
  unitWalletMeta: {
    flexShrink: 1,
    gap: 3,
  },
  unitWalletLabel: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 1.6,
    color: "rgba(246,195,68,0.85)",
    textTransform: "uppercase",
  },
  unitWalletValue: {
    fontFamily: "Oxanium_800ExtraBold",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.2,
    color: "#fff8e7",
    fontVariant: ["tabular-nums"],
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
  identity: {
    position: "relative",
    marginTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    paddingVertical: 11,
    paddingHorizontal: 12,
    paddingLeft: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.22)",
    backgroundColor: "#000000",
    shadowColor: "#ffffff",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
    elevation: 4,
  },
  identityPro: {
    borderColor: "rgba(255, 255, 255, 0.38)",
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  identityPressed: {
    borderColor: "rgba(255, 255, 255, 0.55)",
    opacity: 0.95,
  },
  identityAvatar: {
    width: 40,
    height: 40,
    borderRadius: 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.45)",
    backgroundColor: "#000000",
    shadowColor: "#ffffff",
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 0 },
  },
  identityAvatarPro: {
    borderColor: "rgba(255, 255, 255, 0.65)",
    shadowOpacity: 0.18,
    shadowRadius: 10,
  },
  identityImg: {
    width: "100%",
    height: "100%",
  },
  identityInitial: {
    fontSize: 15,
    fontWeight: "800",
    color: "rgba(255, 255, 255, 0.92)",
  },
  identityMeta: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  identityNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minWidth: 0,
  },
  identityName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: "800",
    color: "#fff",
  },
  identityBadge: {
    flexShrink: 0,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  identityBadgeText: {
    fontFamily: "Oxanium_700Bold",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.18 * 9,
    color: "rgba(255, 255, 255, 0.55)",
    textTransform: "uppercase",
  },
  identitySubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    minWidth: 0,
  },
  identityDot: {
    width: 5,
    height: 5,
    transform: [{ rotate: "45deg" }],
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.55)",
    backgroundColor: "rgba(255, 255, 255, 0.28)",
  },
  identitySub: {
    flexShrink: 1,
    fontFamily: "Oxanium_700Bold",
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.14 * 8,
    color: "rgba(255, 255, 255, 0.55)",
    textTransform: "uppercase",
  },
  identityCaret: {
    flexShrink: 0,
    fontSize: 12,
    color: "#ffffff",
    textShadowColor: "rgba(255, 255, 255, 0.35)",
    textShadowRadius: 6,
  },
});
