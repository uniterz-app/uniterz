/**
 * Web `SideMenuDrawer` + `SettingsMenu`（モバイル相当）に準拠したサイドメニュー。
 */
import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { cyberAlert } from "../../components/cyberAlert";
import {
  Animated, Dimensions, Easing, Image, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BlurView } from "expo-blur";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import type { AdminInboxCounts } from "../../../../../lib/admin/subscribeAdminInboxUnread";
import { EMPTY_ADMIN_INBOX } from "../../../../../lib/admin/subscribeAdminInboxUnread";
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
import { profileSideMenuLabels } from "./profileSideMenuCopy";
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";

type Lang = string;

type Props = {
  visible: boolean;
  onClose: () => void;
  language: Lang;
  /** true のあいだは入場アニメなしで開いた状態を出す（BACK 復帰用） */
  instantOpen?: boolean;
  onInstantOpenConsumed?: () => void;
  /**
   * プロフィール編集など。同一 Modal 内に重ねる（二重 Modal 回避・メニューはそのまま残す）。
   */
  settingsOverlay?: ReactNode;
  onSettingsRequestClose?: () => void;
  /** Web アプリのオリジン（末尾スラッシュなし） */
  apiBase: string | null;
  unreadAnnouncements: number;
  adminInbox?: AdminInboxCounts;
  onOpenProfileSettings: () => void;
  /** ログイン中 UID（ログアウト可否など） */
  uid: string | null | undefined;
  /** 管理メニュー表示（Custom Claim / session API） */
  isAdmin?: boolean;
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
    | "userSearch"
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
    | "commercialLaw"
    | "password"
    | "notifications"
    | "featureRequest"
    | "electronicNotice"
    | "notificationDev"
    | "restartTutorial"
    | "seasonPreview"
    | "weeklyReportPreview"
    | "monthlyReportPreview"
    | "squadBattlePreview"
    | "liveGameStatsPreview"
    | "leagueStatsPreview"
    | "proLeagueTeaserPreview"
    | "proInsightGatePreview"
    | "proInsightNarrativePreview"
    | "matchupTeamStatsPreview"
    | "adminFeatureInbox"
    | "adminContactInbox"
    | "adminRedemptions"
    | "adminGroupBattles") => void;
};

const PANEL_W = Math.min(288, Math.max(248, Math.round(Dimensions.get("window").width * 0.44)));

export default function ProfileSideMenuModal({
  visible,
  onClose,
  language,
  instantOpen = false,
  onInstantOpenConsumed,
  settingsOverlay = null,
  onSettingsRequestClose,
  unreadAnnouncements,
  adminInbox = EMPTY_ADMIN_INBOX,
  onOpenProfileSettings,
  uid,
  isAdmin = false,
  plan,
  displayName = "",
  handle = "",
  avatarUrl = "",
  unitBalance = 0,
  onOpenInApp,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const labelStyle = sideMenuLabelStyle(lang);
  const labels = profileSideMenuLabels(lang);
  const identityName =
    displayName.trim() || labels.userFallback;

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

  useEffect(() => {
    if (!visible) {
      setLogoutOpen(false);
    }
  }, [visible]);

  /** BACK 復帰の即開きは ref で一度だけ。instantOpen→false で spring 再入場しない */
  const pendingInstantOpenRef = useRef(false);
  const onInstantOpenConsumedRef = useRef(onInstantOpenConsumed);
  onInstantOpenConsumedRef.current = onInstantOpenConsumed;
  /** visible セッション中に effect が再走っても入場を繰り返さない */
  const openSessionRef = useRef(false);

  useLayoutEffect(() => {
    if (instantOpen) {
      pendingInstantOpenRef.current = true;
    }
  }, [instantOpen]);

  useLayoutEffect(() => {
    if (visible) {
      const wantInstant =
        pendingInstantOpenRef.current || instantOpen;
      if (openSessionRef.current) {
        // コールバック参照変化などでの再実行 — 既に開いているので触らない
        if (wantInstant) {
          pendingInstantOpenRef.current = false;
          onInstantOpenConsumedRef.current?.();
        }
        return;
      }
      openSessionRef.current = true;
      if (wantInstant) {
        pendingInstantOpenRef.current = false;
        backdropOpacity.setValue(1);
        slide.setValue(0);
        onInstantOpenConsumedRef.current?.();
        return;
      }
      slide.setValue(PANEL_W + 24);
      backdropOpacity.setValue(0);
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
      return;
    }
    openSessionRef.current = false;
    // 設定への退避（instant 予約あり）は退場アニメなし。開位置のまま隠す
    if (pendingInstantOpenRef.current || instantOpen) {
      backdropOpacity.setValue(1);
      slide.setValue(0);
      return;
    }
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
  }, [visible, instantOpen, slide, backdropOpacity]);



  function openUserPage(
    page:
      | "badges"
      | "invite"
      | "userSearch"
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
      | "commercialLaw"
      | "password"
      | "notifications"
      | "featureRequest"
      | "electronicNotice"
      | "notificationDev"
      | "restartTutorial"
      | "seasonPreview"
      | "weeklyReportPreview"
      | "monthlyReportPreview"
      | "squadBattlePreview"
      | "liveGameStatsPreview"
      | "leagueStatsPreview"
      | "proLeagueTeaserPreview"
      | "proInsightGatePreview"
      | "proInsightNarrativePreview"
      | "matchupTeamStatsPreview"
      | "adminFeatureInbox"
      | "adminContactInbox"
      | "adminRedemptions"
      | "adminGroupBattles"
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
      cyberAlert("", labels.logoutFailed);
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
          if (settingsOverlay != null) {
            onSettingsRequestClose?.();
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
            <Pressable
              style={StyleSheet.absoluteFillObject}
              onPress={onClose}
              accessibilityRole="button"
              disabled={settingsOverlay != null}
            />
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
                      accessibilityLabel={L(lang, {
                        ja: `保有 Unit ${unitBalance.toLocaleString("ja-JP")} · 履歴を開く`,
                        en: `${unitBalance.toLocaleString("en-US")} Units · Open history`,
                        ko: `보유 Unit ${unitBalance.toLocaleString("en-US")} · 기록 열기`,
                        zh: `持有 Unit ${unitBalance.toLocaleString("en-US")} · 打开记录`,
                        es: `${unitBalance.toLocaleString("en-US")} Units · Abrir historial`,
                        pt: `${unitBalance.toLocaleString("en-US")} Units · Abrir histórico`,
                        fr: `${unitBalance.toLocaleString("en-US")} Units · Ouvrir l’historique`,
                      })}
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
                      icon="magnify"
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("userSearch")}
                    >
                      {labels.userSearch}
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
                      trailing={<SideMenuUnreadBadgeNative count={unreadAnnouncements} tone="announce" />}
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
                      {labels.tutorial}
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
                      icon="scale-balance"
                      dense
                      labelStyle={labelStyle}
                      onPress={() => openUserPage("commercialLaw")}
                    >
                      {labels.commercialLaw}
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
                          icon="lightbulb-on-outline"
                          labelStyle={labelStyle}
                          trailing={
                            <SideMenuUnreadBadgeNative
                              count={adminInbox.feature}
                              tone="admin"
                            />
                          }
                          onPress={() => openUserPage("adminFeatureInbox")}
                        >
                          {labels.adminFeatureRequests}
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="email-outline"
                          labelStyle={labelStyle}
                          trailing={
                            <SideMenuUnreadBadgeNative
                              count={adminInbox.inbox}
                              tone="admin"
                            />
                          }
                          onPress={() => openUserPage("adminContactInbox")}
                        >
                          {labels.adminContacts}
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="shopping-outline"
                          labelStyle={labelStyle}
                          trailing={
                            <SideMenuUnreadBadgeNative
                              count={adminInbox.redemptions}
                              tone="admin"
                            />
                          }
                          onPress={() => openUserPage("adminRedemptions")}
                        >
                          {labels.adminRedemptions}
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="account-group-outline"
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("adminGroupBattles")}
                        >
                          {labels.adminGroupBattles}
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
                          icon="file-chart-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("weeklyReportPreview")}
                        >
                          週間レポート
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="radar"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("monthlyReportPreview")}
                        >
                          月間レポート
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="account-group-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("squadBattlePreview")}
                        >
                          SQUAD BATTLE
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="scoreboard-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("liveGameStatsPreview")}
                        >
                          ライブ試合スタッツ
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="table-large"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("leagueStatsPreview")}
                        >
                          リーグスタッツ（左レール）
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="sword-cross"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("proLeagueTeaserPreview")}
                        >
                          PRO LEAGUE ゲート
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="lightbulb-on-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() => openUserPage("proInsightGatePreview")}
                        >
                          PRO INSIGHT ゲート
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="text-box-outline"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("proInsightNarrativePreview")
                          }
                        >
                          PRO INSIGHT 新UI
                        </SideMenuItemButtonNative>
                        <SideMenuItemButtonNative
                          icon="chart-timeline-variant"
                          dense
                          labelStyle={labelStyle}
                          onPress={() =>
                            openUserPage("matchupTeamStatsPreview")
                          }
                        >
                          マッチアップ STATS + LAST 5
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
            language={lang}
          />

          {settingsOverlay != null ? (
            <View style={styles.settingsOverlayHost} pointerEvents="box-none">
              {settingsOverlay}
            </View>
          ) : null}
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
  settingsOverlayHost: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
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
