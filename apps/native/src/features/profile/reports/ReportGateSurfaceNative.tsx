/**
 * Web `ReportGateSurface` 相当。
 * Free・月次ロックはモックを BlurView＋説明＋CTA。待ち／予想不足はモックなし。
 */
import type { ComponentProps, ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { nativeBlurViewExtraProps } from "../../../ui/nativeBlurProps";
import {
  reportGateCopy,
  type ReportGateBulletIcon,
} from "../../../../../../lib/reports/reportGateCopy";
import type { ReportGateKind } from "../../../../../../lib/reports/reportGateTypes";
import ProCyberBadgeNative from "../kinetik/ProCyberBadgeNative";
import { OXANIUM_700, OXANIUM_800 } from "./reportThemeNative";

type Lang = "ja" | "en";

const BULLET_ICONS: Record<
  ReportGateBulletIcon,
  ComponentProps<typeof MaterialCommunityIcons>["name"]
> = {
  result: "trophy-outline",
  division: "view-grid-outline",
  rival: "sword-cross",
  target: "crosshairs",
  comment: "comment-text-outline",
  radar: "radar",
  habits: "chart-timeline-variant",
  affinity: "handshake-outline",
  outlook: "star-four-points-outline",
  units: "circle-multiple-outline",
};

function TitleWithBrandFontsNative({ title }: { title: string }) {
  return (
    <>
      {title.split(/(Pro|Monthly)/).map((part, i) =>
        part === "Pro" || part === "Monthly" ? (
          <Text key={i} style={styles.titlePro}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </>
  );
}

type Props = {
  kind: ReportGateKind;
  language: Lang;
  preview?: ReactNode;
  style?: StyleProp<ViewStyle>;
  showCta?: boolean;
  onPressCta?: () => void;
};

const BLUR_KINDS: ReportGateKind[] = ["free", "monthlyLocked"];

export default function ReportGateSurfaceNative({
  kind,
  language,
  preview,
  style,
  showCta = true,
  onPressCta,
}: Props) {
  const copy = reportGateCopy(kind, language);
  const showBlur = BLUR_KINDS.includes(kind) && preview != null;
  const ctaVisible = Boolean(showCta && copy.cta && onPressCta);

  const message = (
    <View style={styles.message}>
      <View style={styles.centerBlock}>
        <View style={styles.eyebrowBlock}>
          <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
          {kind === "free" || kind === "monthlyLocked" ? (
            <View style={styles.badgeScale}>
              <ProCyberBadgeNative premium />
            </View>
          ) : null}
        </View>
        <Text style={styles.title}>
          {kind === "free" || kind === "monthlyLocked" ? (
            <TitleWithBrandFontsNative title={copy.title} />
          ) : (
            copy.title
          )}
        </Text>
        <Text style={styles.body}>{copy.body}</Text>
        {ctaVisible ? (
          <Pressable
            onPress={onPressCta}
            style={styles.cta}
            accessibilityRole="button"
            accessibilityLabel={copy.cta ?? undefined}
          >
            <Text style={styles.ctaLabel}>{copy.cta}</Text>
          </Pressable>
        ) : null}
      </View>
      {copy.bullets && copy.bullets.length > 0 ? (
        <View style={styles.bulletPanel}>
          {copy.bullets.map((item) => (
            <View key={item.title} style={styles.bulletRow}>
              <View style={styles.bulletIcon}>
                <MaterialCommunityIcons
                  name={BULLET_ICONS[item.icon]}
                  size={12}
                  color="#fdba74"
                />
              </View>
              <View style={styles.bulletCopy}>
                <Text style={styles.bulletTitle}>{item.title}</Text>
                <Text style={styles.bulletDetail}>{item.detail}</Text>
              </View>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );

  if (!showBlur) {
    return (
      <View style={[styles.emptyShell, style]}>
        {message}
      </View>
    );
  }

  return (
    <View style={[styles.blurShell, style]}>
      <View style={styles.previewClip} pointerEvents="none">
        {preview}
      </View>
      <BlurView
        intensity={36}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
        {...nativeBlurViewExtraProps()}
      />
      <View style={styles.veil} pointerEvents="none" />
      <View style={styles.overlay} pointerEvents="box-none">
        {message}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  emptyShell: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    paddingHorizontal: 16,
    paddingVertical: 56,
    alignItems: "center",
  },
  blurShell: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    minHeight: 280,
  },
  previewClip: {
    maxHeight: 520,
    overflow: "hidden",
    opacity: 0.9,
  },
  veil: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(4,8,14,0.55)",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 48,
    paddingBottom: 40,
    paddingHorizontal: 12,
  },
  message: {
    width: "100%",
    maxWidth: 360,
    alignItems: "stretch",
    gap: 12,
    paddingHorizontal: 4,
  },
  centerBlock: {
    alignItems: "center",
    gap: 12,
  },
  eyebrowBlock: {
    alignItems: "center",
    gap: 10,
  },
  badgeScale: {
    transform: [{ scale: 1.45 }],
    marginVertical: 6,
  },
  eyebrow: {
    fontFamily: OXANIUM_700,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 2,
    color: "rgba(165,243,252,0.8)",
    textTransform: "uppercase",
    textAlign: "center",
  },
  title: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 24,
    color: "#ffffff",
    textAlign: "center",
  },
  titlePro: {
    fontFamily: OXANIUM_800,
    fontWeight: "800",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  body: {
    fontSize: 13,
    lineHeight: 20,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
  },
  bulletPanel: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.55)",
    borderRadius: 2,
    backgroundColor: "rgba(249,115,22,0.07)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  bulletIcon: {
    width: 20,
    height: 20,
    marginTop: 1,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.45)",
    backgroundColor: "rgba(249,115,22,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  bulletCopy: {
    flex: 1,
    minWidth: 0,
  },
  bulletTitle: {
    fontFamily: OXANIUM_800,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "#ffedd5",
  },
  bulletDetail: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    color: "rgba(255,255,255,0.7)",
  },
  cta: {
    marginTop: 4,
    minWidth: 160,
    minHeight: 40,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "#00F5FF",
    alignItems: "center",
    justifyContent: "center",
  },
  ctaLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 12,
    letterSpacing: 1.2,
    color: "#050508",
    textTransform: "uppercase",
  },
});
