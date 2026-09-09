/**
 * Web `RankingsProLeagueTeaser` 相当 — Report ゲート同型（ぼかし + Pro バッジ + CTA）。
 * 本文は通常フローで高さを確保（absolute オーバーレイだと下端が切れる）。
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
import UniterzLogoNative from "../profile/UniterzLogoNative";
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
    <View style={styles.titleRowFlex}>
      {title.split(/(PRO LEAGUE|Pro)/).map((part, i) => {
        if (!part) return null;
        if (part === "PRO LEAGUE" || part === "Pro") {
          return (
            <View key={i} style={styles.titleBrandSkewWrap}>
              <Text style={[styles.title, styles.titleBrand]}>{part}</Text>
            </View>
          );
        }
        return (
          <Text key={i} style={styles.title}>
            {part}
          </Text>
        );
      })}
    </View>
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
      <View style={styles.bgLayer} pointerEvents="none">
        <View style={styles.previewClip}>
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
        <View style={styles.veil} />
      </View>

      <View style={styles.messageWrap}>
        <View style={styles.message}>
          <View style={styles.centerBlock}>
            <View style={styles.eyebrowBlock}>
              <View style={styles.brandLogo}>
                <UniterzLogoNative width={168} />
              </View>
              <View style={styles.badgeScale}>
                <ProCyberBadgeNative premium />
              </View>
            </View>
            <View style={styles.titleRow}>
              <TitleWithBrandFontsNative title={copy.title} />
            </View>
            <Text style={styles.body}>{copy.body}</Text>
            <Pressable
              onPress={onPressSubscribe}
              style={({ pressed }) => [
                styles.cta,
                pressed ? styles.ctaPressed : null,
              ]}
              accessibilityRole="button"
              accessibilityLabel={copy.cta}
            >
              {({ pressed }) => (
                <Text
                  style={[styles.ctaLabel, pressed ? styles.ctaLabelPressed : null]}
                >
                  {copy.cta}
                </Text>
              )}
            </Pressable>
          </View>
          <View style={styles.bulletPanel}>
            {copy.bullets.map((item) => (
              <View key={item.title} style={styles.bulletRow}>
                <View style={styles.bulletIcon}>
                  <MaterialCommunityIcons
                    name={BULLET_ICONS[item.icon]}
                    size={15}
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
  /** ぼかし下地のみ absolute。本文の高さで root が伸びる */
  bgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  previewClip: {
    flex: 1,
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
  messageWrap: {
    position: "relative",
    zIndex: 1,
    alignItems: "center",
    paddingTop: 40,
    paddingBottom: 28,
    paddingHorizontal: 12,
  },
  message: {
    width: "100%",
    maxWidth: 380,
    alignItems: "stretch",
    gap: 14,
    paddingHorizontal: 4,
  },
  centerBlock: {
    alignItems: "center",
    gap: 14,
  },
  eyebrowBlock: {
    alignItems: "center",
    gap: 10,
  },
  brandLogo: {
    width: 168,
    maxWidth: "72%",
    alignItems: "center",
  },
  badgeScale: {
    transform: [{ scale: 1.45 }],
    marginVertical: 6,
  },
  titleRow: {
    width: "100%",
    alignItems: "center",
  },
  titleRowFlex: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "center",
  },
  titleBrandSkewWrap: {
    transform: [{ skewX: "-10deg" }],
  },
  title: {
    fontSize: 19,
    fontWeight: "700",
    lineHeight: 28,
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
    fontSize: 15,
    lineHeight: 22,
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
  },
  cta: {
    minHeight: 44,
    minWidth: 168,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(252,211,77,0.75)",
    backgroundColor: "#050508",
    paddingHorizontal: 18,
    paddingVertical: 10,
    shadowColor: "#fbbf24",
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 0 },
  },
  ctaPressed: {
    transform: [{ scale: 0.94 }],
    borderColor: "rgba(253,230,138,0.95)",
    backgroundColor: "rgba(251,191,36,0.2)",
    shadowOpacity: 0.4,
    shadowRadius: 14,
  },
  ctaLabel: {
    fontFamily: OXANIUM_800,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    color: "#fde68a",
  },
  ctaLabelPressed: {
    color: "#fffbeb",
  },
  bulletPanel: {
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(251,146,60,0.55)",
    borderRadius: 0,
    backgroundColor: "rgba(249,115,22,0.07)",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  bulletRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  bulletIcon: {
    width: 26,
    height: 26,
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
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.4,
    color: "#ffedd5",
  },
  bulletDetail: {
    marginTop: 3,
    fontSize: 13,
    lineHeight: 18,
    color: "rgba(255,255,255,0.7)",
  },
  backLink: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
    textAlign: "center",
    textDecorationLine: "underline",
  },
});
