/**
 * Web `RankingsProLeagueTeaser` 相当 — Report ゲート同型（ぼかし + Pro バッジ + CTA）。
 */

import { useMemo } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { BlurView } from "expo-blur";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { buildProLeagueTeaserRows } from "../../../../../lib/rankings/proLeagueTeaserMocks";
import {
  proLeagueGateCopy,
  type ProLeagueGateBullet,
} from "../../../../../lib/rankings/proLeagueGateCopy";
import { nativeBlurViewExtraProps } from "../../ui/nativeBlurProps";
import { RankingListCardNative } from "./RankingsRankingCards";
import ProCyberBadgeNative from "../profile/kinetik/ProCyberBadgeNative";
import {
  OXANIUM_700,
  OXANIUM_800,
} from "../profile/reports/reportThemeNative";

const BULLET_ICONS: Record<
  ProLeagueGateBullet["icon"],
  ComponentProps<typeof MaterialCommunityIcons>["name"]
> = {
  swords: "sword-cross",
  trophy: "trophy-outline",
  badge: "medal-outline",
  grid: "view-grid-outline",
  users: "account-group-outline",
  sparkles: "star-four-points-outline",
};

function TitleWithBrandFontsNative({ title }: { title: string }) {
  return (
    <>
      {title.split(/(PRO LEAGUE|Pro)/).map((part, i) =>
        part === "PRO LEAGUE" || part === "Pro" ? (
          <Text key={i} style={styles.titleBrand}>
            {part}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        )
      )}
    </>
  );
}

export function RankingsProLeagueTeaserNative({
  language,
  onPressSubscribe,
  onBackToPickUp,
}: {
  language: "ja" | "en";
  onPressSubscribe: () => void;
  onBackToPickUp?: () => void;
}) {
  const lang = language === "en" ? "en" : "ja";
  const copy = proLeagueGateCopy(lang);
  const rows = useMemo(() => buildProLeagueTeaserRows(), []);

  return (
    <View style={styles.root}>
      <View style={styles.previewClip} pointerEvents="none">
        <View style={styles.listPad}>
          {rows.map((r, i) => (
            <RankingListCardNative
              key={r.uid}
              row={r}
              rank={i + 1}
              metric="totalScore"
              language={language}
            />
          ))}
        </View>
      </View>
      <BlurView
        intensity={36}
        tint="dark"
        style={StyleSheet.absoluteFillObject}
        {...nativeBlurViewExtraProps()}
      />
      <View style={styles.veil} pointerEvents="none" />

      <View style={styles.overlay} pointerEvents="box-none">
        <View style={styles.message}>
          <View style={styles.centerBlock}>
            <View style={styles.eyebrowBlock}>
              <Text style={styles.eyebrow}>{copy.eyebrow}</Text>
              <View style={styles.badgeScale}>
                <ProCyberBadgeNative premium />
              </View>
            </View>
            <Text style={styles.title}>
              <TitleWithBrandFontsNative title={copy.title} />
            </Text>
            <Text style={styles.body}>{copy.body}</Text>
            <Pressable
              onPress={onPressSubscribe}
              style={styles.cta}
              accessibilityRole="button"
              accessibilityLabel={copy.cta}
            >
              <Text style={styles.ctaLabel}>{copy.cta}</Text>
            </Pressable>
          </View>
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
          {onBackToPickUp ? (
            <Pressable onPress={onBackToPickUp} hitSlop={8}>
              <Text style={styles.backLink}>{copy.backToPickUp}</Text>
            </Pressable>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 0,
    minHeight: 420,
  },
  previewClip: {
    maxHeight: 520,
    overflow: "hidden",
    opacity: 0.9,
  },
  listPad: {
    paddingHorizontal: 2,
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
  titleBrand: {
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
  cta: {
    minHeight: 40,
    minWidth: 160,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "#00F5FF",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  ctaLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#050508",
  },
  bulletPanel: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.55)",
    borderRadius: 0,
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
    borderRadius: 0,
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
    lineHeight: 15,
    color: "rgba(255,255,255,0.7)",
  },
  backLink: {
    marginTop: 4,
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
