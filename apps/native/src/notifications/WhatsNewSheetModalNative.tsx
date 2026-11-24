/**
 * 起動時のお知らせシート。閉じるは右上の × のみ。
 * layout: 開発で見比べる案。本番は後で1つに決める。
 * - a: 1本勝負（先頭だけ大きく）
 * - b: カード2枚（同じ重さ、行タップ可）
 * - c: ボトムシート
 * - d: 通知プレビュー型
 * - event: ヒーロー画像つき
 * - legacy: 中央カード（旧）
 */
import { useEffect, useState, type ReactNode } from "react";
import {
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from "react-native";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Canvas } from "@shopify/react-native-skia";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeOut,
  useReducedMotion,
} from "react-native-reanimated";
import { UNITERZ_LOGO_FLAT_VIEWBOX } from "../../../../lib/units/uniterzLogoFlat";
import { nativeBlurViewExtraProps } from "../ui/nativeBlurProps";
import { JP_400, JP_700 } from "../features/profile/reports/reportThemeNative";
import { L, resolveLocalizedLang } from "../../../../lib/i18n/localize";
import {
  buildHitResultPushCopy,
  buildStreakNudgePushCopy,
} from "../../../../lib/notifications/dayResultPushCopy";
import {
  WHATS_NEW_PREVIEW_NOTES,
  resolveWhatsNewBodyLines,
  resolveWhatsNewImageUrl,
  whatsNewActionFromBodyLine,
  whatsNewEventName,
  whatsNewKindLabel,
  whatsNewSheetAction,
  whatsNewSheetCopy,
  type WhatsNewNote,
  type WhatsNewNoteAction,
} from "../../../../lib/launch/whatsNewNotes";
import WhatsNewShaderFillNative from "./WhatsNewShaderFillNative";

/** 展開エリアの最大高さ（この中でスクロール） */
const EXPAND_MAX_H = 220;
const EXPAND_FADE_MS = 160;
/** 展開しても作り直さない背景 Canvas の高さ（カード最大より少し大きめ） */
const STABLE_SHADER_H = 560;

const LOGO_FLAT = require("../../assets/brand/uniterz-logo-flat.png");
const LOGO_W = 112;
const LOGO_H = LOGO_W / UNITERZ_LOGO_FLAT_VIEWBOX.aspectRatio;
/** 横長寄りにしてヒーローの縦を抑える（元画像 1344×768） */
const HERO_ASPECT = 2.15;
const API_BASE = process.env.EXPO_PUBLIC_UNITERZ_API_BASE_URL ?? null;

export type WhatsNewLayoutVariant =
  | "a"
  | "b"
  | "c"
  | "d"
  | "event"
  | "legacy";

type Props = {
  open: boolean;
  language: string;
  notes?: readonly WhatsNewNote[];
  layout?: WhatsNewLayoutVariant;
  onClose: () => void;
  onAction?: (action: WhatsNewNoteAction) => void;
};

/** 直角カード。背景 Canvas の高さは固定（展開でリセットしない）。 */
function StableShaderCard({
  active,
  shader = true,
  children,
}: {
  active: boolean;
  shader?: boolean;
  children: ReactNode;
}) {
  const [w, setW] = useState(0);

  function onLayout(e: LayoutChangeEvent) {
    const next = e.nativeEvent.layout.width;
    if (Math.abs(next - w) < 0.5) return;
    setW(next);
  }

  return (
    <View style={styles.solidCard} onLayout={onLayout} collapsable={false}>
      {shader && w > 0 ? (
        <View style={styles.shaderLayer} pointerEvents="none">
          <Canvas
            style={{ width: w, height: STABLE_SHADER_H }}
            pointerEvents="none"
          >
            <WhatsNewShaderFillNative
              width={w}
              height={STABLE_SHADER_H}
              active={active}
            />
          </Canvas>
        </View>
      ) : (
        <View style={styles.shaderFallback} pointerEvents="none" />
      )}
      <View style={styles.solidCardContent}>{children}</View>
    </View>
  );
}

export default function WhatsNewSheetModalNative({
  open,
  language,
  notes = WHATS_NEW_PREVIEW_NOTES,
  layout = "a",
  onClose,
  onAction,
}: Props) {
  const lang = resolveLocalizedLang(language);
  const copy = whatsNewSheetCopy(lang);
  const insets = useSafeAreaInsets();
  const [lead, ...rest] = notes;
  const action = whatsNewSheetAction(notes);
  const actionLabel = action ? L(lang, action.label) : null;
  const expandLines = resolveWhatsNewBodyLines(lead);
  const canExpand = expandLines.length > 0;
  const [expanded, setExpanded] = useState(false);
  const reduceMotion = useReducedMotion();
  const resolvedLayout =
    layout === "legacy" && lead?.kind === "event" && lead.imageUrl
      ? "event"
      : layout;

  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  const toggleExpand = () => {
    setExpanded((v) => !v);
  };

  const fadeIn = reduceMotion ? undefined : FadeIn.duration(EXPAND_FADE_MS);
  const fadeOut = reduceMotion ? undefined : FadeOut.duration(120);

  const shell = (
    align: "center" | "bottom",
    child: ReactNode
  ) => (
    <Modal
      visible={open}
      transparent
      animationType={align === "bottom" ? "slide" : "fade"}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable
        style={[styles.root, align === "bottom" ? styles.rootBottom : null]}
        onPress={onClose}
      >
        {(Platform.OS === "ios" || Platform.OS === "android") && (
          <BlurView
            pointerEvents="none"
            style={StyleSheet.absoluteFillObject}
            tint="dark"
            intensity={Platform.OS === "ios" ? 28 : 22}
            {...nativeBlurViewExtraProps()}
          />
        )}
        <View style={styles.scrim} pointerEvents="none" />
        <Pressable
          style={[
            align === "bottom" ? styles.sheetWrap : styles.cardWrap,
            align === "bottom"
              ? { paddingBottom: Math.max(12, insets.bottom) }
              : null,
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {child}
        </Pressable>
      </Pressable>
    </Modal>
  );

  const primaryBtn = (label: string, onPress: () => void) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.fullBtn,
        styles.btnHit,
        pressed ? styles.actionHitPressed : null,
      ]}
    >
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );

  const closeX = () => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={copy.close}
      onPress={onClose}
      hitSlop={12}
      style={({ pressed }) => [
        styles.closeX,
        pressed ? { opacity: 0.6 } : null,
      ]}
    >
      <MaterialCommunityIcons name="close" size={18} color="#9AF4FF" />
    </Pressable>
  );

  const topBar = (title = copy.title) => (
    <View style={styles.topBar}>
      <Text style={styles.sheetEyebrow}>{title}</Text>
      <View style={styles.topBarClose}>{closeX()}</View>
    </View>
  );

  /** 角切りなしの直角カード。 */
  const frame = (body: ReactNode, opts?: { fill?: boolean }) => (
    <StableShaderCard active={open} shader={opts?.fill !== false}>
      {body}
    </StableShaderCard>
  );

  if (resolvedLayout === "a") {
    const collapseLabel = L(lang, { ja: "折りたたむ", en: "Show less" });
    const body = (
      <View style={[styles.bodyA, expanded ? styles.bodyAExpanded : null]}>
        {topBar()}
        {lead ? (
          <View style={styles.blockA}>
            <Text style={styles.kindLead}>
              {whatsNewKindLabel(lang, lead.kind)}
            </Text>
            <Text style={styles.heroHeadline} accessibilityRole="header">
              {L(lang, lead.headline)}
            </Text>
          </View>
        ) : null}
        {rest[0] && !expanded ? (
          <Animated.View key="aside" entering={fadeIn} exiting={fadeOut}>
            <Text style={styles.asideA}>
              <Text style={styles.asideKind}>
                {whatsNewKindLabel(lang, rest[0].kind)}
              </Text>
              {"  "}
              {L(lang, rest[0].headline)}
            </Text>
          </Animated.View>
        ) : null}
        {expanded ? (
          <Animated.View key="expand" entering={fadeIn} exiting={fadeOut}>
            <ScrollView
              style={styles.expandScroll}
              contentContainerStyle={styles.expandScrollContent}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {expandLines.map((line, i) => {
                const text = L(lang, line.text);
                const lineAction = whatsNewActionFromBodyLine(line);
                const go =
                  lineAction && onAction
                    ? () => onAction(lineAction)
                    : undefined;
                const row = (
                  <>
                    <Text style={styles.bullet}>・</Text>
                    <Text style={styles.bulletText}>{text}</Text>
                    {go ? (
                      <MaterialCommunityIcons
                        name="chevron-right"
                        size={18}
                        color="rgba(154,244,255,0.55)"
                      />
                    ) : null}
                  </>
                );
                if (!go) {
                  return (
                    <View key={`${i}-${text}`} style={styles.bulletRow}>
                      {row}
                    </View>
                  );
                }
                return (
                  <Pressable
                    key={`${i}-${text}`}
                    accessibilityRole="button"
                    accessibilityLabel={text}
                    onPress={go}
                    style={({ pressed }) => [
                      styles.bulletRow,
                      styles.bulletRowTappable,
                      pressed ? styles.bulletRowPressed : null,
                    ]}
                  >
                    {row}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Animated.View>
        ) : null}
        {canExpand
          ? primaryBtn(
              expanded ? collapseLabel : (actionLabel ?? copy.close),
              toggleExpand
            )
          : action && actionLabel && onAction
            ? primaryBtn(actionLabel, () => onAction(action))
            : null}
      </View>
    );
    return shell("center", frame(body));
  }

  if (resolvedLayout === "b") {
    return shell(
      "center",
      frame(
        <View style={styles.bodyB}>
          {topBar()}
          <View style={styles.cardList}>
            {notes.map((note) => {
              const tap =
                note.action && onAction
                  ? () => onAction(note.action!)
                  : undefined;
              return (
                <Pressable
                  key={note.id}
                  disabled={!tap}
                  onPress={tap}
                  style={({ pressed }) => [
                    styles.noteCard,
                    pressed && tap ? styles.noteCardPressed : null,
                  ]}
                >
                  <Text style={styles.kindRow}>
                    {whatsNewKindLabel(lang, note.kind)}
                  </Text>
                  <Text style={styles.noteCardHeadline}>
                    {L(lang, note.headline)}
                  </Text>
                  {tap ? (
                    <Text style={styles.noteCardCta}>
                      {L(lang, note.action!.label)} →
                    </Text>
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        </View>
      )
    );
  }

  if (resolvedLayout === "c") {
    return shell(
      "bottom",
      frame(
        <View style={styles.bodyC}>
          <View style={styles.grab} />
          {topBar()}
          {notes.map((note, i) => (
            <View
              key={note.id}
              style={[styles.rowC, i > 0 ? styles.rowCBorder : null]}
            >
              <Text style={styles.kindRow}>
                {whatsNewKindLabel(lang, note.kind)}
              </Text>
              <Text style={styles.rowHeadlineC}>{L(lang, note.headline)}</Text>
            </View>
          ))}
          {action && actionLabel && onAction
            ? primaryBtn(actionLabel, () => onAction(action))
            : null}
        </View>,
        { fill: false }
      )
    );
  }

  if (resolvedLayout === "d") {
    const hit = buildHitResultPushCopy(lang, {
      day: "today",
      posts: 5,
      wins: 4,
    });
    const streak = buildStreakNudgePushCopy(lang, {
      streakDays: 7,
      nextPick: "today",
    });
    return shell(
      "center",
      frame(
        <View style={styles.bodyD}>
          {topBar()}
          {lead ? (
            <Text style={styles.heroHeadlineD} accessibilityRole="header">
              {L(lang, lead.headline)}
            </Text>
          ) : null}
          <View style={styles.pushStack}>
            <View style={styles.pushCard}>
              <Text style={styles.pushApp}>UNITERZ</Text>
              <Text style={styles.pushTitle}>{hit.title}</Text>
              <Text style={styles.pushBody}>{hit.body}</Text>
            </View>
            <View style={styles.pushCard}>
              <Text style={styles.pushApp}>UNITERZ</Text>
              <Text style={styles.pushTitle}>{streak.title}</Text>
              <Text style={styles.pushBody} numberOfLines={2}>
                {streak.body}
              </Text>
            </View>
          </View>
          {action && actionLabel && onAction
            ? primaryBtn(actionLabel, () => onAction(action))
            : null}
        </View>
      )
    );
  }

  // event / legacy
  // キャンペーン絵があるときだけ上帯。文字ロゴは本文と同じ面に載せて一体にする。
  const single = rest.length === 0;
  const heroUri =
    lead?.kind === "event"
      ? resolveWhatsNewImageUrl(lead.imageUrl, API_BASE)
      : null;
  const brandInBody = !heroUri;

  return shell(
    "center",
    frame(
      <>
        {heroUri ? (
          <View>
            <Image
              source={{ uri: heroUri }}
              style={styles.hero}
              resizeMode="cover"
              accessibilityIgnoresInvertColors
            />
            <View style={styles.heroClose}>{closeX()}</View>
          </View>
        ) : null}
        <View style={[styles.body, brandInBody ? styles.bodyEventBrand : null]}>
          {brandInBody ? (
            <View
              style={[styles.legacyTop, single ? styles.legacyTopEvent : null]}
            >
              <View style={styles.headerBrandRow} pointerEvents="none">
                <View style={styles.headerBrandLine} />
                <Image
                  source={LOGO_FLAT}
                  style={[styles.logo, single ? styles.logoEvent : null]}
                  resizeMode="contain"
                  accessibilityLabel="UNITERZ"
                />
                <View style={styles.headerBrandLine} />
              </View>
              <View style={styles.legacyClose}>{closeX()}</View>
            </View>
          ) : null}
          {lead ? (
            <View style={[styles.heroBlock, single ? styles.heroSingle : null]}>
              <View
                style={[
                  styles.eventTitleGroup,
                  single ? styles.eventTitleGroupSingle : null,
                ]}
              >
                <Text
                  style={[styles.kindLead, single ? styles.centerText : null]}
                >
                  {whatsNewKindLabel(lang, lead.kind)}
                </Text>
                <Text
                  style={[
                    styles.eventName,
                    single ? styles.eventNameSingle : null,
                  ]}
                  accessibilityRole="header"
                >
                  {L(lang, whatsNewEventName(lead))}
                </Text>
              </View>
              {lead.detail ? (
                <Text
                  style={[styles.heroDetail, single ? styles.centerText : null]}
                >
                  {L(lang, lead.detail)}
                </Text>
              ) : null}
              {lead.scope || (lead.prizes && lead.prizes.length > 0) ? (
                <View
                  style={[
                    styles.eventMeta,
                    single ? styles.eventMetaSingle : null,
                  ]}
                >
                  {lead.scope ? (
                    <Text
                      style={[
                        styles.eventScope,
                        single ? styles.centerText : null,
                      ]}
                    >
                      <Text style={styles.eventScopeLabel}>
                        {L(lang, { ja: "対象", en: "Scope" })}
                      </Text>
                      {"  "}
                      {L(lang, lead.scope)}
                    </Text>
                  ) : null}
                  {lead.prizes && lead.prizes.length > 0 ? (
                    <View
                      style={[
                        styles.prizeList,
                        single ? styles.prizeListSingle : null,
                      ]}
                    >
                      {lead.prizes.map((row, i) => (
                        <View
                          key={`${i}-${L(lang, row.place)}`}
                          style={[
                            styles.prizeRow,
                            single ? styles.prizeRowSingle : null,
                          ]}
                        >
                          <Text style={styles.prizePlace}>
                            {L(lang, row.place)}
                          </Text>
                          <Text
                            style={[
                              styles.prizeName,
                              single ? styles.centerText : null,
                            ]}
                          >
                            {L(lang, row.prize)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ) : null}
                </View>
              ) : null}
              {lead.footnote ? (
                <Text
                  style={[
                    styles.eventFootnote,
                    single ? styles.centerText : null,
                  ]}
                >
                  {L(lang, lead.footnote)}
                </Text>
              ) : null}
            </View>
          ) : null}
          {rest.length > 0 ? (
            <View style={styles.list}>
              {rest.map((note) => (
                <View key={note.id} style={styles.row}>
                  <Text style={styles.kindRow}>
                    {whatsNewKindLabel(lang, note.kind)}
                  </Text>
                  <Text style={styles.rowHeadline}>
                    {L(lang, note.headline)}
                  </Text>
                </View>
              ))}
            </View>
          ) : null}
          {action && actionLabel && onAction ? (
            <View style={styles.actions}>
              {primaryBtn(actionLabel, () => onAction(action))}
            </View>
          ) : null}
        </View>
      </>
    )
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  rootBottom: {
    justifyContent: "flex-end",
    paddingHorizontal: 12,
  },
  scrim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.62)",
  },
  cardWrap: {
    width: "100%",
    maxWidth: 340,
  },
  sheetWrap: {
    width: "100%",
    maxWidth: 480,
  },
  card: {
    width: "100%",
  },
  cardContent: {
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 0,
    alignItems: "stretch",
  },
  hero: {
    width: "100%",
    aspectRatio: HERO_ASPECT,
    maxHeight: 168,
    backgroundColor: "#0a1218",
  },
  heroClose: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 18,
  },
  bodyEventBrand: {
    paddingTop: 14,
  },
  solidCard: {
    width: "100%",
    backgroundColor: "#152029",
    borderWidth: 1,
    borderColor: "rgba(0,245,255,0.28)",
    overflow: "hidden",
  },
  solidCardContent: {
    position: "relative",
    zIndex: 1,
  },
  shaderLayer: {
    position: "absolute",
    left: 0,
    top: 0,
    zIndex: 0,
  },
  shaderFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#152029",
  },
  bodyA: {
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 16,
  },
  bodyAExpanded: {
    maxHeight: 520,
  },
  expandScroll: {
    maxHeight: EXPAND_MAX_H,
  },
  expandScrollContent: {
    gap: 10,
    paddingBottom: 4,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 4,
  },
  bulletRowTappable: {
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 4,
    marginHorizontal: -4,
  },
  bulletRowPressed: {
    backgroundColor: "rgba(0,245,255,0.08)",
  },
  bullet: {
    fontFamily: JP_700,
    fontSize: 14,
    lineHeight: 22,
    color: "#9AF4FF",
    includeFontPadding: false,
  },
  bulletText: {
    flex: 1,
    fontFamily: JP_400,
    fontSize: 14,
    lineHeight: 22,
    color: "rgba(248,250,252,0.88)",
    includeFontPadding: false,
  },
  bodyB: {
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    gap: 14,
  },
  bodyC: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: "#121a24",
  },
  bodyD: {
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 18,
    gap: 14,
  },
  topBar: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 32,
  },
  sheetEyebrow: {
    fontFamily: JP_700,
    fontSize: 13,
    lineHeight: 18,
    letterSpacing: 1.2,
    color: "rgba(248,250,252,0.55)",
    textAlign: "center",
    includeFontPadding: false,
  },
  topBarClose: {
    position: "absolute",
    right: -6,
    top: 0,
  },
  closeX: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  blockA: {
    gap: 8,
  },
  asideA: {
    fontFamily: JP_400,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(248,250,252,0.62)",
    includeFontPadding: false,
  },
  asideKind: {
    fontFamily: JP_700,
    fontSize: 11,
    letterSpacing: 1.2,
    color: "rgba(154,244,255,0.55)",
  },
  cardList: {
    gap: 10,
  },
  noteCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(154,244,255,0.28)",
    backgroundColor: "rgba(0,245,255,0.05)",
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  noteCardPressed: {
    backgroundColor: "rgba(0,245,255,0.12)",
  },
  noteCardHeadline: {
    fontFamily: JP_700,
    fontSize: 15,
    lineHeight: 22,
    color: "#F8FAFC",
    includeFontPadding: false,
  },
  noteCardCta: {
    marginTop: 8,
    fontFamily: JP_700,
    fontSize: 12,
    color: "#9AF4FF",
    includeFontPadding: false,
  },
  grab: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(154,244,255,0.28)",
    marginBottom: 4,
  },
  rowC: {
    paddingVertical: 10,
  },
  rowCBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(154,244,255,0.18)",
  },
  rowHeadlineC: {
    fontFamily: JP_700,
    fontSize: 15,
    lineHeight: 22,
    color: "#F8FAFC",
    includeFontPadding: false,
  },
  heroHeadlineD: {
    fontFamily: JP_700,
    fontSize: 17,
    lineHeight: 24,
    color: "#F8FAFC",
    includeFontPadding: false,
  },
  pushStack: {
    gap: 8,
  },
  pushCard: {
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 2,
  },
  pushApp: {
    fontFamily: JP_700,
    fontSize: 10,
    letterSpacing: 0.6,
    color: "rgba(154,244,255,0.7)",
    includeFontPadding: false,
  },
  pushTitle: {
    fontFamily: JP_700,
    fontSize: 13,
    lineHeight: 18,
    color: "#F8FAFC",
    includeFontPadding: false,
  },
  pushBody: {
    fontFamily: JP_400,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(248,250,252,0.72)",
    includeFontPadding: false,
  },
  legacyTop: {
    position: "relative",
    marginBottom: 18,
  },
  legacyTopEvent: {
    marginBottom: 12,
  },
  legacyClose: {
    position: "absolute",
    top: -4,
    right: -8,
    zIndex: 2,
  },
  headerBrandRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    width: "100%",
  },
  logo: {
    width: LOGO_W,
    height: LOGO_H,
    tintColor: "#9AF4FF",
  },
  logoEvent: {
    width: LOGO_W * 1.15,
    height: LOGO_H * 1.15,
  },
  headerBrandLine: {
    flex: 1,
    maxWidth: 36,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(154,244,255,0.35)",
  },
  heroBlock: {
    alignItems: "flex-start",
  },
  heroSingle: {
    alignItems: "center",
  },
  eventTitleGroup: {
    gap: 6,
    alignItems: "flex-start",
  },
  eventTitleGroupSingle: {
    alignItems: "center",
  },
  centerText: {
    textAlign: "center",
  },
  kindLead: {
    fontFamily: JP_700,
    fontSize: 11,
    lineHeight: 15,
    letterSpacing: 2.2,
    color: "#00F5FF",
    includeFontPadding: false,
  },
  eventName: {
    fontFamily: JP_700,
    fontSize: 20,
    lineHeight: 28,
    color: "#FFFFFF",
    includeFontPadding: false,
  },
  eventNameSingle: {
    textAlign: "center",
    fontSize: 20,
    lineHeight: 28,
    maxWidth: 280,
  },
  heroHeadline: {
    fontFamily: JP_700,
    fontSize: 19,
    lineHeight: 28,
    color: "#F8FAFC",
    includeFontPadding: false,
  },
  heroHeadlineSingle: {
    textAlign: "center",
    fontSize: 18,
    lineHeight: 27,
    maxWidth: 260,
  },
  heroDetail: {
    fontFamily: JP_400,
    fontSize: 14,
    lineHeight: 21,
    color: "rgba(248,250,252,0.72)",
    marginTop: 12,
    includeFontPadding: false,
  },
  eventMeta: {
    marginTop: 16,
    gap: 12,
    alignItems: "flex-start",
    width: "100%",
  },
  eventMetaSingle: {
    alignItems: "center",
  },
  eventScope: {
    fontFamily: JP_400,
    fontSize: 13,
    lineHeight: 19,
    color: "rgba(248,250,252,0.58)",
    includeFontPadding: false,
  },
  eventScopeLabel: {
    fontFamily: JP_700,
    fontSize: 11,
    letterSpacing: 1.1,
    color: "rgba(154,244,255,0.7)",
  },
  prizeList: {
    gap: 8,
    alignItems: "flex-start",
    width: "100%",
  },
  prizeListSingle: {
    alignItems: "center",
  },
  prizeRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 10,
  },
  prizeRowSingle: {
    justifyContent: "center",
    flexWrap: "wrap",
  },
  prizePlace: {
    fontFamily: JP_700,
    fontSize: 13,
    lineHeight: 20,
    letterSpacing: 0.4,
    color: "#00F5FF",
    includeFontPadding: false,
    minWidth: 28,
  },
  prizeName: {
    fontFamily: JP_700,
    fontSize: 14,
    lineHeight: 20,
    color: "#F8FAFC",
    includeFontPadding: false,
  },
  eventFootnote: {
    fontFamily: JP_400,
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(248,250,252,0.42)",
    marginTop: 14,
    includeFontPadding: false,
  },
  list: {
    marginTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(154,244,255,0.18)",
    paddingTop: 14,
  },
  row: {
    paddingBottom: 2,
  },
  kindRow: {
    fontFamily: JP_700,
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 1.4,
    color: "rgba(154,244,255,0.55)",
    marginBottom: 4,
    includeFontPadding: false,
  },
  rowHeadline: {
    fontFamily: JP_400,
    fontSize: 14,
    lineHeight: 20,
    color: "rgba(248,250,252,0.72)",
    includeFontPadding: false,
  },
  actions: {
    marginTop: 22,
    alignItems: "stretch",
  },
  fullBtn: {
    width: "100%",
    backgroundColor: "#00F5FF",
  },
  btnHit: {
    minHeight: 44,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  actionHitPressed: {
    opacity: 0.88,
  },
  actionLabel: {
    fontFamily: JP_700,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.6,
    color: "#041018",
    textAlign: "center",
    includeFontPadding: false,
  },
});
