/**
 * Web `SideMenuDrawer` + `SettingsMenu`（モバイル相当）に準拠したサイドメニュー。
 */
import { useEffect, useId, useRef, useState } from "react";
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
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Defs, Pattern, Rect, Path as SvgPath } from "react-native-svg";
import { signOut } from "firebase/auth";
import { auth } from "../../lib/firebase";
import { ADMIN_UID } from "../../../../../lib/constants";
import {
  PROFILE_SHELL_GRID_NATIVE,
  profileShellGridPathD,
} from "./profileShellGridNative";
import type { ProfileMobileOverlayKind } from "./mobileScreens/profileMobileOverlayTypes";

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
  /** ユーザー向け `/mobile/*` はネイティブ画面で開く（Web と同 UI 相当） */
  onOpenInApp: (page: ProfileMobileOverlayKind) => void;
};

const PANEL_W = Math.min(300, Math.round(Dimensions.get("window").width * 0.86));

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
  onOpenInApp,
}: Props) {
  const isJa = language === "ja";
  const [logoutOpen, setLogoutOpen] = useState(false);
  const slide = useRef(new Animated.Value(-PANEL_W - 24)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const gridPatternId = useId().replace(/[^a-zA-Z0-9_]/g, "_");

  const isAdmin = uid != null && uid === ADMIN_UID;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 220,
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
        logout: "Log out",
        needBase: "Set EXPO_PUBLIC_UNITERZ_API_BASE_URL to open web pages.",
        adminDash: "Admin Dashboard",
        grantBadges: "Grant Badges",
        annManage: "Manage Announcements",
        annNew: "Create Announcement",
        gameImport: "Game Import",
        planApproval: "Plan Approval",
      };

  /** 管理画面などブラウザで開く */
  function web(path: string) {
    if (!apiBase) {
      Alert.alert("", labels.needBase);
      return;
    }
    openUrl(`${apiBase}${path}`);
  }

  function openUserPage(page: ProfileMobileOverlayKind) {
    onClose();
    onOpenInApp(page);
  }

  function confirmLogout() {
    setLogoutOpen(false);
    onClose();
    void signOut(auth);
  }

  return (
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
              intensity={Platform.OS === "ios" ? 18 : 14}
              tint="dark"
              {...(Platform.OS === "android"
                ? { blurMethod: "dimezisBlurViewSdk31Plus" as const, blurReductionFactor: 4 }
                : {})}
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
            <View style={styles.panelClip}>
              <BlurView
                intensity={Platform.OS === "ios" ? 28 : 22}
                tint="dark"
                {...(Platform.OS === "android"
                  ? { blurMethod: "dimezisBlurViewSdk31Plus" as const, blurReductionFactor: 4 }
                  : {})}
                style={StyleSheet.absoluteFillObject}
              />
              <LinearGradient
                colors={[
                  "rgba(7,19,38,0.82)",
                  "rgba(5,10,22,0.88)",
                  "rgba(3,7,14,0.92)",
                ]}
                locations={[0, 0.45, 1]}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.panelFilm} pointerEvents="none" />
              <View style={styles.edgeAccentLeft} pointerEvents="none" />
              <View style={styles.edgeAccentRight} pointerEvents="none" />
              <Svg
                width="100%"
                height="100%"
                style={[StyleSheet.absoluteFillObject, { opacity: PROFILE_SHELL_GRID_NATIVE.layerOpacity * 0.35 }]}
                pointerEvents="none"
              >
                <Defs>
                  <Pattern
                    id={`side_menu_grid_${gridPatternId}`}
                    width={PROFILE_SHELL_GRID_NATIVE.cellPx}
                    height={PROFILE_SHELL_GRID_NATIVE.cellPx}
                    patternUnits="userSpaceOnUse"
                  >
                    <SvgPath
                      d={profileShellGridPathD(PROFILE_SHELL_GRID_NATIVE.cellPx)}
                      fill="none"
                      stroke={PROFILE_SHELL_GRID_NATIVE.stroke}
                      strokeWidth={PROFILE_SHELL_GRID_NATIVE.strokeWidth}
                    />
                  </Pattern>
                </Defs>
                <Rect width="100%" height="100%" fill={`url(#side_menu_grid_${gridPatternId})`} />
              </Svg>
              <View style={styles.innerRing} pointerEvents="none" />

              <ScrollView
                style={styles.scroll}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                <Text style={styles.menuTitle}>{isJa ? "メニュー" : "Menu"}</Text>

                <Text style={styles.groupTitle}>{labels.main}</Text>
                <SideMenuRow
                  icon="account-edit-outline"
                  label={labels.profile}
                  onPress={() => {
                    onClose();
                    onOpenProfileSettings();
                  }}
                />
                <SideMenuRow
                  icon="trophy-outline"
                  label={labels.badges}
                  onPress={() => openUserPage("badges")}
                />
                <SideMenuRow
                  icon="bullhorn-outline"
                  label={labels.announcements}
                  trailingBadge={unreadAnnouncements}
                  onPress={() => openUserPage("announcements")}
                />

                <Text style={styles.groupTitle}>{labels.subscription}</Text>
                <SideMenuRow
                  icon="package-variant"
                  label={labels.plan}
                  onPress={() =>
                    openUserPage(plan === "pro" ? "plan" : "subscribe")
                  }
                />

                <Text style={styles.groupTitle}>{labels.support}</Text>
                <SideMenuRow
                  icon="help-circle-outline"
                  label={labels.help}
                  dense
                  onPress={() => openUserPage({ webview: "/mobile/help" })}
                />
                <SideMenuRow
                  icon="account-group-outline"
                  label={labels.guidelines}
                  dense
                  onPress={() => openUserPage("guidelines")}
                />
                <SideMenuRow
                  icon="file-document-outline"
                  label={labels.terms}
                  dense
                  onPress={() => openUserPage({ webview: "/mobile/terms" })}
                />
                <SideMenuRow
                  icon="email-outline"
                  label={labels.contact}
                  dense
                  onPress={() => openUserPage({ webview: "/mobile/contact" })}
                />

                {isAdmin ? (
                  <>
                    <Text style={styles.groupTitle}>{labels.admin}</Text>
                    <SideMenuRow
                      icon="view-dashboard-outline"
                      label={labels.adminDash}
                      onPress={() => web("/admin")}
                    />
                    <SideMenuRow
                      icon="ribbon"
                      label={labels.grantBadges}
                      onPress={() => web("/admin/badges")}
                    />
                    <SideMenuRow
                      icon="newspaper-variant-outline"
                      label={labels.annManage}
                      onPress={() => web("/admin/announcements")}
                    />
                    <SideMenuRow
                      icon="plus-box-outline"
                      label={labels.annNew}
                      onPress={() => web("/admin/announcements/new")}
                    />
                    <SideMenuRow
                      icon="database-import-outline"
                      label={labels.gameImport}
                      onPress={() => web("/admin/games-import")}
                    />
                    <SideMenuRow
                      icon="clipboard-check-multiple-outline"
                      label={labels.planApproval}
                      onPress={() => web("/admin/plans")}
                    />
                  </>
                ) : null}

                <View style={styles.logoutDivider} />
                <SideMenuRow
                  icon="logout-variant"
                  label={labels.logout}
                  danger
                  onPress={() => setLogoutOpen(true)}
                />
              </ScrollView>
            </View>
          </Pressable>
        </Animated.View>
        {logoutOpen ? (
          <View style={styles.logoutOverlay} pointerEvents="box-none">
            <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setLogoutOpen(false)} />
            <Pressable style={styles.logoutCard} onPress={(e) => e.stopPropagation()}>
              <LinearGradient
                colors={[
                  "rgba(255,255,255,0.1)",
                  "rgba(6,78,94,0.2)",
                  "rgba(9,9,11,0.55)",
                ]}
                locations={[0, 0.42, 1]}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.logoutRing} pointerEvents="none" />
              <MaterialCommunityIcons
                name="logout"
                size={22}
                color="rgba(248,113,113,0.95)"
                style={{ alignSelf: "center", marginBottom: 12 }}
              />
              <Text style={styles.logoutTitle}>
                {isJa ? "ログアウトしますか？" : "Log out?"}
              </Text>
              <View style={styles.logoutBtnRow}>
                <Pressable
                  style={({ pressed }) => [styles.logoutBtnCancel, pressed && { opacity: 0.85 }]}
                  onPress={() => setLogoutOpen(false)}
                >
                  <Text style={styles.logoutBtnCancelText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={({ pressed }) => [styles.logoutBtnConfirm, pressed && { opacity: 0.92 }]}
                  onPress={confirmLogout}
                >
                  <Text style={styles.logoutBtnConfirmText}>Log out</Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        ) : null}
      </View>
    </Modal>
  );
}

function SideMenuRow({
  icon,
  label,
  onPress,
  dense,
  danger,
  trailingBadge,
}: {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label: string;
  onPress: () => void;
  dense?: boolean;
  danger?: boolean;
  trailingBadge?: number;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.rowOuter,
        dense && styles.rowDense,
        danger && styles.rowDangerOuter,
        pressed && !danger && styles.rowPressed,
        pressed && danger && styles.rowDangerPressed,
      ]}
    >
      <View style={[styles.iconSlot, dense && styles.iconSlotDense]}>
        <MaterialCommunityIcons
          name={icon}
          size={dense ? 16 : 18}
          color={danger ? "rgba(254,202,202,0.95)" : "rgba(165,243,252,0.92)"}
        />
      </View>
      <Text style={[styles.rowLabel, dense && styles.rowLabelDense, danger && styles.rowLabelDanger]} numberOfLines={2}>
        {label}
      </Text>
      {trailingBadge != null && trailingBadge > 0 ? (
        <View style={styles.trailBadge}>
          <Text style={styles.trailBadgeText}>{trailingBadge > 99 ? "99+" : String(trailingBadge)}</Text>
        </View>
      ) : null}
    </Pressable>
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
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  panelOuter: {
    marginTop: Platform.select({ ios: 52, android: 48, default: 48 }),
    marginBottom: Platform.select({ ios: 40, android: 36, default: 40 }),
    maxHeight: "92%",
    alignSelf: "flex-start",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 8, height: 18 },
        shadowOpacity: 0.45,
        shadowRadius: 28,
      },
      android: { elevation: 18 },
      default: {},
    }),
  },
  panelPressable: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  panelClip: {
    flex: 1,
    maxHeight: Dimensions.get("window").height * 0.88,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    borderRadius: 14,
    overflow: "hidden",
  },
  panelFilm: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.12)",
  },
  edgeAccentLeft: {
    position: "absolute",
    left: 4,
    top: 28,
    width: 2,
    height: 40,
    borderRadius: 1,
    backgroundColor: "rgba(125,211,252,0.32)",
  },
  edgeAccentRight: {
    position: "absolute",
    right: 4,
    top: 28,
    width: 2,
    height: 40,
    borderRadius: 1,
    backgroundColor: "rgba(125,211,252,0.32)",
  },
  innerRing: {
    ...StyleSheet.absoluteFillObject,
    margin: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    pointerEvents: "none",
  },
  scroll: {
    maxHeight: Dimensions.get("window").height * 0.88,
  },
  scrollContent: {
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 22,
  },
  menuTitle: {
    color: "rgba(248,250,252,0.96)",
    fontSize: 17,
    fontWeight: "800",
    marginBottom: 14,
    fontFamily: Platform.select({
      ios: "Oxanium_800ExtraBold",
      android: "Oxanium_800ExtraBold",
      default: "sans-serif",
    }),
  },
  groupTitle: {
    marginTop: 14,
    marginBottom: 8,
    paddingLeft: 4,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "rgba(148,163,184,0.55)",
    textTransform: "uppercase",
  },
  rowOuter: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 48,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(7,13,20,0.88)",
  },
  rowDense: {
    minHeight: 42,
    paddingVertical: 6,
  },
  rowDangerOuter: {
    borderColor: "rgba(251,113,133,0.22)",
    backgroundColor: "rgba(30,10,14,0.55)",
  },
  rowPressed: {
    borderColor: "rgba(34,211,238,0.38)",
    backgroundColor: "rgba(6,20,28,0.75)",
  },
  rowDangerPressed: {
    borderColor: "rgba(251,113,133,0.45)",
    backgroundColor: "rgba(50,12,18,0.72)",
  },
  iconSlot: {
    width: 40,
    height: 36,
    borderRadius: 10,
    marginRight: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  iconSlotDense: {
    width: 36,
    height: 32,
  },
  rowLabel: {
    flex: 1,
    color: "rgba(241,245,249,0.94)",
    fontSize: 14,
    fontWeight: "700",
  },
  rowLabelDense: {
    fontSize: 12,
  },
  rowLabelDanger: {
    color: "rgba(254,202,202,0.96)",
  },
  trailBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.92)",
  },
  trailBadgeText: {
    color: "#fff",
    fontSize: 10,
    fontWeight: "800",
  },
  logoutDivider: {
    marginTop: 18,
    marginBottom: 10,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  logoutOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  logoutCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    overflow: "hidden",
    paddingVertical: 22,
    paddingHorizontal: 20,
  },
  logoutRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(34,211,238,0.2)",
    margin: 1,
    pointerEvents: "none",
  },
  logoutTitle: {
    textAlign: "center",
    color: "rgba(248,250,252,0.92)",
    fontSize: 15,
    fontWeight: "600",
    lineHeight: 22,
    marginBottom: 18,
  },
  logoutBtnRow: {
    flexDirection: "row",
    gap: 12,
  },
  logoutBtnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
  },
  logoutBtnCancelText: {
    color: "rgba(224,242,254,0.95)",
    fontSize: 15,
    fontWeight: "700",
  },
  logoutBtnConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "rgba(185,28,28,0.85)",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(248,113,113,0.45)",
  },
  logoutBtnConfirmText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "800",
  },
});
