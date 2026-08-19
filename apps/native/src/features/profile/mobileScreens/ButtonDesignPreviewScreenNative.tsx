/**
 * __DEV__ Native で使っているボタン見た目の現行カタログ。
 * 統一前の棚卸し。本番コンポーネントは未接続。
 */
import { type ReactNode } from "react";
import { Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import MobilePageShell from "./MobilePageShell";
import { PlanSlantCtaNative } from "./PlanChamferPanelNative";
import SlantCtaNative from "../../../ui/SlantCtaNative";
import {
  ModalActionButtonNative,
  ModalActionRowNative,
} from "../../../ui/ModalActionButtonNative";
import PredictOverlayChamferedFrameNative from "../../games/PredictOverlayChamferedFrameNative";
import PredictOverlaySubmitButtonNative from "../../games/PredictOverlaySubmitButtonNative";
import MatchCardListCtaNative from "../../games/MatchCardListCtaNative";
import GamesHeaderFilterButtonNative from "../../games/GamesHeaderFilterButtonNative";
import {
  PREDICT_OVERLAY_SUBMIT_BTN_CUT,
} from "../../games/matchListCyberClipPath";
import { AUTH_LANDING } from "../../auth/authLandingPalette";
import { MATCH_CARD_METRIC_FONT } from "../../games/matchCardTypography";
import { useBottomTabBarInsets } from "../../../navigation/useBottomTabBarInsets";
import { spacing } from "../../../theme/tokens";
import CyberChamferButtonNative from "../../../ui/CyberChamferButtonNative";
import { CyberFilterChip } from "../../../ui/CyberFilterBarNative";
import FloatingCloseButtonNative from "../../../ui/FloatingCloseButtonNative";
import UnitEarnPlayButtonNative from "../UnitEarnPlayButtonNative";

const BTN_SKEW = "-10deg";
const BTN_UNSKEW = "10deg";
const OXANIUM = Platform.select({
  ios: "Oxanium_700Bold",
  android: "Oxanium_700Bold",
  default: "sans-serif",
});

type Props = {
  language: "ja" | "en";
  onClose: () => void;
};

function SampleSkew({
  label,
  variant,
}: {
  label: string;
  variant: "fill" | "ghost" | "outline";
}) {
  const fill =
    variant === "fill"
      ? AUTH_LANDING.accent
      : variant === "ghost"
        ? "rgba(8,17,22,0.48)"
        : "rgba(8,14,22,0.96)";
  const border =
    variant === "outline" ? "rgba(0,245,255,0.34)" : AUTH_LANDING.accent;
  const color = variant === "fill" ? AUTH_LANDING.onAccent : "#e8eaed";
  return (
    <View style={styles.skewWrap}>
      <View style={[styles.skewBorder, { backgroundColor: fill, borderColor: border }]}>
        <View style={styles.skewFill}>
          <View
            style={[
              styles.skewRail,
              { backgroundColor: variant === "fill" ? AUTH_LANDING.onAccent : AUTH_LANDING.accent },
            ]}
            pointerEvents="none"
          />
          <View style={styles.skewLabelWrap}>
            <Text style={[styles.skewLabel, { color }]}>{label}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

function SampleChamfer({
  label,
  tone,
}: {
  label: string;
  tone: "primary" | "ghost" | "danger";
}) {
  const gradient =
    tone === "primary"
      ? ["rgba(0,245,255,0.22)", "rgba(0,150,190,0.34)", "rgba(0,90,120,0.42)"]
      : tone === "danger"
        ? ["rgba(248,113,113,0.18)", "rgba(190,60,60,0.28)", "rgba(120,40,40,0.34)"]
        : ["rgba(15,23,42,0.92)", "rgba(10,16,28,0.94)", "rgba(8,12,20,0.96)"];
  const border =
    tone === "primary"
      ? "rgba(0,245,255,0.38)"
      : tone === "danger"
        ? "rgba(248,113,113,0.42)"
        : "rgba(100,116,139,0.35)";
  const color =
    tone === "danger" ? "rgba(254,202,202,0.96)" : "rgba(224,254,255,0.96)";
  return (
    <PredictOverlayChamferedFrameNative
      cut={PREDICT_OVERLAY_SUBMIT_BTN_CUT}
      gradientColors={gradient}
      gradientLocations={[0, 0.45, 1]}
      borderColor={border}
      shadowColor={tone === "primary" ? "#00f5ff" : "#000"}
      shadowOpacity={tone === "primary" ? 0.14 : 0.08}
      shadowRadius={tone === "primary" ? 16 : 6}
      style={{ width: "100%" }}
      contentStyle={styles.chamferContent}
    >
      <Text style={[styles.chamferLabel, { color }]}>{label}</Text>
    </PredictOverlayChamferedFrameNative>
  );
}

export default function ButtonDesignPreviewScreenNative({
  language,
  onClose,
}: Props) {
  const ja = language === "ja";
  const insets = useSafeAreaInsets();
  const { bottomContentReserveY } = useBottomTabBarInsets();

  return (
    <MobilePageShell
      title="BUTTONS"
      eyebrow="DEV PREVIEW"
      subtitle={
        ja
          ? "本番コンポーネント込み。課金・予想・共通アイコンも含む。タブ類は別プレビュー。"
          : "Includes production widgets: billing, predict, shared icons. Tabs have their own previews."
      }
      appBackground
      onClose={onClose}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: Math.max(28, bottomContentReserveY, insets.bottom + 16) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.lead}>
          {ja
            ? "共通化ルール: 画面 CTA は B3（斜め金）。モーダル操作は 06（丸角）。試合カードの PREDICT だけ現行のまま。"
            : "Rule: screen CTAs use B3 (gold slant). Modal actions use 06 (rounded). Match-card PREDICT stays as-is."}
        </Text>

        <GroupTitle ja={ja} jaText="共通ルール" enText="Shared rule" />
        <Section
          index="B3"
          titleJa="画面 CTA（共通）"
          titleEn="Screen CTA (shared)"
          whereJa="ログイン、登録、課金、解約ページなど"
          whereEn="Login, signup, billing, cancel page"
          ja={ja}
        >
          <SlantCtaNative label={ja ? "プランを変更" : "Change plan"} onPress={() => {}} />
          <SlantCtaNative label="LOG IN" variant="ghost" onPress={() => {}} />
          <SlantCtaNative label={ja ? "解約する" : "Cancel plan"} variant="danger" onPress={() => {}} />
        </Section>
        <Section
          index="06"
          titleJa="モーダル操作（共通）"
          titleEn="Modal actions (shared)"
          whereJa="ログアウト、同意ゲート、Alert、削除確認"
          whereEn="Logout, consent, alerts, delete confirm"
          ja={ja}
        >
          <ModalActionRowNative>
            <ModalActionButtonNative label={ja ? "キャンセル" : "Cancel"} tone="ghost" onPress={() => {}} />
            <ModalActionButtonNative label={ja ? "ログアウト" : "Log out"} tone="danger" onPress={() => {}} />
          </ModalActionRowNative>
          <ModalActionRowNative>
            <ModalActionButtonNative label="OK" tone="primary" onPress={() => {}} />
          </ModalActionRowNative>
        </Section>

        <GroupTitle ja={ja} jaText="課金" enText="Billing" />
        <Section
          index="B1"
          titleJa="Pro 購入グラデ CTA"
          titleEn="Pro purchase gradient CTA"
          whereJa="Pro 加入画面の購入ボタン"
          whereEn="Pro subscribe purchase"
          ja={ja}
        >
          <Pressable>
            <LinearGradient colors={["#22d3ee", "#2563eb"]} style={styles.proCta}>
              <Text style={styles.proCtaTxt}>{ja ? "Monthly を購入" : "Buy Monthly"}</Text>
            </LinearGradient>
          </Pressable>
          <Pressable style={styles.restoreBtn}>
            <Text style={styles.restoreTxt}>{ja ? "購入を復元" : "Restore Purchases"}</Text>
          </Pressable>
        </Section>
        <Section
          index="B2"
          titleJa="価格カード"
          titleEn="Price cards"
          whereJa="Weekly / Monthly / Season 選択"
          whereEn="Weekly / Monthly / Season picker"
          ja={ja}
        >
          <View style={[styles.priceCard, styles.priceCardOff]}>
            <Text style={styles.priceTitle}>WEEKLY</Text>
            <Text style={styles.priceAmt}>¥480</Text>
          </View>
          <View style={[styles.priceCard, styles.priceCardOn]}>
            <Text style={[styles.priceTitle, styles.priceTitleOn]}>MONTHLY</Text>
            <Text style={[styles.priceAmt, styles.priceAmtOn]}>¥1,500</Text>
          </View>
        </Section>
        <Section
          index="B3"
          titleJa="プラン斜め CTA（金 / 危険）"
          titleEn="Plan slant CTA (gold / danger)"
          whereJa="プラン変更・解約画面"
          whereEn="Plan change / cancel"
          ja={ja}
        >
          <PlanSlantCtaNative label={ja ? "プランを変更" : "Change plan"} onPress={() => {}} />
          <PlanSlantCtaNative
            label={ja ? "解約する" : "Cancel plan"}
            onPress={() => {}}
            variant="danger"
          />
        </Section>
        <Section
          index="B4"
          titleJa="Unit 獲得再生"
          titleEn="Unit earn play"
          whereJa="Unit 獲得演出の再生"
          whereEn="Unit earn replay"
          ja={ja}
        >
          <UnitEarnPlayButtonNative onPlay={() => {}} language={ja ? "ja" : "en"} />
        </Section>

        <GroupTitle ja={ja} jaText="予想 / 試合" enText="Predict / Games" />
        <Section
          index="G1"
          titleJa="予想送信"
          titleEn="Predict submit"
          whereJa="試合オーバーレイの SUBMIT"
          whereEn="Match overlay SUBMIT"
          ja={ja}
        >
          <PredictOverlaySubmitButtonNative label="SUBMIT" enabled onPress={() => {}} />
          <PredictOverlaySubmitButtonNative
            label="SUBMIT"
            disabledLabel="LOCKED"
            enabled={false}
            onPress={() => {}}
          />
        </Section>
        <Section
          index="G2"
          titleJa="試合カード CTA"
          titleEn="Match card CTA"
          whereJa="試合一覧の PREDICT / LIVE / FINAL"
          whereEn="Match list PREDICT / LIVE / FINAL"
          ja={ja}
        >
          <MatchCardListCtaNative label="PREDICT" variant="normal" />
          <MatchCardListCtaNative label="PREDICTED" variant="predicted" />
          <MatchCardListCtaNative label="LIVE" variant="live" />
          <MatchCardListCtaNative label="FINAL" variant="final" />
        </Section>
        <Section
          index="G3"
          titleJa="ヘッダー絞り込み"
          titleEn="Header filter"
          whereJa="Games ヘッダーの歯車"
          whereEn="Games header tune"
          ja={ja}
        >
          <View style={styles.row}>
            <GamesHeaderFilterButtonNative
              active={false}
              onPress={() => {}}
              accessibilityLabel="filter"
            />
            <GamesHeaderFilterButtonNative
              active
              onPress={() => {}}
              accessibilityLabel="filter on"
            />
          </View>
        </Section>
        <Section
          index="G4"
          titleJa="フィルターチップ"
          titleEn="Filter chips"
          whereJa="リザルト / Games の outcome など"
          whereEn="Results / Games outcome chips"
          ja={ja}
        >
          <View style={styles.rowWrap}>
            <CyberFilterChip label="ALL" active onPress={() => {}} />
            <CyberFilterChip label="HIT" onPress={() => {}} />
            <CyberFilterChip label="MISS" onPress={() => {}} />
          </View>
        </Section>

        <GroupTitle ja={ja} jaText="共通アイコン" enText="Shared icons" />
        <Section
          index="C1"
          titleJa="角切りアイコン"
          titleEn="Chamfer icon"
          whereJa="× / 編集 / 削除 / メニュー / 共有（共通部品）"
          whereEn="Close / edit / delete / menu / share"
          ja={ja}
        >
          <View style={styles.rowWrap}>
            <CyberChamferButtonNative variant="close" onPress={() => {}} />
            <CyberChamferButtonNative variant="edit" onPress={() => {}} />
            <CyberChamferButtonNative variant="delete" onPress={() => {}} />
            <CyberChamferButtonNative variant="menu" onPress={() => {}} />
            <CyberChamferButtonNative variant="share" onPress={() => {}} />
          </View>
        </Section>
        <Section
          index="C2"
          titleJa="フローティング閉じる"
          titleEn="Floating close"
          whereJa="一部フルスクリーンの丸い ×"
          whereEn="Some full-screen round close"
          ja={ja}
        >
          <View style={styles.floatSlot}>
            <FloatingCloseButtonNative onPress={() => {}} top={8} right={8} />
          </View>
        </Section>

        <GroupTitle ja={ja} jaText="Auth / モーダル / プロフィール" enText="Auth / modals / profile" />

        <Section
          index="01"
          titleJa="Landing スキュー塗り"
          titleEn="Landing skew fill"
          whereJa="GET STARTED"
          whereEn="GET STARTED"
          ja={ja}
        >
          <SlantCtaNative label="GET STARTED" variant="mono" onPress={() => {}} />
        </Section>

        <Section
          index="02"
          titleJa="Landing スキューゴースト"
          titleEn="Landing skew ghost"
          whereJa="LOG IN（Landing）"
          whereEn="LOG IN (Landing)"
          ja={ja}
        >
          <SlantCtaNative label="LOG IN" variant="monoGhost" onPress={() => {}} />
        </Section>

        <Section
          index="03"
          titleJa="Auth スキュー塗り"
          titleEn="Auth entry skew fill"
          whereJa="AuthEntry の LOG IN / SIGN UP"
          whereEn="AuthEntry LOG IN / SIGN UP"
          ja={ja}
        >
          <SampleSkew label="SIGN UP" variant="fill" />
        </Section>

        <Section
          index="04"
          titleJa="Auth スキュー枠"
          titleEn="Auth form skew outline"
          whereJa="Signup / ResetPassword / 未使用寄りの LoginScreen"
          whereEn="Signup / ResetPassword / unused LoginScreen"
          ja={ja}
        >
          <SampleSkew label="SIGN UP" variant="outline" />
        </Section>

        <Section
          index="05"
          titleJa="角切り HUD"
          titleEn="Chamfered HUD"
          whereJa="CyberAlert OK、同意して続ける、予想送信"
          whereEn="CyberAlert OK, legal continue, predict submit"
          ja={ja}
        >
          <View style={styles.stack}>
            <SampleChamfer label="OK" tone="primary" />
            <SampleChamfer label="同意して続ける" tone="primary" />
            <SampleChamfer label="キャンセル" tone="ghost" />
            <SampleChamfer label="削除" tone="danger" />
          </View>
        </Section>

        <Section
          index="06"
          titleJa="丸角モーダル"
          titleEn="Rounded modal"
          whereJa="ログアウト確認"
          whereEn="Logout confirm"
          ja={ja}
        >
          <View style={styles.row}>
            <Pressable style={styles.logoutCancel}>
              <Text style={styles.logoutCancelText}>{ja ? "キャンセル" : "Cancel"}</Text>
            </Pressable>
            <Pressable style={styles.logoutConfirm}>
              <Text style={styles.logoutConfirmText}>{ja ? "ログアウト" : "Log out"}</Text>
            </Pressable>
          </View>
        </Section>

        <Section
          index="07"
          titleJa="丸角シアン CTA"
          titleEn="Rounded cyan CTA"
          whereJa="Onboarding 保存"
          whereEn="Onboarding save"
          ja={ja}
        >
          <Pressable style={styles.onboardCta}>
            <Text style={styles.onboardCtaLabel}>CONTINUE</Text>
          </Pressable>
        </Section>

        <Section
          index="08"
          titleJa="ピルチップ"
          titleEn="Pill chip"
          whereJa="Onboarding 言語など"
          whereEn="Onboarding language chips"
          ja={ja}
        >
          <View style={styles.row}>
            <View style={styles.chip}>
              <Text style={styles.chipLabel}>JA</Text>
            </View>
            <View style={[styles.chip, styles.chipOn]}>
              <Text style={[styles.chipLabel, styles.chipLabelOn]}>EN</Text>
            </View>
          </View>
        </Section>

        <Section
          index="09"
          titleJa="MARK テキストチップ"
          titleEn="MARK text chip"
          whereJa="他人プロフィール、国旗の左"
          whereEn="Other profile, left of flag"
          ja={ja}
        >
          <View style={styles.row}>
            <View style={[styles.markChip, styles.markOff]}>
              <Text style={[styles.markText, styles.markTextOff]}>MARK</Text>
            </View>
            <View style={[styles.markChip, styles.markOn]}>
              <Text style={[styles.markText, styles.markTextOn]}>MARKED</Text>
            </View>
          </View>
        </Section>

        <Section
          index="10"
          titleJa="テキストリンク"
          titleEn="Text link"
          whereJa="LOGIN 切替、パスワード再設定、規約「内容を見る」"
          whereEn="LOGIN switch, reset password, legal “view”"
          ja={ja}
        >
          <Text style={styles.linkSample}>CREATE ACCOUNT</Text>
          <Text style={styles.linkInline}>{ja ? "内容を見る" : "View"}</Text>
        </Section>

        <Section
          index="11"
          titleJa="サイドメニュー行"
          titleEn="Side menu row"
          whereJa="プロフィール MENU"
          whereEn="Profile MENU"
          ja={ja}
        >
          <View style={styles.menuRow}>
            <MaterialCommunityIcons name="cog-outline" size={16} color="rgba(226,232,240,0.82)" />
            <Text style={styles.menuLabel}>{ja ? "設定" : "Settings"}</Text>
          </View>
        </Section>

        <Section
          index="12"
          titleJa="エッジタブ / 選択タブ"
          titleEn="Edge tab / selected tab"
          whereJa="MENU・MARK・BACK。ランキング選択タブは凍結中"
          whereEn="MENU / MARK / BACK. Ranking selected tab is frozen"
          ja={ja}
        >
          <View style={styles.edgeTab}>
            <Text style={styles.edgeTabLabel}>MENU</Text>
          </View>
          <Text style={styles.note}>
            {ja
              ? "CyberSlantedTab（ランキングの選択タブ）はこのカタログ対象外。凍結中。"
              : "CyberSlantedTab (rankings selected tab) is frozen and omitted."}
          </Text>
        </Section>
      </ScrollView>
    </MobilePageShell>
  );
}

function GroupTitle({
  ja,
  jaText,
  enText,
}: {
  ja: boolean;
  jaText: string;
  enText: string;
}) {
  return <Text style={styles.groupTitle}>{ja ? jaText : enText}</Text>;
}

function Section({
  index,
  titleJa,
  titleEn,
  whereJa,
  whereEn,
  ja,
  children,
}: {
  index: string;
  titleJa: string;
  titleEn: string;
  whereJa: string;
  whereEn: string;
  ja: boolean;
  children: ReactNode;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionIndex}>{index}</Text>
      <Text style={styles.sectionTitle}>{ja ? titleJa : titleEn}</Text>
      <Text style={styles.sectionWhere}>{ja ? whereJa : whereEn}</Text>
      <View style={styles.sample}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 22,
  },
  lead: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.4,
    lineHeight: 16,
    color: "rgba(226,232,240,0.62)",
  },
  groupTitle: {
    marginTop: 8,
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 2,
    color: "rgba(250,204,21,0.88)",
  },
  section: {
    gap: 6,
  },
  sectionIndex: {
    fontFamily: MATCH_CARD_METRIC_FONT,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.8,
    color: "rgba(79,247,244,0.78)",
  },
  sectionTitle: {
    color: "rgba(248,250,252,0.95)",
    fontSize: 15,
    fontWeight: "700",
  },
  sectionWhere: {
    color: "rgba(148,163,184,0.88)",
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 4,
  },
  sample: {
    gap: 8,
  },
  stack: {
    gap: 8,
  },
  row: {
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  rowWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    alignItems: "center",
  },
  proCta: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  proCtaTxt: {
    fontSize: 15,
    fontWeight: "800",
    color: "#fff",
  },
  restoreBtn: {
    alignItems: "center",
    paddingVertical: 8,
  },
  restoreTxt: {
    fontSize: 13,
    color: "rgba(34,211,238,0.85)",
    fontWeight: "600",
  },
  priceCard: {
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },
  priceCardOff: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  priceCardOn: {
    backgroundColor: "#fff",
    borderColor: "#fff",
  },
  priceTitle: {
    fontWeight: "800",
    color: "#fff",
    fontSize: 15,
  },
  priceTitleOn: { color: "#000" },
  priceAmt: {
    fontSize: 22,
    fontWeight: "900",
    marginTop: 4,
    color: "#fff",
  },
  priceAmtOn: { color: "#000" },
  floatSlot: {
    height: 60,
    position: "relative",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  skewWrap: {
    width: "100%",
    transform: [{ skewX: BTN_SKEW }],
  },
  skewBorder: {
    width: "100%",
    borderWidth: 1,
    overflow: "hidden",
  },
  skewFill: {
    minHeight: 52,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    paddingVertical: 14,
  },
  skewRail: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    opacity: 0.45,
  },
  skewLabelWrap: {
    transform: [{ skewX: BTN_UNSKEW }],
    alignItems: "center",
  },
  skewLabel: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 24,
    letterSpacing: 4,
  },
  chamferContent: {
    paddingVertical: 11,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chamferLabel: {
    fontFamily: OXANIUM,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1.4,
    textAlign: "center",
  },
  logoutCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(255,255,255,0.07)",
    alignItems: "center",
  },
  logoutCancelText: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 14,
    fontWeight: "600",
  },
  logoutConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: "#dc2626",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(252,165,165,0.35)",
  },
  logoutConfirmText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  onboardCta: {
    minHeight: 46,
    backgroundColor: "rgba(6,182,212,0.26)",
    borderWidth: 1,
    borderColor: "rgba(103,232,249,0.45)",
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  onboardCtaLabel: {
    fontFamily: "BebasNeue_400Regular",
    fontSize: 19,
    letterSpacing: 3,
    color: "#f1f5f9",
  },
  chip: {
    minHeight: 36,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.14)",
    backgroundColor: "rgba(15,23,42,0.72)",
    justifyContent: "center",
  },
  chipOn: {
    borderColor: "rgba(103,232,249,0.45)",
    backgroundColor: "rgba(6,182,212,0.18)",
  },
  chipLabel: {
    color: "rgba(148,163,184,0.94)",
    fontSize: 13,
    fontWeight: "600",
  },
  chipLabelOn: {
    color: "#7dd3fc",
  },
  markChip: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  markOff: {
    borderColor: "rgba(165,243,252,0.7)",
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  markOn: {
    borderColor: "#00F5FF",
    backgroundColor: "#00F5FF",
  },
  markText: {
    fontFamily: OXANIUM,
    fontSize: 11,
    letterSpacing: 1.2,
    lineHeight: 14,
  },
  markTextOff: { color: "#a5f3fc" },
  markTextOn: { color: "#050508" },
  linkSample: {
    color: AUTH_LANDING.accentSoft,
    fontFamily: "BebasNeue_400Regular",
    fontSize: 18,
    letterSpacing: 1.4,
    textDecorationLine: "underline",
  },
  linkInline: {
    color: AUTH_LANDING.accentSoft,
    fontSize: 12,
    textDecorationLine: "underline",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  menuLabel: {
    color: "rgba(226,232,240,0.88)",
    fontSize: 14,
  },
  edgeTab: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(0,245,255,0.12)",
    borderWidth: 1,
    borderColor: AUTH_LANDING.accent,
    paddingVertical: 18,
    paddingHorizontal: 6,
  },
  edgeTabLabel: {
    color: AUTH_LANDING.accent,
    fontFamily: "BebasNeue_400Regular",
    fontSize: 14,
    letterSpacing: 1.2,
    transform: [{ rotate: "-90deg" }],
    width: 48,
    textAlign: "center",
  },
  note: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 15,
    color: "rgba(148,163,184,0.7)",
  },
});
